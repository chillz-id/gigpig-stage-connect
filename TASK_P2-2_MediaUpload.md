# P2.2: Media Upload Functionality

## **🎯 TASK OVERVIEW**
**Priority:** HIGH - Core profile functionality
**Component:** Photo & Video upload buttons
**Current Issue:** Photo & Video buttons are non-functional

## **🔍 PROBLEM DETAILS**
- Photo upload button doesn't work
- Video upload button doesn't work
- Need file preview functionality
- Files should store in Supabase Storage
- Need proper validation and error handling

## **📁 FILES TO CHECK**
- `src/components/Profile/MediaUpload.tsx` - Media upload components
- `src/components/Profile/PhotoUpload.tsx` - Photo specific upload
- `src/components/Profile/VideoUpload.tsx` - Video specific upload
- `src/lib/supabase-storage.ts` - Storage configuration
- Profile editing components

## **✅ ACCEPTANCE CRITERIA**
1. Photo upload button opens file picker
2. Video upload button opens file picker
3. Selected files show preview before upload
4. Files upload to Supabase Storage successfully
5. Upload progress indicator displays
6. Proper error handling for failed uploads
7. File type and size validation
8. Mobile-friendly upload experience

## **🔧 TECHNICAL REQUIREMENTS**
1. **Supabase Storage setup:**
   - Create buckets for photos and videos
   - Set up proper RLS policies for storage
   - Configure file type restrictions

2. **File validation:**
   - Photos: JPG, PNG, WebP (max 10MB)
   - Videos: MP4, MOV, WebM (max 100MB)
   - Proper MIME type checking
   - File size validation

3. **Upload functionality:**
   - Progress indicators during upload
   - Optimistic UI updates
   - Error handling and retry logic
   - File compression for photos

4. **Preview functionality:**
   - Image preview with crop option
   - Video thumbnail generation
   - File info display (size, type)
   - Remove/replace options

## **🔍 IMPLEMENTATION REQUIREMENTS**
```typescript
// Storage bucket structure
buckets: {
  'comedian-photos': { public: true, fileSizeLimit: 10MB },
  'comedian-videos': { public: true, fileSizeLimit: 100MB }
}

// File upload function
const uploadMedia = async (file: File, type: 'photo' | 'video') => {
  // Validate file type and size
  // Generate unique filename
  // Upload to appropriate bucket
  // Update user profile with media URL
  // Handle errors gracefully
}
```

## **🎨 UI/UX REQUIREMENTS**
1. **Photo upload flow:**
   - Click "Upload Photo" button
   - File picker opens (images only)
   - Show preview with crop option
   - Upload progress indicator
   - Success confirmation

2. **Video upload flow:**
   - Click "Upload Video" button  
   - File picker opens (videos only)
   - Show video preview/thumbnail
   - Upload progress indicator
   - Success confirmation

3. **Error states:**
   - File too large → clear error message
   - Wrong file type → helpful guidance
   - Upload failed → retry option
   - Network issues → queue for retry

## **📊 STORAGE CONFIGURATION**
```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('comedian-photos', 'comedian-photos', true),
  ('comedian-videos', 'comedian-videos', true);

-- RLS policies for photos
CREATE POLICY "Users can upload their own photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comedian-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Similar policy for videos
```

## **🧪 TESTING INSTRUCTIONS**
1. **Test photo upload:**
   - Click photo upload button
   - Select JPG, PNG, WebP files
   - Verify preview shows correctly
   - Test with oversized files (should error)
   - Test with wrong file types (should error)
   - Verify upload completes successfully

2. **Test video upload:**
   - Click video upload button
   - Select MP4, MOV files
   - Verify thumbnail/preview shows
   - Test with large files
   - Verify upload progress works

3. **Test error handling:**
   - Upload without internet connection
   - Upload files that are too large
   - Upload unsupported file types
   - Test retry functionality

4. **Test mobile experience:**
   - Photo upload on mobile browser
   - Camera capture option
   - Touch-friendly interface
   - Responsive design

## **📋 DEFINITION OF DONE**
- [ ] Photo upload button functional
- [ ] Video upload button functional  
- [ ] File type validation working
- [ ] File size limits enforced
- [ ] Preview functionality implemented
- [ ] Upload progress indicators
- [ ] Error handling with clear messages
- [ ] Files stored in Supabase Storage
- [ ] Mobile-responsive upload experience
- [ ] Profile updates with media URLs