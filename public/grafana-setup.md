# Grafana Setup for Stand Up Sydney

## Access Information
- **URL**: http://170.64.252.55:3000
- **Default Login**: admin / admin (you'll be prompted to change on first login)

## Quick Setup Steps

### 1. Initial Login
1. Go to http://170.64.252.55:3000
2. Login with admin/admin
3. Set a new secure password

### 2. Configure Data Sources
From the main menu, go to Configuration → Data Sources

#### PostgreSQL (Supabase)
- Type: PostgreSQL
- Host: pdikjpfulhhpqpxzpgtu.supabase.co:5432
- Database: postgres
- User: postgres
- SSL Mode: require

### 3. Recommended Dashboards

#### A. Stand Up Sydney Overview
- Event statistics
- Comedian performance metrics
- Venue capacity tracking
- Revenue analytics

#### B. System Monitoring
- MCP server health
- API usage statistics
- Agent activity monitoring

#### C. Social Media Analytics
- Instagram engagement rates
- Post performance tracking
- Audience growth metrics

## Useful Grafana Plugins

Install these from Configuration → Plugins:
1. **PostgreSQL** - For Supabase connection
2. **Pie Chart** - For event distribution
3. **Bar Gauge** - For comedian rankings
4. **Stat Panel** - For KPI displays

## Security Recommendations

1. Change default admin password immediately
2. Create read-only users for public dashboards
3. Enable HTTPS with Let's Encrypt
4. Set up authentication (OAuth with Google)

## Next Steps

1. Import dashboard templates
2. Set up alerts for key metrics
3. Configure automated reports
4. Enable anonymous viewing for public dashboards