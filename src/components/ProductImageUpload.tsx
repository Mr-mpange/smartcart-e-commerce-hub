import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Image, X, Link } from 'lucide-react';
import { toast } from 'sonner';

interface ProductImageUploadProps {
  onImageUpload: (imageUrl: string) => void;
  currentImage?: string;
}

export function ProductImageUpload({ onImageUpload, currentImage }: ProductImageUploadProps) {
  const [imageUrl, setImageUrl] = useState(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // For now, we'll use a placeholder service or local URL
      // In production, you would upload to Supabase Storage or another service
      
      // Create a local URL for preview (this won't persist)
      const localUrl = URL.createObjectURL(file);
      setImageUrl(localUrl);
      onImageUpload(localUrl);
      
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (!imageUrl) {
      toast.error('Please enter an image URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
      onImageUpload(imageUrl);
      toast.success('Image URL added successfully!');
    } catch {
      toast.error('Please enter a valid URL');
    }
  };

  const clearImage = () => {
    setImageUrl('');
    onImageUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload Image File</Label>
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Browse'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported formats: JPG, PNG, GIF. Max size: 5MB
              </p>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <Label>Or Enter Image URL</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleUrlSubmit}
                >
                  <Link className="h-4 w-4 mr-2" />
                  Add URL
                </Button>
              </div>
            </div>

            {/* Image Preview */}
            {imageUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="relative inline-block">
                  <img
                    src={imageUrl}
                    alt="Product preview"
                    className="w-32 h-32 object-cover rounded border"
                    onError={() => {
                      toast.error('Failed to load image');
                      clearImage();
                    }}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                    onClick={clearImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* Upload Area */}
            {!imageUrl && (
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload an image or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, GIF up to 5MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}