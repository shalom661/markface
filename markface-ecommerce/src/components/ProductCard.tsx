import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/api';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const mainImage = product.variants?.[0]?.image_url || product.images?.[0] || '/hero.png';
  const hoverImage = product.images?.[1] || mainImage;
  const lowestPrice = Math.min(...product.variants.map(v => v.price_default));

  return (
    <div className="group cursor-pointer">
      <Link href={`/product/${product.id}`}>
        <div className="relative aspect-[3/4] bg-white mb-6 overflow-hidden">
          {/* Main Image */}
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-700 group-hover:opacity-0"
          />
          
          {/* Hover Image */}
          <Image
            src={hoverImage}
            alt={`${product.name} hover`}
            fill
            className="object-cover absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 scale-105 group-hover:scale-100 transition-transform"
          />

          {/* Overlays */}
          <div className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.09b-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-brand-navy text-white py-4 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 text-xs font-semibold uppercase tracking-[0.2em]">
            Ver Detalhes
          </div>
        </div>

        <div className="space-y-1 px-1">
          <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em]">MarkFace Premium</p>
          <h3 className="font-medium text-brand-navy text-sm group-hover:text-brand-accent transition-colors truncate">
            {product.name}
          </h3>
          <p className="font-serif text-brand-navy text-lg">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lowestPrice)}
          </p>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
