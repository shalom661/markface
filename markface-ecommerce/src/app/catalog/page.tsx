import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import FilterSidebar from '@/components/FilterSidebar';
import CatalogHeader from '@/components/CatalogHeader';
import { Suspense } from 'react';

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
  const page = parseInt(params.page || '1');
  const filters = {
    category: params.category,
    min_price: params.min_price ? parseFloat(params.min_price) : undefined,
    max_price: params.max_price ? parseFloat(params.max_price) : undefined,
    sort: params.sort,
  };

  const { items: products, total } = await fetchProducts(page, 20, filters);

  return (
    <div className="bg-brand-silk min-h-screen">
      <div className="container mx-auto px-4 py-20">
        <CatalogHeader totalItems={total} activeCategory={filters.category || null} />
        
        <div className="flex flex-col lg:flex-row gap-16">
          <Suspense fallback={<div className="w-64 animate-pulse bg-gray-100 h-[600px] rounded-lg" />}>
            <FilterSidebar />
          </Suspense>

          <div className="flex-grow">
            {products.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-serif text-brand-navy">Nenhum produto encontrado</h3>
                  <p className="text-gray-500 max-w-sm">
                    Não encontramos itens que correspondam aos seus filtros. Tente ajustar sua busca ou categoria.
                  </p>
                </div>
                <button className="text-brand-navy font-bold uppercase tracking-widest text-xs underline underline-offset-8 decoration-gray-200 hover:decoration-brand-navy transition-all">
                  Limpar todos os filtros
                </button>
              </div>
            )}
            
            {/* Pagination Placeholder */}
            {total > 20 && (
              <div className="mt-20 flex justify-center border-t border-gray-100 pt-10">
                <nav className="flex items-center gap-4">
                  <button className="w-10 h-10 flex items-center justify-center border border-gray-200 text-gray-400 hover:border-brand-navy hover:text-brand-navy transition-colors">
                    1
                  </button>
                  <button className="w-10 h-10 flex items-center justify-center border border-brand-navy text-brand-navy font-bold">
                    2
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CatalogPage;
