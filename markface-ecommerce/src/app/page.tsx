import Hero from '@/components/Hero';
import Link from 'next/link';
import { fetchProducts } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const { items: products } = await fetchProducts(1, 4);

  return (
    <div className="flex flex-col overflow-x-hidden">
      <Hero />

      {/* New Arrivals Section */}
      <section className="px-4 md:px-20 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-black mb-2 text-primary">Lançamentos</h2>
            <p className="text-slate-700 font-medium">As peças mais recentes adicionadas à nossa coleção esta semana.</p>
          </div>
          <Link href="/catalog" className="font-bold flex items-center gap-2 hover:gap-3 transition-all text-primary">
            Ver Todos <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-4">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110" 
                  style={{ backgroundImage: `url("${product.images?.[0] || 'https://images.unsplash.com/photo-1582232490089-a5c9f5cf2ee5?q=80&w=1000'}")` }}
                />
                <button className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-xl">favorite</span>
                </button>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{product.name}</h3>
              <p className="font-bold text-primary">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  Math.min(...product.variants.map(v => v.price_default))
                )}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Shop by Category */}
      <section className="px-4 md:px-20 py-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black mb-10 text-center text-primary">Compre por Categoria</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pajamas */}
            <Link href="/catalog?category=pajamas" className="relative group h-80 overflow-hidden rounded-xl cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                style={{ 
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6), transparent), url("https://lh3.googleusercontent.com/aida-public/AB6AXuBV8G8H6saF5qYSEjdXmMZWMdWTUa3GC2edw0pzerCNmWv5UL-G0juIHZGIIRkpGu6X7a9F1icoPL8hheq5jYZXszI8fK2Ngphlau46tnB63oMLXp8ndSK6aeh1oHh_sbqZR9DICRUXGCjtfT9bcJV00kw9oQkdsAkcBS2bZM-UaTMLttrtLYpRREOVxurQJ6_QvjXBeAeDs-PTDlT8G4gf2IUH_oMpzdBnkrIbAX2Uld0KFw3zrrSXgfCtBwaEj2I4IMmgNc-dlCVx")` 
                }}
              />
              <div className="absolute inset-0 flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-black mb-2">Pijamas</h3>
                  <p className="text-sm opacity-90 mb-4">O conforto supremo para o seu sono</p>
                  <span className="inline-block border-b-2 border-white font-bold text-sm">Explorar</span>
                </div>
              </div>
            </Link>

            {/* Robes */}
            <Link href="/catalog?category=robes" className="relative group h-80 overflow-hidden rounded-xl cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                style={{ 
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6), transparent), url("https://lh3.googleusercontent.com/aida-public/AB6AXuA4xn4NitApvgHQbtXKBAfW9_Ij8yMzKS7DbRv2f0UeD4dGgL1VVVsk1cA2-RTplWVqYSnXF7iO3sePHylla8WWHN_CpapndX-V_Oj67ItKu0FSlK7ghrkRxeL0-s8dPoWytlv3QihMye-p09985s94OfaDdjW6LdB0Gq_0JwRXJrDrcVxlxGJoNV294A6E0sFokXm2PdBFiMHTojDlB7fCdg_iuk5n1M8AW35hXsQFK2G2IT2k4JMG_6aNpdQDKSJMTf2Q_guXWkAm")` 
                }}
              />
              <div className="absolute inset-0 flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-black mb-2">Robes</h3>
                  <p className="text-sm opacity-90 mb-4">Essenciais para o café da manhã</p>
                  <span className="inline-block border-b-2 border-white font-bold text-sm">Explorar</span>
                </div>
              </div>
            </Link>

            {/* Loungewear */}
            <Link href="/catalog?category=loungewear" className="relative group h-80 overflow-hidden rounded-xl cursor-pointer">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110" 
                style={{ 
                  backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.6), transparent), url("https://lh3.googleusercontent.com/aida-public/AB6AXuB5u-Fg1twJ9L7jTcqzxkWroHwmPOpUlNtErNr3btZsCYcN0Lfo8gtiLwAqeGoABQMiKU920aOMB1gWfEVkXHOhix_sImrtYdDTwlWBxzoTAX-1CBhuf9PT03WY3HbDHH3GQ1dB0ayDmvz_EDyauRf_9Rszo--kY3DDZl_A_XWGTtBafyuKyqsBhW5AsbyC0728d9h5jkviGtU9vatHuenAaPnggiCxi-T5K21XaSTd52kDYxlkOncZDEZsEY5BWv9HPSDCuOtclAGb")` 
                }}
              />
              <div className="absolute inset-0 flex items-end p-8">
                <div className="text-white">
                  <h3 className="text-2xl font-black mb-2">Loungewear</h3>
                  <p className="text-sm opacity-90 mb-4">Para os momentos intermediários</p>
                  <span className="inline-block border-b-2 border-white font-bold text-sm">Explorar</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Subscription Banner */}
      <section className="px-4 md:px-20 py-16">
        <div className="bg-primary rounded-2xl p-12 flex flex-col items-center text-center text-white">
          <h2 className="text-4xl font-black mb-6 uppercase tracking-tight">Junte-se ao Dreamer's Club</h2>
          <p className="max-w-xl text-lg opacity-90 mb-8 font-medium">
            Ganhe 15% de desconto no seu primeiro pedido e fique por dentro dos nossos lançamentos exclusivos e dicas de sono.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
            <input 
              type="email" 
              placeholder="Seu endereço de e-mail"
              className="flex-grow rounded-xl border-none px-6 py-4 text-slate-900 focus:ring-2 focus:ring-white"
            />
            <button className="bg-slate-900 hover:bg-slate-800 px-8 py-4 rounded-xl font-black transition-colors uppercase tracking-widest text-sm">
              Inscrever
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

