# ESP32-CAM Streaming Provider

A comprehensive multi-user ESP32-CAM streaming platform with secure API key authentication, real-time video streaming, and web-based device management.

## 🌟 Features

- **Multi-User System**: Secure user registration and authentication
- **Device Management**: Add and manage multiple ESP32-CAM devices
- **API Key Security**: Separate keys for device streaming and public viewing
- **Real-Time Streaming**: MJPEG video streaming with low latency
- **Web Dashboard**: Modern, responsive web interface
- **Public Embedding**: Secure public viewer endpoints for embedding
- **Auto-Reconnection**: Robust connection handling with automatic recovery
- **Performance Monitoring**: Real-time statistics and device status
- **Multiple Deployment Options**: Local, Docker, Render.com support

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- ESP32-CAM hardware (AI-Thinker recommended)
- Arduino IDE with ESP32 board package
- Supabase account (free tier available)

### 1. Setup Project

```bash
# Install dependencies
npm install

# Setup environment
cp env.example .env
# Edit .env with your Supabase credentials and configuration

# Initialize database
npm run setup

# Start development server
npm run dev
```

The setup will:
- Install all Node.js dependencies
- Create Supabase database tables and indexes
- Configure Row Level Security (RLS)
- Start server at http://localhost:3000

### 2. Configure Environment

Edit `.env` file with your settings:

```env
PORT=3000
NODE_ENV=development
ADDRESS=http://localhost:3000  # Change this for ESP32-CAM access

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

JWT_SECRET=your-generated-secret
ADMIN_PASS=admin123
```

**Getting Supabase Credentials:**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings > API
4. Copy URL, anon key, and service_role key

**Important**: Change `ADDRESS` to your computer's IP for ESP32-CAM access:
```env
ADDRESS=http://192.168.1.100:3000  # Replace with your IP
```

### 3. Access Web Interface

Visit `http://localhost:3000` to:
- Create your account
- Add ESP32-CAM devices  
- Get API keys and configuration

### 4. Setup ESP32-CAM

1. **Get ESP32 Code**: Visit `/docs/generator` in web interface
2. **Fill Configuration**: WiFi, Server URL, Device ID, API Key
3. **Download Code**: Click "Generate & Download ESP32 Code"
4. **Upload to ESP32**: Use Arduino IDE with "AI Thinker ESP32-CAM" board
5. **Start Streaming**: Power on ESP32-CAM and check dashboard

📖 **Complete documentation**: Visit `/docs` in web interface for detailed guides

## 📱 Usage

### Web Interface

1. **Register Account**: Create your account at `/register`
2. **Login**: Access dashboard at `/login`
3. **Add Device**: Click "Add New Device" in dashboard
4. **Get API Keys**: View device settings to get streaming keys
5. **Configure ESP32**: Update Arduino code with your device ID and API key
6. **Start Streaming**: Power on ESP32-CAM and view live stream

### API Endpoints

#### Device Streaming (ESP32-CAM)
```
POST /api/stream/:deviceId?key=DEVICE_API_KEY
Content-Type: image/jpeg
Body: JPEG image data
```

#### Public Viewing
```
GET /api/view/:deviceId?key=VIEWER_API_KEY
Response: MJPEG stream
```

#### Device Status
```
GET /api/status/:deviceId?key=VIEWER_API_KEY
Response: JSON with device and stream information
```

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: Prisma ORM with SQLite (development) / PostgreSQL (production)
- **Streaming**: Custom MJPEG stream manager with memory buffering
- **API Security**: Separate API keys for device and viewer access

### Frontend (EJS + Tailwind CSS)
- **Responsive Design**: Mobile-first approach
- **Real-time Updates**: Auto-refreshing device status
- **Modern UI**: Clean, professional interface
- **Accessibility**: WCAG compliant design

### ESP32-CAM Firmware
- **Multiple Versions**: Simple, advanced, and high-performance variants
- **Auto-Reconnection**: Robust network error handling
- **Performance Optimization**: Frame rate and quality adaptation
- **Configuration**: Web-based setup interface (advanced version)

## 🐳 Deployment

### Local Development
```bash
npm run dev
```

### Docker
```bash
docker-compose up -d
```

### Render.com
1. Connect your GitHub repository to Render
2. Create new Web Service
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables in Render dashboard
6. Deploy automatically on git push

### Manual Production
```bash
# Install dependencies
npm ci --production

# Setup Supabase database
npm run setup

# Start production server
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `ADDRESS` | Server URL for ESP32-CAM access | `http://localhost:3000` |
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Required |
| `JWT_SECRET` | JWT signing secret | Generated |
| `ADMIN_PASS` | Admin panel password | `admin123` |

### Database Configuration

The system uses Supabase (PostgreSQL) for both development and production. The database schema includes:

- **Users**: Authentication and profile data
- **Devices**: ESP32-CAM device information and API keys
- **StreamSessions**: Streaming activity logs

### ESP32-CAM Configuration

Each ESP32-CAM needs:
- WiFi credentials
- Server URL (your deployed server)
- Device ID (from dashboard)
- Device API Key (from dashboard)

## 📊 Performance

### Streaming Performance
- **Frame Rate**: Up to 15 FPS (configurable)
- **Resolution**: Up to 1600x1200 (UXGA) with PSRAM
- **Latency**: < 500ms typical
- **Concurrent Streams**: Limited by server resources

### System Requirements
- **Server**: 512MB RAM minimum, 1GB recommended
- **ESP32-CAM**: PSRAM recommended for high resolution
- **Network**: Stable WiFi connection for ESP32-CAM

## 🛠️ Development

### Project Structure
```
ESP-Cam/
├── server/
│   ├── index.js              # Main server file
│   ├── middleware/           # Authentication middleware
│   ├── routes/              # API routes
│   └── services/            # Database and streaming services
├── views/                   # EJS templates
├── esp32/                   # Arduino code
├── prisma/                  # Database schema
└── docs/                    # Documentation
```

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Apply schema to database
- `npm run db:studio` - Open Prisma Studio

### Adding Features

1. **New API Endpoints**: Add routes in `server/routes/`
2. **Database Changes**: Update `prisma/schema.prisma`
3. **Frontend Pages**: Create EJS templates in `views/`
4. **ESP32 Features**: Modify Arduino code in `esp32/`

## 🔒 Security

### Authentication
- JWT tokens with secure HTTP-only cookies
- bcrypt password hashing with salt rounds
- Session management with automatic expiration

### API Security
- Separate API keys for device and viewer access
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS protection

### Streaming Security
- API key validation for all stream access
- User isolation (users can only access their devices)
- Automatic stream cleanup and memory management

## 🐛 Troubleshooting

### Common Issues

**ESP32-CAM won't connect to WiFi**
- Check WiFi credentials in Arduino code
- Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
- Verify signal strength at ESP32-CAM location

**Stream not appearing in dashboard**
- Verify device API key is correct
- Check server URL in ESP32-CAM code
- Ensure ESP32-CAM is powered properly (use external power supply)

**High latency or dropped frames**
- Reduce frame rate in ESP32-CAM code
- Increase JPEG quality number (lower quality)
- Check network bandwidth and stability

**Database connection errors**
- Run `npx prisma db push` to apply schema
- Check DATABASE_URL in .env file
- Ensure database file permissions are correct

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=* npm run dev
```

### Logs

Application logs are available in:
- Console output during development
- System logs in production deployment
- Browser developer tools for frontend issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the ESP32-CAM hardware documentation

## 🎯 Roadmap

- [ ] WebRTC streaming for lower latency
- [ ] Mobile app for device management
- [ ] Cloud storage integration
- [ ] Motion detection and alerts
- [ ] Multi-camera view dashboard
- [ ] Advanced analytics and reporting
- [ ] RTSP streaming support
- [ ] Audio streaming capability

---

**Made with ❤️ for the ESP32-CAM community**
