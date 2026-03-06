import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Power } from 'lucide-react';
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

    const handleEdit = (item: RawMaterial) => {
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
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

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando matérias-primas...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Erro ao carregar matérias-primas.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Matérias-Primas</h2>
                    <p className="text-muted-foreground">
                        Gestão de tecidos, botões, elásticos, etc.
                    </p>
                </div>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleAddNew}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Matéria-Prima
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Editar Matéria-Prima' : 'Nova Matéria-Prima'}</DialogTitle>
                            <DialogDescription>
                                {editingItem
                                    ? 'Atualize os detalhes da matéria-prima selecionada.'
                                    : 'Preencha os detalhes para adicionar um novo item ao estoque.'}
                            </DialogDescription>
                        </DialogHeader>
                        <RawMaterialForm
                            rawMaterial={editingItem}
                            onSuccess={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todas as Matérias-Primas ({data?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Código</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Fornecedor</TableHead>
                                    <TableHead>Unidade</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-mono text-xs">{item.internal_code || '---'}</TableCell>
                                        <TableCell className="font-medium">{item.description}</TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{item.category}</div>
                                            <div className="text-xs text-muted-foreground">{item.subcategory || '-'}</div>
                                        </TableCell>
                                        <TableCell>{item.supplier?.name || '-'}</TableCell>
                                        <TableCell>{item.unit}</TableCell>
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
                                                    title={item.active ? "Desativar Item" : "Ativar Item"}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(item)}
                                                    className="hover:bg-primary/10 hover:text-primary"
                                                    title="Editar Matéria-Prima"
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
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            Nenhuma matéria-prima encontrada.
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
