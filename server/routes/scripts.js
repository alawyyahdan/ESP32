const express = require('express');
const { customScriptService, deviceService } = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const scriptManager = require('../services/ScriptManager');

const router = express.Router();

// Get all user scripts
router.get('/scripts', authenticateToken, async (req, res) => {
  try {
    const scripts = await customScriptService.getUserScripts(req.user.id);
    
    // Add runtime status
    const scriptsWithStatus = scripts.map(script => ({
      ...script,
      isRunning: scriptManager.isScriptRunning(script.id),
      runtimeInfo: scriptManager.getScriptInfo(script.id)
    }));

    res.json({
      success: true,
      scripts: scriptsWithStatus
    });
  } catch (error) {
    console.error('Get scripts error:', error);
    res.status(500).json({ error: 'Failed to fetch scripts' });
  }
});

// Get single script
router.get('/scripts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const script = await customScriptService.getScriptById(id, req.user.id);
    
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Add runtime status
    script.isRunning = scriptManager.isScriptRunning(id);
    script.runtimeInfo = scriptManager.getScriptInfo(id);

    res.json({
      success: true,
      script
    });
  } catch (error) {
    console.error('Get script error:', error);
    res.status(500).json({ error: 'Failed to fetch script' });
  }
});

// Create new script
router.post('/scripts', authenticateToken, async (req, res) => {
  try {
    const { name, description, deviceId, scriptContent, scriptType = 'python' } = req.body;

    // Validation
    if (!name || !deviceId || !scriptContent) {
      return res.status(400).json({ 
        error: 'Name, device ID, and script content are required' 
      });
    }

    // Check if device belongs to user
    const device = await deviceService.findDeviceById(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Validate script syntax (for Python)
    if (scriptType === 'python') {
      const validation = await scriptManager.validateScript(scriptContent);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Script validation failed', 
          details: validation.error 
        });
      }
    }

    // Create script
    const script = await customScriptService.createScript(
      req.user.id,
      deviceId,
      name,
      description,
      scriptContent,
      scriptType
    );

    res.json({
      success: true,
      message: 'Script created successfully',
      script
    });
  } catch (error) {
    console.error('Create script error:', error);
    res.status(500).json({ error: 'Failed to create script' });
  }
});

// Update script
router.put('/scripts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, scriptContent, scriptType } = req.body;

    // Check if script exists and belongs to user
    const existingScript = await customScriptService.getScriptById(id, req.user.id);
    if (!existingScript) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Validate script syntax if content changed
    if (scriptContent && scriptType === 'python') {
      const validation = await scriptManager.validateScript(scriptContent);
      if (!validation.valid) {
        return res.status(400).json({ 
          error: 'Script validation failed', 
          details: validation.error 
        });
      }
    }

    // Stop script if running and content changed
    if (scriptContent && scriptManager.isScriptRunning(id)) {
      await scriptManager.stopScript(id);
    }

    // Update script
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (scriptContent) updates.script_content = scriptContent;
    if (scriptType) updates.script_type = scriptType;

    const updatedScript = await customScriptService.updateScript(id, req.user.id, updates);

    res.json({
      success: true,
      message: 'Script updated successfully',
      script: updatedScript
    });
  } catch (error) {
    console.error('Update script error:', error);
    res.status(500).json({ error: 'Failed to update script' });
  }
});

// Delete script
router.delete('/scripts/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if script exists and belongs to user
    const script = await customScriptService.getScriptById(id, req.user.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Stop script if running
    if (scriptManager.isScriptRunning(id)) {
      await scriptManager.stopScript(id);
    }

    // Delete script
    await customScriptService.deleteScript(id, req.user.id);

    res.json({
      success: true,
      message: 'Script deleted successfully'
    });
  } catch (error) {
    console.error('Delete script error:', error);
    res.status(500).json({ error: 'Failed to delete script' });
  }
});

// Start script
router.post('/scripts/:id/start', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if script exists and belongs to user
    const script = await customScriptService.getScriptById(id, req.user.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Check if already running
    if (scriptManager.isScriptRunning(id)) {
      return res.status(400).json({ error: 'Script is already running' });
    }

    // Start script
    const result = await scriptManager.startScript(id, script.scriptContent, {
      userId: req.user.id,
      deviceId: script.deviceId,
      scriptType: script.scriptType
    });

    // Update database
    await customScriptService.updateScript(id, req.user.id, { is_active: true });

    res.json({
      success: true,
      message: 'Script started successfully',
      ...result
    });
  } catch (error) {
    console.error('Start script error:', error);
    res.status(500).json({ error: error.message || 'Failed to start script' });
  }
});

// Stop script
router.post('/scripts/:id/stop', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if script exists and belongs to user
    const script = await customScriptService.getScriptById(id, req.user.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Check if running
    if (!scriptManager.isScriptRunning(id)) {
      return res.status(400).json({ error: 'Script is not running' });
    }

    // Stop script
    await scriptManager.stopScript(id);

    // Update database
    await customScriptService.updateScript(id, req.user.id, { is_active: false });

    res.json({
      success: true,
      message: 'Script stopped successfully'
    });
  } catch (error) {
    console.error('Stop script error:', error);
    res.status(500).json({ error: error.message || 'Failed to stop script' });
  }
});

// Restart script
router.post('/scripts/:id/restart', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if script exists and belongs to user
    const script = await customScriptService.getScriptById(id, req.user.id);
    if (!script) {
      return res.status(404).json({ error: 'Script not found' });
    }

    // Restart script
    const result = await scriptManager.restartScript(id, script.scriptContent, {
      userId: req.user.id,
      deviceId: script.deviceId,
      scriptType: script.scriptType
    });

    // Update database
    await customScriptService.updateScript(id, req.user.id, { is_active: true });

    res.json({
      success: true,
      message: 'Script restarted successfully',
      ...result
    });
  } catch (error) {
    console.error('Restart script error:', error);
    res.status(500).json({ error: error.message || 'Failed to restart script' });
  }
});

// Validate script
router.post('/scripts/validate', authenticateToken, async (req, res) => {
  try {
    const { scriptContent, scriptType = 'python' } = req.body;

    if (!scriptContent) {
      return res.status(400).json({ error: 'Script content is required' });
    }

    if (scriptType === 'python') {
      const validation = await scriptManager.validateScript(scriptContent);
      res.json({
        success: true,
        valid: validation.valid,
        error: validation.error || null
      });
    } else {
      res.json({
        success: true,
        valid: true,
        message: 'Validation not implemented for this script type'
      });
    }
  } catch (error) {
    console.error('Validate script error:', error);
    res.status(500).json({ error: 'Failed to validate script' });
  }
});

// Get script manager stats
router.get('/scripts/stats', authenticateToken, async (req, res) => {
  try {
    const stats = scriptManager.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

module.exports = router;
