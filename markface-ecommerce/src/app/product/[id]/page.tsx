import { fetchProductById, fetchProducts } from '@/lib/api';
import ProductGallery from '@/components/ProductGallery';
import ProductInfo from '@/components/ProductInfo';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

const ProductPage = async ({ params }: PageProps) => {
  const { id } = await params;
  
  try {
    const product = await fetchProductById(id);
    
    // Fetch related products for the "Complete the Look" section
    const { items: relatedProducts } = await fetchProducts(1, 4);

    return (
      <div className="bg-white min-h-screen">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
            <Link href="/" className="hover:text-brand-navy transition-colors">Home</Link>
            <span>/</span>
            <Link href="/catalog" className="hover:text-brand-navy transition-colors">Catalog</Link>
            <span>/</span>
            <span className="text-brand-navy truncate max-w-[200px]">{product.name}</span>
          </nav>
        </div>

        {/* Product Grid */}
        <div className="container mx-auto px-4 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
            {/* Gallery Section */}
            <div className="lg:col-span-7 xl:col-span-8">
              <ProductGallery images={product.images || []} />
            </div>

            {/* Info Section */}
            <div className="lg:col-span-5 xl:col-span-4">
              <div className="sticky top-32">
                <ProductInfo product={product} />
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section className="bg-brand-silk py-32 border-t border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-end mb-16">
              <div className="space-y-2">
                <h4 className="uppercase tracking-[0.3em] text-[10px] font-bold text-brand-navy/30">Complemente seu momento</h4>
                <h2 className="text-4xl font-serif text-brand-navy italic">Sugestões Especiais</h2>
              </div>
              <Link href="/catalog" className="text-brand-navy font-bold uppercase tracking-widest text-xs underline underline-offset-8 decoration-brand-navy/20 hover:decoration-brand-navy transition-all">
                Ver Coleção Completa
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts
                .filter(p => p.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </div>
        </section>

        {/* Brand Philosophy Mini-Banner */}
        <section className="bg-brand-navy py-20 text-white overflow-hidden relative">
          <div className="container mx-auto px-4 text-center relative z-10 space-y-6">
            <h3 className="text-2xl font-serif italic text-brand-wheat font-light">"Elegância é a única beleza que nunca desaparece."</h3>
            <p className="text-[10px] uppercase tracking-[0.4em] font-medium text-white/60">Aura MarkFace Premium Selection</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-wheat/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-30" />
        </section>
      </div>
    );
  } catch (error) {
    console.error('Error loading product:', error);
    return notFound();
  }
};

export default ProductPage;
