const { EventEmitter } = require('events');

class StreamManager extends EventEmitter {
  constructor() {
    super();
    this.streams = new Map(); // deviceId -> stream data
    this.viewers = new Map(); // deviceId -> Set of response objects
    this.streamTimeouts = new Map(); // deviceId -> timeout handle
    
    // Clean up inactive streams every 30 seconds
    setInterval(() => {
      this.cleanupInactiveStreams();
    }, 30000);
  }

  // Start or update a stream for a device
  startStream(deviceId, streamData) {
    // Clear existing timeout for this device
    if (this.streamTimeouts.has(deviceId)) {
      clearTimeout(this.streamTimeouts.get(deviceId));
    }

    // Store the stream data
    this.streams.set(deviceId, {
      data: streamData,
      timestamp: Date.now(),
      boundary: this.generateBoundary(),
    });

    // Broadcast to all viewers of this device
    this.broadcastToViewers(deviceId, streamData);

    // Set timeout to mark stream as inactive after 5 seconds (faster for realtime)
    const timeout = setTimeout(() => {
      this.endStream(deviceId);
    }, 5000);
    
    this.streamTimeouts.set(deviceId, timeout);

    this.emit('streamStarted', deviceId);
  }

  // End a stream for a device
  endStream(deviceId) {
    if (this.streamTimeouts.has(deviceId)) {
      clearTimeout(this.streamTimeouts.get(deviceId));
      this.streamTimeouts.delete(deviceId);
    }

    this.streams.delete(deviceId);
    
    // Close all viewer connections for this device
    if (this.viewers.has(deviceId)) {
      const viewerSet = this.viewers.get(deviceId);
      viewerSet.forEach(res => {
        if (!res.headersSent) {
          res.end();
        }
      });
      this.viewers.delete(deviceId);
    }

    this.emit('streamEnded', deviceId);
  }

  // Add a viewer for a device stream
  addViewer(deviceId, response) {
    if (!this.viewers.has(deviceId)) {
      this.viewers.set(deviceId, new Set());
    }
    
    this.viewers.get(deviceId).add(response);

    // Set up MJPEG headers
    response.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace; boundary=frame',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*',
    });

    // Send current frame if available
    if (this.streams.has(deviceId)) {
      const streamData = this.streams.get(deviceId);
      this.sendFrameToViewer(response, streamData.data);
    }

    // Handle viewer disconnect
    response.on('close', () => {
      this.removeViewer(deviceId, response);
    });

    response.on('error', () => {
      this.removeViewer(deviceId, response);
    });
  }

  // Remove a viewer
  removeViewer(deviceId, response) {
    if (this.viewers.has(deviceId)) {
      this.viewers.get(deviceId).delete(response);
      
      // If no more viewers, clean up the set
      if (this.viewers.get(deviceId).size === 0) {
        this.viewers.delete(deviceId);
      }
    }
  }

  // Broadcast frame to all viewers of a device
  broadcastToViewers(deviceId, frameData) {
    if (!this.viewers.has(deviceId)) {
      return;
    }

    const viewerSet = this.viewers.get(deviceId);
    const disconnectedViewers = [];

    viewerSet.forEach(res => {
      try {
        if (!res.headersSent || res.destroyed) {
          disconnectedViewers.push(res);
          return;
        }
        
        this.sendFrameToViewer(res, frameData);
      } catch (error) {
        console.error('Error sending frame to viewer:', error);
        disconnectedViewers.push(res);
      }
    });

    // Clean up disconnected viewers
    disconnectedViewers.forEach(res => {
      this.removeViewer(deviceId, res);
    });
  }

  // Send a single frame to a viewer
  sendFrameToViewer(response, frameData) {
    try {
      response.write('--frame\r\n');
      response.write('Content-Type: image/jpeg\r\n');
      response.write(`Content-Length: ${frameData.length}\r\n\r\n`);
      response.write(frameData);
      response.write('\r\n');
    } catch (error) {
      console.error('Error writing frame to response:', error);
    }
  }

  // Check if a device is currently streaming
  isStreaming(deviceId) {
    return this.streams.has(deviceId);
  }

  // Get stream info for a device
  getStreamInfo(deviceId) {
    if (!this.streams.has(deviceId)) {
      return null;
    }

    const stream = this.streams.get(deviceId);
    return {
      deviceId,
      timestamp: stream.timestamp,
      viewerCount: this.viewers.has(deviceId) ? this.viewers.get(deviceId).size : 0,
      isActive: Date.now() - stream.timestamp < 10000,
    };
  }

  // Get all active streams
  getAllStreams() {
    const result = [];
    this.streams.forEach((stream, deviceId) => {
      result.push(this.getStreamInfo(deviceId));
    });
    return result;
  }

  // Clean up inactive streams
  cleanupInactiveStreams() {
    const now = Date.now();
    const inactiveDevices = [];

    this.streams.forEach((stream, deviceId) => {
      if (now - stream.timestamp > 30000) { // 30 seconds timeout
        inactiveDevices.push(deviceId);
      }
    });

    inactiveDevices.forEach(deviceId => {
      console.log(`Cleaning up inactive stream for device: ${deviceId}`);
      this.endStream(deviceId);
    });
  }

  // Generate boundary string for MJPEG
  generateBoundary() {
    return Math.random().toString(36).substring(2, 15);
  }

  // Get statistics
  getStats() {
    return {
      activeStreams: this.streams.size,
      totalViewers: Array.from(this.viewers.values()).reduce((sum, set) => sum + set.size, 0),
      devices: Array.from(this.streams.keys()),
    };
  }
}

// Singleton instance
const streamManager = new StreamManager();

module.exports = streamManager;
