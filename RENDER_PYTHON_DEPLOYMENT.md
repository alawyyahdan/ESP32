# 🚀 Render.com Deployment with Python Support

## 🎯 Overview

This guide shows how to deploy your ESP32-CAM streaming platform with Python custom scripts support on Render.com.

## ⚡ Quick Deployment

### **1. Push Changes to GitHub**

```bash
# Add all new files
git add .
git commit -m "Add Python support for Render.com deployment"
git push origin main
```

### **2. Deploy on Render.com**

1. Go to [Render.com Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and use the configuration

### **3. Set Environment Variables**

In Render dashboard, add these environment variables:

```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-jwt-secret
ADDRESS=https://your-app.onrender.com
```

## 🔧 Configuration Files

### **render.yaml** (Auto-detected)
```yaml
services:
  - type: web
    name: esp32-cam-streaming
    env: node
    plan: free
    buildCommand: ./render-build.sh
    startCommand: npm start
    # ... environment variables
```

### **render-build.sh** (Build Script)
- ✅ Installs Node.js dependencies
- ✅ Installs Python 3 and pip
- ✅ Installs OpenCV and other Python packages
- ✅ Verifies all installations
- ✅ Creates necessary directories

### **Dockerfile** (Alternative)
If you prefer Docker deployment:
- ✅ Based on `node:18-slim`
- ✅ Includes Python 3 and OpenCV
- ✅ Optimized for production

## 🐍 Python Support Details

### **Packages Installed**
```txt
opencv-python==4.8.1.78
numpy==1.24.3
requests==2.31.0
Pillow==10.0.1
scipy==1.11.4
scikit-learn==1.3.2
python-dateutil==2.8.2
```

### **System Dependencies**
```bash
python3
python3-pip
python3-dev
python3-venv
build-essential
libopencv-dev
pkg-config
```

## 📋 Deployment Checklist

### **Before Deployment**
- [ ] All files committed to GitHub
- [ ] `render.yaml` configured
- [ ] `render-build.sh` executable
- [ ] `requirements.txt` present
- [ ] Environment variables ready

### **After Deployment**
- [ ] Build logs show Python installation success
- [ ] App starts without errors
- [ ] Scripts page loads
- [ ] Script creation works
- [ ] Python script execution works

## 🔍 Troubleshooting

### **Build Fails - Python Installation**

**Error**: `apt-get: command not found`
**Solution**: Render uses Ubuntu, so `apt-get` should work. Check build logs.

**Error**: `pip3: command not found`
**Solution**: Make sure `python3-pip` is installed in build script.

### **Build Fails - OpenCV Installation**

**Error**: `No module named 'cv2'`
**Solution**: Install system dependencies first:
```bash
apt-get install -y libopencv-dev python3-dev build-essential
```

### **Runtime Fails - Script Execution**

**Error**: `Python executable not found`
**Solution**: Verify Python is in PATH:
```bash
# In build script, add:
ln -sf /usr/bin/python3 /usr/bin/python
```

### **Memory Issues**

**Error**: `Build killed due to memory limit`
**Solution**: 
1. Upgrade to paid plan for more memory
2. Or optimize build by removing unnecessary packages

## 📊 Build Process

### **Step-by-Step Build**
1. **Clone Repository**: Render clones your GitHub repo
2. **Run Build Script**: Executes `./render-build.sh`
3. **Install Node.js**: `npm install`
4. **Install Python**: `apt-get install python3 python3-pip`
5. **Install Python Packages**: `pip3 install -r requirements.txt`
6. **Verify Installation**: Test imports
7. **Create Directories**: `server/scripts`, etc.
8. **Start Application**: `npm start`

### **Expected Build Output**
```
🚀 Starting Render.com build for ESP32-CAM with Python support
==============================================================
[BUILD] Installing Node.js dependencies...
[SUCCESS] Node.js dependencies installed
[BUILD] Installing Python and system dependencies...
[SUCCESS] System dependencies installed
[BUILD] Installing Python packages...
[SUCCESS] Python packages installed from requirements.txt
[BUILD] Testing Python imports...
✅ OpenCV version: 4.8.1
✅ NumPy version: 1.24.3
✅ Requests version: 2.31.0
🎉 All Python packages imported successfully!
[SUCCESS] ✅ Build completed successfully!
🎯 Ready for deployment with Python script support
```

## 🎯 Post-Deployment Testing

### **1. Test Web Interface**
```bash
# Your deployed URL
https://your-app.onrender.com

# Test pages:
- /login ✅
- /dashboard ✅
- /scripts ✅
- /analytics ✅
```

### **2. Test Script Creation**
1. Login to your deployed app
2. Go to Scripts tab
3. Create new script with template
4. Verify script starts without Python errors

### **3. Test Analytics**
1. Let script run for a few minutes
2. Go to Analytics tab
3. Verify detection data appears

## 🔄 Updating Deployment

### **Code Changes**
```bash
# Make changes
git add .
git commit -m "Update custom scripts"
git push origin main

# Render auto-deploys on push
```

### **Environment Variables**
Update in Render dashboard → Environment tab

### **Python Dependencies**
Update `requirements.txt` and redeploy

## 💰 Cost Considerations

### **Free Tier Limitations**
- ✅ 750 hours/month (enough for testing)
- ❌ Sleeps after 15 minutes of inactivity
- ❌ Limited build minutes

### **Paid Tier Benefits**
- ✅ Always-on service
- ✅ More memory for builds
- ✅ Faster builds
- ✅ Custom domains

## 🎉 Success Indicators

Your deployment is successful when:

1. **Build Completes**: No errors in build logs
2. **App Starts**: Shows "Server running on port 3000"
3. **Python Available**: Scripts can be created and started
4. **Database Connected**: Supabase connection works
5. **All Features Work**: Dashboard, scripts, analytics functional

## 📞 Support

If deployment fails:

1. **Check Build Logs**: Render dashboard → Logs tab
2. **Verify Environment Variables**: All required vars set
3. **Test Locally**: `./render-build.sh` should work locally
4. **Check GitHub**: All files committed and pushed

Your ESP32-CAM platform with Python support is now ready for production on Render.com! 🚀
