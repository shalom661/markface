'use client';

import { useCartStore } from '@/lib/cartStore';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import { fetchProducts, Product } from '@/lib/api';

const CartPage = () => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCartStore();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [recommended, setRecommended] = useState<Product[]>([]);

  // Handle hydration to prevent mismatch
  useEffect(() => {
    setHasHydrated(true);
    fetchProducts(1, 4).then(res => setRecommended(res.items));
  }, []);

  if (!hasHydrated) return null;

  return (
    <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-10 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items Section */}
        <div className="flex-grow space-y-8">
          <div className="flex items-center justify-between border-b border-primary/10 pb-6">
            <h2 className="text-3xl font-black tracking-tight">Carrinho de Compras</h2>
            <span className="text-slate-700  font-medium">
              {totalItems()} {totalItems() === 1 ? 'Item' : 'Itens'}
            </span>
          </div>

          {items.length > 0 ? (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.variantId} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-xl hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/10">
                  <div 
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-cover bg-center shrink-0 border border-primary/5" 
                    style={{ backgroundImage: `url("${item.image || 'https://images.unsplash.com/photo-1582232490089-a5c9f5cf2ee5?q=80&w=1000'}")` }}
                  />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 
                        <p className="text-sm text-primary font-bold">{item.color || 'Premium Silk'}</p>
                        <p className="text-xs text-slate-700 mt-1">Tamanho: {item.size || 'N/A'} | SKU: {item.sku}</p>
                      </div>
                      <p className="text-lg font-bold text-slate-900 
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-6">
                      <div className="flex items-center bg-background-light  rounded-full px-2 py-1 border border-primary/10">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:text-primary transition-colors focus:outline-none"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.variantId)}
                        className="text-slate-600 hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center space-y-6">
              <div className="w-20 h-20 rounded-full bg-slate-50 mx-auto flex items-center justify-center text-slate-300">
                <span className="material-symbols-outlined text-4xl">shopping_bag</span>
              </div>
              <h3 className="text-xl font-bold">Seu carrinho está vazio</h3>
              <Link href="/catalog" className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                Ir para a Loja
              </Link>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <aside className="w-full lg:w-96 shrink-0">
          <div className="bg-white  border border-primary/10 p-8 rounded-2xl shadow-sm sticky top-28">
            <h3 className="text-xl font-bold mb-6">Resumo do Pedido</h3>
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-slate-600 
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice())}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 
                <span>Frete</span>
                <span className="text-green-600 font-bold uppercase text-[10px] tracking-widest">Grátis</span>
              </div>
              <div className="flex justify-between text-slate-600 
                <span>Taxas Estimadas (ISS/ICMS)</span>
                <span className="font-semibold text-slate-900 
              </div>
            </div>
            
            <div className="border-t border-primary/10 pt-4 mb-8">
              <div className="flex justify-between items-end">
                <span className="text-lg font-bold">Total</span>
                <span className="text-2xl font-black text-primary">
                   {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPrice())}
                </span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Cupom de Desconto</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Código"
                  className="flex-grow bg-background-light  border-none rounded-lg text-sm px-4 focus:ring-2 focus:ring-primary/50 transition-all font-medium"
                />
                <button className="bg-primary/10 text-primary font-bold px-4 py-2 rounded-lg text-sm hover:bg-primary hover:text-white transition-all whitespace-nowrap">
                  Aplicar
                </button>
              </div>
            </div>

            <button className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 mb-4 hover:bg-opacity-90 uppercase tracking-widest text-xs">
              Finalizar Pedido
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[10px] text-slate-700 justify-center uppercase tracking-widest font-semibold">
                <span className="material-symbols-outlined text-sm">lock</span>
                Pagamento seguro com SSL 256-bit
              </div>
              <div className="flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all items-center">
                <img className="h-4" src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" />
                <img className="h-4" src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" />
                <img className="h-4" src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="Paypal" />
              </div>
            </div>
          </div>

          <div className="mt-6 p-6 bg-primary/5 rounded-2xl border border-primary/10 flex items-start gap-4">
            <span className="material-symbols-outlined text-primary font-bold">local_shipping</span>
            <div>
              <h4 className="text-sm font-bold">Benefício de Membro</h4>
              <p className="text-xs text-slate-600  mt-1">
                Você recebeu frete expresso gratuito por ser um membro Mark Face Rewards.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* Recommendations */}
      <section className="mt-20 border-t border-primary/10 pt-16">
        <h3 className="text-2xl font-bold mb-8">Você também pode gostar</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {recommended.map((p) => (
             <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </main>
  );
};

export default CartPage;

