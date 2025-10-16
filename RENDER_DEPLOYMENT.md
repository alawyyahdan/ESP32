# Render.com Deployment Guide

This guide will help you deploy your ESP32-CAM Streaming Provider to Render.com.

## 🚀 Quick Deployment

### Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Supabase Database**: Set up Supabase first (see `SUPABASE_SETUP.md`)
3. **Render Account**: Create account at [render.com](https://render.com)

### 1. Connect GitHub Repository

1. Log in to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" > "Web Service"
3. Connect your GitHub account
4. Select your ESP32-CAM repository
5. Click "Connect"

### 2. Configure Web Service

Fill in the deployment settings:

**Basic Settings:**
- **Name**: `esp32-cam-streaming` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`

**Build & Deploy:**
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Pricing:**
- **Instance Type**: `Free` (for testing) or `Starter` (for production)

### 3. Environment Variables

Add these environment variables in Render dashboard:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | (auto-filled) | Render provides this |
| `ADDRESS` | `https://your-app.onrender.com` | Replace with your Render URL |
| `SUPABASE_URL` | `https://your-project.supabase.co` | From Supabase dashboard |
| `SUPABASE_ANON_KEY` | `your-anon-key` | From Supabase API settings |
| `SUPABASE_SERVICE_KEY` | `your-service-key` | From Supabase API settings |
| `JWT_SECRET` | `your-secure-random-string` | Generate a strong secret |
| `ADMIN_PASS` | `your-admin-password` | Optional admin password |

**To add environment variables:**
1. Go to your service dashboard
2. Click "Environment"
3. Click "Add Environment Variable"
4. Enter key and value
5. Click "Save Changes"

### 4. Deploy

1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Wait for deployment to complete (5-10 minutes)
4. Your app will be available at `https://your-app.onrender.com`

## 🔧 Configuration

### Custom Domain (Optional)

1. Go to service dashboard
2. Click "Settings"
3. Scroll to "Custom Domains"
4. Add your domain
5. Configure DNS records as shown

### Auto-Deploy

Render automatically deploys when you push to your connected branch:

1. Make changes to your code
2. Push to GitHub
3. Render detects changes and redeploys
4. Check deployment logs for any issues

## 📊 Monitoring

### Deployment Logs

Monitor your deployment:

1. Go to service dashboard
2. Click "Logs"
3. View real-time logs
4. Check for errors or issues

### Metrics

View performance metrics:

1. Click "Metrics" tab
2. Monitor CPU, memory, response times
3. Set up alerts if needed

## 🔒 Security

### Environment Variables

- Never commit secrets to GitHub
- Use Render's environment variables for all sensitive data
- Rotate secrets regularly

### HTTPS

Render provides free SSL certificates:
- Automatic HTTPS for all apps
- Custom domain SSL included
- No configuration needed

## 💰 Pricing

### Free Tier
- **Compute**: 750 hours/month
- **Bandwidth**: 100GB/month
- **Build minutes**: 500/month
- **Sleep after 15 minutes** of inactivity

### Starter Plan ($7/month)
- **Always on**: No sleeping
- **Custom domains**: Included
- **More resources**: Better performance

### Pro Plan ($25/month)
- **Horizontal scaling**: Multiple instances
- **Advanced metrics**: Detailed monitoring
- **Priority support**: Faster response

## 🚨 Troubleshooting

### Build Failures

Common issues and solutions:

1. **Node version**: Ensure package.json specifies Node 16+
2. **Dependencies**: Check package.json for correct versions
3. **Build logs**: Check detailed error messages

### Runtime Errors

1. **Environment variables**: Verify all required vars are set
2. **Database connection**: Check Supabase credentials
3. **Port binding**: Use `process.env.PORT` (Render provides this)

### Performance Issues

1. **Free tier sleeping**: Upgrade to Starter for always-on
2. **Cold starts**: First request after sleep takes longer
3. **Resource limits**: Monitor CPU/memory usage

### Database Connection

If database connection fails:

1. **Check Supabase status**: Visit Supabase status page
2. **Verify credentials**: Double-check environment variables
3. **Network issues**: Render should have access to Supabase
4. **Connection limits**: Check Supabase connection usage

## 🔄 Updates and Maintenance

### Updating Your App

1. Make changes locally
2. Test thoroughly
3. Push to GitHub
4. Render auto-deploys
5. Monitor deployment logs

### Database Migrations

When updating database schema:

1. Update your Supabase tables manually
2. Or run migration scripts via Render shell
3. Test changes in staging first

### Backup Strategy

1. **Code**: GitHub serves as backup
2. **Database**: Supabase handles backups
3. **Environment**: Document all environment variables

## 📱 ESP32-CAM Configuration

After deployment, update your ESP32-CAM code:

```cpp
const char* serverURL = "https://your-app.onrender.com";
```

Get the exact URL from your Render dashboard.

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-js)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)
- [Render Status](https://status.render.com)
