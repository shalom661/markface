import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ProductForm } from '@/components/forms/ProductForm';

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
    brand: string | null;
    description: string | null;
    active: boolean;
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsDialogOpen(true);
    };

    const handleAddNew = () => {
        setEditingProduct(null);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("ATENÇÃO: Deseja realmente EXCLUIR este produto permanentemente? Esta ação não pode ser desfeita.")) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggle = (id: string) => {
        toggleMutation.mutate(id);
    };

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando produtos...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Erro ao carregar produtos.</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Produtos & Variantes</h2>
                    <p className="text-muted-foreground">
                        Catálogo principal de produtos acabados da marca.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button onClick={() => navigate('/products/new')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Produto
                    </Button>
                </div>

                {/* Keep dialog just for editing existing products */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Editar Produto</DialogTitle>
                            <DialogDescription>
                                Atualize os dados básicos do produto selecionado.
                            </DialogDescription>
                        </DialogHeader>
                        <ProductForm
                            product={editingProduct}
                            onSuccess={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos os Produtos ({data?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produto</TableHead>
                                    <TableHead>Marca</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>SKUs / Variantes</TableHead>
                                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <div className="cursor-pointer hover:underline">{product.name}</div>
                                            <div className="text-xs text-muted-foreground line-clamp-1">{product.description}</div>
                                        </TableCell>
                                        <TableCell>{product.brand || '-'}</TableCell>
                                        <TableCell>
                                            {product.active ? (
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                                    Ativo
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Inativo</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {product.variants.map(v => (
                                                    <Badge key={v.id} variant="secondary" className="font-mono text-[10px]">
                                                        {v.sku}
                                                    </Badge>
                                                ))}
                                                {product.variants.length === 0 && (
                                                    <span className="text-xs text-muted-foreground">Sem variantes</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleToggle(product.id)}
                                                    className={product.active ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600" : "text-amber-600 hover:bg-amber-500/10 hover:text-amber-600"}
                                                    title={product.active ? "Desativar Produto" : "Ativar Produto"}
                                                >
                                                    <Power className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(product)}
                                                    className="hover:bg-primary/10 hover:text-primary"
                                                    title="Editar Produto"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(product.id)}
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
                                            Nenhum produto cadastrado.
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
