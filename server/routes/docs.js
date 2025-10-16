const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Documentation page
router.get('/docs', (req, res) => {
  res.render('docs', {
    title: 'ESP32-CAM Documentation',
    serverAddress: process.env.ADDRESS || `${req.protocol}://${req.get('host')}`,
  });
});

// ESP32 code generator
router.get('/docs/generator', (req, res) => {
  res.render('code-generator', {
    title: 'ESP32 Code Generator',
    serverAddress: process.env.ADDRESS || `${req.protocol}://${req.get('host')}`,
  });
});

// Download ESP32 code with custom configuration
router.post('/docs/download', (req, res) => {
  try {
    const {
      wifiSSID = 'YOUR_WIFI_SSID',
      wifiPassword = 'YOUR_WIFI_PASSWORD',
      serverURL = 'http://your-server.com',
      deviceId = 'YOUR_DEVICE_ID',
      deviceApiKey = 'YOUR_DEVICE_API_KEY',
      frameRate = '5',
      resolution = 'FRAMESIZE_VGA',
      jpegQuality = '15',
      enableLED = 'true',
      enableDebug = 'true',
      enableStats = 'true',
      autoRestart = 'true',
      maxErrors = '20',
      brightness = '0',
      contrast = '0',
      saturation = '0',
      hmirror = '0',
      vflip = '0'
    } = req.body;

    // Read template file
    const templatePath = path.join(__dirname, '../../esp32/esp32_cam_universal.ino');
    let arduinoCode = fs.readFileSync(templatePath, 'utf8');

    // Replace configuration values
    const replacements = {
      'YOUR_WIFI_SSID': wifiSSID,
      'YOUR_WIFI_PASSWORD': wifiPassword,
      'YOUR_SERVER_ADDRESS': serverURL,
      'YOUR_DEVICE_ID': deviceId,
      'YOUR_DEVICE_API_KEY': deviceApiKey,
      'const int FRAME_RATE = 5;': `const int FRAME_RATE = ${frameRate};`,
      'FRAMESIZE_VGA': resolution,
      'const int JPEG_QUALITY = 15;': `const int JPEG_QUALITY = ${jpegQuality};`,
      'const bool ENABLE_LED_INDICATOR = true;': `const bool ENABLE_LED_INDICATOR = ${enableLED};`,
      'const bool ENABLE_DEBUG_OUTPUT = true;': `const bool ENABLE_DEBUG_OUTPUT = ${enableDebug};`,
      'const bool ENABLE_PERFORMANCE_STATS = true;': `const bool ENABLE_PERFORMANCE_STATS = ${enableStats};`,
      'const bool AUTO_RESTART_ON_ERROR = true;': `const bool AUTO_RESTART_ON_ERROR = ${autoRestart};`,
      'const int MAX_ERRORS_BEFORE_RESTART = 20;': `const int MAX_ERRORS_BEFORE_RESTART = ${maxErrors};`,
      'const int CAMERA_BRIGHTNESS = 0;': `const int CAMERA_BRIGHTNESS = ${brightness};`,
      'const int CAMERA_CONTRAST = 0;': `const int CAMERA_CONTRAST = ${contrast};`,
      'const int CAMERA_SATURATION = 0;': `const int CAMERA_SATURATION = ${saturation};`,
      'const int CAMERA_HMIRROR = 0;': `const int CAMERA_HMIRROR = ${hmirror};`,
      'const int CAMERA_VFLIP = 0;': `const int CAMERA_VFLIP = ${vflip};`
    };

    // Apply replacements
    Object.entries(replacements).forEach(([search, replace]) => {
      arduinoCode = arduinoCode.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
    });

    // Add generation timestamp
    const timestamp = new Date().toISOString();
    const serverAddress = process.env.ADDRESS || `${req.protocol}://${req.get('host')}`;
    arduinoCode = arduinoCode.replace(
      '// Download konfigurasi terbaru dari: [SERVER_URL]/download',
      `// Generated on: ${timestamp}\n// Downloaded from: ${serverAddress}/docs/generator`
    );

    // Set headers for file download
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="esp32_cam_configured.ino"');
    
    res.send(arduinoCode);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate ESP32 code' });
  }
});

// API endpoint to get resolution options
router.get('/api/resolutions', (req, res) => {
  const resolutions = [
    { value: 'FRAMESIZE_96X96', label: '96x96 (Tiny)', description: 'Sangat kecil, untuk testing' },
    { value: 'FRAMESIZE_QQVGA', label: '160x120 (QQVGA)', description: 'Sangat kecil, hemat bandwidth' },
    { value: 'FRAMESIZE_QCIF', label: '176x144 (QCIF)', description: 'Kecil, hemat bandwidth' },
    { value: 'FRAMESIZE_HQVGA', label: '240x176 (HQVGA)', description: 'Kecil, cocok untuk monitoring' },
    { value: 'FRAMESIZE_240X240', label: '240x240 (Square)', description: 'Persegi, untuk aplikasi khusus' },
    { value: 'FRAMESIZE_QVGA', label: '320x240 (QVGA)', description: 'Kecil, smooth streaming' },
    { value: 'FRAMESIZE_CIF', label: '400x296 (CIF)', description: 'Sedang, seimbang' },
    { value: 'FRAMESIZE_HVGA', label: '480x320 (HVGA)', description: 'Sedang, optimal untuk realtime' },
    { value: 'FRAMESIZE_VGA', label: '640x480 (VGA)', description: 'Standard, recommended' },
    { value: 'FRAMESIZE_SVGA', label: '800x600 (SVGA)', description: 'Tinggi, butuh bandwidth baik' },
    { value: 'FRAMESIZE_XGA', label: '1024x768 (XGA)', description: 'Tinggi, butuh PSRAM' },
    { value: 'FRAMESIZE_HD', label: '1280x720 (HD)', description: 'HD, butuh PSRAM dan WiFi kuat' },
    { value: 'FRAMESIZE_SXGA', label: '1280x1024 (SXGA)', description: 'Sangat tinggi, butuh PSRAM' },
    { value: 'FRAMESIZE_UXGA', label: '1600x1200 (UXGA)', description: 'Maximum, butuh PSRAM dan WiFi sangat kuat' }
  ];
  
  res.json(resolutions);
});

// API endpoint to get frame rate recommendations
router.get('/api/framerates', (req, res) => {
  const frameRates = [
    { value: 1, label: '1 FPS', description: 'Hemat bandwidth, untuk monitoring lambat' },
    { value: 2, label: '2 FPS', description: 'Hemat bandwidth, monitoring normal' },
    { value: 5, label: '5 FPS', description: 'Seimbang, recommended untuk umum' },
    { value: 10, label: '10 FPS', description: 'Smooth, butuh bandwidth baik' },
    { value: 15, label: '15 FPS', description: 'Sangat smooth, butuh WiFi kuat' },
    { value: 20, label: '20 FPS', description: 'Maximum realistic untuk ESP32-CAM' }
  ];
  
  res.json(frameRates);
});

module.exports = router;
