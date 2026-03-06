import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Mail, Phone, User as UserIcon, Edit2, Power } from 'lucide-react';
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

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando clientes...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Erro ao carregar clientes.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
                    <p className="text-muted-foreground">
                        Gestão da base de clientes do MarkFace Hub.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Cliente
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
                            <DialogDescription>
                                {editingCustomer
                                    ? 'Atualize os dados do cliente selecionado.'
                                    : 'Adicione um novo cliente à base de dados.'}
                            </DialogDescription>
                        </DialogHeader>
                        <CustomerForm
                            customer={editingCustomer}
                            onSuccess={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Clientes ({data?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>CPF/CNPJ</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                                {item.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 text-xs">
                                                {item.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {item.email}
                                                    </div>
                                                )}
                                                {item.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {item.phone}
                                                    </div>
                                                )}
                                                {!item.email && !item.phone && '---'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">{item.tax_id || '---'}</TableCell>
                                        <TableCell>
                                            {item.active ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    Ativo
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(item.id)}
                                                    className={item.active ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600" : "text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"}
                                                    title={item.active ? "Desativar Cliente" : "Ativar Cliente"}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(item)}
                                                    className="hover:bg-primary/10 hover:text-primary"
                                                    title="Editar Cliente"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(item.id)}
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
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            Nenhum cliente encontrado.
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
