'use client';

import { Product } from '@/lib/api';
import Link from 'next/link';
import { useCartStore } from '@/lib/cartStore';

interface ProductCardProps {
  product: Product;
  label?: 'New' | 'Popular' | 'Limited Edition';
}

const ProductCard = ({ product, label }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const lowestPrice = Math.min(...product.variants.map((v) => v.price_default));
  const mainImage = product.images?.[0] || 'https://images.unsplash.com/photo-1582232490089-a5c9f5cf2ee5?q=80&w=1000';
  const categoryLabel = product.description?.split('.')[0] || 'Premium Silk'; // Placeholder logic

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const firstVariant = product.variants[0];
    if (firstVariant) {
      addItem({
        id: product.id,
        variantId: firstVariant.id,
        sku: firstVariant.sku,
        name: product.name,
        price: firstVariant.price_default,
        quantity: 1,
        image: mainImage,
        size: firstVariant.size || firstVariant.attributes?.size,
      });
      alert(`${product.name} adicionado ao carrinho!`);
    }
  };

  return (
    <div className="group relative flex flex-col">
      <Link href={`/product/${product.id}`} className="block">
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100 relative">
          <div 
            className="h-full w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
            style={{ backgroundImage: `url("${mainImage}")` }}
          />
          
          <button 
            onClick={handleQuickAdd}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-4 rounded-full bg-white px-6 py-2 text-sm font-bold text-slate-900 opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100 z-20"
          >
            Adição Rápida
          </button>

          {label && (
            <div className={`absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-black uppercase text-white ${
              label === 'New' ? 'bg-primary' : 
              label === 'Popular' ? 'bg-slate-900' : 
              'bg-primary/20 backdrop-blur-md text-primary'
            }`}>
              {label}
            </div>
          )}

          <div className="absolute top-4 right-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined fill-1">favorite</span>
          </div>
        </div>
      </Link>

      <div className="mt-4 flex justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs font-bold text-slate-600">{categoryLabel}</p>
        </div>
        <p className="text-sm font-black text-primary">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lowestPrice)}
        </p>
      </div>

      <div className="mt-2 flex gap-1">
        <span className="h-3 w-3 rounded-full bg-white border border-slate-200"></span>
        <span className="h-3 w-3 rounded-full bg-[#2b2d42]"></span>
        <span className="h-3 w-3 rounded-full bg-[#e8305e]"></span>
      </div>
    </div>
  );
};

export default ProductCard;

