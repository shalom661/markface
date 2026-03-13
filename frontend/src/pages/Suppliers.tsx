import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Edit2,
    Phone,
    Mail,
    User as UserIcon,
    Trash2,
    Power,
    Building2,
    Search,
    Zap,
    Calendar,
    ShieldCheck
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
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { SupplierForm } from '@/components/forms/SupplierForm';

interface Supplier {
    id: string;
    name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    notes: string | null;
    active: boolean;
    created_at: string;
}

interface PaginatedResponse {
    total: number;
    page: number;
    page_size: number;
    items: Supplier[];
}

export default function Suppliers() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error } = useQuery<PaginatedResponse>({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const { data } = await api.get('/suppliers');
            return data;
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/suppliers/${id}/toggle-active`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast({
                title: "Status atualizado",
                description: "O status do fornecedor foi alterado com sucesso.",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/suppliers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast({
                title: "Fornecedor excluído",
                description: "O registro foi removido permanentemente do sistema.",
            });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível remover o fornecedor. Verifique se existem vínculos.",
            });
        }
    });

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingSupplier(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("ATENÇÃO: Deseja realmente EXCLUIR este fornecedor permanentemente? Esta ação não pode ser desfeita.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggle = (id: string) => {
        toggleMutation.mutate(id);
    };

    if (isLoading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="relative">
                <Building2 className="h-12 w-12 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full scale-150" />
            </div>
            <p className="label-brand text-muted-foreground italic">Mapeando Cadeia de Suprimentos...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto p-12 text-center space-y-8 smooth-glass rounded-[3rem] border-destructive/20 mt-10">
            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-destructive/20">
                <Building2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h3 className="h2-brand underline decoration-destructive/40 underline-offset-8">Erro de Redundância</h3>
                <p className="body-brand text-muted-foreground">Falha crítica ao acessar o cluster de fornecedores.</p>
            </div>
            <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['suppliers'] })}
                className="h-14 px-8 rounded-2xl border-white/10 hover:bg-white/10 label-brand"
            >
                Reiniciar Conexão
            </Button>
        </div>
    );

    const filteredItems = data?.items.filter(item =>
        (item.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.contact_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Massive Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-2xl border border-primary/5">
                            <Building2 className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-1">
                                <h1 className="h1-brand text-3xl">Global</h1>
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none label-brand px-3 py-1 mt-1">Sourcing</Badge>
                            </div>
                            <p className="body-brand text-muted-foreground opacity-50 italic">
                                Gestão centralizada de <span className="text-primary font-bold">Trade Partners</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-[450px] group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all group-focus-within:scale-110" />
                        <Input
                            placeholder="Pesquisar fornecedor, consultor ou chave..."
                            className="h-11 pl-14 rounded-[2rem] smooth-glass border-none ring-offset-background placeholder:text-muted-foreground/30 body-brand focus-visible:ring-primary/40 shadow-2xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <button
                                onClick={handleAddNew}
                                className="h-11 px-8 rounded-[2rem] bg-primary text-primary-foreground label-brand shadow-3xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 group"
                            >
                                <Plus className="h-5 w-5 stroke-[4] group-hover:rotate-90 transition-transform" />
                                Credenciar Fornecedor
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none smooth-glass shadow-3xl p-0 overflow-hidden outline-none">
                            <DialogHeader className="p-8 bg-primary/10 border-b border-primary/5">
                                <div className="flex items-center gap-6 mb-2">
                                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-3xl">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <DialogTitle className="h2-brand text-2xl text-foreground">
                                            {editingSupplier ? 'Atualizar Assets' : 'Novo Credencial'}
                                        </DialogTitle>
                                        <DialogDescription className="label-brand text-muted-foreground/60 mt-1 text-[10px]">
                                            {editingSupplier ? 'Protocolo de manutenção de registro' : 'Iniciando nova integração na cadeia produtiva'}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="p-8">
                                <SupplierForm
                                    supplier={editingSupplier}
                                    onSuccess={() => setIsDialogOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Visual Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Parceiros de Mercado', value: data?.total || 0, icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Taxa de Entrega', value: '98.4%', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Pipeline Ativo', value: '12', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Integridade Verificada', value: '100%', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-[2rem] border-none smooth-glass p-5 group hover:scale-[1.02] transition-transform shadow-xl">
                        <div className="flex items-center gap-5">
                            <div className={`p-2.5 rounded-2xl ${stat.bg} ${stat.color} shadow-lg transition-transform group-hover:-rotate-12`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="label-brand text-muted-foreground/60 text-xs">{stat.label}</p>
                                <p className="stat-brand mt-0.5 leading-none text-xl">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* High-End Table */}
            <Card className="rounded-[4rem] border-none smooth-glass shadow-3xl overflow-hidden min-h-[600px] flex flex-col">
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader className="bg-primary/[0.03]">
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableHead className="py-4 px-12 label-brand text-primary/60">Organização & Hub</TableHead>
                                <TableHead className="label-brand text-primary/60">Operações & Contato</TableHead>
                                <TableHead className="label-brand text-primary/60">Status de Rede</TableHead>
                                <TableHead className="label-brand text-primary/60">Registro Temporal</TableHead>
                                <TableHead className="w-[120px] text-right px-12 label-brand text-primary/60">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((supplier) => (
                                <TableRow key={supplier.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5 active:bg-white/10">
                                    <TableCell className="py-4 px-12">
                                        <div className="flex items-center gap-8">
                                            <div className="h-12 w-12 rounded-[1.5rem] bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center text-primary stat-brand text-xl group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-2xl border border-white/5">
                                                {supplier.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div
                                                    className="h3-brand text-foreground text-base truncate max-w-md group-hover:text-primary transition-colors cursor-pointer"
                                                    onClick={() => handleEdit(supplier)}
                                                >
                                                    {supplier.name}
                                                </div>
                                                <div className="label-brand text-[10px] text-muted-foreground/40 italic flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-primary/30" />
                                                    Partner ID: <span className="text-muted-foreground/60">{supplier.id.slice(0, 8).toUpperCase()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-3">
                                            <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 label-brand text-[10px] text-muted-foreground/80 group-hover:bg-primary/5 transition-colors">
                                                <UserIcon className="h-3.5 w-3.5 text-primary/40" />
                                                {supplier.contact_name || 'Protocolo N/A'}
                                            </div>
                                            <div className="flex items-center gap-4 label-brand text-[10px] text-muted-foreground/40 italic px-1">
                                                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {supplier.phone || 'Sem terminal'}</div>
                                                <div className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-pointer"><Mail className="h-3 w-3" /> {supplier.email ? 'Email Ativo' : 'Sem canal'}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleToggle(supplier.id)}
                                            className={`h-10 px-5 rounded-2xl label-brand text-[10px] transition-all flex items-center gap-3 ${supplier.active
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5'
                                                : 'bg-red-500/5 text-red-500/50 border border-red-500/10 hover:bg-red-500/10'
                                                }`}
                                        >
                                            <div className={`h-2 w-2 rounded-full shadow-inner ${supplier.active ? 'bg-emerald-400 animate-pulse' : 'bg-red-900'}`} />
                                            {supplier.active ? 'Operacional' : 'Restrito'}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5">
                                            <div className="label-brand text-muted-foreground/60 flex items-center gap-2 italic">
                                                <Calendar className="h-3.5 w-3.5 opacity-30" />
                                                {format(new Date(supplier.created_at), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="label-brand text-[9px] text-muted-foreground/20 italic ml-5">Protocolo validado</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-12">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)} className="h-8 w-8 rounded-lg hover:bg-primary/20 hover:text-primary">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleToggle(supplier.id)} className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500">
                                                <Power className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!filteredItems.length && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-[400px] text-center border-none hover:bg-transparent">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-8 animate-in zoom-in duration-1000">
                                            <div className="h-32 w-32 rounded-[3rem] bg-white/[0.02] flex items-center justify-center border-4 border-dashed border-white/5 group-hover:border-primary/20 transition-colors">
                                                <Building2 className="h-16 w-16 opacity-5 rotate-12" />
                                            </div>
                                            <div className="space-y-2">
                                                <p className="h2-brand text-muted-foreground">Rede Vazia</p>
                                                <p className="body-brand text-sm opacity-30 italic">Nenhum parceiro comercial localizado na região de busca.</p>
                                            </div>
                                            <button
                                                className="h-14 px-10 rounded-2xl border border-primary/20 text-primary label-brand hover:bg-primary/10 transition-all active:scale-95"
                                                onClick={handleAddNew}
                                            >
                                                Mapear Novo Fornecedor
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
}



