# 🌐 ADDRESS Configuration Guide

## 📋 Overview

Variable `ADDRESS` di `.env` digunakan untuk mengatur base URL server yang akan muncul di seluruh sistem. Ini menggantikan semua hardcoded localhost dan domain references.

## ⚙️ Configuration

### 1. **Edit .env File**
```bash
# Server Configuration
PORT=3000
NODE_ENV=development
ADDRESS=http://localhost:3000  # Ganti sesuai kebutuhan
```

### 2. **Example Configurations**

#### **Local Development**
```bash
ADDRESS=http://localhost:3000
```

#### **Local Network (untuk ESP32-CAM)**
```bash
ADDRESS=http://192.168.1.100:3000  # Ganti dengan IP komputer Anda
```

#### **ngrok Tunnel**
```bash
ADDRESS=https://abc123.ngrok.io
```

#### **Production Domain**
```bash
ADDRESS=https://your-domain.com
```

#### **Railway.app Deployment**
```bash
ADDRESS=https://your-app.railway.app
```

## 🎯 What Gets Replaced

### **Dashboard URLs:**
- Stream URLs (POST/GET endpoints)
- Embed code HTML
- Direct viewer links

### **Code Generator:**
- Default server URL in form
- Generated ESP32 code
- Download timestamps

### **Documentation:**
- Example URLs
- Configuration snippets

### **CORS Settings:**
- Allowed origins
- Production/development modes

## 🔧 Usage Examples

### **Scenario 1: Local Development**
```bash
# .env
ADDRESS=http://localhost:3000
```
**Result**: Semua URL akan menggunakan `http://localhost:3000`

### **Scenario 2: ESP32-CAM Testing**
```bash
# .env  
ADDRESS=http://192.168.1.100:3000
```
**Result**: ESP32-CAM bisa akses server via IP lokal

### **Scenario 3: Public Access**
```bash
# .env
ADDRESS=https://myesp32.herokuapp.com
```
**Result**: Bisa diakses dari internet

## 🚀 Benefits

### ✅ **Centralized Configuration**
- Satu tempat untuk mengatur semua URLs
- Tidak perlu edit banyak file

### ✅ **Environment Flexibility**
- Mudah switch antara local/staging/production
- Support untuk berbagai deployment methods

### ✅ **ESP32-CAM Friendly**
- Otomatis generate URL yang benar untuk ESP32
- Tidak perlu manual edit kode ESP32

### ✅ **Dynamic URL Generation**
- Dashboard otomatis pakai ADDRESS yang benar
- Code generator otomatis isi server URL

## 🔄 How to Change

### **Step 1: Update .env**
```bash
nano .env
# Edit ADDRESS=your-new-url
```

### **Step 2: Restart Server**
```bash
npm run dev
# atau
pm2 restart esp32-cam-server
```

### **Step 3: Verify**
- Buka dashboard
- Cek device settings → Stream URLs
- Pastikan URL sudah berubah

## 🌍 Deployment Examples

### **Railway.app**
```bash
# .env
ADDRESS=https://esp32cam-production.railway.app
```

### **Heroku**
```bash
# .env  
ADDRESS=https://myesp32cam.herokuapp.com
```

### **VPS/Dedicated Server**
```bash
# .env
ADDRESS=https://esp32.yourdomain.com
```

### **Local Network**
```bash
# .env
ADDRESS=http://192.168.1.50:3000
```

## 🔍 Troubleshooting

### **Problem**: ESP32-CAM tidak bisa connect
**Solution**: Pastikan ADDRESS menggunakan IP yang bisa diakses ESP32
```bash
# Bad
ADDRESS=http://localhost:3000

# Good  
ADDRESS=http://192.168.1.100:3000
```

### **Problem**: CORS error di browser
**Solution**: Pastikan ADDRESS sesuai dengan URL yang diakses browser
```bash
# Jika akses via domain
ADDRESS=https://yourdomain.com

# Jika akses via IP
ADDRESS=http://192.168.1.100:3000
```

### **Problem**: Generated code salah URL
**Solution**: Restart server setelah ubah ADDRESS
```bash
pkill -f "npm run dev"
npm run dev
```

## 💡 Pro Tips

### **1. Use IP for ESP32-CAM**
```bash
# Untuk ESP32-CAM, selalu gunakan IP, bukan localhost
ADDRESS=http://192.168.1.100:3000
```

### **2. HTTPS for Production**
```bash
# Production harus HTTPS
ADDRESS=https://yourdomain.com
```

### **3. Port Consistency**
```bash
# Pastikan PORT dan ADDRESS konsisten
PORT=3000
ADDRESS=http://192.168.1.100:3000
```

### **4. Environment-Specific**
```bash
# Development
ADDRESS=http://localhost:3000

# Staging  
ADDRESS=https://staging.yourdomain.com

# Production
ADDRESS=https://yourdomain.com
```

---

**🎉 Sekarang semua URL di sistem akan otomatis menggunakan ADDRESS dari .env!**

