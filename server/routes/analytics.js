const express = require('express');
const { analyticsService, deviceService, customScriptService } = require('../services/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Log detection data (called by Python scripts)
router.post('/analytics/log', async (req, res) => {
  try {
    const { 
      userId, 
      deviceId, 
      scriptId, 
      detectionType, 
      detectedCount, 
      confidence, 
      metadata = {},
      apiKey 
    } = req.body;

    // Validation
    if (!userId || !deviceId || !scriptId || !detectionType || detectedCount === undefined) {
      return res.status(400).json({ 
        error: 'userId, deviceId, scriptId, detectionType, and detectedCount are required' 
      });
    }

    // Verify device belongs to user (basic security check)
    const device = await deviceService.findDeviceById(deviceId);
    if (!device || device.userId !== userId) {
      return res.status(403).json({ error: 'Invalid device or user' });
    }

    // Verify script belongs to user
    const script = await customScriptService.getScriptById(scriptId, userId);
    if (!script) {
      return res.status(403).json({ error: 'Invalid script' });
    }

    // Log the detection
    const analyticsData = await analyticsService.logDetection(
      userId,
      deviceId,
      scriptId,
      detectionType,
      parseInt(detectedCount),
      confidence ? parseFloat(confidence) : null,
      metadata
    );

    res.json({
      success: true,
      message: 'Detection logged successfully',
      id: analyticsData.id,
      timestamp: analyticsData.timestamp
    });

  } catch (error) {
    console.error('Log analytics error:', error);
    res.status(500).json({ error: 'Failed to log detection data' });
  }
});

// Get analytics for a specific device
router.get('/analytics/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '24h', detectionType } = req.query;

    // Check if device belongs to user
    const device = await deviceService.findDeviceById(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get analytics data
    let analyticsData = await analyticsService.getDeviceAnalytics(
      deviceId, 
      req.user.id, 
      timeRange
    );

    // Filter by detection type if specified
    if (detectionType) {
      analyticsData = analyticsData.filter(item => 
        item.detectionType === detectionType
      );
    }

    // Get summary data
    const summary = await analyticsService.getAnalyticsSummary(
      deviceId, 
      req.user.id, 
      timeRange
    );

    // Get total detections
    const totals = await analyticsService.getTotalDetections(
      deviceId, 
      req.user.id, 
      timeRange
    );

    res.json({
      success: true,
      device: {
        id: device.id,
        name: device.name
      },
      timeRange,
      data: analyticsData,
      summary,
      totals,
      detectionTypes: [...new Set(analyticsData.map(item => item.detectionType))]
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get analytics summary for all user devices
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Get user devices
    const devices = await deviceService.getUserDevices(req.user.id);

    // Get analytics for each device
    const deviceAnalytics = await Promise.all(
      devices.map(async (device) => {
        try {
          const analytics = await analyticsService.getDeviceAnalytics(
            device.id, 
            req.user.id, 
            timeRange
          );
          
          const totals = await analyticsService.getTotalDetections(
            device.id, 
            req.user.id, 
            timeRange
          );

          return {
            device: {
              id: device.id,
              name: device.name
            },
            analytics,
            totals,
            detectionTypes: [...new Set(analytics.map(item => item.detectionType))]
          };
        } catch (error) {
          console.error(`Error getting analytics for device ${device.id}:`, error);
          return {
            device: {
              id: device.id,
              name: device.name
            },
            analytics: [],
            totals: { total: 0, count: 0 },
            detectionTypes: []
          };
        }
      })
    );

    // Calculate overall totals
    const overallTotals = deviceAnalytics.reduce((acc, deviceData) => ({
      total: acc.total + deviceData.totals.total,
      count: acc.count + deviceData.totals.count
    }), { total: 0, count: 0 });

    // Get all detection types
    const allDetectionTypes = [...new Set(
      deviceAnalytics.flatMap(deviceData => deviceData.detectionTypes)
    )];

    res.json({
      success: true,
      timeRange,
      devices: deviceAnalytics,
      overallTotals,
      detectionTypes: allDetectionTypes
    });

  } catch (error) {
    console.error('Get all analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Get analytics data for charts (hourly aggregation)
router.get('/analytics/:deviceId/chart', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '24h', detectionType } = req.query;

    // Check if device belongs to user
    const device = await deviceService.findDeviceById(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get summary data (hourly aggregation)
    let summaryData = await analyticsService.getAnalyticsSummary(
      deviceId, 
      req.user.id, 
      timeRange
    );

    // Filter by detection type if specified
    if (detectionType) {
      summaryData = summaryData.filter(item => 
        item.detection_type === detectionType
      );
    }

    // Format data for charts
    const chartData = summaryData.map(item => ({
      timestamp: item.hour,
      detections: item.total_detections,
      confidence: item.avg_confidence,
      events: item.event_count,
      detectionType: item.detection_type
    }));

    // Group by detection type for multi-series charts
    const groupedData = chartData.reduce((acc, item) => {
      const type = item.detectionType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {});

    res.json({
      success: true,
      device: {
        id: device.id,
        name: device.name
      },
      timeRange,
      chartData,
      groupedData,
      detectionTypes: Object.keys(groupedData)
    });

  } catch (error) {
    console.error('Get chart analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// Delete analytics data (cleanup)
router.delete('/analytics/:deviceId', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { olderThan = '30d' } = req.query;

    // Check if device belongs to user
    const device = await deviceService.findDeviceById(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Calculate cutoff date
    let cutoffDate = new Date();
    switch (olderThan) {
      case '1d':
        cutoffDate.setDate(cutoffDate.getDate() - 1);
        break;
      case '7d':
        cutoffDate.setDate(cutoffDate.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(cutoffDate.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        break;
      default:
        cutoffDate.setDate(cutoffDate.getDate() - 30);
    }

    // Delete old analytics data
    const { error } = await analyticsService.supabase
      .from('analytics_data')
      .delete()
      .eq('device_id', deviceId)
      .eq('user_id', req.user.id)
      .lt('timestamp', cutoffDate.toISOString());

    if (error) throw error;

    res.json({
      success: true,
      message: `Analytics data older than ${olderThan} deleted successfully`
    });

  } catch (error) {
    console.error('Delete analytics error:', error);
    res.status(500).json({ error: 'Failed to delete analytics data' });
  }
});

// Get detection statistics
router.get('/analytics/:deviceId/stats', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { timeRange = '24h' } = req.query;

    // Check if device belongs to user
    const device = await deviceService.findDeviceById(deviceId);
    if (!device || device.userId !== req.user.id) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Get analytics data
    const analyticsData = await analyticsService.getDeviceAnalytics(
      deviceId, 
      req.user.id, 
      timeRange
    );

    // Calculate statistics
    const stats = {
      totalDetections: analyticsData.reduce((sum, item) => sum + item.detectedCount, 0),
      totalEvents: analyticsData.length,
      detectionTypes: [...new Set(analyticsData.map(item => item.detectionType))],
      averageConfidence: analyticsData.length > 0 
        ? analyticsData.reduce((sum, item) => sum + (item.confidence || 0), 0) / analyticsData.length
        : 0,
      detectionsByType: {},
      hourlyAverage: 0
    };

    // Group by detection type
    analyticsData.forEach(item => {
      const type = item.detectionType;
      if (!stats.detectionsByType[type]) {
        stats.detectionsByType[type] = {
          count: 0,
          events: 0,
          avgConfidence: 0
        };
      }
      stats.detectionsByType[type].count += item.detectedCount;
      stats.detectionsByType[type].events += 1;
      stats.detectionsByType[type].avgConfidence += item.confidence || 0;
    });

    // Calculate averages for each type
    Object.keys(stats.detectionsByType).forEach(type => {
      const typeData = stats.detectionsByType[type];
      typeData.avgConfidence = typeData.events > 0 
        ? typeData.avgConfidence / typeData.events 
        : 0;
    });

    // Calculate hourly average
    const hours = timeRange === '1h' ? 1 : 
                  timeRange === '24h' ? 24 : 
                  timeRange === '7d' ? 168 : 
                  timeRange === '30d' ? 720 : 24;
    stats.hourlyAverage = stats.totalDetections / hours;

    res.json({
      success: true,
      device: {
        id: device.id,
        name: device.name
      },
      timeRange,
      stats
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
