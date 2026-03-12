import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-brand-navy text-white pt-20 pb-10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/10 pb-12 mb-8">
        <div className="flex flex-col gap-6">
          <Image src="/logo.png" alt="MarkFace Logo" width={150} height={40} className="brightness-0 invert opacity-90 h-10 w-auto" />
          <p className="text-gray-400 text-sm leading-relaxed">
            Unimos o máximo conforto à sofisticação absoluta. MarkFace é a sua escolha definitiva em pijamas e vestuário de qualidade premium.
          </p>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6">Explore</h4>
          <ul className="flex flex-col gap-4 text-gray-400 text-sm">
            <li><Link href="/catalog" className="hover:text-white transition-colors">Todos os Produtos</Link></li>
            <li><Link href="/catalog?category=lancamentos" className="hover:text-white transition-colors">Lançamentos</Link></li>
             <li><Link href="/catalog?category=mais-vendidos" className="hover:text-white transition-colors">Mais Vendidos</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg mb-6">Ajuda</h4>
          <ul className="flex flex-col gap-4 text-gray-400 text-sm">
            <li><Link href="/shipping" className="hover:text-white transition-colors">Prazos e Entregas</Link></li>
            <li><Link href="/returns" className="hover:text-white transition-colors">Trocas e Devoluções</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacidade</Link></li>
          </ul>
        </div>

        <div>
           <h4 className="font-serif text-lg mb-6">Siga-nos</h4>
           <div className="flex gap-4">
             {/* Social link placeholders */}
             <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">IG</a>
             <a href="#" className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors">FB</a>
           </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 text-center text-gray-500 text-xs">
        <p>&copy; {new Date().getFullYear()} MarkFace. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
