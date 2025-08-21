# Google Maps API Setup Guide

## Overview
The Stand Up Sydney platform uses Google Maps for:
- Address autocomplete in event creation
- Map visualization for event locations
- Geocoding for address validation

## Step 1: Get Google Cloud Console Access

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable billing (required for Maps API)

## Step 2: Enable Required APIs

Navigate to **APIs & Services** → **Library** and enable:

1. **Maps JavaScript API** - For displaying maps
2. **Places API** - For address autocomplete
3. **Geocoding API** - For converting addresses to coordinates

## Step 3: Create API Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **API Key**
3. Copy the generated API key
4. Click on the API key to configure restrictions

## Step 4: Configure API Key Restrictions

### Application Restrictions
- Select **HTTP referrers (websites)**
- Add allowed referrers:
  ```
  http://localhost:8080/*
  http://localhost:*
  https://your-app.vercel.app/*
  ```

### API Restrictions
- Select **Restrict key**
- Select only these APIs:
  - Maps JavaScript API
  - Places API
  - Geocoding API

## Step 5: Update Environment Variables

### Local Development (.env)
```bash
VITE_GOOGLE_MAPS_API_KEY="your-api-key-here"
```

### Production (.env.production)
```bash
VITE_GOOGLE_MAPS_API_KEY="your-production-api-key-here"
```

## Step 6: Verify Setup

1. Restart your development server
2. Navigate to event creation page
3. Click on address field - you should see autocomplete suggestions
4. Check browser console for any API errors

## Troubleshooting

### "Google Maps JavaScript API error: InvalidKeyMapError"
- Verify API key is correct
- Check that billing is enabled
- Ensure required APIs are enabled

### "You have exceeded your request quota"
- Add API key restrictions
- Check Google Cloud Console for usage
- Consider implementing request caching

### Address autocomplete not working
- Check browser console for errors
- Verify Places API is enabled
- Ensure API key has proper permissions

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use different keys for development and production**
3. **Always restrict API keys by:**
   - HTTP referrer for web apps
   - Specific APIs that are needed
4. **Monitor usage in Google Cloud Console**
5. **Set up billing alerts**

## Cost Considerations

Google Maps APIs have a monthly free tier:
- $200 USD free credit per month
- Maps JavaScript API: $7 per 1,000 loads
- Places Autocomplete: $2.83 per 1,000 requests
- Geocoding: $5 per 1,000 requests

For a comedy platform with moderate usage, you should stay within the free tier.

## Implementation Notes

The Google Maps integration is already implemented in:
- `/src/hooks/useGoogleMaps.ts` - Maps loading hook
- `/src/components/AddressAutocomplete.tsx` - Address input component
- `/src/components/GoogleMapsComponent.tsx` - Map display component

Once you add the API key, these components will automatically start working.