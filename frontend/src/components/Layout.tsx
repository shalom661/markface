import { useState } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { LogOut, Package, ShoppingCart, Truck, Scissors, LayoutDashboard, FileUp, Moon, Sun, User as UserIcon, Settings, Menu } from 'lucide-react';
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
        <div className="flex h-screen flex-col lg:flex-row bg-muted/20 overflow-hidden">
            {/* Sidebar */}
            <aside 
                className={cn(
                    "w-full lg:w-64 border-r bg-card shadow-sm flex-shrink-0 flex flex-col h-full",
                    isMobileMenuOpen ? "flex" : "hidden lg:flex"
                )}
            >
                <div className="p-6 border-b flex items-center justify-between">
                    <h1 className="text-xl font-bold tracking-tight">MarkFace Hub</h1>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/"><LayoutDashboard className="h-4 w-4" /> Visão Geral</Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/products"><Package className="h-4 w-4" /> Produtos & Estoque</Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/orders"><ShoppingCart className="h-4 w-4" /> Pedidos</Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/suppliers"><Truck className="h-4 w-4" /> Fornecedores</Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/raw-materials"><Scissors className="h-4 w-4" /> Matérias-Primas</Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/customers"><UserIcon className="h-4 w-4" /> Clientes</Link>
                    </Button>

                    <div className="my-2 border-t" />

                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/import"><FileUp className="h-4 w-4" /> Importar Dados</Link>
                    </Button>
                    <Button variant="ghost" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" asChild onClick={handleMenuClick}>
                        <Link to="/management"><Settings className="h-4 w-4" /> Gerenciamento</Link>
                    </Button>
                </nav>

                <div className="p-4 border-t mt-auto">
                    <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                        <LogOut className="h-4 w-4" /> Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main 
                className={cn(
                    "flex-1 flex flex-col min-w-0 h-full overflow-hidden",
                    !isMobileMenuOpen ? "flex" : "hidden lg:flex"
                )}
            >
                <header className="h-16 border-b bg-card flex items-center px-6 shadow-sm flex-shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="mr-2 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="ml-auto flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="rounded-full"
                        >
                            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>
                        <span className="text-sm text-muted-foreground hidden sm:inline">Admin User</span>
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">AD</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 p-4 md:p-8 overflow-y-auto w-full">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
