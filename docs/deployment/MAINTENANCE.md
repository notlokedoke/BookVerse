# Maintenance Procedures

This guide documents routine maintenance tasks, backup procedures, and monitoring practices for the BookVerse platform.

## Table of Contents

1. [Backup Procedures](#backup-procedures)
2. [Monitoring and Logging](#monitoring-and-logging)
3. [Common Maintenance Tasks](#common-maintenance-tasks)
4. [Background Jobs](#background-jobs)
5. [Security Maintenance](#security-maintenance)
6. [Troubleshooting Quick Reference](#troubleshooting-quick-reference)

---

## Backup Procedures

### Database Backups

BookVerse uses MongoDB Atlas. Backup strategy depends on your Atlas tier.

#### Free Tier (M0) — Manual Backups

Atlas M0 does not include automated backups. Run these manually before any significant change.

**Export all collections:**
```bash
mongodump \
  --uri="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/bookverse" \
  --out="./backups/$(date +%Y-%m-%d)"
```

**Export a single collection:**
```bash
mongodump \
  --uri="mongodb+srv://..." \
  --collection=books \
  --out="./backups/$(date +%Y-%m-%d)"
```

**Restore from backup:**
```bash
mongorestore \
  --uri="mongodb+srv://..." \
  ./backups/2025-01-15
```

**Recommended schedule:**
- Before every deployment
- Weekly on a fixed day
- Before any schema migration

#### Paid Tier (M10+) — Automatic Backups

Atlas continuous backups and point-in-time recovery are available from M10.

1. Go to Atlas → your cluster → **Backup**
2. Enable **Continuous Cloud Backup**
3. Set retention: 7 days minimum, 30 days recommended
4. Configure a scheduled snapshot (daily recommended)

**Restore via Atlas UI:**
1. Cluster → Backup → Snapshots
2. Select snapshot → **Restore**
3. Choose target cluster and confirm

#### Verifying Backup Integrity

After taking a backup, spot-check it:

```bash
# List collections in backup
ls ./backups/2025-01-15/bookverse/

# Count documents in a collection
bsondump ./backups/2025-01-15/bookverse/books.bson | wc -l
```

### Code Backups

All code is version-controlled in Git. Ensure the remote is current before any major change:

```bash
git push origin main
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin --tags
```

### Configuration Backups

Environment variables are not committed to Git. Keep a secure copy:

- Store in a password manager (1Password, Bitwarden)
- Keep an encrypted `.env.production` in a private location — never the repository
- Document all required keys (see [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md))

---

## Monitoring and Logging

### Built-in Performance Monitoring

BookVerse includes performance middleware at `server/middleware/performance.js` that runs automatically in production.

**What it tracks:**

| Signal | Threshold | Action |
|--------|-----------|--------|
| MongoDB query | > 2 000 ms | `console.warn` with query details |
| API response | > 3 000 ms | `console.warn` with method and path |
| Heap memory | > 500 MB | `console.warn` with usage breakdown |
| Memory report | every 5 min | `console.log` with RSS, heap totals |

**Reading performance headers:**

Every API response includes an `X-Response-Time` header. Check it during debugging:

```bash
curl -I https://your-api-domain.com/api/books
# X-Response-Time: 142ms
```

### Application Logs

**Viewing logs by platform:**

```bash
# Railway
railway logs

# Heroku
heroku logs --tail

# Render
# Use the Logs tab in the dashboard
```

**Key log prefixes to watch:**

| Prefix | Meaning |
|--------|---------|
| `[BookEnrichment]` | Background enrichment job activity |
| `Slow MongoDB query` | Query exceeded 2 s threshold |
| `Slow API response` | Response exceeded 3 s threshold |
| `Memory Usage (MB):` | Periodic memory report |
| `⚠️ High memory usage` | Heap > 500 MB — investigate |
| `❌ MongoDB connection error` | Database unreachable |
| `⚠️ MongoDB disconnected` | Lost connection — auto-reconnects |

### API Usage Tracking

The `server/middleware/api-usage-tracker.js` monitors Google Places API calls to control cost.

**Check current usage stats via a temporary log:**

```javascript
// Temporary — add to server.js for debugging, remove after
const { getUsageStats } = require('./middleware/api-usage-tracker');
console.log('API usage:', getUsageStats());
```

**Built-in limits:**

- Warns at > 25 requests/day
- Blocks at > 100 requests/day (returns HTTP 429)
- Free tier budget: ~33 requests/day (1 000/month)

### Database Monitoring via MongoDB Atlas

1. Atlas → your cluster → **Metrics** tab
2. Key charts to review:

| Chart | Healthy range | Action if exceeded |
|-------|---------------|--------------------|
| Operations/s | Baseline ± 2× | Investigate unusual query patterns |
| Connections | < 80% of max | Scale up or add connection pooling |
| Disk Usage | < 70% | Archive old data or upgrade tier |
| Query Targeting | > 0.9 (selectivity) | Add or refine indexes |

**Set up Atlas alerts:**
1. Atlas → **Alerts** → Add alert
2. Recommended alerts:

| Metric | Threshold |
|--------|-----------|
| CPU Usage | > 80% |
| Memory Usage | > 80% |
| Disk Usage | > 70% |
| Connections | > 80% of max |
| Replication Lag | > 60 s |

### Uptime Monitoring

Use [UptimeRobot](https://uptimerobot.com) (free) to monitor availability:

1. Create an HTTP monitor pointing to the health endpoint:
   ```
   https://your-api-domain.com/api/health
   ```
2. Set interval: 5 minutes
3. Configure email (and optionally Slack) alerts
4. Expected healthy response:
   ```json
   {
     "success": true,
     "message": "BookVerse API is running",
     "database": "connected",
     "jwtConfigured": true
   }
   ```

### Error Tracking (Optional)

Integrate Sentry for production error visibility:

```bash
cd server
npm install @sentry/node
```

```javascript
// server/server.js — add before routes
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2  // Sample 20% of transactions
});

app.use(Sentry.Handlers.requestHandler());
// ... routes ...
app.use(Sentry.Handlers.errorHandler());
```

Add `SENTRY_DSN` to your environment variables on the hosting platform.

---

## Common Maintenance Tasks

### Dependency Updates

**Check for outdated packages:**

```bash
# Backend
cd server && npm outdated

# Frontend
cd client && npm outdated
```

**Apply patch and minor updates (low risk):**

```bash
npm update
```

**Apply major updates (test thoroughly):**

```bash
npm install express@latest
npm test
```

**Audit for known vulnerabilities:**

```bash
npm audit
npm audit fix
```

**Update schedule:**

| Update type | Frequency |
|-------------|-----------|
| Security patches | Within 48 hours of disclosure |
| Minor / patch updates | Monthly |
| Major version updates | Quarterly, with full test run |

### Token Blacklist Maintenance

The token blacklist (`server/utils/tokenBlacklist.js`) is in-memory. It auto-clears when it exceeds 10 000 entries, but this resets valid invalidations. For production:

**Short term — monitor size:**
```javascript
const { getBlacklistSize } = require('./utils/tokenBlacklist');
console.log('Blacklist size:', getBlacklistSize());
```

**Long term — migrate to Redis:**
```bash
npm install redis
```
Replace the in-memory `Set` with Redis key-value entries that expire at the token's own `exp` time. This is the recommended production approach.

### Database Index Verification

Run this after schema changes or when queries slow down:

**Via MongoDB Atlas:**
1. Collections → select collection → **Indexes** tab
2. Compare against expected indexes in model files (`server/models/*.js`)

**Via mongosh:**
```bash
mongosh "mongodb+srv://..."
use bookverse
db.books.getIndexes()
db.users.getIndexes()
db.trades.getIndexes()
```

**Rebuild a fragmented index (run during low traffic):**
```javascript
db.books.reIndex()
```

### Cloudinary Storage Audit

Free tier: 25 GB storage, 25 GB bandwidth/month.

1. Log in to [cloudinary.com](https://cloudinary.com) → Dashboard
2. Check **Storage** and **Bandwidth** usage
3. Delete orphaned images (books deleted without cleaning up Cloudinary):

```javascript
// One-off cleanup script — node scripts/cleanup-orphaned-images.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const Book = require('./server/models/Book');

async function cleanup() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Get all Cloudinary public_ids in the bookverse folder
  const { resources } = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'bookverse/',
    max_results: 500
  });
  const cloudinaryIds = new Set(resources.map(r => r.public_id));

  // Get all public_ids referenced by book documents
  const books = await Book.find({}, 'frontImageUrl backImageUrl').lean();
  const referencedIds = new Set(
    books.flatMap(b => [b.frontImageUrl, b.backImageUrl]).filter(Boolean)
  );

  // Identify and delete orphans
  for (const id of cloudinaryIds) {
    if (!referencedIds.has(id)) {
      await cloudinary.uploader.destroy(id);
      console.log('Deleted orphan:', id);
    }
  }

  await mongoose.disconnect();
}

cleanup();
```

### Log Rotation

Hosting platforms (Railway, Render, Heroku) manage log retention automatically. If you self-host or write logs to disk:

```
# /etc/logrotate.d/bookverse
/var/log/bookverse/*.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
}
```

### Scheduled Maintenance Window

For non-trivial updates (major dependency upgrades, schema migrations):

1. Announce downtime in advance if users are active
2. Take a full database backup
3. Deploy to staging first and validate
4. Apply to production during lowest-traffic window
5. Monitor logs for 30 minutes post-deployment
6. Keep rollback ready (see [BACKEND_DEPLOYMENT.md — Rollback Procedure](BACKEND_DEPLOYMENT.md))

---

## Background Jobs

### Book Enrichment Job

Located at `server/jobs/bookEnrichmentJob.js`. Starts automatically when the server starts.

**Configuration (constants at top of file):**

| Constant | Default | Description |
|----------|---------|-------------|
| `BATCH_SIZE` | 5 | Books processed per run |
| `JOB_INTERVAL` | 5 min | How often the job runs |
| `DELAY_BETWEEN_BOOKS` | 1 000 ms | Rate-limit buffer between books |

**Expected log output:**

```
[BookEnrichment] Starting background job (runs every 5 minutes)
[BookEnrichment] Processing 5 books...
[BookEnrichment] Enriching: "The Great Gatsby" by F. Scott Fitzgerald
[BookEnrichment] ✓ Updated "The Great Gatsby"
[BookEnrichment] Batch complete: 4 success, 1 failed
[BookEnrichment] No books need enrichment   ← healthy idle state
```

**If the job is stuck (`isRunning` never clears):**

The guard flag lives in process memory and resets on server restart. If you see repeated `Job already running, skipping...` with no batch completion, redeploy the server.

**Adjusting rate under external API pressure:**

If Open Library or Google Books returns 429 errors, increase `DELAY_BETWEEN_BOOKS` to `3000`–`5000` and reduce `BATCH_SIZE` to `2`.

---

## Security Maintenance

### Rotating Secrets

Rotate `JWT_SECRET` when:
- A team member with access leaves
- A secret may have been exposed
- As a quarterly precaution

**Steps:**
1. Generate a new secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update `JWT_SECRET` in your hosting platform's environment variables
3. Redeploy the server
4. All existing JWT tokens are immediately invalidated — users must log in again

### SSL Certificate Renewal

All recommended platforms (Railway, Render, Vercel, Netlify) provision and renew SSL automatically. No action required unless using a custom certificate.

**Verify certificate expiry:**
```bash
echo | openssl s_client -connect your-api-domain.com:443 2>/dev/null \
  | openssl x509 -noout -dates
```

### Monthly Security Checklist

- [ ] `npm audit` clean on both `server/` and `client/`
- [ ] No hardcoded credentials in recent commits:
  ```bash
  git log --since="30 days ago" -p | grep -iE "password|secret|api_key|token" | grep "^\+"
  ```
- [ ] MongoDB Atlas network access is as restrictive as possible
- [ ] Rate limiting active — test by sending a burst of requests, expect HTTP 429
- [ ] Review failed login attempts in logs for brute-force patterns
- [ ] Confirm `NODE_ENV=production` on the live server (disables stack traces in responses)
- [ ] Verify Cloudinary API secret has not been rotated without updating env vars

---

## Troubleshooting Quick Reference

| Symptom | First check | Fix |
|---------|-------------|-----|
| API returns 503 | Hosting platform dashboard | Redeploy or scale up |
| `MongooseServerSelectionError` | Atlas Network Access | Add `0.0.0.0/0` or server IP |
| CORS errors in browser | `FRONTEND_URL` env var | Set to exact frontend origin including `https://` |
| All JWTs rejected | `JWT_SECRET` env var | Ensure value matches across all instances |
| Images not uploading | Cloudinary credentials | Verify `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` |
| Slow page loads | `X-Response-Time` header | Check slow-query logs; add or rebuild indexes |
| High memory warnings | Server logs | Check for un-paginated queries; restart to clear leaks |
| Book enrichment stalled | `[BookEnrichment]` logs | Redeploy to reset `isRunning` flag |
| Google Places 429 | API usage tracker stats | Increase `DELAY_BETWEEN_BOOKS`; reduce `BATCH_SIZE` |

---

## Related Documentation

- [BACKEND_DEPLOYMENT.md](BACKEND_DEPLOYMENT.md) — Deployment platforms, rollback, scaling
- [FRONTEND_DEPLOYMENT.md](FRONTEND_DEPLOYMENT.md) — Frontend deployment and updates
- [DATABASE_SETUP.md](DATABASE_SETUP.md) — MongoDB Atlas initial setup
- [CLOUD_STORAGE_SETUP.md](CLOUD_STORAGE_SETUP.md) — Cloudinary configuration
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) — API reference

---

**Last Updated**: January 2025
**BookVerse Version**: 1.0.0
