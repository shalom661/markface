import { useState } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { LogOut, Package, ShoppingCart, Truck, Scissors, LayoutDashboard, FileUp, Moon, Sun, User as UserIcon, Settings, Menu, DollarSign, ShoppingBag, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export default function Layout() {
    const token = localStorage.getItem('token');
    const { theme, setTheme } = useTheme();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    const handleMenuClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <div className="flex h-screen flex-col lg:flex-row bg-background/50 overflow-hidden">
            {/* Sidebar */}
            <aside
                className={cn(
                    "w-full lg:w-72 glass border-r shadow-2xl flex-shrink-0 flex flex-col h-full z-20 transition-all duration-300 premium-sidebar",
                    isMobileMenuOpen ? "flex" : "hidden lg:flex"
                )}
            >
                <div className="p-8 border-b flex items-center justify-center">
                    <Link to="/" className="flex items-center justify-center">
                        <img
                            src="/src/assets/markface-logo.png"
                            alt="MarkFace Logo"
                            className="h-12 w-auto object-contain hover:scale-105 transition-transform duration-300 drop-shadow-sm"
                        />
                    </Link>
                </div>

                <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
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
                    ].map((item) => (
                        <Button
                            key={item.to}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200 hover:bg-primary/5 group",
                                window.location.pathname === item.to ? "nav-item-active" : "text-muted-foreground hover:text-foreground"
                            )}
                            asChild
                            onClick={handleMenuClick}
                        >
                            <Link to={item.to}>
                                <item.icon className={cn(
                                    "h-5 w-5 transition-transform group-hover:scale-110",
                                    window.location.pathname === item.to ? "text-primary" : ""
                                )} />
                                {item.label}
                            </Link>
                        </Button>
                    ))}

                    <div className="my-6 border-t border-primary/10" />

                    {[
                        { to: "/import", icon: FileUp, label: "Importar Dados" },
                        { to: "/management", icon: Settings, label: "Gerenciamento" },
                    ].map((item) => (
                        <Button
                            key={item.to}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200 hover:bg-primary/5 group",
                                window.location.pathname === item.to ? "nav-item-active" : "text-muted-foreground hover:text-foreground"
                            )}
                            asChild
                            onClick={handleMenuClick}
                        >
                            <Link to={item.to}>
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        </Button>
                    ))}
                </nav>

                <div className="p-6 border-t mt-auto">
                    <Button variant="outline" className="w-full justify-start gap-3 h-12 rounded-xl border-dashed hover:border-destructive hover:text-destructive transition-colors" onClick={handleLogout}>
                        <LogOut className="h-5 w-5" /> Sair
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
                <header className="h-20 glass border-b flex items-center px-8 shadow-sm flex-shrink-0 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-4 lg:hidden rounded-xl bg-background shadow-sm border"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>

                    <div className="ml-auto flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-xl h-10 w-10 bg-background border shadow-sm hover:scale-110 transition-transform"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
                        </Button>

                        <div className="flex items-center gap-3 pl-4 border-l">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold leading-none">Admin Admin</p>
                                <p className="text-xs text-muted-foreground mt-1">Gerente de Produção</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20 text-primary-foreground font-bold">
                                AD
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-6 md:p-10 overflow-y-auto w-full relative">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
