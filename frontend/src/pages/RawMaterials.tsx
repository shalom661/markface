import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Trash2,
    Edit2,
    Power,
    Scissors,
    Package,
    Search,
    Filter,
    Check,
    AlertCircle,
    Boxes,
    Layers,
    SquareStack,
    History
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RawMaterialForm } from '@/components/forms/RawMaterialForm';
import { Input } from '@/components/ui/input';

interface RawMaterial {
    id: string;
    description: string;
    internal_code: string | null;
    category: string;
    subcategory: string | null;
    unit: string;
    active: boolean;
    supplier: {
        id: string;
        name: string;
    } | null;
}

interface PaginatedResponse {
    total: number;
    page: number;
    page_size: number;
    items: RawMaterial[];
}

export default function RawMaterials() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error } = useQuery<PaginatedResponse>({
        queryKey: ['raw-materials'],
        queryFn: async () => {
            const { data } = await api.get('/raw-materials');
            return data;
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/raw-materials/${id}/toggle-active`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
            toast({
                title: "Status atualizado",
                description: "O status do item foi alterado com sucesso.",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/raw-materials/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
            toast({
                title: "Excluído",
                description: "A matéria-prima foi removida permanentemente do sistema.",
            });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível remover o item. Verifique se existem vínculos.",
            });
        }
    });

    // v1.1.5 - Prefetch Support Data to prevent empty dropdowns
    const prefetchData = async () => {
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: ['suppliers'],
                queryFn: async () => (await api.get('/suppliers')).data
            }),
            queryClient.prefetchQuery({
                queryKey: ['categories'],
                queryFn: async () => (await api.get('/categories')).data
            }),
            queryClient.prefetchQuery({
                queryKey: ['units'],
                queryFn: async () => (await api.get('/units?active_only=true')).data
            })
        ]);
    };

    const handleAddNew = () => {
        prefetchData();
        setEditingItem(null);
        setIsDialogOpen(true);
    };

    const handleEdit = (item: RawMaterial) => {
        prefetchData();
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("ATENÇÃO: Deseja realmente EXCLUIR este item permanentemente? Esta ação não pode ser desfeita.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggle = (id: string) => {
        toggleMutation.mutate(id);
    };

    if (isLoading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="relative">
                <Scissors className="h-12 w-12 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full scale-150" />
            </div>
            <p className="label-brand italic opacity-50">Sincronizando Inventário...</p>
        </div>
    );

    if (error) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center space-y-8 glass rounded-[3rem] border-destructive/20 mt-10">
                <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-destructive/20">
                    <AlertCircle className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                    <h3 className="h2-brand text-3xl italic">Falha de Protocolo</h3>
                    <p className="body-brand text-muted-foreground opacity-60">Não foi possível estabelecer conexão com o catálogo de suprimentos.</p>
                </div>
                <div className="text-xs text-muted-foreground/60 bg-black/40 p-6 rounded-2xl font-mono border border-white/5 text-left overflow-auto max-h-40 scrollbar-hide">
                    {error instanceof Error ? error.message : JSON.stringify(error)}
                    {error && typeof error === 'object' && 'response' in error && (error as any).response?.data?.detail && (
                        <div className="mt-2 text-destructive font-bold">
                            SERVERLOG: {JSON.stringify((error as any).response.data.detail)}
                        </div>
                    )}
                </div>
                <Button
                    variant="outline"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['raw-materials'] })}
                    className="h-14 px-8 rounded-2xl border-white/10 hover:bg-white/10 label-brand"
                >
                    Reiniciar Protocolo de Busca
                </Button>
            </div>
        );
    }

    const filteredItems = data?.items.filter(item =>
        (item.description?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.internal_code?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.category?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                            <Scissors className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="h1-brand text-3xl">Suprimentos</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-primary/5 text-primary-foreground/70 border-none label-brand px-2">v2.4.0</Badge>
                                <span className="body-brand text-muted-foreground text-sm opacity-60 italic">— Gestão Inteligente de Matérias-Primas</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar no inventário..."
                            className="h-11 pl-12 rounded-2xl smooth-glass border-none ring-offset-background placeholder:text-muted-foreground/40 body-brand focus-visible:ring-primary/40 shadow-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <button
                                onClick={handleAddNew}
                                className="h-11 px-8 rounded-2xl bg-primary text-primary-foreground label-brand shadow-2xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3"
                            >
                                <Plus className="h-5 w-5 stroke-[4]" />
                                Novo Insumo
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh] rounded-[3rem] glass border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] p-0">
                            <div className="p-8 space-y-6">
                                <DialogHeader>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                            {editingItem ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <DialogTitle className="h2-brand text-2xl italic">{editingItem ? 'Protocolo de Edição' : 'Novo Registro'}</DialogTitle>
                                            <DialogDescription className="body-brand text-muted-foreground/70 italic text-[10px]">
                                                {editingItem ? 'Configurando parâmetros de suprimento existente.' : 'Provisionando novo recurso para a cadeia produtiva.'}
                                            </DialogDescription>
                                        </div>
                                    </div>
                                </DialogHeader>
                                <RawMaterialForm
                                    rawMaterial={editingItem}
                                    onSuccess={() => setIsDialogOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Portfólio', value: data?.total || 0, icon: Boxes, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                    { label: 'Fluxos', value: [...new Set(data?.items.map(i => i.category))].length, icon: Layers, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                    { label: 'Monitoramento', value: data?.items.filter(i => i.active).length || 0, icon: Check, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                    { label: 'Real-Time', value: 'LIVE', icon: History, color: 'text-pink-400', bg: 'bg-pink-400/10' },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-3xl border-none smooth-glass hover:bg-white/[0.07] transition-all group overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-5">
                            <div className={`h-11 w-11 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-white transition-colors">{stat.label}</p>
                                <p className="stat-brand mt-0.5 leading-none text-xl">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <Card className="rounded-[3rem] border-none smooth-glass shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                <CardHeader className="border-b border-white/5 bg-white/[0.02] p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <CardTitle className="h2-brand text-xl flex items-center gap-3 italic">
                                Catálogo de Insumos
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-lg label-brand px-2">{filteredItems.length} Registros</Badge>
                            </CardTitle>
                            <p className="label-brand text-muted-foreground opacity-60 italic leading-relaxed text-[10px]">Listagem detalhada de matérias-primas e componentes de montagem.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" className="h-10 w-10 border border-white/5 rounded-xl hover:bg-white/5">
                                <Filter className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 border border-white/5 rounded-xl hover:bg-white/5">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <div className="overflow-x-auto scrollbar-hide">
                        <Table>
                            <TableHeader className="bg-primary/[0.02]">
                                <TableRow className="border-b border-white/5 hover:bg-transparent">
                                    <TableHead className="py-3 px-10 label-brand text-primary/70">Identificação & Código</TableHead>
                                    <TableHead className="label-brand text-primary/70">Especificações</TableHead>
                                    <TableHead className="label-brand text-primary/70">Parceiro Estratégico</TableHead>
                                    <TableHead className="label-brand text-primary/70 text-center">Unid.</TableHead>
                                    <TableHead className="label-brand text-primary/70 text-center">Inat. / Ativ.</TableHead>
                                    <TableHead className="w-[120px] text-right px-10 label-brand text-primary/70">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredItems.map((item) => (
                                    <TableRow key={item.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5 active:bg-white/10">
                                        <TableCell className="py-3 px-10">
                                            <div className="flex flex-col gap-1">
                                                <div className="h3-brand text-lg text-white/90 truncate max-w-xs group-hover:text-primary transition-colors italic uppercase leading-none">{item.description}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="label-brand text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded border border-white/5 font-mono text-[9px]">{item.internal_code || 'N/A'}</span>
                                                    <span className="label-brand tracking-tighter text-muted-foreground/40 italic text-[9px]">System ID: {item.id.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <SquareStack className="h-3 w-3 text-primary/50" />
                                                    <span className="label-brand text-indigo-100">{item.category}</span>
                                                </div>
                                                <span className="label-brand text-muted-foreground/60 italic ml-5 truncate max-w-[150px]">{item.subcategory || 'Padrão'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary label-brand shadow-inner text-xs">
                                                    {(item.supplier?.name || 'S')[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="h3-brand text-xs text-white/80">{item.supplier?.name || 'Venda Local'}</span>
                                                    <span className="label-brand text-muted-foreground/40 italic text-[9px]">Fornecedor</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white label-brand shadow-xl">
                                                {item.unit}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <button
                                                onClick={() => handleToggle(item.id)}
                                                className={`mx-auto w-24 px-3 py-1.5 rounded-full label-brand transition-all ${item.active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'
                                                    }`}
                                            >
                                                {item.active ? 'Monitorado' : 'Offline'}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right px-10">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} className="h-8 w-8 rounded-lg hover:bg-primary/20 hover:text-primary">
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleToggle(item.id)} className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500">
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
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
                        <div className="h-[400px] flex flex-col items-center justify-center space-y-8 animate-in zoom-in duration-700">
                            <div className="relative">
                                <div className="h-32 w-32 rounded-[2.5rem] bg-indigo-500/5 flex items-center justify-center border-2 border-dashed border-indigo-500/20 group">
                                    <Package className="h-16 w-16 text-indigo-500/20 group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-xl">
                                    <Search className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="h2-brand text-2xl italic">Vazio Industrial</p>
                                <p className="body-brand text-muted-foreground opacity-60 text-sm">Nenhum registro encontrado para "{searchQuery}"</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); handleAddNew(); }}
                                className="h-14 px-10 rounded-2xl border-indigo-500/20 hover:bg-indigo-500/10 text-indigo-100 font-black uppercase tracking-widest text-xs"
                            >
                                Iniciar Novo Protocolo
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}


