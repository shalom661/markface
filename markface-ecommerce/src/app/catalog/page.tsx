import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ 
    category?: string; 
    min_price?: string; 
    max_price?: string; 
    sort?: string;
    page?: string;
  }>;
}

const CatalogPage = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const pageValue = parseInt(params.page || '1');
  const filters = {
    category: params.category,
    min_price: params.min_price ? parseFloat(params.min_price) : undefined,
    max_price: params.max_price ? parseFloat(params.max_price) : undefined,
    sort: params.sort,
  };

  const { items: products, total } = await fetchProducts(pageValue, 24, filters);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-8 md:px-10 lg:px-20">
      {/* Breadcrumbs */}
      <nav className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="text-slate-900 dark:text-slate-100 font-bold uppercase tracking-widest text-[10px]">Pijamas Premium</span>
      </nav>

      {/* Page Title */}
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-100 md:text-5xl">Sleepwear</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
          Entregue-se ao luxo com nossa coleção curada de sedas premium, algodão orgânico e modal, projetados para o descanso noturno definitivo.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar */}
        <Suspense fallback={<div className="w-64 animate-pulse bg-gray-100 h-[600px] rounded-lg" />}>
          <FilterSidebar />
        </Suspense>

        {/* Product Grid Area */}
        <div className="flex-1">
          {/* Controls */}
          <div className="mb-6 flex items-center justify-between border-b border-primary/10 pb-4">
            <p className="text-sm font-medium text-slate-500">Exibindo {products.length} de {total} produtos</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Ordenar por:</span>
              <select className="rounded-lg border-none bg-primary/5 py-1 pl-3 pr-8 text-sm font-bold focus:ring-primary">
                <option>Destaque</option>
                <option>Mais Novos</option>
                <option>Preço: Menor para Maior</option>
                <option>Preço: Maior para Menor</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, idx) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                label={idx === 0 ? 'New' : idx === 2 ? 'Popular' : undefined} 
              />
            ))}
          </div>

          {/* Fallback if empty */}
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                  <span className="material-symbols-outlined text-4xl">search_off</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Nenhum produto encontrado</h3>
                  <p className="text-slate-500 max-w-xs">Tente ajustar seus filtros para encontrar o que procura.</p>
                </div>
            </div>
          )}

          {/* Pagination */}
          {total > 24 && (
            <div className="mt-16 flex items-center justify-center gap-4">
              <button className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined">west</span>
                Anterior
              </button>
              <div className="flex gap-2">
                <button className="h-8 w-8 rounded-lg bg-primary text-xs font-bold text-white">1</button>
                <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-bold hover:bg-primary/5 text-slate-600">2</button>
                <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-bold hover:bg-primary/5 text-slate-600">3</button>
                <span className="flex h-8 items-center px-1 text-slate-400">...</span>
                <button className="h-8 w-8 rounded-lg border border-slate-200 text-xs font-bold hover:bg-primary/5 text-slate-600">12</button>
              </div>
              <button className="flex items-center gap-1 text-sm font-bold text-slate-900 hover:text-primary dark:text-slate-100 transition-colors">
                Próximo
                <span className="material-symbols-outlined">east</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

// Add Link to types if missing
import Link from 'next/link';
export default CatalogPage;
