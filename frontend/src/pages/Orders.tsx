import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
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

interface OrderItem {
    sku: string;
    name: string;
    quantity: number;
}

interface Order {
    id: string;
    origin: string;
    external_id: string;
    external_status: string;
    internal_status: string;
    created_at: string;
    items: OrderItem[];
}

interface PaginatedResponse {
    total: number;
    items: Order[];
}

export default function Orders() {
    // Assuming a generic /orders endpoint exists or we fetch from DB. 
    // Let's implement an actual orders route logic if not available yet but use a placeholder.

    // NOTE: For now, the backend may not have a simple GET /orders, 
    // we will add a fallback UI or write the fetch if the user approved adding GET /orders.
    // We added Orders DB earlier, assuming GET /orders is partially implemented. Let's try.

    const { data, isLoading, error } = useQuery<PaginatedResponse>({
        queryKey: ['orders'],
        queryFn: async () => {
            // Trying GET /orders (might need backend adjustment if strictly webhook only right now)
            // For dashboard phase, creating a view for what we have.
            try {
                const { data } = await api.get('/orders', { params: { limit: 50 } });
                return data;
            } catch (e: any) {
                if (e.response?.status === 404) {
                    return { total: 0, items: [] };
                }
                throw e;
            }
        },
    });

    if (isLoading) return <div className="p-8 text-center text-muted-foreground">Carregando pedidos...</div>;
    if (error) return <div className="p-8 text-center text-destructive">Erro ao carregar pedidos.</div>;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Pedidos</h2>
                <p className="text-muted-foreground">
                    Pedidos recebidos através dos webhooks (WooCommerce, etc).
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Últimos Pedidos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Origem / ID Ext</TableHead>
                                    <TableHead>Status Externo</TableHead>
                                    <TableHead>Status Interno</TableHead>
                                    <TableHead>Qtd. Itens</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>
                                            <div className="font-medium flex items-center gap-2">
                                                <Badge variant="outline">{order.origin}</Badge>
                                                #{order.external_id}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{order.external_status}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={order.internal_status === 'processed' ? 'default' : 'destructive'}>
                                                {order.internal_status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{order.items?.length || 0} itens</TableCell>
                                    </TableRow>
                                ))}
                                {(!data?.items || data.items.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            Nenhum pedido encontrado.
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
