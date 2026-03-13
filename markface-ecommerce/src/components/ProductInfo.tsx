'use client';

import { Product } from '@/lib/api';
import { useState } from 'react';
import { useCartStore } from '@/lib/cartStore';

interface ProductInfoProps {
  product: Product;
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('Dusty Rose'); // Placeholder
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const sizes = Array.from(new Set(product.variants.map(v => v.size || v.attributes?.size))).filter(Boolean) as string[];
  const lowestPrice = Math.min(...product.variants.map(v => v.price_default));

  const handleAddToCart = () => {
    if (!selectedSize && sizes.length > 0) {
      alert('Por favor, selecione um tamanho.');
      return;
    }

    const variant = product.variants.find(v => (v.size || v.attributes?.size) === selectedSize) || product.variants[0];

    addItem({
      id: product.id,
      variantId: variant.id,
      sku: variant.sku,
      name: product.name,
      price: variant.price_default,
      quantity,
      image: product.images?.[0] || null,
      size: selectedSize || undefined,
      color: selectedColor,
    });

    alert(`${product.name} adicionado ao carrinho!`);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <span className="text-primary font-bold text-sm uppercase tracking-widest">Nova Coleção</span>
        <h1 className="text-4xl md:text-5xl font-black mt-2 mb-4 leading-tight text-slate-900 dark:text-slate-100">
          {product.name}
        </h1>
        <div className="flex items-center gap-4">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lowestPrice)}
          </p>
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded text-primary">
            <span className="material-symbols-outlined text-sm">star</span>
            <span className="text-sm font-bold">4.9</span>
            <span className="text-slate-500 dark:text-slate-400 text-xs ml-1">(128 avaliações)</span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg">Detalhes do Produto</h3>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {product.description || 'Experimente o luxo noturno definitivo com nosso conjunto de pijama premium. Feito à mão para o seu conforto máximo.'}
        </p>
        <ul className="grid grid-cols-2 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
          <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> 100% Seda Mulberry</li>
          <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Costuras Francesas</li>
          <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Cintura Elástica</li>
          <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-lg">check_circle</span> Hipoalergênico</li>
        </ul>
      </div>

      {/* Options */}
      <div className="space-y-6">
        <div>
          <h4 className="font-bold mb-3 flex justify-between items-center text-sm">
            <span>Selecionar Cor</span>
            <span className="text-slate-400 text-xs font-normal">{selectedColor}</span>
          </h4>
          <div className="flex gap-3">
            {['#E5B5B5', '#2D3142', '#F5F5F5', '#1A1A1A'].map((c, i) => (
              <button 
                key={i}
                onClick={() => setSelectedColor(i === 0 ? 'Dusty Rose' : 'Midnight')}
                className={`w-10 h-10 rounded-full border-2 p-0.5 transition-all ${
                  (i === 0 && selectedColor === 'Dusty Rose') ? 'border-primary' : 'border-transparent hover:border-primary/50'
                }`}
              >
                <div className="w-full h-full rounded-full" style={{ backgroundColor: c }}></div>
              </button>
            ))}
          </div>
        </div>

        {sizes.length > 0 && (
          <div>
            <h4 className="font-bold mb-3 flex justify-between items-center text-sm">
              <span>Selecionar Tamanho</span>
              <button className="text-primary text-xs font-semibold underline decoration-primary/30">Guia de Medidas</button>
            </h4>
            <div className="grid grid-cols-5 gap-3">
              {sizes.map((size) => (
                <button 
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 border rounded-lg font-bold transition-all ${
                    selectedSize === size 
                      ? 'bg-primary text-white border-primary' 
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <button 
          onClick={handleAddToCart}
          className="flex-1 bg-primary text-white h-14 rounded-xl font-bold flex items-center justify-center gap-3 hover:opacity-90 transition-opacity uppercase tracking-widest text-xs"
        >
          <span className="material-symbols-outlined text-lg">shopping_bag</span>
          Adicionar ao Carrinho
        </button>
        <button className="w-full sm:w-14 h-14 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:text-primary hover:border-primary transition-all">
          <span className="material-symbols-outlined">favorite</span>
        </button>
      </div>

      {/* Feedback Summary */}
      <div className="bg-primary/5 rounded-xl p-6 border border-primary/10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-lg">Feedback dos Clientes</h4>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-primary">4.9</span>
            <div className="flex text-primary">
              {[1,2,3,4,5].map(i => <span key={i} className="material-symbols-outlined text-sm">star</span>)}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[
            { label: '5', width: '90%' },
            { label: '4', width: '7%' },
            { label: '3', width: '2%' }
          ].map((bar) => (
            <div key={bar.label} className="grid grid-cols-[20px_1fr_40px] items-center gap-3 text-xs">
              <p className="font-bold">{bar.label}</p>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-full bg-primary" style={{ width: bar.width }}></div>
              </div>
              <p className="text-[10px] text-slate-500 text-right">{bar.width}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
