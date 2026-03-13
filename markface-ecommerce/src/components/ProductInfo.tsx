'use client';

import { Product } from '@/lib/api';
import { useState } from 'react';

interface ProductInfoProps {
  product: Product;
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const sizes = Array.from(new Set(product.variants.map(v => v.size))).filter(Boolean);
  const lowestPrice = Math.min(...product.variants.map(v => v.price_default));
  
  const handleAddToCart = () => {
    if (!selectedSize && sizes.length > 0) {
      alert('Por favor, selecione um tamanho.');
      return;
    }
    // TODO: Implement actual cart logic (Context/Zustand)
    console.log('Added to cart:', { product: product.name, size: selectedSize, quantity });
    alert(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-[0.3em]">MarkFace Premium</p>
        <h1 className="text-4xl md:text-5xl font-serif text-brand-navy leading-tight">{product.name}</h1>
        <p className="text-2xl font-serif text-brand-navy">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lowestPrice)}
        </p>
      </div>

      <div className="h-[1px] bg-gray-100" />

      {/* Description */}
      <div className="prose prose-sm text-gray-600 leading-relaxed">
        <p>{product.description || 'Uma peça exclusiva MarkFace, desenhada para proporcionar o máximo conforto com um toque de sofisticação inigualável.'}</p>
      </div>

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center text-xs uppercase tracking-widest font-bold">
            <span className="text-brand-navy">Tamanho: {selectedSize || 'Selecione'}</span>
            <button className="text-gray-400 hover:text-brand-navy transition-colors underline underline-offset-4">Guia de Medidas</button>
          </div>
          <div className="flex flex-wrap gap-3">
            {sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`w-14 h-14 border flex items-center justify-center text-xs font-bold transition-all ${
                  selectedSize === size 
                    ? 'border-brand-navy bg-brand-navy text-white' 
                    : 'border-gray-200 text-brand-navy hover:border-brand-navy'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity & Add to Cart */}
      <div className="space-y-6 pt-4">
        <div className="flex gap-4">
          <div className="flex border border-gray-200 h-16">
            <button 
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-brand-navy"
            >-</button>
            <div className="w-12 h-full flex items-center justify-center text-brand-navy font-bold">{quantity}</div>
            <button 
              onClick={() => setQuantity(q => q + 1)}
              className="w-12 h-full flex items-center justify-center text-gray-400 hover:text-brand-navy"
            >+</button>
          </div>
          <button 
            onClick={handleAddToCart}
            className="flex-grow bg-brand-navy text-white h-16 uppercase tracking-[0.2em] text-xs font-bold hover:bg-brand-wheat hover:text-brand-navy transition-all duration-500"
          >
            Adicionar ao Carrinho
          </button>
        </div>
        
        <button className="w-full border border-brand-navy text-brand-navy h-16 uppercase tracking-[0.2em] text-xs font-bold hover:bg-brand-silk transition-all">
          Comprar Agora
        </button>
      </div>

      {/* Extras */}
      <div className="space-y-4 pt-6 text-[10px] uppercase tracking-widest font-semibold text-gray-400">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.129-1.125V11.25c0-4.446-3.542-7.898-8.068-8.397a.75.75 0 0 0-.584.212l-5.62 5.62a.75.75 0 0 0-.214.582v6.59c0 .622.508 1.126 1.129 1.126H11.25" />
          </svg>
          <span>Frete grátis em pedidos acima de R$ 500</span>
        </div>
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.333 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <span>Pagamento seguro via Mercado Pago</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
