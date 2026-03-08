import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/lib/api';

export default function Costs() {
    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/products');
            return res.data;
        },
    });

    const { data: fixedCosts = [] } = useQuery({
        queryKey: ['fixed-costs'],
        queryFn: async () => {
            const res = await api.get('/fixed-costs');
            return res.data;
        },
    });

    const totalFixed = fixedCosts.reduce((acc: number, curr: any) => acc + curr.value, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Custo de Produtos</h1>
                <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="py-3">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Gastos Fixos</p>
                        <p className="text-2xl font-bold text-primary">R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="manufactured">
                <TabsList>
                    <TabsTrigger value="manufactured">Produção Própria</TabsTrigger>
                    <TabsTrigger value="resale">Revenda</TabsTrigger>
                </TabsList>

                <TabsContent value="manufactured">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cálculo de Custos (Matéria-Prima)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead>Atributos</TableHead>
                                        <TableHead className="text-right">Custo Insumos</TableHead>
                                        <TableHead className="text-right">Custo + Gastos Fixos</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.filter((p: any) => p.is_manufactured).map((product: any) => (
                                        product.variants.map((variant: any) => {
                                            const bomCost = (variant.materials || []).reduce((acc: number, m: any) => {
                                                const unitPrice = m.raw_material?.last_unit_price || 0;
                                                return acc + (m.quantity * unitPrice);
                                            }, 0);

                                            // Fixed cost distribution (placeholder for avg production)
                                            const avgMonthlyProduction = 1000;
                                            const fixedShare = totalFixed / avgMonthlyProduction;
                                            const totalCost = bomCost + fixedShare;

                                            return (
                                                <TableRow key={variant.id}>
                                                    <TableCell className="font-medium">{product.name}</TableCell>
                                                    <TableCell>{variant.sku}</TableCell>
                                                    <TableCell>
                                                        {Object.entries(variant.attributes || {}).map(([key, value]) => `${key}: ${value}`).join(', ')}
                                                    </TableCell>
                                                    <TableCell className="text-right">R$ {bomCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell className="text-right font-bold">R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="resale">
                    <Card>
                        <CardHeader>
                            <CardTitle>Custos de Revenda</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Produto</TableHead>
                                        <TableHead>SKU</TableHead>
                                        <TableHead className="text-right">Último Custo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.filter((p: any) => !p.is_manufactured).map((product: any) => (
                                        product.variants.map((variant: any) => (
                                            <TableRow key={variant.id}>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell>{variant.sku}</TableCell>
                                                <TableCell className="text-right font-bold">R$ {(variant.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                                            </TableRow>
                                        ))
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
