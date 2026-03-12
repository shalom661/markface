import Image from 'next/image';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative h-[85vh] w-full overflow-hidden flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/hero.png" 
          alt="MarkFace Comfort Hero" 
          fill 
          className="object-cover brightness-75"
          priority 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy/60 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative z-10 text-white">
        <div className="max-w-2xl">
          <h4 className="uppercase tracking-[0.3em] text-sm mb-4 font-medium text-brand-wheat">MarkFace Premium Selection</h4>
          <h1 className="text-6xl md:text-8xl font-serif mb-8 leading-tight">
            Onde o <br />
            <span className="italic">conforto</span> encontra a <br />
            sofisticação.
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-lg leading-relaxed">
            Pijamas e vestuário de extrema qualidade, desenhados para elevar seus momentos de descanso com elegância e suavidade.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              href="/catalog" 
              className="bg-brand-navy text-white px-10 py-4 font-medium uppercase tracking-widest text-sm hover:bg-brand-wheat hover:text-brand-navy transition-all duration-300"
            >
              Comprar Agora
            </Link>
             <Link 
              href="/about" 
              className="border border-white text-white px-10 py-4 font-medium uppercase tracking-widest text-sm hover:bg-white hover:text-brand-navy transition-all duration-300 backdrop-blur-sm"
            >
              Nossa História
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
