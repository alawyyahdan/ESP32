const express = require('express');
const multer = require('multer');
const { deviceService, streamService } = require('../services/database');
const streamManager = require('../services/StreamManager');

const router = express.Router();

// Configure multer for handling multipart data
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware to validate device API key
const validateDeviceApiKey = async (req, res, next) => {
  try {
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const device = await deviceService.findDeviceByApiKey(apiKey, 'device');
    if (!device) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if device ID matches
    if (req.params.deviceId && device.id !== req.params.deviceId) {
      return res.status(403).json({ error: 'API key does not match device' });
    }

    req.device = device;
    next();
  } catch (error) {
    console.error('Device API key validation error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Middleware to validate viewer API key
const validateViewerApiKey = async (req, res, next) => {
  try {
    const apiKey = req.query.key || req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    const device = await deviceService.findDeviceByApiKey(apiKey, 'viewer');
    if (!device) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Check if device ID matches
    if (req.params.deviceId && device.id !== req.params.deviceId) {
      return res.status(403).json({ error: 'API key does not match device' });
    }

    req.device = device;
    next();
  } catch (error) {
    console.error('Viewer API key validation error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// ESP32-CAM stream upload endpoint
router.post('/stream/:deviceId', validateDeviceApiKey, upload.single('frame'), async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = req.device;

    // Update device status to online
    await deviceService.updateDeviceStatus(deviceId, true);

    // Handle different content types
    let frameData;
    
    if (req.file) {
      // Single frame upload
      frameData = req.file.buffer;
    } else if (req.body && Buffer.isBuffer(req.body)) {
      // Raw buffer data
      frameData = req.body;
    } else {
      return res.status(400).json({ error: 'No frame data received' });
    }

    // Start/update stream
    streamManager.startStream(deviceId, frameData);

    // Start stream session if not already active
    const activeSession = await streamService.getActiveSession(deviceId);
    if (!activeSession) {
      await streamService.startSession(deviceId);
    }

    res.json({ 
      success: true, 
      message: 'Frame received',
      timestamp: new Date().toISOString(),
      frameSize: frameData.length,
    });

  } catch (error) {
    console.error('Stream upload error:', error);
    res.status(500).json({ error: 'Failed to process stream' });
  }
});

// Handle MJPEG stream upload (for continuous streaming)
router.post('/stream/:deviceId/mjpeg', validateDeviceApiKey, (req, res) => {
  try {
    const { deviceId } = req.params;
    let buffer = Buffer.alloc(0);

    // Update device status to online
    deviceService.updateDeviceStatus(deviceId, true);

    req.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      
      // Look for JPEG frame boundaries (0xFFD8 start, 0xFFD9 end)
      let startIndex = 0;
      while (true) {
        const jpegStart = buffer.indexOf(Buffer.from([0xFF, 0xD8]), startIndex);
        if (jpegStart === -1) break;
        
        const jpegEnd = buffer.indexOf(Buffer.from([0xFF, 0xD9]), jpegStart + 2);
        if (jpegEnd === -1) break;
        
        // Extract complete JPEG frame
        const frameData = buffer.slice(jpegStart, jpegEnd + 2);
        
        // Send frame to stream manager
        streamManager.startStream(deviceId, frameData);
        
        startIndex = jpegEnd + 2;
      }
      
      // Keep remaining incomplete data
      if (startIndex > 0) {
        buffer = buffer.slice(startIndex);
      }
    });

    req.on('end', () => {
      res.json({ success: true, message: 'Stream ended' });
    });

    req.on('error', (error) => {
      console.error('MJPEG stream error:', error);
      res.status(500).json({ error: 'Stream processing failed' });
    });

  } catch (error) {
    console.error('MJPEG stream setup error:', error);
    res.status(500).json({ error: 'Failed to setup stream' });
  }
});

// Public viewer endpoint
router.get('/view/:deviceId', validateViewerApiKey, (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Add viewer to stream manager
    streamManager.addViewer(deviceId, res);
    
    // The response is handled by StreamManager
    // Connection will be closed when stream ends or viewer disconnects
    
  } catch (error) {
    console.error('Viewer endpoint error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to start viewer' });
    }
  }
});

// Get stream status
router.get('/status/:deviceId', validateViewerApiKey, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = req.device;
    
    const streamInfo = streamManager.getStreamInfo(deviceId);
    
    res.json({
      device: {
        id: device.id,
        name: device.name,
        isOnline: device.isOnline,
        lastActive: device.lastActive,
      },
      stream: streamInfo,
      isStreaming: streamManager.isStreaming(deviceId),
    });
    
  } catch (error) {
    console.error('Status endpoint error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Get all devices for a user (requires authentication)
router.get('/devices', async (req, res) => {
  try {
    // This endpoint would need user authentication
    // For now, return stream statistics
    const stats = streamManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Devices endpoint error:', error);
    res.status(500).json({ error: 'Failed to get devices' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  const stats = streamManager.getStats();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ...stats,
  });
});

module.exports = router;

