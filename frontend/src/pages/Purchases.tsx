import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import api from '@/lib/api';
import PurchaseDialog from '@/components/PurchaseDialog';

export default function Purchases() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [purchaseType, setPurchaseType] = useState<'raw_material' | 'resale_product'>('raw_material');

    const openDialog = (type: 'raw_material' | 'resale_product') => {
        setPurchaseType(type);
        setDialogOpen(true);
    };
    const { data: purchases = [] } = useQuery({
        queryKey: ['purchases'],
        queryFn: async () => {
            const res = await api.get('/purchases');
            return res.data;
        },
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Registro de Compras</h1>
                <div className="flex gap-2">
                    <Button onClick={() => openDialog('raw_material')} variant="outline">
                        <Plus className="mr-2 h-4 w-4" /> Comprar Insumo
                    </Button>
                    <Button onClick={() => openDialog('resale_product')}>
                        <Plus className="mr-2 h-4 w-4" /> Comprar Revenda
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="raw_material">
                <TabsList>
                    <TabsTrigger value="raw_material">Matéria-Prima</TabsTrigger>
                    <TabsTrigger value="resale">Peças p/ Revenda</TabsTrigger>
                </TabsList>

                <TabsContent value="raw_material">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compras de Insumos</CardTitle>
                            <CardDescription>Histórico de entradas de tecidos, aviamentos, etc.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Fornecedor</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.filter((p: any) => p.type === 'raw_material').map((purchase: any) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>{new Date(purchase.purchase_date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{purchase.supplier?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-medium">R$ {Number(purchase.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Ver Detalhes</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {purchases.filter((p: any) => p.type === 'raw_material').length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma compra registrada</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resale">
                    <Card>
                        <CardHeader>
                            <CardTitle>Compras de Revenda</CardTitle>
                            <CardDescription>Produtos prontos adquiridos de fornecedores externos.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Fornecedor</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchases.filter((p: any) => p.type === 'resale_product').map((purchase: any) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>{new Date(purchase.purchase_date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell>{purchase.supplier?.name || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-medium">R$ {purchase.total_value.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">Ver Detalhes</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {purchases.filter((p: any) => p.type === 'resale_product').length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma compra registrada</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <PurchaseDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                type={purchaseType}
            />
        </div>
    );
}
