import Link from 'next/link';
import Image from 'next/image';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 premium-glass border-b border-white/20">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="MarkFace Logo" 
            width={150} 
            height={40} 
            className="h-10 w-auto"
            priority 
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm tracking-widest uppercase">
          <Link href="/catalog" className="hover:text-brand-navy transition-colors">Catálogo</Link>
          <Link href="/catalog?category=feminino" className="hover:text-brand-navy transition-colors">Feminino</Link>
          <Link href="/catalog?category=masculino" className="hover:text-brand-navy transition-colors">Masculino</Link>
          <Link href="/catalog?category=infantil" className="hover:text-brand-navy transition-colors">Infantil</Link>
          <Link href="/about" className="hover:text-brand-navy transition-colors">Sobre</Link>
        </nav>

        <div className="flex items-center gap-6">
          <button className="hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          
          <button className="relative hover:scale-110 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span className="absolute -top-2 -right-2 bg-brand-navy text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">0</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
