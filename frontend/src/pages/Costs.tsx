import React from 'react';
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
    Calculator,
    TrendingUp,
    DollarSign,
    PieChart,
    Info,
    Activity,
    Zap,
    Target,
    BarChart3,
    ShieldCheck,
    Compass,
    ArrowUpRight,
    Settings,
    Plus,
    Edit2,
    Trash2
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesModalityForm from '@/components/forms/SalesModalityForm';
import { useToast } from '@/hooks/use-toast';

interface ProductVariant {
    id: string;
    sku: string;
    cost: number;
    attributes: Record<string, string | number>;
    materials?: { quantity: number; raw_material?: { last_unit_price: number } }[];
}

interface Product {
    id: string;
    name: string;
    is_manufactured: boolean;
    variants: ProductVariant[];
}

interface FixedCost {
    id: string;
    description: string;
    value: number;
}

interface SalesModality {
    id: string;
    name: string;
    tax_percent: number;
    fixed_fee: number;
    extra_cost: number;
}


export default function Costs() {
    const [selectedModality, setSelectedModality] = React.useState<string>('direct');
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingModality, setEditingModality] = React.useState<SalesModality | null>(null);
    const { toast } = useToast();

    const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/products');
            return res.data;
        },
    });

    const { data: fixedCosts = [], isLoading: loadingFixed } = useQuery<FixedCost[]>({
        queryKey: ['fixed-costs'],
        queryFn: async () => {
            const res = await api.get('/finance/fixed-costs');
            return res.data;
        },
    });

    const { data: modalities = [], isLoading: loadingModalities, refetch: refetchModalities } = useQuery<SalesModality[]>({
        queryKey: ['sales-modalities'],
        queryFn: async () => {
            const res = await api.get('/finance/sales-modalities');
            return res.data;
        },
    });

    const handleDeleteModality = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta modalidade?')) return;
        try {
            await api.delete(`/finance/sales-modalities/${id}`);
            toast({ title: "Modalidade Excluída", description: "O registro foi removido com sucesso." });
            refetchModalities();
        } catch (error) {
            toast({ title: "Erro ao Excluir", description: "Não foi possível remover a modalidade.", variant: "destructive" });
        }
    };

    const productsArr = Array.isArray(products) ? products : [];
    const fixedCostsArr = Array.isArray(fixedCosts) ? fixedCosts : [];
    const modalitiesArr = Array.isArray(modalities) ? modalities : [];

    const totalFixed = fixedCostsArr.reduce((acc: number, curr: FixedCost) => acc + Number(curr.value || 0), 0);
    const avgMonthlyProduction = 1000;
    const fixedShare = totalFixed / avgMonthlyProduction;

    const modality = modalitiesArr.find(m => m.id === selectedModality) || modalitiesArr[0] || { id: 'default', name: 'Nenhuma', tax_percent: 0, fixed_fee: 0, extra_cost: 0 };

    if (loadingProducts || loadingFixed || loadingModalities) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="relative">
                <Calculator className="h-16 w-16 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-10 bg-primary rounded-full scale-[2]" />
            </div>
            <div className="text-center space-y-2">
                <p className="label-brand text-muted-foreground italic">Sincronizando Margens...</p>
                <div className="h-1 w-48 bg-white/5 rounded-full overflow-hidden mx-auto">
                    <div className="h-full bg-primary animate-[shimmer_2s_infinite] w-1/3" />
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Elite Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-3xl border border-primary/10">
                            <BarChart3 className="h-10 w-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="h1-brand text-7xl text-white">Lucro</h1>
                                <Badge className="bg-primary/10 text-primary border-none label-brand px-4 py-1.5 rounded-full">Análise</Badge>
                            </div>
                            <p className="h3-brand text-muted-foreground opacity-40">
                                Auditoria técnica de <span className="text-primary not-italic font-black text-white/80">Margens & Custos Fixos</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overhead Monitor */}
                <div className="w-full lg:w-auto flex flex-col items-end gap-6">
                    <div className="w-full max-w-[320px] space-y-3">
                        <Label className="label-brand text-primary/60 ml-2">Modo de Escoamento (Venda)</Label>
                        <Select value={selectedModality} onValueChange={setSelectedModality}>
                            <SelectTrigger className="h-16 rounded-2xl smooth-glass border-none focus:ring-2 focus:ring-primary/20 transition-all body-brand text-sm uppercase">
                                <SelectValue placeholder="Selecione a modalidade" />
                            </SelectTrigger>
                            <SelectContent className="smooth-glass border-white/5 rounded-2xl">
                                {modalitiesArr.map(m => (
                                    <SelectItem key={m.id} value={m.id} className="label-brand py-4 focus:bg-primary/20 focus:text-primary transition-colors">
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-4 w-full max-w-[320px]">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="h-14 flex-1 rounded-2xl border-white/5 hover:bg-white/5 label-brand px-6 gap-2">
                                    <Settings className="h-4 w-4" /> Gerenciar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="smooth-glass border-white/5 sm:max-w-[500px] rounded-[2.5rem] overflow-hidden">
                                <DialogHeader>
                                    <DialogTitle className="h2-brand text-2xl">Modalidades de Venda</DialogTitle>
                                    <DialogDescription className="label-brand text-muted-foreground">Configure taxas e custos extras por canal de venda.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-6 py-4">
                                    {isFormOpen ? (
                                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="h3-brand text-sm">{editingModality ? 'Editar' : 'Nova'} Modalidade</h3>
                                                <Button variant="ghost" className="label-brand" onClick={() => { setIsFormOpen(false); setEditingModality(null); }}>Cancelar</Button>
                                            </div>
                                            <SalesModalityForm
                                                initialData={editingModality}
                                                onSuccess={() => {
                                                    setIsFormOpen(false);
                                                    setEditingModality(null);
                                                    refetchModalities();
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            {modalitiesArr.map(m => (
                                                <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                                    <div>
                                                        <p className="body-brand text-xs uppercase">{m.name}</p>
                                                        <p className="label-brand text-muted-foreground opacity-60">Taxa: {m.tax_percent}% + R$ {(m.fixed_fee + m.extra_cost).toFixed(2)}</p>
                                                    </div>
                                                    <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-all">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                setEditingModality(m);
                                                                setIsFormOpen(true);
                                                            }}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleDeleteModality(m.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                className="w-full h-12 rounded-xl label-brand bg-primary hover:scale-[1.02] shadow-xl shadow-primary/20"
                                                onClick={() => {
                                                    setEditingModality(null);
                                                    setIsFormOpen(true);
                                                }}
                                            >
                                                <Plus className="h-4 w-4 mr-2" /> Nova Modalidade
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="rounded-[2.5rem] border-none smooth-glass p-8 relative overflow-hidden group hover:scale-[1.02] transition-all shadow-2xl min-w-[320px]">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                            <PieChart className="h-24 w-24" />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="label-brand text-muted-foreground/40 flex items-center gap-2">
                                    <Activity className="h-3 w-3" /> Hub de OpEx Fixo
                                </p>
                                <span className="label-brand text-emerald-400">Meta em Tempo Real</span>
                            </div>
                            <p className="stat-brand text-5xl text-primary">
                                R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[42%]" />
                                </div>
                                <span className="label-brand text-muted-foreground/30">Índice de Utilização</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Performance Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Média COGS', value: 'R$ 42,90', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Eficiência Líquida', value: '94.2%', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Score OEE', value: '88', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Carga Tributária', value: `${modality.tax_percent}% + R$ ${modality.fixed_fee + modality.extra_cost}`, icon: Compass, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat: { label: string; value: string; icon: React.ElementType; color: string; bg: string }, i: number) => (
                    <Card key={i} className="rounded-[3rem] border-none smooth-glass p-8 group hover:scale-[1.05] transition-all shadow-2xl">
                        <div className="space-y-4">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-lg border border-white/5 group-hover:rotate-12 transition-transform`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="label-brand text-muted-foreground/40">{stat.label}</p>
                                <p className="stat-brand text-3xl mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Tabs defaultValue="manufactured" className="w-full">
                <div className="flex justify-between items-center mb-10">
                    <TabsList className="bg-white/5 p-2 rounded-[2rem] smooth-glass border-white/5 h-auto">
                        <TabsTrigger value="manufactured" className="rounded-2xl px-12 py-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all label-brand flex gap-4">
                            <Calculator className="h-4 w-4" /> Produção Própria
                        </TabsTrigger>
                        <TabsTrigger value="resale" className="rounded-2xl px-12 py-5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all label-brand flex gap-4">
                            <TrendingUp className="h-4 w-4" /> Revenda Externa
                        </TabsTrigger>
                    </TabsList>

                    <div className="hidden lg:flex items-center gap-6 p-6 rounded-[2rem] smooth-glass border-none">
                        <Info className="h-5 w-5 text-primary animate-pulse" />
                        <p className="label-brand text-muted-foreground/40 max-w-[300px]">
                            O cálculo de Rateio (COGS + OpEx) é calibrado para lotes otimizados de <span className="text-white font-black">1.000 unidades</span> mensais.
                        </p>
                    </div>
                </div>

                <TabsContent value="manufactured" className="mt-0 focus-visible:outline-none">
                    <Card className="rounded-[4rem] border-none smooth-glass overflow-hidden shadow-3xl min-h-[500px]">
                        <CostTable
                            data={productsArr.filter((p: Product) => p.is_manufactured)}
                            type="manufactured"
                            fixedShare={fixedShare}
                            modality={modality}
                        />
                    </Card>
                </TabsContent>

                <TabsContent value="resale" className="mt-0 focus-visible:outline-none">
                    <Card className="rounded-[4rem] border-none smooth-glass overflow-hidden shadow-3xl min-h-[500px]">
                        <CostTable
                            data={productsArr.filter((p: Product) => !p.is_manufactured)}
                            type="resale"
                            fixedShare={0}
                            modality={modality}
                        />
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    );
}

function CostTable({ data, type, fixedShare, modality }: { data: Product[], type: 'manufactured' | 'resale', fixedShare: number, modality: SalesModality }) {
    return (
        <div className="overflow-x-auto scrollbar-hide">
            <Table>
                <TableHeader className="bg-primary/[0.03]">
                    <TableRow className="border-b border-white/5 hover:bg-transparent">
                        <TableHead className="py-10 px-12 label-brand text-primary/60">Entidade do Produto</TableHead>
                        <TableHead className="label-brand text-primary/60">Configuração (SKU)</TableHead>
                        <TableHead className="text-right label-brand text-primary/60">{type === 'manufactured' ? 'COGS de Insumos' : 'Aquisição'}</TableHead>
                        <TableHead className="text-right px-12 label-brand text-primary/60">Yield de Mercado (Custo Estimado)</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((product: Product) => (
                        (product.variants || []).map((variant: ProductVariant) => {
                            const bomCost = type === 'manufactured'
                                ? (variant.materials || []).reduce((acc: number, m) => {
                                    const unitPrice = Number(m.raw_material?.last_unit_price || 0);
                                    return acc + (Number(m.quantity || 0) * unitPrice);
                                }, 0)
                                : Number(variant.cost || 0);

                            // Base Cost = Production/Resale Cost + OpEx Share
                            const baseCost = bomCost + fixedShare;

                            // Formula: (Base Cost + Fixed Fee + Extra Cost) / (1 - Tax%)
                            // This ensures that the yield represents the final "break-even" or target cost after modality fees
                            const taxRate = modality.tax_percent / 100;
                            const totalYieldCost = (baseCost + modality.fixed_fee + modality.extra_cost) / (1 - taxRate);

                            return (
                                <TableRow key={variant.id} className="group hover:bg-white/[0.04] transition-all border-b border-white/5 active:bg-white/10">
                                    <TableCell className="py-10 px-12">
                                        <div className="flex items-center gap-8">
                                            <div className="h-16 w-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-2xl border border-white/5 group-hover:border-primary/20">
                                                <DollarSign className="h-8 w-8 opacity-40 group-hover:opacity-100" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <div className="h3-brand text-2xl text-white/90 group-hover:translate-x-1 transition-transform">
                                                    {product.name}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {Object.entries(variant.attributes || {}).map(([key, value]) => (
                                                        <span key={key} className="label-brand text-primary/40 flex items-center gap-1.5">
                                                            <div className="h-1 w-1 rounded-full bg-primary/40" />
                                                            {key}: {String(value)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <span className="body-brand text-sm text-white uppercase">{variant.sku}</span>
                                            <span className="label-brand text-[9px] text-muted-foreground">ID de Registro do Sistema</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="space-y-1">
                                            <p className="stat-brand text-xl text-white/60">
                                                R$ {Number(bomCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </p>
                                            <p className="label-brand text-muted-foreground/20">Valor de Inventário Base</p>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-12">
                                        <div className="flex flex-col items-end gap-1 group-hover:translate-x-[-4px] transition-transform">
                                            <div className="flex items-center gap-4">
                                                {(modality.tax_percent > 0 || modality.fixed_fee > 0 || modality.extra_cost > 0) && (
                                                    <Badge className="bg-primary/10 text-primary border-none label-brand text-[9px] h-5">Incl. Taxas</Badge>
                                                )}
                                                <span className="stat-brand text-4xl text-primary">
                                                    R$ {Number(totalYieldCost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 label-brand text-emerald-400/60">
                                                <ArrowUpRight className="h-3 w-3" />
                                                Yield de {modality.name}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ))}
                    {data.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="h-[400px] text-center border-none hover:bg-transparent">
                                <div className="flex flex-col items-center justify-center text-muted-foreground gap-8 animate-in zoom-in duration-1000">
                                    <div className="h-40 w-40 rounded-[4rem] bg-white/[0.02] flex items-center justify-center border-4 border-dashed border-white/5">
                                        <Calculator className="h-20 w-20 opacity-5 -rotate-12" />
                                    </div>
                                    <div className="space-y-3">
                                        <p className="h2-brand text-4xl text-white/20">Vazio Detectado</p>
                                        <p className="label-brand opacity-30">Nenhum dado de custo disponível para análise neste cluster.</p>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

