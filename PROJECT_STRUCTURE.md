# 📁 Project Structure

## 🗂️ Clean Code Structure

```
ESP-Cam/
├── 📄 Configuration Files
│   ├── package.json              # Dependencies & scripts
│   ├── env.example               # Environment template
│   ├── .gitignore               # Git ignore rules
│   └── ADDRESS_CONFIG.md        # ADDRESS variable guide
│
├── 🗄️ Database
│   └── prisma/
│       └── schema.prisma        # Database schema
│
├── 🖥️ Server Code
│   ├── server/
│   │   ├── index.js            # Main server file
│   │   ├── middleware/
│   │   │   └── auth.js         # Authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js         # Login/register routes
│   │   │   ├── dashboard.js    # Dashboard & device routes
│   │   │   ├── api.js          # Streaming API routes
│   │   │   └── docs.js         # Documentation & generator
│   │   └── services/
│   │       ├── database.js     # Database operations
│   │       └── StreamManager.js # Stream handling
│
├── 🎨 Frontend Templates
│   └── views/
│       ├── layout.ejs          # Base template
│       ├── login.ejs           # Login page
│       ├── register.ejs        # Register page
│       ├── dashboard.ejs       # Main dashboard
│       ├── device-viewer.ejs   # Stream viewer
│       ├── docs.ejs            # Documentation
│       ├── code-generator.ejs  # ESP32 code generator
│       └── error.ejs           # Error pages
│
├── 🔧 ESP32 Code
│   └── esp32/
│       └── esp32_cam_universal.ino  # Universal ESP32-CAM code
│
├── 🚀 Deployment
│   ├── Dockerfile              # Docker container
│   ├── docker-compose.yml      # Docker compose
│   ├── railway.json           # Railway.app config
│   ├── Procfile               # Heroku config
│   └── setup.sh               # Setup script
│
└── 📚 Documentation
    ├── README.md               # Main documentation
    ├── QUICKSTART.md          # Quick setup guide
    └── ADDRESS_CONFIG.md      # ADDRESS variable guide
```

## 🎯 Key Features

### **Single ESP32 Code**
- ✅ One universal `.ino` file for all configurations
- ✅ Customizable via web interface
- ✅ No external library dependencies

### **Web-Based Configuration**
- ✅ Interactive code generator at `/docs/generator`
- ✅ Complete documentation at `/docs`
- ✅ Device management dashboard

### **Environment-Based URLs**
- ✅ `ADDRESS` variable in `.env` controls all URLs
- ✅ Easy switching between local/production
- ✅ ESP32-CAM friendly configuration

### **Production Ready**
- ✅ Docker containerization
- ✅ Railway.app deployment
- ✅ Heroku support
- ✅ Environment-based configuration

## 🛠️ Development Workflow

### **1. Initial Setup**
```bash
npm install
cp env.example .env
# Edit .env with your settings
npm run db:generate
npm run db:push
npm run dev
```

### **2. ESP32-CAM Setup**
1. Visit `http://localhost:3000/docs/generator`
2. Fill configuration form
3. Download generated code
4. Upload to ESP32-CAM

### **3. Production Deployment**
```bash
# Docker
docker-compose up -d

# Railway
railway up

# Heroku
git push heroku main
```

## 📦 Clean Installation

This project structure contains only source code:
- ❌ No `node_modules/` (run `npm install`)
- ❌ No database files (run `npm run db:push`)
- ❌ No `.env` file (copy from `env.example`)
- ❌ No build artifacts
- ✅ Clean, ready-to-deploy code

## 🎉 Ready to Use!

The project is now clean and ready for:
- ✅ Version control (git)
- ✅ Distribution/sharing
- ✅ Fresh installation
- ✅ Production deployment
