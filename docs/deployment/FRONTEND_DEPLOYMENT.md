# Frontend Deployment Guide

This comprehensive guide walks you through deploying the BookVerse frontend application to production, from environment setup to monitoring and troubleshooting.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Build Configuration](#build-configuration)
4. [Deployment Platforms](#deployment-platforms)
5. [Step-by-Step Deployment](#step-by-step-deployment)
6. [Post-Deployment Configuration](#post-deployment-configuration)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)
9. [Maintenance and Updates](#maintenance-and-updates)

---

## Prerequisites

Before deploying the BookVerse frontend, ensure you have:

### Required Accounts and Services

- ✅ **Backend API Deployed** - Frontend requires a running backend
  - See [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) for backend deployment
  - Note your backend API URL (e.g., `https://api.bookverse.com`)

- ✅ **Hosting Platform Account** - Choose one:
  - Vercel (recommended for React/Vite)
  - Netlify
  - Cloudflare Pages
  - AWS Amplify
  - GitHub Pages (static hosting)

### Optional Services

- ⚪ **Domain Name** - Custom domain (optional)
  - Purchase from Namecheap, GoDaddy, Google Domains, etc.
  - Configure DNS settings for your chosen platform

- ⚪ **Analytics Service** - Track user behavior (optional)
  - Google Analytics
  - Plausible Analytics
  - Fathom Analytics

### Technical Requirements

- **Node.js**: v16.x or higher
- **npm**: v8.x or higher
- **Git**: For version control and deployment

### Knowledge Requirements

- Basic understanding of React applications
- Familiarity with environment variables
- Basic command line usage
- Understanding of DNS and domain configuration

---

## Environment Variables

The frontend requires environment variables to connect to the backend API. Vite uses the `VITE_` prefix for environment variables that should be exposed to the client.

### Required Environment Variables

#### API Configuration

```env
# Backend API URL
VITE_API_URL=https://your-backend-api.com/api
```

**Details:**
- `VITE_API_URL`: Full URL to your backend API including the `/api` path
- Must include protocol (`https://` or `http://`)
- No trailing slash after `/api`
- This URL is embedded in the client-side bundle

**Examples:**
```env
# Railway backend
VITE_API_URL=https://bookverse-api.up.railway.app/api

# Render backend
VITE_API_URL=https://bookverse-api.onrender.com/api

# Custom domain
VITE_API_URL=https://api.bookverse.com/api

# Local development
VITE_API_URL=http://localhost:5000/api
```

### Environment Variable Security

**Important Notes:**

⚠️ **Client-Side Exposure:**
- All `VITE_` prefixed variables are embedded in the client bundle
- They are visible to anyone who inspects the browser code
- **NEVER** store sensitive credentials (API keys, secrets) in frontend environment variables
- Only store public configuration values

✅ **Best Practices:**
- Use different API URLs for development, staging, and production
- Document required variables in `.env.example`
- Use hosting platform's environment variable management
- Verify variables are set correctly before deployment

**Verification Checklist:**
- [ ] `.env` is listed in `.gitignore`
- [ ] `VITE_API_URL` points to production backend
- [ ] No sensitive credentials in environment variables
- [ ] `.env.example` is up to date

---

## Build Configuration

The BookVerse frontend uses Vite as the build tool, which provides fast builds and optimized production bundles.

### Build Settings

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
client/dist/
```

**Build Process:**
1. Vite compiles React components
2. Tailwind CSS processes styles
3. Assets are optimized and hashed
4. Source maps are generated (optional)
5. Output is written to `dist/` directory

### Vite Configuration

The `vite.config.js` file contains build optimization settings:

```javascript
export default defineConfig({
  plugins: [react()],
  build: {
    target: ['chrome120', 'firefox120', 'safari17', 'edge120'],
    cssTarget: ['chrome120', 'firefox120', 'safari17', 'edge120']
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
```

**Key Settings:**
- **Target Browsers**: Modern browsers (last 2 versions)
- **CSS Target**: Matches browser targets for optimal CSS
- **Dev Server Port**: 3000 (development only)
- **API Proxy**: Proxies `/api` requests in development (not used in production)

### Build Optimization

**Automatic Optimizations:**
- ✅ Code splitting for faster initial load
- ✅ Tree shaking to remove unused code
- ✅ Minification of JavaScript and CSS
- ✅ Asset hashing for cache busting
- ✅ Compression (gzip/brotli) by hosting platform

**Bundle Size:**
- Typical production bundle: 200-400 KB (gzipped)
- Initial load: ~150 KB
- Lazy-loaded chunks: 50-100 KB each

### Tailwind CSS Configuration

Tailwind CSS is configured to purge unused styles in production:

```javascript
// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // ... theme configuration
}
```

**Production Optimizations:**
- Unused CSS classes are removed
- Final CSS bundle: ~20-30 KB (gzipped)
- Critical CSS is inlined automatically

---

## Deployment Platforms

BookVerse frontend can be deployed to various platforms. Here's a comparison to help you choose:

### Platform Comparison

| Platform | Free Tier | Ease of Use | Performance | Best For |
|----------|-----------|-------------|-------------|----------|
| **Vercel** | ✅ Unlimited | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ Excellent | React/Vite apps, automatic deployments |
| **Netlify** | ✅ 100 GB bandwidth | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Very Good | Static sites, form handling |
| **Cloudflare Pages** | ✅ Unlimited | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐⭐⭐ Excellent | Global CDN, fast performance |
| **AWS Amplify** | ❌ Pay per use | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | AWS ecosystem integration |
| **GitHub Pages** | ✅ Free | ⭐⭐⭐ Good | ⭐⭐⭐ Fair | Simple static sites |

### Recommended Platform: Vercel

**Why Vercel?**
- ✅ Built specifically for React and Vite applications
- ✅ Automatic deployments from GitHub
- ✅ Instant rollbacks and preview deployments
- ✅ Global CDN with edge caching
- ✅ Automatic HTTPS and SSL
- ✅ Generous free tier (unlimited bandwidth)
- ✅ Excellent performance and reliability
- ✅ Built-in analytics (optional)

**Limitations:**
- Free tier has execution time limits (not relevant for static sites)
- Commercial use may require paid plan

### Alternative: Netlify

**Why Netlify?**
- ✅ Generous free tier (100 GB bandwidth/month)
- ✅ Easy GitHub integration
- ✅ Form handling and serverless functions
- ✅ Automatic HTTPS
- ✅ Split testing and branch deploys

**Limitations:**
- Bandwidth limits on free tier
- Build minutes limited (300/month on free tier)

---

## Step-by-Step Deployment

This section provides detailed deployment instructions for the most popular platforms.

### Option 1: Deploy to Vercel (Recommended)

Vercel offers the best experience for React applications with automatic GitHub integration.

#### Prerequisites
- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- BookVerse code pushed to GitHub repository
- Backend API deployed and accessible

#### Step 1: Prepare Repository

1. **Ensure Code is Pushed to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify Build Works Locally**
   ```bash
   cd client
   npm install
   npm run build
   npm run preview
   ```

#### Step 2: Create Vercel Project

1. **Sign in to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Sign Up" and authenticate with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose your BookVerse repository
   - Click "Import"

#### Step 3: Configure Project Settings

1. **Framework Preset**
   - Vercel should auto-detect "Vite"
   - If not, select "Vite" from the dropdown

2. **Root Directory**
   - Set to `client` (since frontend is in client folder)
   - Click "Edit" next to Root Directory
   - Enter `client`

3. **Build Settings**
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

#### Step 4: Configure Environment Variables

1. **Add Environment Variables**
   - Scroll to "Environment Variables" section
   - Click "Add" for each variable

2. **Required Variables**
   ```
   VITE_API_URL=https://your-backend-api.com/api
   ```

   **Example:**
   ```
   VITE_API_URL=https://bookverse-api.up.railway.app/api
   ```

3. **Environment Selection**
   - Select "Production", "Preview", and "Development"
   - This ensures variables are available in all environments

#### Step 5: Deploy

1. **Click "Deploy"**
   - Vercel will start building your application
   - Watch build logs in real-time
   - First deployment takes 2-5 minutes

2. **Deployment Complete**
   - Vercel provides a production URL
   - Format: `https://bookverse-xxxxx.vercel.app`
   - Click "Visit" to view your deployed site

#### Step 6: Configure Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to project "Settings" → "Domains"
   - Click "Add"
   - Enter your domain (e.g., `bookverse.com` or `www.bookverse.com`)

2. **Configure DNS**
   - Vercel provides DNS configuration instructions
   - Add records in your domain registrar:

   **For apex domain (bookverse.com):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **Wait for SSL**
   - Vercel automatically provisions SSL certificate
   - Takes 5-10 minutes after DNS propagation
   - Verify at `https://your-domain.com`

#### Step 7: Configure Automatic Deployments

Vercel automatically deploys on every push to your repository:

```bash
# Make changes to your code
git add .
git commit -m "Update homepage design"
git push origin main

# Vercel automatically detects the push and deploys
```

**Preview Deployments:**
- Every pull request gets a unique preview URL
- Test changes before merging to main
- Preview URLs: `https://bookverse-xxxxx-git-branch-name.vercel.app`

#### Step 8: Update Backend CORS

Update your backend's `FRONTEND_URL` environment variable:

```env
FRONTEND_URL=https://bookverse-xxxxx.vercel.app
# Or your custom domain:
FRONTEND_URL=https://bookverse.com
```

This ensures the backend accepts requests from your frontend.

---

### Option 2: Deploy to Netlify

Netlify offers excellent features for static sites with easy GitHub integration.

#### Prerequisites
- GitHub account
- Netlify account (sign up at [netlify.com](https://netlify.com))
- BookVerse code pushed to GitHub repository
- Backend API deployed and accessible

#### Step 1: Create Netlify Site

1. **Sign in to Netlify**
   - Go to [netlify.com](https://netlify.com)
   - Click "Sign Up" and authenticate with GitHub

2. **Add New Site**
   - Click "Add new site" → "Import an existing project"
   - Select "Deploy with GitHub"
   - Authorize Netlify to access your repositories
   - Select your BookVerse repository

#### Step 2: Configure Build Settings

1. **Basic Build Settings**
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/dist`

2. **Advanced Settings**
   - Click "Show advanced"
   - Add environment variables

#### Step 3: Add Environment Variables

1. **Environment Variables Section**
   - Click "New variable"
   - Add required variables:

   ```
   Key: VITE_API_URL
   Value: https://your-backend-api.com/api
   ```

2. **Save Variables**
   - Click "Deploy site"

#### Step 4: Deploy

1. **Initial Deployment**
   - Netlify starts building your site
   - Watch build logs in real-time
   - First deployment takes 2-5 minutes

2. **Get Your URL**
   - Netlify provides a random URL
   - Format: `https://random-name-123456.netlify.app`
   - Click "Open production deploy" to view

#### Step 5: Configure Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter your domain (e.g., `bookverse.com`)

2. **Configure DNS**
   - **Option A: Use Netlify DNS** (Recommended)
     - Transfer nameservers to Netlify
     - Netlify manages all DNS records
     - Automatic SSL provisioning

   - **Option B: External DNS**
     - Add CNAME record:
       ```
       Type: CNAME
       Name: www (or @)
       Value: random-name-123456.netlify.app
       ```

3. **Enable HTTPS**
   - Netlify automatically provisions SSL
   - Takes 5-10 minutes
   - Force HTTPS redirect is enabled by default

#### Step 6: Configure Redirects

Create a `_redirects` file in `client/public/` for SPA routing:

```bash
# client/public/_redirects
/*    /index.html   200
```

This ensures all routes are handled by React Router.

#### Step 7: Update Backend CORS

Update your backend's `FRONTEND_URL` environment variable:

```env
FRONTEND_URL=https://random-name-123456.netlify.app
# Or your custom domain:
FRONTEND_URL=https://bookverse.com
```

---

### Option 3: Deploy to Cloudflare Pages

Cloudflare Pages offers excellent performance with global CDN.

#### Prerequisites
- GitHub account
- Cloudflare account (sign up at [cloudflare.com](https://cloudflare.com))
- BookVerse code pushed to GitHub repository

#### Step 1: Create Pages Project

1. **Sign in to Cloudflare**
   - Go to [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to "Pages"

2. **Create Project**
   - Click "Create a project"
   - Select "Connect to Git"
   - Authorize Cloudflare
   - Select your repository

#### Step 2: Configure Build

1. **Build Settings**
   - **Production branch**: `main`
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `client`

2. **Environment Variables**
   - Click "Add variable"
   - Add:
     ```
     VITE_API_URL=https://your-backend-api.com/api
     ```

#### Step 3: Deploy

1. **Save and Deploy**
   - Click "Save and Deploy"
   - Watch build progress
   - First deployment takes 2-5 minutes

2. **Get Your URL**
   - Format: `https://bookverse.pages.dev`
   - Click URL to view deployed site

#### Step 4: Configure Custom Domain (Optional)

1. **Add Custom Domain**
   - Go to "Custom domains"
   - Click "Set up a custom domain"
   - Enter your domain

2. **DNS Configuration**
   - Cloudflare provides DNS instructions
   - If domain is on Cloudflare, setup is automatic
   - If external, add CNAME record

---

### Option 4: Deploy to AWS Amplify

AWS Amplify integrates well with the AWS ecosystem.

#### Prerequisites
- AWS account
- GitHub repository
- AWS CLI installed (optional)

#### Step 1: Create Amplify App

1. **Sign in to AWS Console**
   - Navigate to AWS Amplify service
   - Click "Get Started" under "Amplify Hosting"

2. **Connect Repository**
   - Select "GitHub"
   - Authorize AWS Amplify
   - Select repository and branch

#### Step 2: Configure Build Settings

1. **App Settings**
   - **App name**: bookverse-frontend
   - **Environment**: production

2. **Build Settings**
   - Amplify auto-detects build settings
   - Verify:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd client
             - npm install
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: client/dist
         files:
           - '**/*'
       cache:
         paths:
           - client/node_modules/**/*
     ```

#### Step 3: Add Environment Variables

1. **Environment Variables**
   - Go to "Environment variables"
   - Click "Manage variables"
   - Add:
     ```
     VITE_API_URL=https://your-backend-api.com/api
     ```

#### Step 4: Deploy

1. **Save and Deploy**
   - Click "Save and deploy"
   - Monitor build progress
   - First deployment takes 5-10 minutes

2. **Get Your URL**
   - Format: `https://main.xxxxx.amplifyapp.com`

#### Step 5: Configure Custom Domain (Optional)

1. **Add Domain**
   - Go to "Domain management"
   - Click "Add domain"
   - Enter your domain

2. **DNS Configuration**
   - Follow AWS instructions
   - Add CNAME records to your DNS provider
   - SSL is automatic

---

## Post-Deployment Configuration

After deploying your frontend, complete these essential configuration steps.

### 1. Verify Backend Connection

Test that the frontend can communicate with the backend:

1. **Open Browser DevTools**
   - Visit your deployed frontend
   - Open DevTools (F12)
   - Go to "Network" tab

2. **Test API Calls**
   - Try logging in or browsing books
   - Verify API requests go to correct backend URL
   - Check for CORS errors

3. **Common Issues**
   - **CORS Error**: Update backend `FRONTEND_URL` environment variable
   - **404 on API**: Verify `VITE_API_URL` includes `/api` path
   - **Mixed Content**: Ensure both frontend and backend use HTTPS

### 2. Update Backend CORS Configuration

Ensure your backend accepts requests from the frontend:

**Backend Environment Variable:**
```env
FRONTEND_URL=https://your-frontend-domain.com
```

**Verify CORS in Backend:**
```javascript
// server/server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 3. Test All Features

Verify all functionality works in production:

#### Authentication
- [ ] User registration
- [ ] User login
- [ ] Password reset (if implemented)
- [ ] Session persistence
- [ ] Logout

#### Book Management
- [ ] Browse books
- [ ] Search and filter
- [ ] View book details
- [ ] Create book listing (with image upload)
- [ ] Edit book listing
- [ ] Delete book listing

#### Trading Features
- [ ] Send trade proposal
- [ ] Accept/reject trade
- [ ] View trade history
- [ ] Trade notifications

#### Messaging
- [ ] Send messages
- [ ] Receive messages
- [ ] Real-time updates (if implemented)

#### User Profile
- [ ] View profile
- [ ] Edit profile
- [ ] Privacy settings
- [ ] View user's books

### 4. Configure SEO and Meta Tags

Optimize for search engines and social sharing:

**Update `index.html`:**
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- SEO Meta Tags -->
  <title>BookVerse - Peer-to-Peer Book Trading Platform</title>
  <meta name="description" content="Trade books with fellow readers. Discover new reads, connect with book lovers, and build your personal library through fair peer-to-peer exchanges." />
  <meta name="keywords" content="book trading, book exchange, peer-to-peer, books, reading, community" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://bookverse.com/" />
  <meta property="og:title" content="BookVerse - Peer-to-Peer Book Trading Platform" />
  <meta property="og:description" content="Trade books with fellow readers. Discover new reads and connect with book lovers." />
  <meta property="og:image" content="https://bookverse.com/og-image.jpg" />
  
  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image" />
  <meta property="twitter:url" content="https://bookverse.com/" />
  <meta property="twitter:title" content="BookVerse - Peer-to-Peer Book Trading Platform" />
  <meta property="twitter:description" content="Trade books with fellow readers. Discover new reads and connect with book lovers." />
  <meta property="twitter:image" content="https://bookverse.com/og-image.jpg" />
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/placeholder-book.svg" />
</head>
```

### 5. Set Up Analytics (Optional)

Track user behavior and site performance:

#### Google Analytics

1. **Create GA4 Property**
   - Go to [analytics.google.com](https://analytics.google.com)
   - Create new property
   - Get Measurement ID (G-XXXXXXXXXX)

2. **Add to Frontend**
   ```html
   <!-- Add to index.html before </head> -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

#### Vercel Analytics

1. **Enable in Vercel Dashboard**
   - Go to project settings
   - Navigate to "Analytics"
   - Click "Enable"

2. **Install Package** (Optional for advanced features)
   ```bash
   npm install @vercel/analytics
   ```

   ```javascript
   // src/main.jsx
   import { Analytics } from '@vercel/analytics/react';
   
   ReactDOM.createRoot(document.getElementById('root')).render(
     <React.StrictMode>
       <App />
       <Analytics />
     </React.StrictMode>
   );
   ```

### 6. Configure Error Tracking (Optional)

Monitor and fix production errors:

#### Sentry

1. **Create Sentry Project**
   - Sign up at [sentry.io](https://sentry.io)
   - Create new project (React)
   - Get DSN

2. **Install Sentry**
   ```bash
   npm install @sentry/react
   ```

3. **Initialize Sentry**
   ```javascript
   // src/main.jsx
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "your-sentry-dsn",
     environment: "production",
     tracesSampleRate: 1.0,
   });
   ```

### 7. Set Up Monitoring

Monitor site availability and performance:

#### UptimeRobot (Free)

1. **Sign up at [uptimerobot.com](https://uptimerobot.com)**
2. **Add Monitor**
   - Type: HTTP(s)
   - URL: `https://your-frontend-domain.com`
   - Interval: 5 minutes
3. **Configure Alerts**
   - Email notifications
   - SMS (optional)
   - Slack integration (optional)

---

## Performance Optimization

Optimize your frontend for the best user experience:

### 1. Image Optimization

**Cloudinary Images:**
- Images are already optimized by Cloudinary
- Cloudinary provides automatic format conversion (WebP)
- Responsive images with different sizes

**Local Images:**
- Use WebP format for better compression
- Provide multiple sizes for responsive images
- Lazy load images below the fold

### 2. Code Splitting

Vite automatically code-splits your application:

**Route-Based Splitting:**
```javascript
// Lazy load route components
const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

// Wrap with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/dashboard" element={<DashboardPage />} />
  </Routes>
</Suspense>
```

### 3. Caching Strategy

**Static Assets:**
- Hosting platforms automatically cache static assets
- Hashed filenames enable long-term caching
- CDN distributes assets globally

**API Responses:**
- Consider caching API responses in frontend
- Use React Query or SWR for data caching
- Implement stale-while-revalidate pattern

### 4. Performance Monitoring

**Lighthouse Scores:**
```bash
# Run Lighthouse audit
npx lighthouse https://your-domain.com --view
```

**Target Scores:**
- Performance: 90+
- Accessibility: 90+
- Best Practices: 90+
- SEO: 90+

**Web Vitals:**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### 5. Bundle Size Optimization

**Analyze Bundle:**
```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-visualizer

# Add to vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({ open: true })
  ]
});

# Build and view analysis
npm run build
```

**Optimization Tips:**
- Remove unused dependencies
- Use tree-shaking friendly imports
- Lazy load heavy components
- Consider lighter alternatives for large libraries

---

## Troubleshooting

Common issues and solutions for frontend deployment:

### Build Failures

#### Issue: "Module not found" Error

**Cause:** Missing dependencies or incorrect import paths

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify all imports use correct paths
# Check for case-sensitive filename issues
```

#### Issue: "Out of memory" During Build

**Cause:** Large bundle or insufficient memory

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Platform-Specific:**
- **Vercel**: Upgrade to Pro plan for more memory
- **Netlify**: Contact support to increase build memory

#### Issue: Tailwind CSS Not Working

**Cause:** Incorrect Tailwind configuration or missing PostCSS

**Solution:**
```bash
# Verify Tailwind config
# Ensure content paths are correct
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]

# Verify PostCSS config exists
# postcss.config.js should have:
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Runtime Errors

#### Issue: "Failed to fetch" or CORS Errors

**Cause:** Backend not accepting requests from frontend domain

**Solution:**
1. **Update Backend CORS:**
   ```env
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Verify Backend CORS Configuration:**
   ```javascript
   app.use(cors({
     origin: process.env.FRONTEND_URL,
     credentials: true
   }));
   ```

3. **Check API URL:**
   ```env
   # Must include /api path
   VITE_API_URL=https://your-backend.com/api
   ```

#### Issue: "Mixed Content" Warning

**Cause:** Frontend (HTTPS) calling backend (HTTP)

**Solution:**
- Ensure backend uses HTTPS
- Update `VITE_API_URL` to use `https://`
- Most hosting platforms provide automatic HTTPS

#### Issue: 404 on Page Refresh

**Cause:** Server not configured for SPA routing

**Solution:**

**Vercel:**
```json
// vercel.json in client directory
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Netlify:**
```
// client/public/_redirects
/*    /index.html   200
```

**Cloudflare Pages:**
```
// client/public/_redirects
/*    /index.html   200
```

#### Issue: Environment Variables Not Working

**Cause:** Variables not prefixed with `VITE_` or not set in platform

**Solution:**
1. **Verify Prefix:**
   ```env
   # Correct
   VITE_API_URL=https://api.example.com/api
   
   # Wrong (won't work)
   API_URL=https://api.example.com/api
   ```

2. **Set in Platform:**
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Cloudflare: Pages → Settings → Environment Variables

3. **Redeploy:**
   - Environment variable changes require redeployment
   - Trigger new deployment after updating variables

### Performance Issues

#### Issue: Slow Initial Load

**Cause:** Large bundle size or slow API responses

**Solution:**
1. **Analyze Bundle:**
   ```bash
   npm run build
   # Check dist/ folder size
   ```

2. **Optimize Images:**
   - Use Cloudinary transformations
   - Lazy load images
   - Use appropriate image sizes

3. **Code Splitting:**
   - Lazy load routes
   - Split large components

#### Issue: Slow API Responses

**Cause:** Backend performance or network latency

**Solution:**
1. **Check Backend Performance:**
   - Review backend logs
   - Optimize database queries
   - Add caching

2. **Add Loading States:**
   - Show loading indicators
   - Implement skeleton screens
   - Provide feedback to users

3. **Consider CDN:**
   - Use CDN for static assets
   - Cache API responses when appropriate

---

## Maintenance and Updates

Keep your frontend deployment healthy and up-to-date:

### Regular Updates

**Dependencies:**
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Update to latest versions (carefully)
npm install react@latest react-dom@latest

# Audit for vulnerabilities
npm audit
npm audit fix
```

**Update Schedule:**
- **Security updates**: Immediately
- **Minor updates**: Monthly
- **Major updates**: Quarterly (with testing)

### Monitoring

**Weekly Checks:**
- [ ] Site is accessible
- [ ] All features working
- [ ] No console errors
- [ ] Performance is good

**Monthly Checks:**
- [ ] Review analytics
- [ ] Check error logs (if using Sentry)
- [ ] Update dependencies
- [ ] Review and optimize bundle size

### Backup Strategy

**Git Repository:**
- All code is version controlled
- Tags for production releases
- Branches for features and fixes

**Deployment History:**
- Vercel/Netlify keep deployment history
- Easy rollback to previous versions
- Preview deployments for testing

### Rollback Procedure

**Vercel:**
1. Go to "Deployments"
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Netlify:**
1. Go to "Deploys"
2. Find previous working deploy
3. Click "Publish deploy"

**Manual Rollback:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Continuous Improvement

**Performance:**
- Monitor Core Web Vitals
- Optimize based on real user data
- A/B test improvements

**User Experience:**
- Gather user feedback
- Fix reported issues
- Improve based on analytics

**Security:**
- Keep dependencies updated
- Monitor security advisories
- Follow security best practices

---

## Conclusion

You've successfully deployed the BookVerse frontend! Your application is now live and accessible to users worldwide.

### Next Steps

1. **Monitor Performance**
   - Set up analytics
   - Track Core Web Vitals
   - Monitor error rates

2. **Gather Feedback**
   - Share with users
   - Collect feedback
   - Iterate and improve

3. **Scale as Needed**
   - Upgrade hosting plan if needed
   - Optimize for growing traffic
   - Add features based on user needs

### Support Resources

- **Vercel Documentation**: [vercel.com/docs](https://vercel.com/docs)
- **Netlify Documentation**: [docs.netlify.com](https://docs.netlify.com)
- **Vite Documentation**: [vitejs.dev](https://vitejs.dev)
- **React Documentation**: [react.dev](https://react.dev)

### Related Documentation

- [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) - Backend deployment guide
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database configuration
- [CLOUD_STORAGE_SETUP.md](CLOUD_STORAGE_SETUP.md) - Cloudinary setup
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

---

**Happy Deploying! 🚀**

If you encounter any issues not covered in this guide, please refer to your hosting platform's documentation or reach out to their support team.
