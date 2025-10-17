# 🐍 Python Setup & Script Execution Troubleshooting

## ❌ Error yang Terjadi

```
Error starting script: TypeError: Cannot read properties of undefined (reading 'toString')
[Script xxx] Process error: Error: spawn python3 ENOENT
```

## 🔍 Penyebab Masalah

1. **Python3 tidak terinstall** di sistem
2. **Python executable tidak ditemukan** di PATH
3. **Bug di ScriptManager.js** saat handle process yang gagal start

## ✅ Solusi Lengkap

### **1. Quick Fix - Install Python**

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install python3 python3-pip python3-dev
```

#### CentOS/RHEL:
```bash
sudo yum install python3 python3-pip python3-devel
```

#### macOS:
```bash
# Using Homebrew
brew install python3

# Or download from python.org
```

#### Windows:
Download dan install dari [python.org](https://www.python.org/downloads/)

### **2. Automated Setup**

Gunakan script setup otomatis:

```bash
# Make executable and run
chmod +x setup-python.sh
./setup-python.sh
```

Script ini akan:
- ✅ Detect OS dan install Python otomatis
- ✅ Install semua dependencies dari requirements.txt
- ✅ Test installation dengan script test
- ✅ Create test script untuk verifikasi

### **3. Manual Verification**

Verify Python installation:

```bash
# Check Python version
python3 --version
# Should show: Python 3.x.x

# Check pip
pip3 --version

# Test imports
python3 -c "import cv2, numpy, requests; print('All packages OK')"
```

### **4. Install Python Dependencies**

```bash
# Install from requirements.txt
pip3 install -r requirements.txt

# Or install individually
pip3 install opencv-python requests numpy
```

## 🧪 Testing Setup

### **1. Run Test Script**

```bash
# Run the automated test
python3 test_python_setup.py
```

Expected output:
```
🐍 ESP32-CAM Python Setup Test
========================================
Python version: 3.x.x
Test time: 2024-01-01 12:00:00

🔍 Testing OpenCV...
✅ Face cascade loaded successfully

🌐 Testing requests...
✅ HTTP requests working

🔧 Testing environment...
   SCRIPT_ID: test-script
   SERVER_URL: http://localhost:3000
   DEVICE_ID: test-device
   USER_ID: test-user
✅ Environment variables accessible

========================================
Tests passed: 3/3
🎉 All tests passed! Python setup is ready for ESP32-CAM scripts.
```

### **2. Test Script Creation**

1. Start server: `npm run dev`
2. Go to: `http://localhost:3000/scripts`
3. Create new script with simple code:
   ```python
   print("Hello from ESP32-CAM script!")
   import cv2
   print(f"OpenCV version: {cv2.__version__}")
   ```
4. Click "Validate" - should pass
5. Click "Start" - should run without errors

## 🔧 Advanced Troubleshooting

### **Issue 1: Python Command Not Found**

```bash
# Check which Python commands are available
which python3
which python
which py

# Add to PATH if needed (Linux/macOS)
export PATH="/usr/bin/python3:$PATH"

# For permanent fix, add to ~/.bashrc or ~/.zshrc
echo 'export PATH="/usr/bin/python3:$PATH"' >> ~/.bashrc
```

### **Issue 2: Permission Errors**

```bash
# Fix permissions for script directory
sudo chown -R $USER:$USER /path/to/ESP32/server/scripts/
chmod 755 /path/to/ESP32/server/scripts/

# Install packages with user flag
pip3 install --user -r requirements.txt
```

### **Issue 3: OpenCV Installation Issues**

```bash
# Ubuntu: Install system dependencies
sudo apt-get install python3-opencv libopencv-dev

# macOS: Use Homebrew
brew install opencv

# Alternative: Use conda
conda install opencv

# Or use headless version (for servers)
pip3 install opencv-python-headless
```

### **Issue 4: Virtual Environment Setup**

```bash
# Create virtual environment
python3 -m venv venv

# Activate (Linux/macOS)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install packages in venv
pip install -r requirements.txt

# Update ScriptManager to use venv python
# Edit server/services/ScriptManager.js
# Change python command to: /path/to/venv/bin/python
```

## 🐳 Docker Solution

Jika masih ada masalah, gunakan Docker:

```dockerfile
# Dockerfile.python
FROM python:3.9-slim

RUN apt-get update && apt-get install -y \
    libopencv-dev \
    python3-opencv \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt

WORKDIR /app
```

```bash
# Build and run
docker build -f Dockerfile.python -t esp32-python .
docker run -v $(pwd):/app esp32-python python script.py
```

## 📋 Verification Checklist

After setup, verify:

- [ ] `python3 --version` shows Python 3.x
- [ ] `pip3 --version` works
- [ ] `python3 -c "import cv2"` works
- [ ] `python3 test_python_setup.py` passes all tests
- [ ] Script creation works in web interface
- [ ] Script validation works
- [ ] Script execution starts without ENOENT error
- [ ] Server logs show script output

## 🚀 Production Deployment

### **Render.com Setup**

Add to `render.yaml`:
```yaml
services:
  - type: web
    name: esp32-cam-app
    env: node
    buildCommand: |
      npm install
      apt-get update
      apt-get install -y python3 python3-pip
      pip3 install -r requirements.txt
    startCommand: npm start
```

### **Docker Production**

```dockerfile
FROM node:18-slim

# Install Python
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    libopencv-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python requirements
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Copy and install Node.js app
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "start"]
```

## 📞 Still Having Issues?

1. **Check server logs** for detailed error messages
2. **Verify Python path** in system PATH
3. **Test Python imports** manually
4. **Check file permissions** for script directory
5. **Try virtual environment** if system Python has issues
6. **Use Docker** as last resort for consistent environment

The updated ScriptManager.js now properly detects Python executable and provides better error messages! 🎉
