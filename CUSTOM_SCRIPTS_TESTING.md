# Custom Scripts & Analytics Testing Guide

## 🚀 Quick Setup & Testing

### 1. Database Setup

First, execute the database schema in your Supabase SQL Editor:

```bash
# Copy and paste the contents of database-update.sql into Supabase SQL Editor
cat database-update.sql
```

### 2. Install Python Dependencies

```bash
# Install Python requirements for script execution
pip install -r requirements.txt

# Or install individually:
pip install opencv-python requests numpy
```

### 3. Start the Server

```bash
# Install Node.js dependencies (if not already done)
npm install

# Start development server
npm run dev
```

Server will be available at: `http://localhost:3000`

## 🧪 Testing Custom Scripts Feature

### Step 1: Access Scripts Page

1. Login to your dashboard at `http://localhost:3000`
2. Navigate to **Scripts** tab in the navigation
3. You should see the Custom Scripts management interface

### Step 2: Create Your First Script

1. Click **"Create New Script"** button
2. Fill in the form:
   - **Name**: "Test Face Detection"
   - **Device**: Select one of your ESP32-CAM devices
   - **Description**: "Testing face detection script"
3. Use one of the template buttons:
   - Click **"Face Detection Template"** to load example code
   - Or **"Motion Detection Template"** for motion detection
4. **Important**: Replace `YOUR_VIEWER_API_KEY_HERE` with your actual viewer API key from device settings
5. Click **"Validate"** to check script syntax
6. Click **"Create Script"** to save

### Step 3: Test Script Execution

1. Find your created script in the list
2. Click **"Start"** button
3. Check the script status - should show "Running" with green indicator
4. Monitor server console for script output:
   ```
   ✅ Script test-script-id started with PID 12345
   [Script test-script-id] Face detection script started
   [Script test-script-id] Starting face detection loop...
   ```

### Step 4: Verify Analytics Data

1. Navigate to **Analytics** tab
2. You should see:
   - Updated detection counts in overview cards
   - Charts showing detection timeline
   - Device analytics with your script's detections
3. Check **Recent Detection Activity** section for logged events

## 📊 Testing Analytics Feature

### API Testing with curl

Test the analytics logging endpoint directly:

```bash
# Log a test detection
curl -X POST http://localhost:3000/analytics/log \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "YOUR_USER_ID",
    "deviceId": "YOUR_DEVICE_ID", 
    "scriptId": "YOUR_SCRIPT_ID",
    "detectionType": "face",
    "detectedCount": 3,
    "confidence": 0.85,
    "metadata": {"test": true}
  }'
```

### Get Analytics Data

```bash
# Get device analytics
curl "http://localhost:3000/analytics/YOUR_DEVICE_ID?timeRange=24h" \
  -H "Cookie: token=YOUR_JWT_TOKEN"

# Get chart data
curl "http://localhost:3000/analytics/YOUR_DEVICE_ID/chart?timeRange=24h" \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

## 🔧 Script Management Testing

### Test All Script Operations

1. **Create Script**: ✅ Test with both templates
2. **Edit Script**: Click "Edit" → Modify code → Save
3. **Start Script**: Click "Start" → Verify "Running" status
4. **Stop Script**: Click "Stop" → Verify "Stopped" status  
5. **Restart Script**: Click "Restart" → Verify process restart
6. **Delete Script**: Click "Delete" → Confirm deletion

### Script Status Verification

Check script manager stats:
```bash
curl http://localhost:3000/api/scripts/stats \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

Expected response:
```json
{
  "success": true,
  "stats": {
    "totalRunning": 1,
    "scripts": [
      {
        "scriptId": "script-id",
        "pid": 12345,
        "startTime": 1234567890,
        "uptime": 30000
      }
    ]
  }
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Script Won't Start
```
Error: Script validation failed
```
**Solution**: Check Python syntax, ensure all imports are available

#### 2. No Stream Data
```
Error getting frame from stream: HTTP Error 401
```
**Solution**: Update `VIEWER_API_KEY` in your script with correct key from device settings

#### 3. Analytics Not Logging
```
Failed to log detection: HTTP 403
```
**Solution**: Verify `userId`, `deviceId`, and `scriptId` are correct

#### 4. Python Dependencies Missing
```
ModuleNotFoundError: No module named 'cv2'
```
**Solution**: Install requirements: `pip install -r requirements.txt`

### Debug Mode

Enable debug logging in scripts:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Server Logs

Monitor server console for detailed script execution logs:
```bash
npm run dev
# Watch for script manager output:
# [Script script-id] Output messages
# [Script script-id ERROR] Error messages
```

## 📈 Performance Testing

### Load Testing Scripts

Test multiple concurrent scripts:

1. Create 3-5 different scripts
2. Start all scripts simultaneously
3. Monitor system resources:
   ```bash
   # Check CPU/Memory usage
   htop
   
   # Check script processes
   ps aux | grep python
   ```

### Analytics Performance

Test analytics with bulk data:

```bash
# Generate test analytics data
for i in {1..100}; do
  curl -X POST http://localhost:3000/analytics/log \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"$USER_ID\",\"deviceId\":\"$DEVICE_ID\",\"scriptId\":\"$SCRIPT_ID\",\"detectionType\":\"test\",\"detectedCount\":$((RANDOM % 10 + 1)),\"confidence\":0.8}"
  sleep 0.1
done
```

## 🔒 Security Testing

### API Key Validation

Test with invalid keys:
```bash
# Should return 401
curl -X POST http://localhost:3000/analytics/log \
  -H "Content-Type: application/json" \
  -d '{"userId":"invalid","deviceId":"invalid","scriptId":"invalid","detectionType":"test","detectedCount":1}'
```

### Script Sandboxing

Test script isolation:
1. Create script that tries to access system files
2. Verify it runs in isolated environment
3. Check it can't affect other scripts

## 📋 Test Checklist

### ✅ Database
- [ ] Tables created successfully
- [ ] RLS policies working
- [ ] Indexes created for performance

### ✅ Backend APIs
- [ ] `/api/scripts` - CRUD operations work
- [ ] `/api/scripts/:id/start` - Script starts successfully
- [ ] `/api/scripts/:id/stop` - Script stops cleanly
- [ ] `/analytics/log` - Logging works with validation
- [ ] `/analytics/:deviceId` - Data retrieval works

### ✅ Frontend
- [ ] Scripts page loads without errors
- [ ] Script creation modal works
- [ ] Code editor (Monaco) loads properly
- [ ] Analytics page shows charts
- [ ] Real-time updates work
- [ ] Navigation between tabs works

### ✅ Script Execution
- [ ] Python scripts start and run
- [ ] Environment variables passed correctly
- [ ] Script output captured in logs
- [ ] Process cleanup on stop/restart
- [ ] Error handling and recovery

### ✅ Analytics
- [ ] Detection data logged correctly
- [ ] Charts update with new data
- [ ] Time range filtering works
- [ ] Device filtering works
- [ ] Export functionality works

## 🎯 Success Criteria

Your implementation is successful when:

1. **Scripts Management**: Can create, edit, start, stop, and delete Python scripts
2. **Script Execution**: Scripts run in background and process ESP32-CAM streams
3. **Analytics Logging**: Detection results are logged to database
4. **Data Visualization**: Charts show detection trends over time
5. **Real-time Updates**: Dashboard updates automatically
6. **Error Handling**: Graceful handling of script errors and recovery
7. **Security**: Proper API key validation and user isolation
8. **Performance**: System handles multiple concurrent scripts

## 📞 Support

If you encounter issues:

1. Check server console logs
2. Verify database tables exist
3. Ensure Python dependencies installed
4. Test API endpoints with curl
5. Check script syntax and API keys

Happy testing! 🚀
