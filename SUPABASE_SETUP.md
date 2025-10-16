# Supabase Setup Guide

This guide will help you set up Supabase as the database backend for your ESP32-CAM Streaming Provider.

## 🚀 Quick Setup

### 1. Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### 2. Create New Project

1. Click "New Project"
2. Choose your organization
3. Fill in project details:
   - **Name**: `esp32-cam-streaming`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your location
4. Click "Create new project"
5. Wait for project initialization (2-3 minutes)

### 3. Get API Credentials

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: Your anonymous key
   - **service_role**: Your service role key (keep this secret!)

### 4. Update Environment Variables

Add to your `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
```

### 5. Initialize Database

Run the setup script:

```bash
npm run setup
```

This will create all necessary tables and indexes.

## 🗄️ Database Schema

The setup creates the following tables:

### Users Table
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Devices Table
```sql
CREATE TABLE devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  device_api_key VARCHAR(255) UNIQUE NOT NULL,
  viewer_api_key VARCHAR(255) UNIQUE NOT NULL,
  is_online BOOLEAN DEFAULT FALSE,
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Stream Sessions Table
```sql
CREATE TABLE stream_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);
```

## 🔒 Security Configuration

### Row Level Security (RLS)

The setup automatically enables RLS with these policies:

- **Users**: Can only view/update their own data
- **Devices**: Users can only access their own devices
- **Stream Sessions**: Users can only view sessions for their devices

### API Keys

- **Anon Key**: Used for client-side operations (safe to expose)
- **Service Key**: Used for admin operations (keep secret!)

## 🚀 Production Deployment

### Environment Variables for Production

Set these in your deployment platform (Render.com):

```env
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
JWT_SECRET=your-production-jwt-secret
ADDRESS=https://your-app.onrender.com
```

### Database Backup

Supabase automatically backs up your database. You can also:

1. Go to **Settings** > **Database**
2. Click "Database backups"
3. Configure backup schedule

## 🔧 Troubleshooting

### Connection Issues

1. **Check credentials**: Verify URL and keys are correct
2. **Network access**: Ensure your server can reach Supabase
3. **API limits**: Free tier has usage limits

### Table Creation Errors

If automatic setup fails:

1. Go to **SQL Editor** in Supabase dashboard
2. Run the SQL commands from `server/setup-db.js` manually
3. Check for any error messages

### RLS Issues

If you get permission errors:

1. Go to **Authentication** > **Policies**
2. Verify RLS policies are created
3. Temporarily disable RLS for testing (not recommended for production)

## 📊 Monitoring

### Database Usage

Monitor your usage in Supabase dashboard:

1. Go to **Settings** > **Usage**
2. Check database size, API requests, bandwidth
3. Upgrade plan if needed

### Performance

- Use indexes for better query performance
- Monitor slow queries in **Logs** section
- Consider connection pooling for high traffic

## 🆓 Free Tier Limits

Supabase free tier includes:

- **Database**: Up to 500MB
- **API requests**: 50,000 per month
- **Bandwidth**: 2GB per month
- **Storage**: 1GB

Perfect for development and small deployments!

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
