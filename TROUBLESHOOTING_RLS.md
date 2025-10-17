# 🔧 Troubleshooting RLS Policy Error

## ❌ Error yang Terjadi
```
Create script error: {
  code: '42501',
  details: null,
  hint: null,
  message: 'new row violates row-level security policy for table "custom_scripts"'
}
```

## 🔍 Penyebab Masalah

Error ini terjadi karena:
1. **RLS (Row Level Security)** diaktifkan di tabel `custom_scripts`
2. **Policy RLS** menggunakan `auth.uid()` yang hanya bekerja dengan Supabase Auth
3. **Aplikasi kita** menggunakan custom JWT authentication, bukan Supabase Auth
4. **Database service** menggunakan `SUPABASE_ANON_KEY` instead of `SUPABASE_SERVICE_KEY`

## ✅ Solusi 1: Disable RLS (Recommended)

### Step 1: Execute SQL di Supabase
```sql
-- Copy paste ini ke Supabase SQL Editor
-- Disable RLS untuk custom_scripts dan analytics_data
ALTER TABLE custom_scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data DISABLE ROW LEVEL SECURITY;

-- Drop existing policies yang bermasalah
DROP POLICY IF EXISTS "Users can manage own scripts" ON custom_scripts;
DROP POLICY IF EXISTS "Users can manage own analytics" ON analytics_data;
```

### Step 2: Verify Environment Variables
Pastikan file `.env` Anda memiliki:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key  # ← Pastikan ini ada!
```

### Step 3: Restart Server
```bash
# Stop server (Ctrl+C)
# Start again
npm run dev
```

## ✅ Solusi 2: Fix RLS Policies (Advanced)

Jika Anda ingin tetap menggunakan RLS, gunakan policies ini:

```sql
-- Re-enable RLS
ALTER TABLE custom_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;

-- Create policies yang bekerja dengan service key
CREATE POLICY "Service role can manage all scripts" ON custom_scripts
  FOR ALL USING (true);

CREATE POLICY "Service role can manage all analytics" ON analytics_data
  FOR ALL USING (true);
```

## 🧪 Testing Fix

### Test 1: Create Script via API
```bash
curl -X POST http://localhost:3000/api/scripts \
  -H "Content-Type: application/json" \
  -H "Cookie: token=YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Script",
    "deviceId": "YOUR_DEVICE_ID",
    "description": "Testing RLS fix",
    "scriptContent": "print(\"Hello World\")",
    "scriptType": "python"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Script created successfully",
  "script": { ... }
}
```

### Test 2: Create Script via Web Interface
1. Go to `http://localhost:3000/scripts`
2. Click "Create New Script"
3. Fill form and save
4. Should work without RLS error

## 🔒 Security Considerations

### Mengapa Disable RLS Aman?

1. **Application-level Security**: Kita sudah implementasi user isolation di aplikasi
2. **JWT Authentication**: Setiap request sudah divalidasi dengan JWT
3. **API Key Validation**: Endpoint analytics sudah ada validasi API key
4. **User ID Checking**: Semua operasi sudah cek ownership berdasarkan user ID

### Code Security yang Sudah Ada:

```javascript
// Di scripts.js - sudah ada user isolation
const script = await customScriptService.getScriptById(id, req.user.id);
if (!script) {
  return res.status(404).json({ error: 'Script not found' });
}

// Di analytics.js - sudah ada device ownership check
const device = await deviceService.findDeviceById(deviceId);
if (!device || device.userId !== userId) {
  return res.status(403).json({ error: 'Invalid device or user' });
}
```

## 🚀 Quick Fix Commands

Execute semua command ini untuk fix cepat:

### 1. Update Database (Supabase SQL Editor)
```sql
ALTER TABLE custom_scripts DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own scripts" ON custom_scripts;
DROP POLICY IF EXISTS "Users can manage own analytics" ON analytics_data;
```

### 2. Verify Environment
```bash
# Check if SERVICE_KEY exists
grep SUPABASE_SERVICE_KEY .env
```

### 3. Restart Server
```bash
npm run dev
```

### 4. Test Script Creation
Go to `http://localhost:3000/scripts` and create a test script.

## ✅ Verification Checklist

- [ ] RLS disabled di Supabase
- [ ] `SUPABASE_SERVICE_KEY` ada di `.env`
- [ ] Server restarted
- [ ] Script creation works via web interface
- [ ] Analytics logging works
- [ ] No more RLS errors in console

## 📞 Still Having Issues?

If you still get RLS errors:

1. **Double-check Supabase credentials**:
   - URL correct?
   - Service key correct?
   - Keys not swapped?

2. **Check database connection**:
   ```bash
   # Should show "Supabase connected successfully"
   npm run dev
   ```

3. **Verify table exists**:
   ```sql
   SELECT * FROM custom_scripts LIMIT 1;
   ```

4. **Check server logs** for detailed error messages

The fix should resolve the RLS policy violation error and allow script creation to work properly! 🎉
