import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Trash2,
    Edit2,
    Power,
    Package,
    Truck,
    Search,
    Filter,
    CheckCircle2,
    AlertCircle,
    LayoutGrid,
    Boxes,
    BarChart3
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from '@/components/ui/input';

interface ProductVariant {
    id: string;
    sku: string;
    price_default: string;
    active: boolean;
    attributes: Record<string, any>;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    is_manufactured: boolean;
    internal_code: string;
    variants: ProductVariant[];
}

interface PaginatedResponse {
    total: number;
    page: number;
    page_size: number;
    items: Product[];
}

export default function Products() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = React.useState('');

    const { data, isLoading, error } = useQuery<PaginatedResponse>({
        queryKey: ['products'],
        queryFn: async () => {
            const { data } = await api.get('/products');
            return data;
        },
    });

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

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/products/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast({
                title: "Produto excluído",
                description: "O registro foi removido permanentemente do sistema.",
            });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível remover o produto. Verifique se existem vínculos.",
            });
        }
    });

    const handleEdit = (id: string) => {
        navigate(`/products/${id}/edit`);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("ATENÇÃO: Deseja realmente EXCLUIR este produto permanentemente? Esta ação não pode ser desfeita.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggle = (id: string) => {
        toggleMutation.mutate(id);
    };

    if (isLoading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="relative">
                <Package className="h-12 w-12 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full scale-150" />
            </div>
            <p className="label-brand text-muted-foreground italic">Acessando Banco de Dados...</p>
        </div>
    );

    if (error) return (
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

    const filteredItems = data?.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.internal_code?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const manufacturedProducts = filteredItems.filter(p => p.is_manufactured);
    const resaleProducts = filteredItems.filter(p => !p.is_manufactured);

    const ProductTable = ({ products }: { products: Product[] }) => (
        <div className="overflow-x-auto scrollbar-hide">
            <Table>
                <TableHeader className="bg-primary/[0.02]">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableHead className="py-6 px-10 label-brand text-primary/70">Produto & Ficha Técnica</TableHead>
                        <TableHead className="label-brand text-primary/70">Cód. Identificação</TableHead>
                        <TableHead className="label-brand text-primary/70">Estado Atual</TableHead>
                        <TableHead className="label-brand text-primary/70">Variações Ativas</TableHead>
                        <TableHead className="w-[120px] text-right px-10 label-brand text-primary/70">Gestão</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => (
                        <TableRow key={product.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5 active:bg-white/10">
                            <TableCell className="py-7 px-10">
                                <div className="flex flex-col gap-1.5">
                                    <div
                                        className="h3-brand text-xl text-white/90 truncate max-w-sm group-hover:text-primary transition-colors cursor-pointer"
                                        onClick={() => handleEdit(product.id)}
                                    >
                                        {product.name}
                                    </div>
                                    <div className="label-brand text-muted-foreground/50 line-clamp-1 max-w-sm">
                                        {product.description || 'Sem descrição técnica do produto.'}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="body-brand inline-flex items-center px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-muted-foreground">
                                    {product.internal_code}
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
                                <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                    {product.variants.map(v => (
                                        <Badge key={v.id} className="bg-primary/5 text-primary border-none label-brand text-[9px] px-1.5">
                                            {v.sku.slice(-4)}
                                        </Badge>
                                    ))}
                                    {product.variants.length === 0 && (
                                        <span className="label-brand text-[9px] text-muted-foreground/30">Sem SKUs</span>
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
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(product.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!products.length && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-64 text-center">
                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-6 animate-in zoom-in duration-700">
                                    <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                                        <Package className="h-12 w-12 opacity-20" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="h3-brand text-xl">Nenhum Ativo Encontrado</p>
                                        <p className="label-brand opacity-50">Refine sua busca ou inicie um novo cadastro.</p>
                                    </div>
                                    <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/10 label-brand" onClick={() => navigate('/products/new')}>Cadastrar Primeiro</Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner">
                            <Boxes className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="h2-brand text-5xl">Portfólio</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-primary/5 text-primary-foreground/70 border-none label-brand px-2">Hub 3.1</Badge>
                                <span className="label-brand text-muted-foreground opacity-60">— Gestão do Portfólio Industrial</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Pesquisar por nome ou código..."
                            className="h-14 pl-12 rounded-2xl smooth-glass border-none ring-offset-background placeholder:text-muted-foreground/40 body-brand focus-visible:ring-primary/40 shadow-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <button
                        onClick={() => navigate('/products/new')}
                        className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground label-brand shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3"
                    >
                        <Plus className="h-5 w-5 stroke-[4]" />
                        Novo Produto
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="rounded-[2.5rem] border-none smooth-glass overflow-hidden group">
                    <CardContent className="p-8 flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                            <CheckCircle2 className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="label-brand text-muted-foreground">Portfólio Ativo</p>
                            <p className="stat-brand text-4xl mt-1">{data?.total || 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2.5rem] border-none smooth-glass overflow-hidden group">
                    <CardContent className="p-8 flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                            <BarChart3 className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="label-brand text-muted-foreground">Novos Registros</p>
                            <p className="stat-brand text-4xl mt-1">+12%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2.5rem] border-none smooth-glass overflow-hidden group">
                    <CardContent className="p-8 flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
                            <LayoutGrid className="h-8 w-8" />
                        </div>
                        <div>
                            <p className="label-brand text-muted-foreground">Volume de Categorias</p>
                            <p className="stat-brand text-4xl mt-1">08</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="manufactured" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <TabsList className="smooth-glass border border-white/5 p-1.5 rounded-2xl h-16 w-full md:w-[450px]">
                        <TabsTrigger
                            value="manufactured"
                            className="rounded-xl flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all label-brand text-sm gap-3"
                        >
                            <Package className="h-4 w-4" /> Fabricação Própria
                        </TabsTrigger>
                        <TabsTrigger
                            value="resale"
                            className="rounded-xl flex-1 h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-2xl transition-all label-brand text-sm gap-3"
                        >
                            <Truck className="h-4 w-4" /> Revenda / Outros
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex items-center gap-3">
                        <div className="label-brand text-muted-foreground mr-2 border-r border-white/10 pr-4">Visões Disponíveis</div>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 text-primary">
                            <LayoutGrid className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10">
                            <Filter className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <TabsContent value="manufactured" className="outline-none focus-visible:ring-0">
                    <Card className="rounded-[3.5rem] border-none smooth-glass shadow-2xl overflow-hidden min-h-[500px]">
                        <ProductTable products={manufacturedProducts} />
                    </Card>
                </TabsContent>

                <TabsContent value="resale" className="outline-none focus-visible:ring-0">
                    <Card className="rounded-[3.5rem] border-none smooth-glass shadow-2xl overflow-hidden min-h-[500px]">
                        <ProductTable products={resaleProducts} />
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}



