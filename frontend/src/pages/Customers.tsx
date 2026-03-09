import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Trash2,
    Mail,
    Phone,
    Edit2,
    Power,
    Users,
    CreditCard,
    Search,
    UserCheck,
    Activity,
    UserPlus
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CustomerForm } from '@/components/forms/CustomerForm';

interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    tax_id: string | null;
    address: string | null;
    active: boolean;
}

interface PaginatedResponse {
    total: number;
    page: number;
    page_size: number;
    items: Customer[];
}

export default function Customers() {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const { data, isLoading, error } = useQuery<PaginatedResponse>({
        queryKey: ['customers'],
        queryFn: async () => {
            const { data } = await api.get('/customers');
            return data;
        },
    });

    const toggleMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/customers/${id}/toggle-active`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({
                title: "Status atualizado",
                description: "O status do cliente foi alterado com sucesso.",
            });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/customers/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast({
                title: "Cliente excluído",
                description: "O registro foi removido permanentemente do sistema.",
            });
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Erro ao excluir",
                description: "Não foi possível remover o cliente.",
            });
        }
    });

    const handleEdit = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingCustomer(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("ATENÇÃO: Deseja realmente EXCLUIR este cliente permanentemente? Esta ação não pode ser desfeita.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggle = (id: string) => {
        toggleMutation.mutate(id);
    };

    if (isLoading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4 animate-pulse">
            <div className="relative">
                <Users className="h-12 w-12 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-20 bg-primary rounded-full scale-150" />
            </div>
            <p className="label-brand text-muted-foreground italic">Sincronizando Leads...</p>
        </div>
    );

    if (error) return (
        <div className="max-w-2xl mx-auto p-12 text-center space-y-8 smooth-glass rounded-[3rem] border-destructive/20 mt-10">
            <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-destructive/20">
                <Users className="h-10 w-10" />
            </div>
            <div className="space-y-2">
                <h3 className="h2-brand underline decoration-destructive/40 underline-offset-8">Falha de Comunicação</h3>
                <p className="body-brand text-muted-foreground font-medium">Não foi possível carregar a base de clientes. Tente novamente.</p>
            </div>
            <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['customers'] })}
                className="h-14 px-8 rounded-2xl border-white/10 hover:bg-white/10 label-brand"
            >
                Tentar Reconectar
            </Button>
        </div>
    );

    const filteredItems = data?.items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tax_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-inner">
                            <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="h1-brand text-3xl leading-none">CRM</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="bg-primary/5 text-primary-foreground/70 border-none label-brand px-2">Hub 3.1</Badge>
                                <span className="body-brand text-muted-foreground opacity-50 font-bold">— Gestão de Relacionamento e Clientes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar por nome, email ou CPF/CNPJ..."
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
                                Novo Cliente
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none smooth-glass shadow-2xl p-0 overflow-hidden outline-none">
                            <DialogHeader className="p-6 bg-primary/10 border-b border-primary/5">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-2xl">
                                        <UserPlus className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <DialogTitle className="h2-brand text-xl">
                                            {editingCustomer ? 'Perfil do Cliente' : 'Novo Registro'}
                                        </DialogTitle>
                                        <DialogDescription className="label-brand text-[10px]">
                                            {editingCustomer ? 'Camada de edição de dados sensíveis' : 'Iniciando novo ciclo de relacionamento'}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="p-10">
                                <CustomerForm
                                    customer={editingCustomer}
                                    onSuccess={() => setIsDialogOpen(false)}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="rounded-[2.5rem] border-none smooth-glass overflow-hidden group">
                    <CardContent className="p-5 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center transition-transform group-hover:scale-110">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="label-brand text-muted-foreground text-[10px]">Base Total</p>
                            <p className="stat-brand mt-0.5 leading-none text-xl">{data?.total || 0}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2.5rem] border-none smooth-glass overflow-hidden group">
                    <CardContent className="p-5 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center transition-transform group-hover:scale-110">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="label-brand text-muted-foreground text-[10px]">Taxa Ativa</p>
                            <p className="stat-brand mt-0.5 leading-none text-xl">94%</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2.5rem] border-none smooth-glass overflow-hidden group">
                    <CardContent className="p-5 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center transition-transform group-hover:scale-110">
                            <UserPlus className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="label-brand text-muted-foreground text-[10px]">Novos/Mês</p>
                            <p className="stat-brand mt-0.5 leading-none text-xl">+18</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="rounded-[2.5rem] border-none smooth-glass overflow-hidden group">
                    <CardContent className="p-5 flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center transition-transform group-hover:scale-110">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="label-brand text-muted-foreground text-[10px]">Pessoas Jurídicas</p>
                            <p className="stat-brand mt-0.5 leading-none text-xl">24</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card className="rounded-[3.5rem] border-none smooth-glass shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="overflow-x-auto scrollbar-hide">
                    <Table>
                        <TableHeader className="bg-primary/[0.02]">
                            <TableRow className="border-b border-white/5 hover:bg-transparent">
                                <TableHead className="py-3 px-10 label-brand text-primary/70">Identificação & Perfil</TableHead>
                                <TableHead className="label-brand text-primary/70">Canais de Contato</TableHead>
                                <TableHead className="label-brand text-primary/70">Documentação</TableHead>
                                <TableHead className="label-brand text-primary/70">Status</TableHead>
                                <TableHead className="w-[120px] text-right px-10 label-brand text-primary/70">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.map((item) => (
                                <TableRow key={item.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5 active:bg-white/10">
                                    <TableCell className="py-3 px-10">
                                        <div className="flex items-center gap-6">
                                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary text-xl stat-brand group-hover:scale-110 transition-transform shadow-inner">
                                                {item.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div
                                                    className="h3-brand text-white/90 truncate max-w-sm group-hover:text-primary transition-colors cursor-pointer text-lg"
                                                    onClick={() => handleEdit(item)}
                                                >
                                                    {item.name}
                                                </div>
                                                <div className="label-brand text-[9px] text-muted-foreground/40 italic flex items-center gap-2">
                                                    <div className="h-1 w-1 rounded-full bg-primary/40" />
                                                    Cliente desde {new Date().getFullYear()}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-2">
                                            {item.email ? (
                                                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] font-bold text-muted-foreground/70">
                                                    <Mail className="h-3 w-3 text-primary/50" />
                                                    {item.email}
                                                </div>
                                            ) : (
                                                <span className="label-brand text-muted-foreground/20 italic">Email N/A</span>
                                            )}
                                            {item.phone && (
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 italic ml-1">
                                                    <Phone className="h-3 w-3" />
                                                    {item.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="inline-flex items-center px-2 py-1 rounded-lg bg-white/5 border border-white/5 label-brand font-mono">
                                            {item.tax_id || 'NÃO REGISTRADO'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <button
                                            onClick={() => handleToggle(item.id)}
                                            className={`w-28 px-3 py-1.5 rounded-full label-brand transition-all ${item.active
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20'
                                                }`}
                                        >
                                            {item.active ? 'Ativo' : 'Retido'}
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
                            {!filteredItems.length && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-6 animate-in zoom-in duration-700">
                                            <div className="h-24 w-24 rounded-[2rem] bg-white/5 flex items-center justify-center border-2 border-dashed border-white/10">
                                                <Users className="h-12 w-12 opacity-20" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="h3-brand">Nenhum Registro Localizado</p>
                                                <p className="body-brand opacity-50 italic">Sua busca não retornou Leads.</p>
                                            </div>
                                            <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/10" onClick={handleAddNew}>Adicionar Cliente</Button>
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



