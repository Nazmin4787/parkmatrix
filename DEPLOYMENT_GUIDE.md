# Car Parking System - Deployment Guide

## 🚀 Quick Start (Free Hosting)

### Frontend Deployment (Vercel - Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Build your frontend:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

### Backend Deployment (Railway - Free Tier)

1. **Create Railway account** at railway.app
2. **Connect your GitHub repository**
3. **Set environment variables** (copy from your `.env` file)
4. **Deploy automatically** on git push

## 🌐 Production Deployment Steps

### 1. Frontend Production Build
```bash
cd frontend
npm run build
```

### 2. Backend Production Setup
```bash
cd backend
pip install -r requirements.txt
python manage.py collectstatic
python manage.py migrate
```

### 3. Environment Variables
Create `.env` file in backend:
```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
```

### 4. Update Frontend API URLs
Update `frontend/src/services/httpClient.js` with production backend URL.

## 🔧 Configuration Updates Needed

### Frontend API Configuration
Update the base URL in your HTTP client to point to your production backend.

### CORS Settings
Ensure your Django backend allows requests from your frontend domain.

### Database
- **Development**: SQLite (current)
- **Production**: PostgreSQL (recommended) or MongoDB

## 📱 Domain & SSL
1. **Buy a domain** (Namecheap, GoDaddy, etc.)
2. **Configure DNS** to point to your hosting
3. **Enable SSL/HTTPS** (automatic with Vercel/Railway)

## 🚨 Security Checklist
- [ ] Set `DEBUG=False` in production
- [ ] Use strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Enable HTTPS
- [ ] Set up proper CORS
- [ ] Use environment variables for secrets

## 💰 Cost Estimation (Monthly)
- **Domain**: $10-15/year
- **Frontend Hosting**: Free (Vercel/Netlify)
- **Backend Hosting**: Free tier available
- **Database**: Free tier available
- **Total**: ~$1-2/month for basic setup

## 🔄 Continuous Deployment
Set up GitHub Actions to automatically deploy on push to main branch.

## 📞 Support
- Vercel: Excellent documentation and support
- Railway: Good free tier and documentation
- Django: Extensive community support
