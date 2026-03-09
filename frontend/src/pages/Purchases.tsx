import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Plus,
    ShoppingCart,
    Package,
    Layers,
    Calendar,
    User,
    ExternalLink,
    TrendingUp,
    Zap,
    CreditCard,
    ArrowUpRight,
    ShoppingBag,
    Search,
    ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import PurchaseDialog from '@/components/PurchaseDialog';
import { Badge } from '@/components/ui/badge';

export default function Purchases() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [purchaseType, setPurchaseType] = useState<'raw_material' | 'resale_product'>('raw_material');
    const [searchQuery, setSearchQuery] = useState('');

    const openDialog = (type: 'raw_material' | 'resale_product') => {
        setPurchaseType(type);
        setDialogOpen(true);
    };
    const { data: purchases = [], isLoading } = useQuery({
        queryKey: ['purchases'],
        queryFn: async () => {
            const res = await api.get('/purchases');
            return res.data;
        },
    });

    const purchasesArr = Array.isArray(purchases) ? purchases : [];

    const filteredPurchases = (type: string) => {
        return purchasesArr.filter((p: any) =>
            p && p.type === type &&
            (p.supplier?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.id.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    };

    if (isLoading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="relative">
                <ShoppingBag className="h-16 w-16 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-10 bg-primary rounded-full scale-[2]" />
            </div>
            <div className="text-center space-y-2">
                <p className="label-brand text-muted-foreground italic">Sincronizando Ordens de Compra...</p>
                <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-1/2" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Ultra-Modern Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-3xl border border-primary/10">
                            <ShoppingCart className="h-7 w-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-1">
                                <h1 className="h1-brand text-3xl text-white">Suprimentos</h1>
                                <Badge className="bg-primary/10 text-primary border-none label-brand px-3 py-1 rounded-full text-[10px]">Chain</Badge>
                            </div>
                            <p className="body-brand text-muted-foreground opacity-40 text-sm">
                                Orquestração de compras e <span className="text-primary text-white/80">Inteligência de Aquisição</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-[400px] group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-all" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Localizar PO, Fornecedor ou Lote..."
                            className="w-full h-11 pl-16 rounded-[2rem] smooth-glass border-none ring-offset-background placeholder:text-muted-foreground/40 body-brand focus:ring-2 ring-primary/20 shadow-xl transition-all"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => openDialog('raw_material')}
                            className="h-11 px-8 rounded-[2rem] border border-white/5 hover:bg-white/5 text-muted-foreground label-brand transition-all flex items-center gap-3 group text-[10px]"
                        >
                            <Layers className="h-3.5 w-3.5 opacity-40 group-hover:rotate-12 transition-transform" />
                            Comprar Insumo
                        </button>
                        <button
                            onClick={() => openDialog('resale_product')}
                            className="h-11 px-10 rounded-[2rem] bg-primary text-primary-foreground label-brand shadow-3xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 group text-[10px]"
                        >
                            <Plus className="h-5 w-5 stroke-[4] group-hover:rotate-90 transition-transform" />
                            Adquirir Revenda
                        </button>
                    </div>
                </div>
            </div>

            {/* Insight Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Volume Total', value: `R$ ${purchasesArr.reduce((acc: any, p: any) => acc + (p.total_value || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Entregas Abertas', value: '08', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Principal Fornecedor', value: purchasesArr[0]?.supplier?.name || 'N/A', icon: User, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Capital Ativo', value: '42%', icon: CreditCard, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-[2.5rem] border-none smooth-glass p-5 relative overflow-hidden group hover:scale-[1.02] transition-transform shadow-2xl">
                        <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                            <stat.icon className="h-16 w-16 -rotate-12" />
                        </div>
                        <div className="space-y-3 relative z-10">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-lg`}>
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="label-brand text-muted-foreground/40 text-[10px]">{stat.label}</p>
                                <p className="stat-brand mt-0.5 truncate text-xl">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="raw_material" className="w-full">
                <div className="flex justify-between items-center mb-6">
                    <TabsList className="bg-white/5 p-1 rounded-2xl smooth-glass border-white/5 h-auto">
                        <TabsTrigger value="raw_material" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all label-brand flex gap-3 text-xs">
                            <Layers className="h-3.5 w-3.5" /> Matéria-Prima
                        </TabsTrigger>
                        <TabsTrigger value="resale" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all label-brand flex gap-3 text-xs">
                            <Package className="h-3.5 w-3.5" /> Revenda
                        </TabsTrigger>
                    </TabsList>
                    <div className="hidden lg:flex items-center gap-4 label-brand text-muted-foreground opacity-40 italic">
                        <div className="h-px w-20 bg-white/10" />
                        Visualizando Fluxo de Aquisição
                    </div>
                </div>

                <TabsContent value="raw_material" className="mt-0 focus-visible:outline-none">
                    <Card className="rounded-[4rem] border-none smooth-glass overflow-hidden shadow-3xl min-h-[500px]">
                        <PurchasesTable
                            purchases={filteredPurchases('raw_material')}
                            isLoading={isLoading}
                            openDialog={openDialog}
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="resale" className="mt-0 focus-visible:outline-none">
                    <Card className="rounded-[4rem] border-none smooth-glass overflow-hidden shadow-3xl min-h-[500px]">
                        <PurchasesTable
                            purchases={filteredPurchases('resale_product')}
                            isLoading={isLoading}
                            openDialog={openDialog}
                        />
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

function PurchasesTable({ purchases, isLoading, openDialog }: { purchases: any[], isLoading: boolean, openDialog: (type: 'raw_material' | 'resale_product') => void }) {
    if (isLoading) return (
        <div className="p-32 text-center text-muted-foreground animate-pulse">
            <ShoppingCart className="h-12 w-12 mx-auto mb-6 opacity-10" />
            <p className="label-brand opacity-40 italic">Processando Ledger...</p>
        </div>
    );

    return (
        <div className="overflow-x-auto scrollbar-hide">
            <Table>
                <TableHeader className="bg-primary/[0.03]">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableHead className="py-4 px-10 label-brand text-primary/60">Timeline & Protocolo</TableHead>
                        <TableHead className="label-brand text-primary/60">Parceiro Comercial</TableHead>
                        <TableHead className="text-right label-brand text-primary/60">Valor de Mercado</TableHead>
                        <TableHead className="w-[180px] text-right px-10 label-brand text-primary/60">Operações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {purchases.map((purchase: any) => (
                        <TableRow key={purchase.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5 active:bg-white/10">
                            <TableCell className="py-4 px-10">
                                <div className="flex items-center gap-6">
                                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-2xl border border-white/5">
                                        <Calendar className="h-5 w-5 opacity-40 group-hover:opacity-100" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <div className="h3-brand text-lg text-white/90 group-hover:translate-x-1 transition-transform">
                                            {purchase.purchase_date ? new Date(purchase.purchase_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Protocolo N/A'}
                                        </div>
                                        <div className="label-brand text-[8px] text-muted-foreground/40 flex items-center gap-2">
                                            <div className="h-1 w-1 rounded-full bg-primary/20" />
                                            Ref PO: <span className="text-muted-foreground/50">{purchase.id.slice(0, 12).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-4">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-primary/40 flex items-center justify-center text-primary-foreground stat-brand group-hover:scale-110 transition-transform text-xs">
                                        {purchase.supplier?.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="h3-brand text-base text-white/80 group-hover:text-primary transition-colors">
                                            {purchase.supplier?.name || 'Entidade Desconhecida'}
                                        </span>
                                        <p className="label-brand text-[8px] text-muted-foreground/20 italic">Arquitetura de Parceiro Verificada</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-0.5">
                                    <span className="stat-brand text-white/60 text-lg">
                                        R$ {Number(purchase.total_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <div className="flex items-center gap-1.5 label-brand text-emerald-400/60 text-[9px]">
                                        <ArrowUpRight className="h-2.5 w-2.5" />
                                        Valor Indexado
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right px-10">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-5 group-hover:translate-x-0">
                                    <button
                                        className="h-9 w-9 rounded-xl bg-white/5 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all flex items-center justify-center group/btn"
                                        title="System Integration"
                                    >
                                        <ExternalLink className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                                    </button>
                                    <button
                                        className="h-9 px-4 rounded-xl bg-primary text-primary-foreground label-brand transition-all flex items-center gap-2 hover:shadow-2xl hover:shadow-primary/20 text-[10px]"
                                    >
                                        Inspecionar
                                        <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                    {purchases.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-[400px] text-center border-none hover:bg-transparent">
                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-8 animate-in zoom-in duration-1000">
                                    <div className="h-40 w-40 rounded-[4rem] bg-white/[0.02] flex items-center justify-center border-4 border-dashed border-white/5">
                                        <ShoppingCart className="h-20 w-20 opacity-5 rotate-12" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="h2-brand text-white/20">Liquidez Zero</p>
                                        <p className="label-brand opacity-30">Nenhum registro de aquisição localizado no ledger atual.</p>
                                    </div>
                                    <button
                                        className="h-14 px-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary label-brand hover:bg-primary/20 transition-all active:scale-95"
                                        onClick={() => openDialog('raw_material')}
                                    >
                                        Inaugurar Cadeia de Compras
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

