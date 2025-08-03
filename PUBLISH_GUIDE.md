# Publishing Guide for LEL Riders Website

## Current Status
The website is live at: https://lel-riders-r93fegj1k-rohanshars-projects.vercel.app

## To Add a Custom Domain:

### Option 1: Using Vercel CLI
```bash
# Add a custom domain to your project
vercel domains add your-domain.com

# Or add a subdomain
vercel domains add lel.your-domain.com
```

### Option 2: Using Vercel Dashboard
1. Go to https://vercel.com/rohanshars-projects/lel-riders-web
2. Click on "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Option 3: Create a Vercel Alias
```bash
# Create a custom Vercel subdomain
vercel alias lel-riders.vercel.app
```

## Recommended Domain Names:
- lel2025.enduroco.in
- riders.enduroco.in
- lel.ultra-rides.com
- lel-tracker.vercel.app

## DNS Configuration (if using custom domain):
Add these records to your domain's DNS:
- A Record: Point to 76.76.21.21
- CNAME: Point to cname.vercel-dns.com

## Share the Website:
Once published, you can share:
- The live tracking dashboard for Indian riders
- Interactive route map
- Complete rider directory
- Real-time updates during the event

## Maintenance:
- Data auto-updates from S3 buckets
- No server maintenance required
- Automatic deployments on git push