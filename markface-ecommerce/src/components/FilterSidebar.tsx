'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const CATEGORIES = [
  { id: 'silk', label: '100% Mulberry Silk' },
  { id: 'cotton', label: 'Organic Cotton' },
  { id: 'modal', label: 'Premium Modal' },
  { id: 'linen', label: 'Linen Blend' },
];

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const FilterSidebar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const activeCategory = searchParams.get('category');

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="sticky top-28 flex flex-col gap-8">
        {/* Materials */}
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Materiais</h3>
          <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-3">
            {CATEGORIES.map((cat) => (
              <label key={cat.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1 hover:bg-primary/5 transition-colors">
                <input 
                  type="checkbox" 
                  checked={activeCategory === cat.id}
                  onChange={() => router.push(`/catalog?${createQueryString('category', activeCategory === cat.id ? '' : cat.id)}`)}
                  className="h-5 w-5 rounded border-slate-400 text-primary focus:ring-primary"
                />
                <span className="text-sm font-bold text-slate-700">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Paleta de Cores</h3>
          <div className="flex flex-wrap gap-3">
            <button className="h-8 w-8 rounded-full border-2 border-primary ring-2 ring-primary/20 bg-white" title="Cream"></button>
            <button className="h-8 w-8 rounded-full border border-slate-400 bg-[#2b2d42]" title="Navy"></button>
            <button className="h-8 w-8 rounded-full border border-slate-400 bg-[#e8305e]" title="Rose"></button>
            <button className="h-8 w-8 rounded-full border border-slate-400 bg-[#7a8d99]" title="Slate"></button>
            <button className="h-8 w-8 rounded-full border border-slate-400 bg-[#111111]" title="Midnight"></button>
            <button className="h-8 w-8 rounded-full border border-slate-400 bg-[#d9d9d9]" title="Pearl"></button>
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-primary">Tamanho</h3>
          <div className="grid grid-cols-4 gap-2">
            {SIZES.map((size) => (
              <button 
                key={size}
                className="flex h-10 items-center justify-center rounded-lg border border-slate-300 text-xs font-black hover:border-primary/40 hover:bg-primary/5 transition-all text-slate-800"
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Membership Promo */}
        <div className="mt-4 rounded-xl bg-primary p-6 text-white shadow-lg shadow-primary/20">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Membro Premium</p>
          <p className="mt-2 text-lg font-bold">Ganhe 20% de desconto no seu primeiro pedido</p>
          <button className="mt-4 w-full rounded-lg bg-white py-2 text-primary text-sm font-bold transition-transform hover:scale-105 whitespace-nowrap">
            Participar Agora
          </button>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;

