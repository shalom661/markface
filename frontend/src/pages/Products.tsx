import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Search,
    Package,
    Trash2,
    Edit2,
    Power,
    AlertCircle,
    LayoutGrid,
    Boxes,
    BarChart3,
    Globe,
    Zap
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ProductVariant {
    id: string;
    sku: string;
    price_default: number;
    stock?: number;
}

interface Product {
    id: string;
    name: string;
    description: string;
    images: string[];
    active: boolean;
    is_manufactured: boolean;
    internal_code: string;
    is_on_website: boolean;
    variants: ProductVariant[];
}

export default function Products() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/products');
            return res.data;
        },
    });

    const products: Product[] = data?.items || [];

    const toggleMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/products/${id}/toggle-active`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast({
                title: "Status atualizado",
                description: "O status do produto foi alterado com sucesso.",
            });
        },
    });

    const toggleWebsiteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/products/${id}/toggle-website`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast({
                title: "Visibilidade alterada",
                description: "A visibilidade no site foi atualizada com sucesso.",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast({
                title: "Produto Excluído",
                description: "O registro foi removido do sistema.",
            });
        },
    });

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este produto permanentemente?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggle = (id: string) => {
        toggleMutation.mutate(id);
    };

    const handleToggleWebsite = (id: string) => {
        toggleWebsiteMutation.mutate(id);
    };

    const handleEdit = (id: string) => {
        navigate(`/products/${id}/edit`);
    };

    if (isLoading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="relative">
                <Boxes className="h-16 w-16 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-10 bg-primary rounded-full scale-[2]" />
            </div>
            <p className="label-brand text-muted-foreground italic text-xs">Sincronizando Base de Produtos...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto p-12 text-center space-y-8 smooth-glass rounded-[3rem] border-destructive/20 mt-10">
            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-destructive/20">
                <AlertCircle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h3 className="h3-brand text-3xl underline decoration-destructive/40 underline-offset-8">Falha de Sincronização</h3>
                <p className="body-brand text-muted-foreground">Houve um problema ao processar a requisição do catálogo de produtos.</p>
            </div>
            <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
                className="h-14 px-8 rounded-2xl border-white/10 hover:bg-white/10 label-brand"
            >
                Tentar Novamente
            </Button>
        </div>
    );

    const filteredItems = products.filter(item =>
        (item.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.internal_code?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Boxes className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="h2-brand text-3xl">Portfólio</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-primary/5 text-primary-foreground border-none label-brand px-2">Hub 3.1</Badge>
                                <span className="label-brand text-muted-foreground opacity-80">— Gestão do Portfólio Industrial</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar ativo, SKU ou código..."
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border-white/10 h-12 rounded-2xl pl-12 focus:ring-primary/20 transition-all body-brand"
                        />
                    </div>
                    <Button 
                        onClick={() => navigate('/products/new')}
                        className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground hover:scale-[1.03] transition-all shadow-glow label-brand gap-2"
                    >
                        <Plus className="h-4 w-4" /> Novo Lançamento
                    </Button>
                </div>
            </div>

            {/* Content Container */}
            <Card className="rounded-[3rem] border-none smooth-glass overflow-hidden shadow-2xl p-1">
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader className="bg-primary/[0.02]">
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableHead className="py-3 px-10 label-brand text-primary/70">Produto & Ficha Técnica</TableHead>
                                <TableHead className="label-brand text-primary/70">Cód. Identificação</TableHead>
                                <TableHead className="label-brand text-primary/70">Estado Atual</TableHead>
                                <TableHead className="label-brand text-primary/70">Site</TableHead>
                                <TableHead className="label-brand text-primary/70">Variações Ativas</TableHead>
                                <TableHead className="w-[120px] text-right px-10 label-brand text-primary/70">Gestão</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((product) => (
                                <TableRow key={product.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5 active:bg-white/10">
                                    <TableCell className="py-3 px-10">
                                        <div className="flex flex-col gap-0.5">
                                            <div
                                                className="h3-brand text-lg text-foreground truncate max-w-sm group-hover:text-primary transition-colors cursor-pointer text-left"
                                                onClick={() => handleEdit(product.id)}
                                            >
                                                {product.name}
                                            </div>
                                            <div className="label-brand text-muted-foreground line-clamp-1 max-w-sm text-left">
                                                {product.description || 'Sem descrição técnica do produto.'}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="body-brand inline-flex items-center px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-muted-foreground">
                                            {product.internal_code || '---'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleToggle(product.id)}
                                            className={`w-28 px-3 py-1.5 rounded-full label-brand transition-all ${product.active
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'
                                                }`}
                                        >
                                            {product.active ? 'Publicado' : 'Rascunho'}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleToggleWebsite(product.id)}
                                            className={`p-2 rounded-xl transition-all ${product.is_on_website
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-glow-blue'
                                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                }`}
                                            title={product.is_on_website ? "Ativado para o Site" : "Inativo para o Site"}
                                        >
                                            <Globe className={`h-4 w-4 ${product.is_on_website ? 'animate-pulse' : ''}`} />
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                            {product.variants.map(v => (
                                                <div key={v.id} className="bg-primary/5 text-primary border-none label-brand text-[9px] px-1.5 rounded-md">
                                                    {v.sku.slice(-6)}
                                                </div>
                                            ))}
                                            {product.variants.length === 0 && (
                                                <span className="label-brand text-[9px] text-muted-foreground/50">Sem SKUs</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-10">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product.id)} className="h-8 w-8 rounded-lg hover:bg-primary/20 hover:text-primary">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleToggle(product.id)} className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500">
                                                <Power className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleToggleWebsite(product.id)} className={`h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 ${product.is_on_website ? 'text-blue-400 bg-blue-500/5' : ''}`}>
                                                <Globe className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {!filteredItems.length && (
                    <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-6 animate-in zoom-in duration-700">
                        <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                            <Package className="h-12 w-12 opacity-20" />
                        </div>
                        <div className="space-y-1 text-center">
                            <p className="h3-brand text-xl">Nenhum Ativo Encontrado</p>
                            <p className="label-brand opacity-70">Refine sua busca ou inicie um novo cadastro.</p>
                        </div>
                        <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 label-brand" onClick={() => navigate('/products/new')}>Cadastrar Primeiro</Button>
                    </div>
                )}
            </Card>

            {/* Summary Analytics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Unidades Industriais', value: products.length, icon: Boxes, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'SKUs em Operação', value: products.reduce((acc, p) => acc + (p.variants?.length || 0), 0), icon: LayoutGrid, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Yield Analytics', value: 'High', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Saúde de Portfólio', value: 'A+', icon: BarChart3, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
                ].map((stat, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-none smooth-glass p-6 group hover:translate-y-[-5px] transition-all shadow-xl">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <span className="label-brand text-[8px] opacity-30">Live Monitor</span>
                        </div>
                        <div className="space-y-1">
                            <p className="label-brand text-[10px] text-muted-foreground/60">{stat.label}</p>
                            <p className="stat-brand text-2xl">{stat.value}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
