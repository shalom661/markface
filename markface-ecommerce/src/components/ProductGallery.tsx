'use client';

import { useState } from 'react';

interface ProductGalleryProps {
  images: string[];
}

const ProductGallery = ({ images }: ProductGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const galleryImages = images.length > 0 ? images : [
    'https://images.unsplash.com/photo-1582232490089-a5c9f5cf2ee5?q=80&w=1000'
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <div className="aspect-[4/5] w-full bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div 
          className="w-full h-full bg-cover bg-center transition-all duration-700" 
          style={{ backgroundImage: `url("${galleryImages[activeIndex]}")` }}
        />
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-4">
        {galleryImages.map((img, idx) => (
          <button 
            key={idx}
            onClick={() => setActiveIndex(idx)}
            className={`aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
              activeIndex === idx ? 'border-primary' : 'border-transparent hover:border-primary/50'
            }`}
          >
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: `url("${img}")` }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery;
