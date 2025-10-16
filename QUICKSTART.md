# 🚀 ESP32-CAM Streaming Provider - Quick Start Guide

Get your ESP32-CAM streaming system up and running in 10 minutes!

## ⚡ Prerequisites

- **Node.js 16+** installed on your computer
- **ESP32-CAM** hardware (AI-Thinker model recommended)
- **Arduino IDE** with ESP32 board support
- **FTDI programmer** for uploading code to ESP32-CAM
- **Supabase account** (free tier available at supabase.com)

## 📋 Step-by-Step Setup

### 1. Database Setup (3 minutes)

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down: URL, anon key, service key

2. **Setup Environment**:
```bash
# Clone the project
git clone <your-repo-url>
cd ESP-Cam

# Copy environment template
cp env.example .env

# Edit .env with your Supabase credentials
nano .env  # or use your preferred editor
```

3. **Initialize Database**:
```bash
# Install dependencies and setup database
npm install
npm run setup

# Start the server
npm run dev
```

✅ **Server is now running at http://localhost:3000**

### 2. Create Your Account (1 minute)

1. Open http://localhost:3000 in your browser
2. Click "create a new account"
3. Enter your email and password
4. You'll be redirected to the dashboard

### 3. Add Your First Device (1 minute)

1. In the dashboard, click "Add New Device"
2. Enter a name like "Living Room Camera"
3. Click "Add Device"
4. Click "Settings" on your new device to see the API keys

**Save these values for ESP32-CAM setup:**
- Device ID: `dev_xxxxxxxxxx`
- Device API Key: `dev_yyyyyyyyyyyy`
- Server URL: `http://your-ip:3000` (replace with your computer's IP)

### 4. ESP32-CAM Setup (3 minutes)

#### Hardware Connection
```
ESP32-CAM    FTDI Programmer
VCC     →    5V (or 3.3V)
GND     →    GND
U0R     →    TX
U0T     →    RX
IO0     →    GND (for programming mode)
```

#### Arduino IDE Setup
1. Install ESP32 board package: `https://dl.espressif.com/dl/package_esp32_index.json`
2. Select board: "AI Thinker ESP32-CAM"
3. Set partition scheme: "Huge APP (3MB No OTA/1MB SPIFFS)"

#### Upload Code
1. Open `esp32/esp32_cam_simple.ino`
2. Update these lines:
   ```cpp
   const char* ssid = "YOUR_WIFI_NAME";
   const char* password = "YOUR_WIFI_PASSWORD";
   const char* serverURL = "http://192.168.1.100:3000";  // Your computer's IP
   const char* deviceId = "dev_xxxxxxxxxx";              // From dashboard
   const char* deviceApiKey = "dev_yyyyyyyyyyyy";        // From dashboard
   ```
3. Remove IO0-GND connection
4. Press ESP32-CAM reset button
5. Upload the code

### 5. Start Streaming! (30 seconds)

1. Power the ESP32-CAM (use external 5V power supply for best results)
2. Wait 30 seconds for connection
3. Refresh your dashboard - device should show "Streaming"
4. Click "View" to see your live stream!

## 🎯 Quick Test Checklist

- [ ] Server running at http://localhost:3000
- [ ] Account created and logged in
- [ ] Device added with API keys visible
- [ ] ESP32-CAM code uploaded with correct credentials
- [ ] ESP32-CAM powered and connected to WiFi
- [ ] Dashboard shows device as "Streaming"
- [ ] Live video visible in viewer page

## 🔧 Common Quick Fixes

**ESP32-CAM not connecting?**
- Check WiFi name and password
- Use 2.4GHz WiFi (not 5GHz)
- Try external power supply instead of USB

**No video in dashboard?**
- Verify server URL uses your computer's IP address
- Check device API key matches exactly
- Wait 1-2 minutes for initial connection

**Can't upload to ESP32-CAM?**
- Connect IO0 to GND during upload
- Press reset button before uploading
- Check FTDI wiring connections

## 🌐 Access Your Stream

### Local Access
- Dashboard: http://localhost:3000
- Direct stream: http://localhost:3000/api/view/DEVICE_ID?key=VIEWER_KEY

### Remote Access (using ngrok)
```bash
# Install ngrok
npm install -g ngrok

# Expose your server
ngrok http 3000

# Use the ngrok URL in ESP32-CAM code
# Example: http://abc123.ngrok.io
```

## 🚀 Next Steps

Once everything is working:

1. **Add more devices**: Repeat steps 3-4 for additional ESP32-CAMs
2. **Deploy to production**: Use Render.com or Docker for permanent hosting
3. **Embed streams**: Use the viewer API key to embed streams in websites
4. **Explore advanced features**: Try the advanced ESP32-CAM code versions

## 📞 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review [troubleshooting section](README.md#troubleshooting)
- Verify hardware connections and power supply
- Check Arduino IDE serial monitor for ESP32-CAM debug messages

**Happy Streaming! 📹✨**

