import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { LogOut, Package, ShoppingCart, Truck, Scissors, LayoutDashboard, FileUp, Moon, Sun, User as UserIcon, Settings, Menu, DollarSign, ShoppingBag, Landmark, MessageSquare, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export default function Layout() {
    const token = localStorage.getItem('token');
    const { theme, setTheme } = useTheme();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Changed to false default for mobile usability

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const handleMenuClick = () => {
        if (window.innerWidth < 1024) {
            setIsMobileMenuOpen(false);
        }
    };

    return (
        <div className="flex h-screen flex-col lg:flex-row bg-background overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "w-full lg:w-72 smooth-glass flex-shrink-0 flex flex-col h-full z-20 transition-all duration-500",
                    isMobileMenuOpen ? "flex" : "hidden lg:flex"
                )}
            >
                <div className="p-10 flex items-center justify-center">
                    <Link to="/" className="flex items-center justify-center">
                        <img
                            src={theme === 'dark' ? "/markface-white.png" : "/markface-blue.png"}
                            alt="MarkFace Logo"
                            className="h-14 w-auto object-contain hover:scale-110 transition-transform duration-500 drop-shadow-2xl"
                        />
                    </Link>
                </div>

                <nav className="flex-1 px-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {[
                        { to: "/", icon: LayoutDashboard, label: "Visão Geral" },
                        { to: "/products", icon: Package, label: "Produtos & Estoque" },
                        { to: "/orders", icon: ShoppingCart, label: "Pedidos" },
                        { to: "/suppliers", icon: Truck, label: "Fornecedores" },
                        { to: "/raw-materials", icon: Scissors, label: "Matérias-Primas" },
                        { to: "/customers", icon: UserIcon, label: "Clientes" },
                        { to: "/costs", icon: DollarSign, label: "Custos de Produção" },
                        { to: "/purchases", icon: ShoppingBag, label: "Compras" },
                        { to: "/fixed-costs", icon: Landmark, label: "Gastos Fixos" },
                        { to: "/website", icon: Globe, label: "Website" },
                        { to: "/whatsapp", icon: MessageSquare, label: "WhatsApp" },
                    ].map((item) => (
                        <Button
                            key={item.to}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 group hover:translate-x-1",
                                location.pathname === item.to
                                    ? "bg-primary/10 text-primary font-bold shadow-[0_0_20px_rgba(0,60,113,0.1)]"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                            asChild
                            onClick={handleMenuClick}
                        >
                            <Link to={item.to}>
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform group-hover:scale-110",
                                    location.pathname === item.to ? "text-primary" : ""
                                )} />
                                <span className="body-brand">{item.label}</span>
                            </Link>
                        </Button>
                    ))}

                    <div className="my-8 mx-4 h-[1px] bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

                    {[
                        { to: "/import", icon: FileUp, label: "Importar Dados" },
                        { to: "/management", icon: Settings, label: "Gerenciamento" },
                    ].map((item) => (
                        <Button
                            key={item.to}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 h-12 rounded-2xl transition-all duration-300 group hover:translate-x-1",
                                location.pathname === item.to
                                    ? "bg-primary/10 text-primary font-bold shadow-[0_0_20px_rgba(0,60,113,0.1)]"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                            asChild
                            onClick={handleMenuClick}
                        >
                            <Link to={item.to}>
                                <item.icon className="h-5 w-5" />
                                <span className="body-brand">{item.label}</span>
                            </Link>
                        </Button>
                    ))}
                </nav>

                <div className="p-6 mt-auto space-y-4 border-t border-primary/5">
                    {/* User Profile & Theme Toggle Group */}
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 group/profile transition-all hover:bg-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg text-primary-foreground font-bold text-xs">
                                AD
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-bold tracking-tight">Administrador</p>
                                <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest opacity-40 italic">Produção</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-xl h-9 w-9 bg-background/50 backdrop-blur-md shadow-sm hover:scale-110 active:scale-95 transition-all"
                        >
                            {theme === 'dark' ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-primary" />}
                        </Button>
                    </div>

                    <Button variant="ghost" className="w-full justify-start gap-3 h-12 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all group" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="body-brand text-sm">Encerrar Sessão</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={cn(
                    "flex-1 flex flex-col min-w-0 h-full overflow-hidden relative",
                    !isMobileMenuOpen ? "flex" : "hidden lg:flex"
                )}
            >
                {/* Floating Mobile Trigger */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "fixed top-6 left-6 z-30 lg:hidden rounded-2xl bg-card/80 backdrop-blur-xl shadow-2xl border border-white/10 transition-all active:scale-90",
                        isMobileMenuOpen && "left-auto right-6"
                    )}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    <Menu className="h-6 w-6 text-primary" />
                </Button>

                <div className={cn(
                    "flex-1 overflow-y-auto w-full relative custom-scrollbar",
                    location.pathname === '/whatsapp' ? "p-0" : "p-6 md:p-12 lg:p-16"
                )}>
                    <div className={cn(
                        "mx-auto animate-in fade-in zoom-in-95 duration-700 h-full",
                        location.pathname === '/whatsapp' ? "max-w-none w-full" : "max-w-[1600px]"
                    )}>
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
