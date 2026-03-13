import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-primary/10 px-4 md:px-20 py-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary rounded-lg text-white">
                <span className="material-symbols-outlined text-xl">bedtime</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">Mark Face</h2>
            </div>
            <p className="text-slate-700 max-w-xs mb-6 leading-relaxed text-sm">
              Criando os pijamas mais confortáveis do mundo desde 2012. Materiais de qualidade, produção ética e design atemporal.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 flex items-center justify-center bg-white border border-primary/20 rounded-full hover:bg-primary hover:text-white transition-all text-primary">
                <span className="material-symbols-outlined text-xl">share</span>
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-black mb-6 text-sm uppercase tracking-wider text-primary">Loja</h4>
            <ul className="space-y-4 text-slate-800 text-sm font-black">
              <li><Link href="/catalog" className="hover:text-primary transition-colors">Todos os Produtos</Link></li>
              <li><Link href="/catalog?category=best-sellers" className="hover:text-primary transition-colors">Mais Vendidos</Link></li>
              <li><Link href="/catalog?category=new-arrivals" className="hover:text-primary transition-colors">Lançamentos</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-black mb-6 text-sm uppercase tracking-wider text-primary">Ajuda</h4>
            <ul className="space-y-4 text-slate-800 text-sm font-black">
              <li><Link href="/shipping" className="hover:text-primary transition-colors">Entregas</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">Devoluções</Link></li>
              <li><Link href="/size-guide" className="hover:text-primary transition-colors">Guia de Tamanhos</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Contato</Link></li>
            </ul>
          </div>

          <div className="col-span-2 space-y-8">
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-primary/20">
              <span className="material-symbols-outlined text-3xl text-primary font-black">local_shipping</span>
              <div>
                <h5 className="font-black text-sm text-primary">Frete Expresso Grátis</h5>
                <p className="text-xs text-slate-800 font-bold">Em todos os pedidos acima de R$ 500</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-primary/20">
              <span className="material-symbols-outlined text-3xl text-primary font-black">verified</span>
              <div>
                <h5 className="font-black text-sm text-primary">Garantia de Qualidade</h5>
                <p className="text-xs text-slate-800 font-bold">Conforto absoluto ou seu dinheiro de volta</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-primary/20 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-700 text-xs font-bold">
          <p>© {new Date().getFullYear()} Mark Face Premium Sleepwear. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidade</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Termos de Serviço</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

