import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Phone, Mail, User as UserIcon, Trash2, Power } from 'lucide-react';
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

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando fornecedores...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Erro ao carregar fornecedores.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
                    <p className="text-muted-foreground">
                        Gerencie a lista de fornecedores de matéria-prima.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Fornecedor
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>{editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}</DialogTitle>
                            <DialogDescription>
                                {editingSupplier
                                    ? 'Atualize os dados de contato do fornecedor selecionado.'
                                    : 'Preencha os dados abaixo para cadastrar um novo fornecedor.'}
                            </DialogDescription>
                        </DialogHeader>
                        <SupplierForm
                            supplier={editingSupplier}
                            onSuccess={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Fornecedores ({data?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fornecedor</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Cadastrado Em</TableHead>
                                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items.map((supplier) => (
                                    <TableRow key={supplier.id} className="group">
                                        <TableCell>
                                            <div className="font-medium group-hover:text-primary transition-colors">
                                                {supplier.name}
                                            </div>
                                            {supplier.phone && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                    <Phone className="h-3 w-3" /> {supplier.phone}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div className="flex items-center gap-1.5">
                                                    <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {supplier.contact_name || 'Não informado'}
                                                </div>
                                                {supplier.email && (
                                                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                                                        <Mail className="h-3 w-3" /> {supplier.email}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {supplier.active ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    Ativo
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(supplier.created_at), 'dd/MM/yyyy')}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(supplier.id)}
                                                    className={supplier.active ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600" : "text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"}
                                                    title={supplier.active ? "Desativar Fornecedor" : "Ativar Fornecedor"}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(supplier)}
                                                    className="hover:bg-primary/10 hover:text-primary"
                                                    title="Editar Fornecedor"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    title="Excluir Permanentemente"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!data?.items.length && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            Nenhum fornecedor encontrado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
