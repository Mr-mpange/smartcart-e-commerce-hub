# Product Images Storage Setup

## Issue
Product images were not persisting because they were using temporary blob URLs (`URL.createObjectURL()`). These URLs only work in the current browser session and are lost on page refresh or when accessed by other users.

## Solution
Images are now uploaded to Supabase Storage with permanent public URLs.

## Setup Instructions

### 1. Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **Create a new bucket**
4. Configure:
   - **Name**: `product-images`
   - **Public bucket**: Toggle ON (to allow public access)
   - **File size limit**: 52428800 (50MB)
5. Click **Create bucket**

### 2. Set Storage Policies (Optional but Recommended)

If you want to restrict uploads to authenticated vendors only:

1. In the Storage section, click on `product-images` bucket
2. Go to **Policies** tab
3. Add policies:

```sql
-- Allow authenticated users (vendors) to upload images
CREATE POLICY "Vendors can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Allow public read access to all images
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Allow vendors to delete their own images
CREATE POLICY "Vendors can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'product-images' AND auth.uid()::text = owner);
```

### 3. Verify Setup

1. Go to Vendor Dashboard
2. Create or edit a product
3. Upload an image
4. The image should now:
   - Upload successfully to Supabase Storage
   - Generate a permanent public URL
   - Display correctly when viewing the product
   - Persist across page refreshes
   - Be accessible to all users

## How It Works

1. **Upload**: When a vendor uploads an image, it's sent to Supabase Storage
2. **Storage**: The image is stored in the `product-images` bucket
3. **URL Generation**: A permanent public URL is generated (e.g., `https://[project].supabase.co/storage/v1/object/public/product-images/product-123456-abc-image.jpg`)
4. **Database**: The URL is saved in the `products` table's `image_url` column
5. **Display**: When users view products, the permanent URL is used to load the image

## Troubleshooting

### Images not uploading
- Check that the `product-images` bucket exists and is public
- Verify the bucket name is exactly `product-images`
- Check browser console for error messages

### Images showing "Failed to load"
- Ensure the bucket is set to **Public**
- Check that the image URL is correct in the database
- Verify the image file wasn't deleted from storage

### Bucket not found error
- Create the bucket manually in Supabase Dashboard
- Ensure the bucket name is `product-images`
- Make sure it's set to public

## File Size Limits

- Maximum file size: 5MB (enforced by frontend)
- Bucket limit: 50MB (configurable in Supabase)
- Supported formats: JPG, PNG, GIF, WebP

## Security Notes

- The bucket is public, so anyone can view images
- Only authenticated vendors can upload (if policies are set)
- Images are stored with unique filenames to prevent conflicts
- Consider adding virus scanning for production environments
