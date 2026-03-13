import { fetchProductById, fetchProducts } from '@/lib/api';
import ProductGallery from '@/components/ProductGallery';
import ProductInfo from '@/components/ProductInfo';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  
  try {
    const product = await fetchProductById(id);
    const { items: related } = await fetchProducts(1, 4); // Simple related products

    return (
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-8 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-widest">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <Link href="/catalog" className="hover:text-primary transition-colors">Produtos</Link>
            <span className="material-symbols-outlined text-[10px]">chevron_right</span>
            <span className="text-slate-900 dark:text-slate-100">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery */}
          <ProductGallery images={product.images || []} />

          {/* Info */}
          <ProductInfo product={product} />
        </div>

        {/* Suggested Products */}
        <section className="mt-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tight">Você também pode gostar</h2>
            <Link href="/catalog" className="text-primary font-bold hover:underline flex items-center gap-1 group">
                Ver todos <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">chevron_right</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.filter(p => p.id !== product.id).slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </main>
    );
  } catch (error) {
    notFound();
  }
}
