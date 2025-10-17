const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const { customScriptService } = require('./database');

class ScriptManager extends EventEmitter {
  constructor() {
    super();
    this.runningScripts = new Map(); // scriptId -> process info
    this.scriptsDir = path.join(__dirname, '../scripts');
    this.pythonEnvDir = path.join(__dirname, '../python-env');
    
    // Ensure directories exist
    this.initializeDirectories();
    
    // Cleanup on exit
    process.on('SIGINT', () => this.stopAllScripts());
    process.on('SIGTERM', () => this.stopAllScripts());
  }

  async initializeDirectories() {
    try {
      await fs.mkdir(this.scriptsDir, { recursive: true });
      await fs.mkdir(this.pythonEnvDir, { recursive: true });
      console.log('📁 Script directories initialized');
    } catch (error) {
      console.error('Error creating script directories:', error);
    }
  }

  async startScript(scriptId, scriptContent, config = {}) {
    try {
      // Check if script is already running
      if (this.runningScripts.has(scriptId)) {
        throw new Error('Script is already running');
      }

      // Write script to file
      const scriptPath = path.join(this.scriptsDir, `script_${scriptId}.py`);
      await fs.writeFile(scriptPath, scriptContent);

      // Prepare environment variables
      const env = {
        ...process.env,
        SCRIPT_ID: scriptId,
        SERVER_URL: process.env.ADDRESS || 'http://localhost:3000',
        DEVICE_ID: config.deviceId || '',
        USER_ID: config.userId || '',
        ...config.envVars
      };

      // Start Python process
      const pythonProcess = spawn('python3', [scriptPath], {
        env,
        cwd: this.scriptsDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Store process info
      const processInfo = {
        process: pythonProcess,
        scriptId,
        startTime: Date.now(),
        config,
        scriptPath
      };

      this.runningScripts.set(scriptId, processInfo);

      // Handle process events
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(`[Script ${scriptId}] ${output}`);
        this.emit('scriptOutput', scriptId, output);
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[Script ${scriptId} ERROR] ${error}`);
        this.emit('scriptError', scriptId, error);
      });

      pythonProcess.on('close', (code) => {
        console.log(`[Script ${scriptId}] Process exited with code ${code}`);
        this.runningScripts.delete(scriptId);
        
        // Update database status
        customScriptService.updateScriptStatus(scriptId, 'stopped', null)
          .catch(err => console.error('Error updating script status:', err));
        
        this.emit('scriptStopped', scriptId, code);
      });

      pythonProcess.on('error', (error) => {
        console.error(`[Script ${scriptId}] Process error:`, error);
        this.runningScripts.delete(scriptId);
        
        // Update database status
        customScriptService.updateScriptStatus(scriptId, 'error', null)
          .catch(err => console.error('Error updating script status:', err));
        
        this.emit('scriptError', scriptId, error.message);
      });

      // Update database status
      await customScriptService.updateScriptStatus(scriptId, 'running', pythonProcess.pid.toString());

      console.log(`✅ Script ${scriptId} started with PID ${pythonProcess.pid}`);
      this.emit('scriptStarted', scriptId, pythonProcess.pid);

      return {
        success: true,
        pid: pythonProcess.pid,
        scriptId
      };

    } catch (error) {
      console.error(`Error starting script ${scriptId}:`, error);
      
      // Update database status
      await customScriptService.updateScriptStatus(scriptId, 'error', null)
        .catch(err => console.error('Error updating script status:', err));
      
      throw error;
    }
  }

  async stopScript(scriptId) {
    try {
      const processInfo = this.runningScripts.get(scriptId);
      
      if (!processInfo) {
        throw new Error('Script is not running');
      }

      // Kill the process
      processInfo.process.kill('SIGTERM');
      
      // Wait a bit, then force kill if still running
      setTimeout(() => {
        if (this.runningScripts.has(scriptId)) {
          processInfo.process.kill('SIGKILL');
        }
      }, 5000);

      // Clean up script file
      try {
        await fs.unlink(processInfo.scriptPath);
      } catch (error) {
        console.warn(`Could not delete script file: ${error.message}`);
      }

      console.log(`🛑 Script ${scriptId} stopped`);
      this.emit('scriptStopped', scriptId, 0);

      return {
        success: true,
        scriptId
      };

    } catch (error) {
      console.error(`Error stopping script ${scriptId}:`, error);
      throw error;
    }
  }

  async stopAllScripts() {
    console.log('🛑 Stopping all running scripts...');
    
    const stopPromises = Array.from(this.runningScripts.keys()).map(scriptId => 
      this.stopScript(scriptId).catch(err => 
        console.error(`Error stopping script ${scriptId}:`, err)
      )
    );

    await Promise.allSettled(stopPromises);
    console.log('✅ All scripts stopped');
  }

  getRunningScripts() {
    const scripts = [];
    for (const [scriptId, processInfo] of this.runningScripts) {
      scripts.push({
        scriptId,
        pid: processInfo.process.pid,
        startTime: processInfo.startTime,
        uptime: Date.now() - processInfo.startTime,
        config: processInfo.config
      });
    }
    return scripts;
  }

  isScriptRunning(scriptId) {
    return this.runningScripts.has(scriptId);
  }

  getScriptInfo(scriptId) {
    const processInfo = this.runningScripts.get(scriptId);
    if (!processInfo) {
      return null;
    }

    return {
      scriptId,
      pid: processInfo.process.pid,
      startTime: processInfo.startTime,
      uptime: Date.now() - processInfo.startTime,
      config: processInfo.config
    };
  }

  async restartScript(scriptId, scriptContent, config = {}) {
    try {
      // Stop if running
      if (this.isScriptRunning(scriptId)) {
        await this.stopScript(scriptId);
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Start again
      return await this.startScript(scriptId, scriptContent, config);
    } catch (error) {
      console.error(`Error restarting script ${scriptId}:`, error);
      throw error;
    }
  }

  // Method to validate Python script before execution
  async validateScript(scriptContent) {
    try {
      const tempPath = path.join(this.scriptsDir, `temp_${Date.now()}.py`);
      await fs.writeFile(tempPath, scriptContent);

      return new Promise((resolve) => {
        const pythonProcess = spawn('python3', ['-m', 'py_compile', tempPath], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let errorOutput = '';
        pythonProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        pythonProcess.on('close', async (code) => {
          // Clean up temp file
          try {
            await fs.unlink(tempPath);
          } catch (error) {
            // Ignore cleanup errors
          }

          if (code === 0) {
            resolve({ valid: true });
          } else {
            resolve({ 
              valid: false, 
              error: errorOutput || 'Script compilation failed' 
            });
          }
        });
      });
    } catch (error) {
      return { 
        valid: false, 
        error: error.message 
      };
    }
  }

  // Get script execution statistics
  getStats() {
    return {
      totalRunning: this.runningScripts.size,
      scripts: this.getRunningScripts()
    };
  }
}

// Singleton instance
const scriptManager = new ScriptManager();

module.exports = scriptManager;
