'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import Link from 'next/link';

const CatalogHeader = ({ totalItems, activeCategory }: { totalItems: number, activeCategory: string | null }) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
      <div className="space-y-2">
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          <Link href="/" className="hover:text-brand-navy transition-colors">Home</Link>
          <span>/</span>
          <span className="text-brand-navy">{activeCategory || 'Todos os Produtos'}</span>
        </nav>
        <h1 className="text-4xl md:text-5xl font-serif text-brand-navy capitalize">
          {activeCategory || 'Nossa Coleção'}
        </h1>
        <p className="text-gray-400 text-xs font-medium uppercase tracking-[0.2em]">Exibindo {totalItems} produtos</p>
      </div>

      <div className="flex items-center gap-4 border-b border-brand-navy/20 pb-2">
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Ordenar por:</span>
        <select 
          onChange={(e) => router.push(`/catalog?${createQueryString('sort', e.target.value)}`)}
          defaultValue={searchParams.get('sort') || 'newest'}
          className="bg-transparent text-xs font-bold uppercase tracking-widest text-brand-navy focus:outline-none cursor-pointer"
        >
          <option value="newest">Lançamentos</option>
          <option value="price-asc">Preço: Menor para Maior</option>
          <option value="price-desc">Preço: Maior para Menor</option>
          <option value="name-asc">A-Z</option>
        </select>
      </div>
    </div>
  );
};

export default CatalogHeader;
