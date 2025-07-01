# P2.1: Social Media Link Intelligence

## **🎯 TASK OVERVIEW**
**Priority:** HIGH - Improves user experience significantly
**Component:** Profile social media links
**Current Issue:** Users must manually enter full URLs for social media

## **🔍 PROBLEM DETAILS**
- Users have to type full URLs like `https://instagram.com/username`
- Should be able to just enter `@chillzy` and auto-convert
- Need intelligent conversion for major platforms
- Should handle both `@username` and `username` formats

## **📁 FILES TO CHECK**
- `src/utils/socialLinks.ts` - Create utility for URL conversion
- `src/components/Profile/` - Profile components with social media fields
- `src/components/Forms/SocialMediaInput.tsx` - Social media input components
- Profile editing/creation forms

## **✅ ACCEPTANCE CRITERIA**
1. User types `@chillzy` in Instagram field
2. System converts to `https://instagram.com/chillzy`
3. Works for all major platforms
4. Handles both `@username` and `username` formats
5. Validates username format
6. Shows preview of generated URL

## **🔧 PLATFORM MAPPING REQUIREMENTS**
```javascript
const PLATFORM_MAPPINGS = {
  instagram: (username) => `https://instagram.com/${username}`,
  tiktok: (username) => `https://tiktok.com/@${username}`,
  twitter: (username) => `https://twitter.com/${username}`,
  youtube: (username) => `https://youtube.com/@${username}`,
  facebook: (username) => `https://facebook.com/${username}`,
  linkedin: (username) => `https://linkedin.com/in/${username}`,
  snapchat: (username) => `https://snapchat.com/add/${username}`
}
```

## **🔧 TECHNICAL REQUIREMENTS**
1. **Create utility function:**
   ```typescript
   // src/utils/socialLinks.ts
   export function convertToSocialUrl(platform: string, input: string): string
   export function extractUsername(input: string): string
   export function validateUsername(username: string): boolean
   ```

2. **Input field enhancements:**
   - Real-time conversion as user types
   - Show preview of generated URL
   - Validation for username format
   - Error handling for invalid usernames

3. **Platform support:**
   - Instagram: `@chillzy` → `https://instagram.com/chillzy`
   - TikTok: `@chillzy` → `https://tiktok.com/@chillzy`
   - Twitter: `@chillzy` → `https://twitter.com/chillzy`
   - YouTube: `@chillzy` → `https://youtube.com/@chillzy`
   - Facebook: `chillzy` → `https://facebook.com/chillzy`
   - LinkedIn: `chillzy` → `https://linkedin.com/in/chillzy`

## **🔍 IMPLEMENTATION EXAMPLE**
```typescript
// src/utils/socialLinks.ts
export function convertToSocialUrl(platform: string, input: string): string {
  const username = extractUsername(input);
  
  const mappings = {
    instagram: `https://instagram.com/${username}`,
    tiktok: `https://tiktok.com/@${username}`,
    twitter: `https://twitter.com/${username}`,
    // ... more platforms
  };
  
  return mappings[platform.toLowerCase()] || input;
}

function extractUsername(input: string): string {
  // Remove @ symbol if present
  // Remove any existing URL prefixes
  // Return clean username
}
```

## **🎨 UI/UX REQUIREMENTS**
1. **Input field behavior:**
   - Placeholder: "Enter @username or username"
   - Real-time preview below input
   - Green checkmark for valid usernames
   - Red error for invalid format

2. **Preview display:**
   ```
   Instagram: @chillzy
   Preview: https://instagram.com/chillzy ✓
   ```

## **🧪 TESTING INSTRUCTIONS**
1. **Test username formats:**
   - `@chillzy` → converts correctly
   - `chillzy` → converts correctly
   - `@chillzy123` → converts correctly
   - `chillzy_comedy` → converts correctly

2. **Test platform differences:**
   - Instagram: removes @ from URL
   - TikTok: keeps @ in URL
   - YouTube: uses @ format
   - LinkedIn: uses /in/ format

3. **Test validation:**
   - Empty input → no error
   - Invalid characters → show error
   - Too long username → show error
   - Valid format → show green checkmark

4. **Test edge cases:**
   - Full URLs entered → extract username
   - Mixed case → normalize
   - Spaces → trim/reject

## **📋 DEFINITION OF DONE**
- [ ] Utility function created and tested
- [ ] Works for all major social platforms
- [ ] Handles both @username and username formats
- [ ] Real-time preview functionality
- [ ] Input validation with error messages
- [ ] Existing profiles updated to use new system
- [ ] Mobile-friendly input experience
- [ ] No console errors during conversion