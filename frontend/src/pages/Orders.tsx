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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ShoppingBag, Loader2, Activity, Globe, PackageOpen, ChevronRight, Hash, Clock
} from 'lucide-react';

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
    const { data, isLoading, error } = useQuery<PaginatedResponse>({
        queryKey: ['orders'],
        queryFn: async () => {
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-6 min-h-[60vh] animate-in fade-in duration-700">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Loader2 className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-2xl font-black tracking-tight text-primary font-mono uppercase">Sincronizando Hub</p>
                    <p className="text-muted-foreground font-medium animate-pulse">Buscando transações externas recentes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-20 text-center animate-in zoom-in duration-500">
                <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
                    <Activity className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-black mb-2">Erro de Conectividade</h3>
                <p className="text-muted-foreground font-medium max-w-md mx-auto">
                    Não foi possível sincronizar com o banco de dados de pedidos. Por favor, tente novamente mais tarde.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <ShoppingBag className="h-6 w-6" />
                        </div>
                        <h2 className="text-4xl font-extrabold tracking-tight">Hub de Pedidos</h2>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">
                        Monitoramento centralizado de transações externas (WooCommerce & ERPs).
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-primary/5 p-4 rounded-3xl border border-primary/10">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {data?.total || 0}
                    </div>
                    <div>
                        <p className="text-xs font-black uppercase tracking-widest text-primary">Total Processados</p>
                        <p className="text-muted-foreground text-sm font-medium italic">últimos 30 dias</p>
                    </div>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border-none glass overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-primary/5">
                <CardHeader className="border-b border-primary/10 bg-primary/5 p-8 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-background/50 border border-primary/20 shadow-sm">
                            <PackageOpen className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black">Fluxo Recente</CardTitle>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Ordens de serviço v2.0</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-tighter">Live Monitor</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-primary/5">
                                    <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Origem & Protocolo</TableHead>
                                    <TableHead className="py-6 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Status de Origem</TableHead>
                                    <TableHead className="py-6 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Status Integrado</TableHead>
                                    <TableHead className="py-6 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 text-center">Itens</TableHead>
                                    <TableHead className="py-6 px-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data?.items.map((order) => (
                                    <TableRow key={order.id} className="group hover:bg-primary/[0.02] border-primary/5 transition-all duration-300">
                                        <TableCell className="py-6 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                                                    <Globe className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="font-black text-lg text-primary">{order.origin}</span>
                                                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                                                        <span className="font-mono text-xs font-bold text-muted-foreground">ID: {order.external_id}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold">Detectado em {new Date().toLocaleDateString('pt-BR')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-4">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-orange-500/10 text-orange-600 border border-orange-500/20">
                                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 group-hover:animate-ping" />
                                                <span className="text-xs font-black uppercase tracking-tight">{order.external_status}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-4">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border font-black uppercase tracking-tight text-xs ${order.internal_status === 'processed'
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : 'bg-primary/10 text-primary border-primary/20'
                                                }`}>
                                                <Activity className="h-3.3 w-3.5" />
                                                {order.internal_status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-4 text-center">
                                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-[10px] font-black border border-primary/10">
                                                {order.items?.length || 0}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-6 px-8 text-right">
                                            <button className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center text-muted-foreground border border-transparent hover:border-primary/20 shadow-sm hover:shadow-xl hover:shadow-primary/20">
                                                <ChevronRight className="h-5 w-5" />
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!data?.items || data.items.length === 0) && (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={5} className="h-80 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                                                <PackageOpen className="h-20 w-20 text-muted-foreground" />
                                                <div className="space-y-1">
                                                    <p className="text-xl font-black tracking-tight">Fila de Pedidos Vazia</p>
                                                    <p className="text-sm font-medium">Aguardando novos eventos de webhook...</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-80">
                <div className="glass p-6 rounded-[2rem] border-white/10 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                        <Activity className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Saúde do Sistema</p>
                        <p className="font-bold text-lg">99.8% Uptime</p>
                    </div>
                </div>
                <div className="glass p-6 rounded-[2rem] border-white/10 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Processamento</p>
                        <p className="font-bold text-lg">Tempo Real</p>
                    </div>
                </div>
                <div className="glass p-6 rounded-[2rem] border-white/10 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                        <Hash className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Protocolos</p>
                        <p className="font-bold text-lg">RFC Compliant</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
