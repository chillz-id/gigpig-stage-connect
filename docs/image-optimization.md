# Image Optimization and CDN Integration

## Overview

The Stand Up Sydney platform now includes comprehensive image optimization and CDN integration for comedian profiles and media, providing:

- **Automatic image resizing** with multiple size variants
- **Modern format conversion** (WebP/AVIF)
- **Progressive loading** with blur-to-sharp transitions
- **CDN integration** for fast global delivery
- **Responsive image serving** based on device and network conditions

## Key Components

### 1. OptimizedImage Component

A smart image component that handles all optimization automatically:

```tsx
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src="profile.jpg"
  alt="Comedian profile"
  imageSize="medium"
  priority={true}
  blur={true}
  aspectRatio={16/9}
/>
```

Features:
- Lazy loading with IntersectionObserver
- Automatic format selection (AVIF > WebP > JPEG)
- Progressive enhancement with blur placeholders
- Error handling with fallback images
- Responsive srcset generation

### 2. OptimizedAvatar Component

Specialized avatar component with optimization:

```tsx
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';

<OptimizedAvatar
  src={user.avatar_url}
  name={user.name}
  size="lg"
  priority
/>
```

Features:
- Automatic initial generation for fallbacks
- Optimized sizes for avatars
- Consistent styling across the platform

### 3. MediaGallery Component

Optimized gallery for comedian performance photos:

```tsx
import { MediaGallery } from '@/components/ui/MediaGallery';

<MediaGallery
  items={mediaItems}
  columns={3}
  enableLightbox
  showCaptions
/>
```

Features:
- Responsive grid layout
- Lightbox with navigation
- Lazy loading for performance
- Touch-friendly on mobile

## Image Optimization Service

### Upload with Optimization

```typescript
import { uploadImage } from '@/services/imageUploadService';

const result = await uploadImage(file, {
  bucket: 'profile-images',
  userId: user.id,
  maxSize: 5 * 1024 * 1024, // 5MB
  optimize: true,
  keepPreviousImages: 2
});

// Access optimized URLs
console.log(result.optimizedUrls.thumbnail); // 150x150
console.log(result.optimizedUrls.medium);    // 600x600
console.log(result.optimizedUrls.large);     // 1200x1200
```

### Image Processing Features

1. **Automatic Compression**: Images over 1MB are automatically compressed
2. **Smart Resizing**: Maintains aspect ratios while fitting within bounds
3. **Format Conversion**: Generates WebP and AVIF versions
4. **CDN URLs**: All images served through CDN with caching

## CDN Configuration

### Environment-based Configuration

```typescript
// Production config
{
  enabled: true,
  baseUrl: process.env.VITE_CDN_URL,
  cacheDuration: 31536000, // 1 year
  transformations: {
    quality: 85,
    format: 'auto',
    progressive: true
  }
}
```

### Adaptive Quality

The system automatically adjusts image quality based on network conditions:
- **4G**: 85% quality
- **3G**: 70% quality
- **2G**: 60% quality

## Performance Optimizations

### 1. Preloading Critical Images

```typescript
// For above-fold images
<OptimizedImage
  src="hero.jpg"
  priority={true}
  preload
/>
```

### 2. Responsive Images

```typescript
// Automatic srcset generation
<OptimizedImage
  src="banner.jpg"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

### 3. Progressive Enhancement

Images load in stages:
1. Low-quality placeholder (instant)
2. Blurred preview (fast)
3. Full-quality image (when ready)

## Usage Examples

### Comedian Profile Avatar

```tsx
<ComedianAvatar
  name={comedian.name}
  avatar_url={comedian.avatar_url}
  stage_name={comedian.stage_name}
  size="large"
  priority
/>
```

### Event Banner

```tsx
<OptimizedEventBanner
  bannerUrl={event.banner_url}
  eventName={event.name}
  eventDate={event.date}
  eventLocation={event.location}
  priority
/>
```

### Profile Image Upload

```tsx
const { uploadFile, uploading, progress } = useOptimizedFileUpload({
  bucket: 'profile-images',
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  optimize: true,
  keepPreviousImages: 2
});

const handleUpload = async (file: File) => {
  const result = await uploadFile(file);
  if (result?.success) {
    // Update profile with optimized URLs
    updateProfile({
      avatar_url: result.url,
      avatar_thumbnail: result.optimizedUrls.thumbnail
    });
  }
};
```

## Best Practices

### 1. Image Sizes

Use appropriate image sizes for different contexts:
- **Thumbnails**: 150x150 (listings, avatars)
- **Small**: 300x300 (cards, previews)
- **Medium**: 600x600 (profile pages)
- **Large**: 1200x1200 (full views)
- **Hero**: 1920x1080 (banners)

### 2. Loading Strategies

- Use `priority` for above-fold images
- Enable `lazy` for below-fold content
- Preload critical images on key pages
- Use `blur` for better perceived performance

### 3. Error Handling

Always provide fallbacks:
```tsx
<OptimizedImage
  src={profileImage}
  fallbackSrc="/default-avatar.jpg"
  alt="Profile"
/>
```

### 4. SEO Optimization

Include proper alt text and structured data:
```tsx
<OptimizedImage
  src={comedian.headshot}
  alt={`${comedian.name} - Stand-up comedian`}
  itemProp="image"
/>
```

## Performance Metrics

Expected improvements:
- **50-70% reduction** in image file sizes
- **2-3x faster** page load times on mobile
- **Better Core Web Vitals** scores
- **Reduced bandwidth** usage

## Migration Guide

### Updating Existing Components

1. Replace `<img>` with `<OptimizedImage>`:
```tsx
// Before
<img src={avatar} alt="User" className="w-32 h-32" />

// After
<OptimizedImage
  src={avatar}
  alt="User"
  className="w-32 h-32"
  imageSize="avatar"
/>
```

2. Replace `<Avatar>` with `<OptimizedAvatar>`:
```tsx
// Before
<Avatar>
  <AvatarImage src={user.avatar} />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>

// After
<OptimizedAvatar
  src={user.avatar}
  name={user.name}
  size="md"
/>
```

## Troubleshooting

### Common Issues

1. **Images not loading**: Check Supabase Storage policies
2. **Slow loading**: Ensure CDN is properly configured
3. **Format not supported**: Falls back to JPEG automatically
4. **Upload failures**: Check file size and type restrictions

### Debug Mode

Enable debug logging:
```typescript
// In development
localStorage.setItem('image-optimization-debug', 'true');
```

This will log:
- CDN URL generation
- Format detection
- Loading states
- Error details