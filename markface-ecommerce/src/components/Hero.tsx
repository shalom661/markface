import Link from 'next/link';

const Hero = () => {
  return (
    <section className="px-4 md:px-20 py-8">
      <div className="relative h-[600px] w-full overflow-hidden rounded-xl bg-slate-200">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105" 
          style={{ 
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.9), transparent), url("https://lh3.googleusercontent.com/aida-public/AB6AXuAvfSB0_ShNDICdM05DvY7AwFJas_HeO8xEqv11lf-94nURtpnl5HRXMFYlSZXBIVstvZzRwxxka81_WGKVOezgBRnnyR_iRvJkxBD5NNmhqA7mtsABnXkRHNLpoIgE5tejL2_ijTi5yQ3O2wHstC5rs792oqapy_4u9EEdrBOVk8ud3UHbAZh9yB8ad6WJagxpmH4UCuhBYA-AHq7o1iH9J7WYdu_MWIkuzgitfAtXU9fN6MXlSh5Y-_Quq9_rIh_LBcQaQAeDWsYl")` 
          }}
        />
        <div className="relative h-full flex flex-col justify-center px-12 md:px-24 text-primary max-w-3xl">
          <span className="bg-primary/10 text-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6 w-fit">Nova Coleção</span>
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6">Redefina Seu Ritual Noturno</h1>
          <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-lg leading-relaxed">
            Experimente o luxo supremo em seda premium e algodão macio. Desenhado para sonhos que duram mais.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/catalog" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-bold transition-all transform hover:scale-105 inline-block text-center"
            >
              Comprar Coleção
            </Link>
            <Link 
              href="/catalog" 
              className="bg-primary/5 hover:bg-primary/10 border border-primary/10 text-primary px-8 py-4 rounded-xl font-bold transition-all inline-block text-center"
            >
              Ver Lookbook
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

