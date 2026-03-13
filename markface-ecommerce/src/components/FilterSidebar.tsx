'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const CATEGORIES = [
  { id: 'feminino', label: 'Feminino' },
  { id: 'masculino', label: 'Masculino' },
  { id: 'infantil', label: 'Infantil' },
  { id: 'lancamentos', label: 'Lançamentos' },
];

const SIZES = ['P', 'M', 'G', 'GG', 'XG'];

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
    <aside className="w-full lg:w-64 flex-shrink-0 space-y-12">
      {/* Categories */}
      <div className="space-y-6">
        <h4 className="font-serif text-xl text-brand-navy">Categorias</h4>
        <ul className="space-y-4 text-sm font-medium tracking-wide">
          <li>
            <button 
              onClick={() => router.push(`/catalog?${createQueryString('category', '')}`)}
              className={`hover:text-brand-accent transition-colors ${!activeCategory ? 'text-brand-navy font-bold underline underline-offset-4' : 'text-gray-500'}`}
            >
              Todos os Produtos
            </button>
          </li>
          {CATEGORIES.map((cat) => (
            <li key={cat.id}>
              <button 
                onClick={() => router.push(`/catalog?${createQueryString('category', cat.id)}`)}
                className={`hover:text-brand-accent transition-colors ${activeCategory === cat.id ? 'text-brand-navy font-bold underline underline-offset-4' : 'text-gray-500'}`}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Sizes */}
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <h4 className="font-serif text-xl text-brand-navy">Tamanho</h4>
        <div className="grid grid-cols-5 gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              className="h-10 border border-gray-200 flex items-center justify-center text-[10px] font-bold hover:border-brand-navy transition-colors text-brand-navy"
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-6 border-t border-gray-100 pt-10">
        <h4 className="font-serif text-xl text-brand-navy">Faixa de Preço</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <span>R$ 0</span>
            <div className="h-[1px] flex-grow bg-gray-100"></div>
            <span>R$ 1000+</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="1000" 
            className="w-full accent-brand-navy" 
          />
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
