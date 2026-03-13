import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Globe,
    Search,
    Zap,
    Activity,
    Info,
    ShoppingBag
} from 'lucide-react';
import api from '@/lib/api';
import { Card } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
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
    variants: ProductVariant[];
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

    const websiteModality = modalities?.find(m => m.name.toLowerCase().includes('website') || m.name.toLowerCase().includes('site'));
    const totalFixed = Array.isArray(fixedCosts) ? fixedCosts.reduce((acc: number, curr: any) => acc + Number(curr.value || 0), 0) : 0;
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

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
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
                                                        <span className="h3-brand text-lg text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-left">{product.name}</span>
                                                        <Badge className="w-fit bg-blue-500/10 text-blue-700 dark:text-blue-400 border-none text-[8px] uppercase">{product.is_manufactured ? 'In-House' : 'Revenda'}</Badge>
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
