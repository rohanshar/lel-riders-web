# Google Analytics Setup Guide

## Setting up Google Analytics for LEL 2025 Riders Website

### 1. Create a Google Analytics Account

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Start measuring"
4. Set up your account:
   - Account name: "Enduroco"
   - Leave data sharing settings as default
5. Set up your property:
   - Property name: "LEL 2025 Riders"
   - Reporting time zone: Your timezone
   - Currency: Your currency
6. About your business:
   - Industry category: "Sports & Recreation"
   - Business size: Select appropriate

### 2. Create a Web Data Stream

1. Platform: Choose "Web"
2. Website URL: `https://lel2025.enduroco.in` (or your actual domain)
3. Stream name: "LEL 2025 Riders Web"
4. Click "Create stream"

### 3. Get your Measurement ID

1. After creating the stream, you'll see a Measurement ID that looks like `G-XXXXXXXXXX`
2. Copy this ID

### 4. Update the Code

Replace `G-XXXXXXXXXX` with your actual Measurement ID in:

1. `/public/index.html` (lines 45 and 50)
2. `/src/hooks/useAnalytics.ts` (line 26)

### 5. Events Being Tracked

The following events are automatically tracked:

#### Page Views
- Every page navigation is tracked automatically

#### Custom Events
- **search**: When users search for riders
- **view_rider**: When a rider profile is viewed
- **view_wave**: When a wave page is viewed
- **map_interaction**: Various map interactions

### 6. Testing Your Implementation

1. Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna) Chrome extension
2. Open your website
3. Open Chrome DevTools (F12)
4. Navigate through pages and perform actions
5. Check the Console for GA debug messages

### 7. View Reports

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Navigate to "Reports" → "Realtime" to see live data
4. Other useful reports:
   - Engagement → Pages and screens
   - User → Demographics
   - Acquisition → Traffic acquisition

### 8. Additional Configuration (Optional)

#### Enhanced Measurement
GA4 automatically tracks:
- Page views
- Scrolls
- Outbound clicks
- Site search
- Video engagement
- File downloads

#### Custom Dimensions
You might want to add:
- User country (for riders)
- Wave category
- Rider status

### 9. Privacy Considerations

Consider adding:
1. Cookie consent banner
2. Privacy policy page
3. Option to opt-out of tracking

### 10. Alternative Analytics Options

If you prefer privacy-focused alternatives:

1. **Plausible Analytics**
   - Privacy-friendly
   - No cookies
   - GDPR compliant
   - Simple setup

2. **Fathom Analytics**
   - Privacy-focused
   - Fast and lightweight
   - GDPR compliant

3. **Matomo**
   - Open source
   - Self-hostable
   - Full data ownership

To implement these alternatives, you would replace the Google Analytics script with their respective tracking codes.