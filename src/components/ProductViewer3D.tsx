import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  X, 
  Play, 
  Pause,
  ChevronLeft,
  ChevronRight,
  Palette,
  RotateCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ColorSwatch {
  name: string;
  color: string;
  image?: string;
}

interface ProductViewer3DProps {
  images: string[];
  productName: string;
  colorSwatches?: ColorSwatch[];
  isOpen?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  className?: string;
}

export function ProductViewer3D({
  images,
  productName,
  colorSwatches = [],
  isOpen = true,
  onClose,
  isModal = false,
  className
}: ProductViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedColor, setSelectedColor] = useState<ColorSwatch | null>(
    colorSwatches.length > 0 ? colorSwatches[0] : null
  );
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-rotate effect
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying, images.length]);

  // Handle mouse drag for rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: 0 });
    }
  }, [zoom, pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    if (zoom > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    } else {
      const deltaX = e.clientX - dragStart.x;
      const sensitivity = 0.5;
      const newIndex = Math.floor(Math.abs(deltaX * sensitivity / 20)) % images.length;
      
      if (deltaX > 0) {
        setCurrentImageIndex(newIndex);
      } else {
        setCurrentImageIndex(images.length - 1 - newIndex);
      }
    }
  }, [isDragging, dragStart, zoom, images.length]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    } else {
      setIsDragging(true);
      setDragStart({ x: touch.clientX, y: 0 });
    }
  }, [zoom, pan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];

    if (zoom > 1) {
      setPan({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    } else {
      const deltaX = touch.clientX - dragStart.x;
      const sensitivity = 0.3;
      const imageShift = Math.floor(deltaX * sensitivity / 15);
      const newIndex = ((currentImageIndex - imageShift) % images.length + images.length) % images.length;
      setCurrentImageIndex(newIndex);
    }
  }, [isDragging, dragStart, zoom, images.length, currentImageIndex]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  }, []);

  const handleZoomIn = () => setZoom((prev) => Math.min(3, prev + 0.25));
  const handleZoomOut = () => {
    setZoom((prev) => Math.max(1, prev - 0.25));
    if (zoom <= 1.25) setPan({ x: 0, y: 0 });
  };

  const handleRotateLeft = () => setRotation((prev) => prev - 90);
  const handleRotateRight = () => setRotation((prev) => prev + 90);

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setCurrentImageIndex(0);
    setIsPlaying(false);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentImage = selectedColor?.image || images[currentImageIndex];

  const viewerContent = (
    <div 
      ref={containerRef}
      className={cn(
        "relative bg-gradient-to-br from-muted/50 to-muted rounded-2xl overflow-hidden select-none",
        isFullscreen ? "w-screen h-screen" : "aspect-square",
        className
      )}
    >
      {/* Main Image Container */}
      <div
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <img
          src={currentImage}
          alt={productName}
          className="max-w-full max-h-full object-contain transition-transform duration-100"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            filter: selectedColor && !selectedColor.image 
              ? `sepia(1) saturate(5) hue-rotate(${getHueRotation(selectedColor.color)}deg)` 
              : 'none'
          }}
          draggable={false}
        />
      </div>

      {/* 360° Badge */}
      <Badge 
        className="absolute top-4 left-4 bg-background/90 text-foreground backdrop-blur-sm"
      >
        <RotateCcw className="h-3 w-3 mr-1" />
        360° View
      </Badge>

      {/* Close button for modal */}
      {isModal && onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm hover:bg-background"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      )}

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm hover:bg-background"
            onClick={handlePrevImage}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/90 backdrop-blur-sm hover:bg-background"
            onClick={handleNextImage}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4">
        {/* Image Slider */}
        {images.length > 1 && (
          <div className="flex-1 bg-background/90 backdrop-blur-sm rounded-full p-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Slider
              value={[currentImageIndex]}
              max={images.length - 1}
              step={1}
              onValueChange={([value]) => {
                setIsPlaying(false);
                setCurrentImageIndex(value);
              }}
              className="flex-1"
            />
            <span className="text-xs font-medium px-2 shrink-0">
              {currentImageIndex + 1}/{images.length}
            </span>
          </div>
        )}

        {/* Zoom & Rotate Controls */}
        <div className="flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full p-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs font-medium w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRotateLeft}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRotateRight}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Color Swatches */}
      {colorSwatches.length > 0 && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center gap-1 mb-2 text-xs font-medium">
              <Palette className="h-3 w-3" />
              Colors
            </div>
            <div className="flex flex-wrap gap-1 max-w-[120px]">
              {colorSwatches.map((swatch, index) => (
                <button
                  key={index}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                    selectedColor?.name === swatch.name 
                      ? "border-primary ring-2 ring-primary/30" 
                      : "border-background"
                  )}
                  style={{ backgroundColor: swatch.color }}
                  onClick={() => setSelectedColor(swatch)}
                  title={swatch.name}
                />
              ))}
            </div>
            {selectedColor && (
              <p className="text-xs text-center mt-2 font-medium">
                {selectedColor.name}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute left-4 top-16 flex flex-col gap-2 max-h-[calc(100%-120px)] overflow-y-auto scrollbar-hide">
          {images.slice(0, 6).map((img, index) => (
            <button
              key={index}
              className={cn(
                "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 bg-background",
                currentImageIndex === index 
                  ? "border-primary ring-2 ring-primary/30" 
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              onClick={() => {
                setCurrentImageIndex(index);
                setIsPlaying(false);
              }}
            >
              <img 
                src={img} 
                alt={`View ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {images.length > 6 && (
            <div className="w-12 h-12 rounded-lg bg-background/90 backdrop-blur-sm flex items-center justify-center text-xs font-medium">
              +{images.length - 6}
            </div>
          )}
        </div>
      )}

      {/* Drag Hint */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-xs flex items-center gap-2 opacity-70">
        <RotateCcw className="h-3 w-3" />
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );

  if (isModal) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-0">
          <DialogTitle className="sr-only">{productName} - 3D Viewer</DialogTitle>
          {viewerContent}
        </DialogContent>
      </Dialog>
    );
  }

  return viewerContent;
}

// Helper to calculate hue rotation for color overlay
function getHueRotation(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;

  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return Math.round(h * 360);
}

export default ProductViewer3D;
