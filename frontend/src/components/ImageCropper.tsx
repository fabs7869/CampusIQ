'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Scissors, 
  ZoomIn,
  Search,
  Maximize
} from 'lucide-react';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  initialAspect?: number;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ 
  image, 
  onCropComplete, 
  onCancel, 
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [zoom, setZoom] = useState(1);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    // Always start with 100% freeform selection for trimming
    setCrop({ unit: '%', width: 100, height: 100, x: 0, y: 0 });
  }

  const createCropImage = async () => {
    if (completedCrop && imgRef.current) {
      try {
        const blob = await getCroppedImg(imgRef.current, completedCrop);
        onCropComplete(blob);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#050505]/95 backdrop-blur-3xl" 
        onClick={onCancel} 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-5xl bg-[#0d0d0d] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(99,102,241,0.2)] flex flex-col h-[85vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-indigo-600/10 text-indigo-500 border border-indigo-600/20">
                 <Scissors className="h-5 w-5" />
              </div>
              <div>
                 <h2 className="text-xl font-black tracking-tight text-white">Manual Precision Framing</h2>
                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stretch corners at any zoom level to capture the fix</p>
              </div>
           </div>
           <button onClick={onCancel} className="p-4 rounded-full hover:bg-white/5 text-gray-500 transition-all">
              <X className="h-6 w-6" />
           </button>
        </div>

        {/* Cropper Area */}
        <div className="flex-1 bg-black/40 overflow-hidden flex items-center justify-center p-4 md:p-12 relative group">
          <div 
            className="w-full h-full flex items-center justify-center overflow-auto custom-scrollbar"
          >
            <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                className="max-h-full"
            >
                <img 
                    ref={imgRef}
                    src={image} 
                    onLoad={onImageLoad}
                    alt="Crop preview" 
                    style={{ 
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center',
                        transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="max-h-[50vh] w-auto object-contain pointer-events-none"
                />
            </ReactCrop>
          </div>
          
          <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest text-indigo-400">
             <Search className="h-3 w-3" />
             Magnification {zoom.toFixed(1)}x
          </div>
        </div>

        {/* Dynamic Zoom Bar & Actions */}
        <div className="p-8 bg-[#0a0a0a] border-t border-white/5 space-y-8 shrink-0">
          
          {/* Enhanced Zoom Slider */}
          <div className="flex flex-col gap-4">
             <div className="flex items-center justify-between px-2">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                    <ZoomIn className="h-3.5 w-3.5" /> High-Resolution Zoom
                </label>
                <span className="text-[9px] font-black text-indigo-500 uppercase">{zoom === 1 ? 'Original' : `${zoom}x Zoom`}</span>
             </div>
             <input
               type="range"
               value={zoom}
               min={1}
               max={3}
               step={0.1}
               onChange={(e) => setZoom(Number(e.target.value))}
               className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-indigo-600 transition-all hover:bg-white/10"
             />
          </div>

          <div className="flex gap-4">
             <button 
               onClick={onCancel}
               className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 border border-white/5 hover:bg-white/5 transition-all"
             >
                Discard
             </button>
             <button 
               onClick={createCropImage}
               disabled={!completedCrop}
               className="flex-[2] py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
             >
                <Check className="h-4 w-4" /> Apply Custom Frame
             </button>
          </div>
        </div>
      </motion.div>

      <style jsx global>{`
        .ReactCrop__crop-selection { border: 2px solid #6366f1 !important; border-radius: 4px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.6); }
        .ReactCrop__handle { background-color: #6366f1 !important; width: 14px !important; height: 14px !important; border: 2px solid white !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      `}</style>
    </div>
  );
};

// Helper function to process the crop
async function getCroppedImg(image: HTMLImageElement, pixelCrop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) throw new Error('No 2d context');

  // getCroppedImg with Scale logic
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = pixelCrop.width * scaleX;
  canvas.height = pixelCrop.height * scaleY;

  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}
