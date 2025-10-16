const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { deviceService } = require('../services/database');
const { authenticateToken } = require('../middleware/auth');
const streamManager = require('../services/StreamManager');

const router = express.Router();

// Dashboard page
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const devices = await deviceService.getUserDevices(req.user.id);
    
    // Add stream status to each device
    const devicesWithStatus = devices.map(device => ({
      ...device,
      isStreaming: streamManager.isStreaming(device.id),
      streamInfo: streamManager.getStreamInfo(device.id),
    }));

    res.render('dashboard', {
      user: req.user,
      devices: devicesWithStatus,
      success: req.query.success,
      error: req.query.error,
      serverAddress: process.env.ADDRESS || `${req.protocol}://${req.get('host')}`,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('dashboard', {
      user: req.user,
      devices: [],
      error: 'Failed to load devices',
      serverAddress: process.env.ADDRESS || `${req.protocol}://${req.get('host')}`,
    });
  }
});

// Add new device
router.post('/dashboard/devices', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.redirect('/dashboard?error=Device name is required');
    }

    // Generate API keys
    const deviceApiKey = `dev_${uuidv4().replace(/-/g, '')}`;
    const viewerApiKey = `view_${uuidv4().replace(/-/g, '')}`;

    // Create device
    await deviceService.createDevice(
      req.user.id,
      name.trim(),
      deviceApiKey,
      viewerApiKey
    );

    res.redirect('/dashboard?success=Device added successfully');
  } catch (error) {
    console.error('Add device error:', error);
    res.redirect('/dashboard?error=Failed to add device');
  }
});

// Delete device
router.delete('/dashboard/devices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // End any active stream for this device
    streamManager.endStream(id);
    
    // Delete device (only if it belongs to the user)
    const result = await deviceService.deleteDevice(id, req.user.id);
    
    if (result.count === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Regenerate API keys
router.post('/dashboard/devices/:id/regenerate', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Generate new API keys
    const deviceApiKey = `dev_${uuidv4().replace(/-/g, '')}`;
    const viewerApiKey = `view_${uuidv4().replace(/-/g, '')}`;

    // Update device (only if it belongs to the user)
    const result = await deviceService.regenerateApiKeys(
      id,
      req.user.id,
      deviceApiKey,
      viewerApiKey
    );

    if (result.count === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // End any active stream for this device (keys changed)
    streamManager.endStream(id);

    res.json({
      success: true,
      deviceApiKey,
      viewerApiKey,
    });
  } catch (error) {
    console.error('Regenerate keys error:', error);
    res.status(500).json({ error: 'Failed to regenerate API keys' });
  }
});

// Device viewer page
router.get('/device/:id/view', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if device belongs to user
    const device = await deviceService.findDeviceById(id);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).render('error', { 
        error: 'Device not found',
        code: 404 
      });
    }

    const streamInfo = streamManager.getStreamInfo(id);
    
    res.render('device-viewer', {
      device,
      streamInfo,
      user: req.user,
      serverAddress: process.env.ADDRESS || `${req.protocol}://${req.get('host')}`,
    });
  } catch (error) {
    console.error('Device viewer error:', error);
    res.status(500).render('error', { 
      error: 'Failed to load device viewer',
      code: 500 
    });
  }
});

// Get device stream status (AJAX endpoint)
router.get('/api/devices/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if device belongs to user
    const device = await deviceService.findDeviceById(id);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const streamInfo = streamManager.getStreamInfo(id);
    
    res.json({
      device: {
        id: device.id,
        name: device.name,
        isOnline: device.isOnline,
        lastActive: device.lastActive,
      },
      stream: streamInfo,
    });
  } catch (error) {
    console.error('Device status error:', error);
    res.status(500).json({ error: 'Failed to get device status' });
  }
});

module.exports = router;
