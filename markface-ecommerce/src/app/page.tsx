import Hero from '@/components/Hero';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col gap-20 pb-32">
      <Hero />

      {/* Philosophy Section */}
      <section className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-serif mb-8 text-brand-navy">Qualidade que se sente.</h2>
          <p className="text-gray-600 leading-loose text-lg font-light italic">
            "Na MarkFace, acreditamos que o verdadeiro luxo é o conforto absoluto. Cada fibra, cada costura é pensada para abraçar seu corpo e proporcionar uma experiência sensorial única de suavidade e elegância."
          </p>
        </div>
      </section>

      {/* Featured Collections Grid */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[600px]">
          <div className="relative group overflow-hidden bg-gray-100">
            <div className="absolute inset-0 bg-brand-navy/10 group-hover:bg-brand-navy/20 transition-all duration-500 z-10" />
            <div className="absolute bottom-12 left-12 z-20 text-white">
              <h3 className="text-3xl font-serif mb-4">Coleção Feminina</h3>
              <Link href="/catalog?category=feminino" className="underline underline-offset-8 tracking-widest text-sm uppercase font-medium hover:text-brand-wheat transition-colors">Ver Coleção</Link>
            </div>
            <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1582232490089-a5c9f5cf2ee5?q=80&w=1000')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
          </div>
          <div className="grid grid-rows-2 gap-8">
             <div className="relative group overflow-hidden bg-gray-100">
                <div className="absolute inset-0 bg-brand-navy/10 group-hover:bg-brand-navy/20 transition-all duration-500 z-10" />
                <div className="absolute bottom-8 left-8 z-20 text-white">
                  <h3 className="text-2xl font-serif mb-2">Linha Masculina</h3>
                  <Link href="/catalog?category=masculino" className="underline underline-offset-4 tracking-widest text-xs uppercase font-medium hover:text-brand-wheat transition-colors">Explorar</Link>
                </div>
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1598033104337-33e5066c1e30?q=80&w=1000')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
             </div>
             <div className="relative group overflow-hidden bg-gray-100">
                <div className="absolute inset-0 bg-brand-navy/10 group-hover:bg-brand-navy/20 transition-all duration-500 z-10" />
                <div className="absolute bottom-8 left-8 z-20 text-white">
                  <h3 className="text-2xl font-serif mb-2">Conforto Infantil</h3>
                  <Link href="/catalog?category=infantil" className="underline underline-offset-4 tracking-widest text-xs uppercase font-medium hover:text-brand-wheat transition-colors">Descobrir</Link>
                </div>
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1519340241574-2eca39969458?q=80&w=1000')] bg-cover bg-center group-hover:scale-105 transition-transform duration-700" />
             </div>
          </div>
        </div>
      </section>

      {/* Placeholder for Product Feed from Hub */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h4 className="uppercase tracking-[0.2em] text-xs font-semibold text-brand-navy/40 mb-2">Novidades</h4>
            <h2 className="text-4xl font-serif text-brand-navy">Lançamentos Recentes</h2>
          </div>
          <Link href="/catalog" className="text-brand-navy font-medium hover:underline">Ver tudo</Link>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="group cursor-pointer">
              <div className="relative aspect-[3/4] bg-white mb-6 overflow-hidden">
                <div className="absolute top-4 right-4 z-10 bg-white/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.09b-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                </div>
                <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300">
                   {/* This would be real images from HUB later */}
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-brand-navy text-white py-3 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 text-xs font-semibold uppercase tracking-widest">
                  Comprar
                </div>
              </div>
              <p className="text-gray-400 text-[10px] uppercase tracking-widest mb-2">Coleção Conforto</p>
              <h3 className="font-medium text-brand-navy mb-1 group-hover:text-brand-accent transition-colors">Pijama Silk Dream Premium</h3>
              <p className="font-serif text-brand-navy">R$ 289,90</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quality Commitment Section */}
      <section className="bg-white py-20 border-y border-gray-100">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-16 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-brand-silk flex items-center justify-center text-brand-navy">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9s2.015-9 4.5-9m0 0a9.015 9.015 0 0 1 8.716 6.747M12 3a9.015 9.015 0 0 0-8.716 6.747" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-brand-navy">Envio Internacional</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Entregamos suavidade e estilo para todo o Brasil e o mundo com logística otimizada.</p>
          </div>
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-brand-silk flex items-center justify-center text-brand-navy">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-brand-navy">Garantia de Qualidade</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Materiais premium de origem certificada para garantir a durabilidade e o toque incomparável.</p>
          </div>
           <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-brand-silk flex items-center justify-center text-brand-navy">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-brand-navy">Atendimento Exclusivo</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Suporte humanizado e consultoria de estilo para ajudar você na melhor escolha.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
