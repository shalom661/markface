import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Globe,
    Search,
    Zap,
    Activity,
    Info,
    ShoppingBag,
    Star,
    Clock,
    ChevronDown,
    Layout
} from 'lucide-react';
import api from '@/lib/api';
import { Card } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface SalesModality {
    id: string;
    name: string;
    tax_percent: number;
    fixed_fee: number;
    extra_cost: number;
}

interface ProductVariant {
    id: string;
    sku: string;
    cost: number;
    price_default: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    is_manufactured: boolean;
    is_on_website: boolean;
    is_featured: boolean;
    is_new_arrival: boolean;
    variants: ProductVariant[];
}

interface ProductCategory {
    id: string;
    name: string;
    slug: string;
    active: boolean;
    show_in_menu: boolean;
    is_featured: boolean;
    order: number;
    children?: ProductCategory[];
}

interface Banner {
    id: string;
    image_url: string;
    link_url?: string;
    title?: string;
    subtitle?: string;
    active: boolean;
    duration: number;
    order: number;
}

export default function Website() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: productsData, isLoading: loadingProducts } = useQuery({
        queryKey: ['products-website'],
        queryFn: async () => {
            const res = await api.get('/products?website_only=true');
            return res.data;
        },
    });

    const { data: modalities, isLoading: loadingModalities } = useQuery<SalesModality[]>({
        queryKey: ['sales-modalities'],
        queryFn: async () => {
            const res = await api.get('/sales-modalities');
            return res.data;
        },
    });

    const { data: fixedCosts } = useQuery({
        queryKey: ['fixed-costs'],
        queryFn: async () => {
            const res = await api.get('/fixed-costs');
            return res.data;
        },
    });

    const { data: categories } = useQuery<ProductCategory[]>({
        queryKey: ['product-categories-website'],
        queryFn: async () => {
            const res = await api.get('/product-categories?root_only=true');
            return res.data;
        },
    });

    const { data: banners } = useQuery<Banner[]>({
        queryKey: ['site-banners-active'],
        queryFn: async () => {
            const res = await api.get('/site/banners?active_only=true');
            return res.data;
        },
    });

    const [currentBanner, setCurrentBanner] = useState(0);

    React.useEffect(() => {
        if (!banners || banners.length <= 1) return;

        const duration = (banners[currentBanner]?.duration || 5) * 1000;
        const timer = setTimeout(() => {
            setCurrentBanner((prev: number) => (prev + 1) % banners.length);
        }, duration);

        return () => clearTimeout(timer);
    }, [currentBanner, banners]);

    const websiteModality = modalities?.find((m: SalesModality) => m.name.toLowerCase().includes('website') || m.name.toLowerCase().includes('site'));
    const totalFixed = Array.isArray(fixedCosts) ? fixedCosts.reduce((acc: number, curr: { value: string | number }) => acc + Number(curr.value || 0), 0) : 0;
    const fixedShare = totalFixed / 1000; // Assuming 1000 units/month as in Costs.tsx

    const calculateYieldPrice = (baseCost: number, isManufactured: boolean) => {
        if (!websiteModality) return 0;
        
        const effectiveBaseCost = baseCost + (isManufactured ? fixedShare : 0);
        const taxRate = (websiteModality.tax_percent || 0) / 100;
        
        if (taxRate >= 1) return 0;
        
        return (effectiveBaseCost + (websiteModality.fixed_fee || 0) + (websiteModality.extra_cost || 0)) / (1 - taxRate);
    };

    const products: Product[] = productsData?.items || [];
    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loadingProducts || loadingModalities) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <Globe className="h-16 w-16 text-primary/20" />
            <p className="label-brand text-muted-foreground italic text-xs">Sincronizando Vitrine Digital...</p>
        </div>
    );

    if (productsData?.error || !productsData || !modalities) return (
        <div className="max-w-2xl mx-auto p-12 text-center space-y-8 smooth-glass rounded-[3rem] border-destructive/20 mt-10">
            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-destructive/20">
                <Globe className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h3 className="h3-brand text-3xl underline decoration-destructive/40 underline-offset-8">Falha na Vitrine</h3>
                <p className="body-brand text-muted-foreground">Houve um problema ao sincronizar os dados da vitrine digital. Verifique sua conexão ou se as modalidades de venda estão configuradas.</p>
            </div>
            <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="h-14 px-8 rounded-2xl border-white/10 hover:bg-white/10 label-brand"
            >
                Tentar Sincronizar
            </Button>
        </div>
    );

    const featuredCategories = categories?.filter((c: ProductCategory) => c.is_featured && c.active) || [];
    const menuCategories = categories?.filter((c: ProductCategory) => c.show_in_menu && c.active).sort((a: ProductCategory, b: ProductCategory) => a.order - b.order) || [];

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Hero Slider */}
            {banners && banners.length > 0 && (
                <div className="relative w-full h-[400px] md:h-[600px] rounded-[3rem] overflow-hidden smooth-glass group shadow-3xl">
                    {banners.map((banner, index) => (
                        <div
                            key={banner.id}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                                index === currentBanner ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                            }`}
                        >
                            <img 
                                src={banner.image_url} 
                                alt={banner.title || 'Banner'} 
                                className="w-full h-full object-cover"
                            />
                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-12 md:p-20 text-left">
                                <div className="max-w-2xl space-y-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                                    {banner.title && (
                                        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
                                            {banner.title}
                                        </h2>
                                    )}
                                    {banner.subtitle && (
                                        <p className="text-lg md:text-xl text-white/80 font-medium max-w-lg">
                                            {banner.subtitle}
                                        </p>
                                    )}
                                    {banner.link_url && (
                                        <Button 
                                            onClick={() => window.location.href = banner.link_url!}
                                            className="h-14 px-10 rounded-2xl bg-white text-navy hover:bg-white/90 font-bold text-lg shadow-2xl shadow-white/20 w-fit"
                                        >
                                            Ver Coleção
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Dots */}
                    {banners.length > 1 && (
                        <div className="absolute bottom-10 right-10 flex gap-3 z-10">
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentBanner(index)}
                                    className={`h-2 transition-all duration-500 rounded-full ${
                                        index === currentBanner ? 'w-10 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Category Bar */}
            {menuCategories.length > 0 && (
                <div className="sticky top-0 z-40 w-full smooth-glass border-y border-white/5 py-3 overflow-x-auto">
                    <div className="flex items-center justify-center gap-8 px-8 min-w-max">
                        {menuCategories.map((cat: ProductCategory) => (
                            <div key={cat.id} className="group relative py-2">
                                <button className="label-brand text-[10px] uppercase font-bold tracking-widest text-muted-foreground hover:text-blue-400 transition-colors flex items-center gap-2 px-3">
                                    {cat.name}
                                    {cat.children && cat.children.length > 0 && (
                                        <ChevronDown className="h-3 w-3 opacity-50 group-hover:rotate-180 transition-transform" />
                                    )}
                                </button>
                                
                                {cat.children && cat.children.length > 0 && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 z-50">
                                        <div className="smooth-glass rounded-2xl p-4 border border-white/10 shadow-2xl min-w-[200px] grid gap-2">
                                            {cat.children.map((sub: ProductCategory) => (
                                                <button key={sub.id} className="label-brand text-[9px] uppercase text-muted-foreground hover:text-white hover:bg-blue-600/20 p-2 rounded-lg text-left transition-all">
                                                    {sub.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Featured Sections (Joge Style) */}
            {featuredCategories.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 px-4">
                    {featuredCategories.map((cat: ProductCategory) => (
                        <Card key={cat.id} className="aspect-[4/3] rounded-[2.5rem] border-none overflow-hidden relative group cursor-pointer shadow-2xl">
                            {/* Placeholder for category image if we had one, otherwise a nice gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-navy/80 group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-x-0 bottom-0 p-8 pt-20 bg-gradient-to-t from-black/80 to-transparent">
                                <p className="label-brand text-[10px] uppercase text-blue-400 font-black tracking-[0.2em] mb-2">Destaque</p>
                                <h3 className="h3-brand text-3xl font-bold text-white mb-4 line-clamp-1">{cat.name}</h3>
                                <Button className="h-10 px-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] uppercase font-bold hover:bg-white hover:text-navy transition-all">
                                    Ver Coleção
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Featured Products Row */}
            {products.some(p => p.is_featured) && (
                <div className="space-y-6 px-4">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                            <Star className="h-5 w-5 fill-current" />
                        </div>
                        <h2 className="h3-brand text-2xl">Vitrines em Destaque</h2>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.filter(p => p.is_featured).slice(0, 5).map(product => {
                           const baseCost = product.variants?.[0]?.cost || 0;
                           const yieldPrice = calculateYieldPrice(baseCost, product.is_manufactured);
                           return (
                            <Card key={product.id} className="group p-4 rounded-[2rem] smooth-glass border-none hover:bg-white/[0.04] transition-all cursor-pointer">
                                <div className="aspect-[3/4] rounded-2xl bg-muted overflow-hidden mb-4 relative">
                                    {/* Product image would go here */}
                                    <div className="absolute top-3 left-3">
                                        <Badge className="bg-amber-500/20 text-amber-400 border-none label-brand text-[8px] uppercase px-2">Destaque</Badge>
                                    </div>
                                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/10">
                                        <Layout className="h-10 w-10" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="label-brand text-xs font-bold truncate">{product.name}</h4>
                                    <p className="stat-brand text-primary text-lg">R$ {yieldPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </Card>
                           );
                        })}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-4">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center text-blue-400 shadow-3xl border border-blue-500/10">
                        <Globe className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="h1-brand text-4xl text-foreground mb-1">Website Hub</h1>
                        <p className="label-brand text-muted-foreground opacity-90 text-xs text-left">
                            Gestão de <span className="text-blue-600 dark:text-blue-400 not-italic font-black">Produtos Online & Pricing Diferenciado</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <Button 
                        onClick={() => window.location.href = '/website/customize'}
                        className="h-12 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white label-brand flex items-center gap-2"
                    >
                        <Zap className="h-4 w-4" />
                        Personalizar Site
                    </Button>
                    <div className="relative flex-1 lg:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            placeholder="Buscar na vitrine..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 rounded-2xl smooth-glass border-none focus:ring-2 focus:ring-blue-500/20 transition-all body-brand text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Modality Status */}
            {!websiteModality && (
                <Card className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4">
                    <Info className="h-5 w-5 text-amber-500" />
                    <p className="label-brand text-amber-500 text-xs">
                        Atenção: Modalidade "Website" não detectada. Os preços abaixo são baseados no custo base sem taxas de canal.
                    </p>
                </Card>
            )}

            {/* Main Content */}
            <div className="grid lg:grid-cols-12 gap-8">
                <div className="lg:col-span-9">
                    <Card className="rounded-[3rem] border-none smooth-glass overflow-hidden shadow-2xl p-1">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-blue-500/[0.02]">
                                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                                        <TableHead className="py-4 px-10 label-brand text-blue-400/70">Produto Digital</TableHead>
                                        <TableHead className="label-brand text-blue-400/70">Custo Base</TableHead>
                                        <TableHead className="label-brand text-blue-400/70">Preço Website</TableHead>
                                        <TableHead className="label-brand text-blue-400/70">Variações</TableHead>
                                        <TableHead className="text-right px-10 label-brand text-blue-400/70">Sincronização</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredProducts.map((product) => {
                                        const baseCost = product.variants?.[0]?.cost || 0;
                                        const yieldPrice = calculateYieldPrice(baseCost, product.is_manufactured);
                                        
                                        return (
                                            <TableRow key={product.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5">
                                                <TableCell className="py-5 px-10">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="h3-brand text-lg text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-left">{product.name}</span>
                                                            {product.is_featured && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                                                            {product.is_new_arrival && <Clock className="h-3 w-3 text-emerald-400" />}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="w-fit bg-blue-500/10 text-blue-700 dark:text-blue-400 border-none text-[8px] uppercase">{product.is_manufactured ? 'In-House' : 'Revenda'}</Badge>
                                                            {product.is_featured && <Badge variant="outline" className="text-[7px] border-amber-500/20 text-amber-500/70 h-4 px-1.5 uppercase">Destaque</Badge>}
                                                            {product.is_new_arrival && <Badge variant="outline" className="text-[7px] border-emerald-500/20 text-emerald-400/70 h-4 px-1.5 uppercase">Novo</Badge>}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="stat-brand text-muted-foreground/60 text-sm">R$ {baseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="stat-brand text-xl text-blue-700 dark:text-blue-400">R$ {yieldPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                        <span className="label-brand text-[8px] text-muted-foreground">Yield Calculado</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex -space-x-1.5">
                                                        {product.variants.slice(0, 4).map(v => (
                                                            <div key={v.id} className="h-7 px-2 rounded-lg bg-blue-500/5 border border-blue-500/10 flex items-center justify-center text-[9px] text-blue-300/60 shadow-lg" title={v.sku}>
                                                                {v.sku.slice(-4)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-10">
                                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none label-brand text-[9px] px-3 py-1 animate-pulse">Ativo no Site</Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-6">
                                <ShoppingBag className="h-12 w-12 opacity-10" />
                                <p className="body-brand text-xs opacity-40">Nenhum produto ativado para o website.</p>
                            </div>
                        )}
                    </Card>
                </div>

                {/* Sidebar Stats */}
                <div className="lg:col-span-3 space-y-6">
                    <Card className="rounded-[2.5rem] border-none smooth-glass p-8 space-y-6 shadow-2xl bg-blue-500/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12">
                            <Activity className="h-20 w-20" />
                        </div>
                        <div className="space-y-1 relative z-10">
                            <p className="label-brand text-blue-700 dark:text-blue-400 text-xs uppercase tracking-widest">Resumo Online</p>
                            <p className="stat-brand text-4xl text-foreground">{filteredProducts.length}</p>
                            <p className="body-brand text-[10px] text-muted-foreground italic">Produtos na vitrine digital</p>
                        </div>
                        
                        <div className="space-y-4 pt-4 border-t border-navy/10 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="label-brand text-[10px] text-muted-foreground">Taxa Canal</span>
                                <span className="stat-brand text-blue-700 dark:text-blue-400">{websiteModality?.tax_percent || 0}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="label-brand text-[10px] text-muted-foreground">Rateio Fixo</span>
                                <span className="stat-brand text-blue-700 dark:text-blue-400">R$ {fixedShare.toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[2rem] border-none smooth-glass p-6 flex flex-col gap-4">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Zap className="h-5 w-5" />
                        </div>
                        <p className="label-brand text-[10px] text-muted-foreground leading-relaxed">
                            O preço de venda é calculado automaticamente aplicando o <span className="text-primary font-bold">Yield Target</span> sobre o custo de produção + taxas de canal.
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
