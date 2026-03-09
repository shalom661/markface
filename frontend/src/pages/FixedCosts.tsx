import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Trash2,
    Wallet,
    Landmark,
    TrendingDown,
    Receipt,
    Calculator,
    Zap,
    ShieldCheck,
    ArrowUpRight,
    PiggyBank,
    Activity,
    CreditCard
} from 'lucide-react';
import api from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface FixedCost {
    id: string;
    description: string;
    value: number;
}

export default function FixedCosts() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [newDesc, setNewDesc] = useState('');
    const [newValue, setNewValue] = useState('');

    const { data: costs, isLoading } = useQuery<FixedCost[]>({
        queryKey: ['fixed-costs'],
        queryFn: async () => {
            const res = await api.get('/fixed-costs');
            return Array.isArray(res.data) ? res.data : (res.data.items || []);
        },
    });

    const costsArr = Array.isArray(costs) ? costs : [];

    const createMutation = useMutation({
        mutationFn: (newCost: { description: string, value: number }) => api.post('/fixed-costs', newCost),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
            setNewDesc('');
            setNewValue('');
            toast({
                title: "Protocolo Autenticado",
                description: "Custo fixo registrado com sucesso no sistema.",
            });
        },
        onError: () => {
            toast({
                title: "Falha na Autenticação",
                description: "Erro ao tentar registrar o custo fixo. Verifique a conexão.",
                variant: "destructive"
            });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/fixed-costs/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
            toast({
                title: "Entrada Deletada",
                description: "O registro foi removido do perímetro operacional.",
            });
        },
    });

    const handleCreate = () => {
        if (!newDesc || !newValue) {
            toast({
                title: "Dados Incompletos",
                description: "Preencha a descrição e o valor para prosseguir.",
                variant: "destructive"
            });
            return;
        }
        createMutation.mutate({ description: newDesc, value: parseFloat(newValue) });
    };

    const totalFixed = costsArr.reduce((acc: number, curr: FixedCost) => acc + Number(curr.value || 0), 0);

    if (isLoading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="relative">
                <PiggyBank className="h-16 w-16 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-10 bg-primary rounded-full scale-[2]" />
            </div>
            <div className="text-center space-y-2">
                <p className="label-brand text-muted-foreground italic">Carregando Hub de Custos Fixos...</p>
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
                        <div className="h-20 w-20 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-3xl border border-primary/10 transition-transform hover:scale-110 duration-500">
                            <Landmark className="h-10 w-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="h1-brand text-7xl">Gastos Operacionais</h1>
                                <Badge className="bg-primary/10 text-primary border-none label-brand px-4 py-1.5 rounded-full">Recorrente</Badge>
                            </div>
                            <p className="h3-brand text-muted-foreground text-2xl">
                                Gestão estratégica de <span className="text-primary text-white/80">Custos Fixos & Operação</span>.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overhead Monitor */}
                <div className="w-full lg:w-auto">
                    <Card className="rounded-[2.5rem] border-none smooth-glass p-8 relative overflow-hidden group hover:scale-[1.02] transition-all shadow-2xl min-w-[320px]">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                            <Calculator className="h-24 w-24" />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="label-brand text-muted-foreground/60 flex items-center gap-2">
                                    <Activity className="h-3 w-3" /> Custo Mensal Total
                                </p>
                                <span className="label-brand text-emerald-400">Protocolo Ativo</span>
                            </div>
                            <p className="stat-brand text-5xl text-primary">
                                R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[65%]" />
                                </div>
                                <span className="label-brand text-muted-foreground/50">Carga Estrutural</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Performance Widgets */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Fluxo Recorrente', value: costsArr.length.toString(), icon: Receipt, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Impacto Médio Unitário', value: 'R$ ' + (totalFixed / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 }), icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Nível de Auditoria', value: 'Alpha', icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Eficiência Financeira', value: 'Alta', icon: PiggyBank, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                ].map((stat: { label: string; value: string; icon: React.ElementType; color: string; bg: string }, i: number) => (
                    <Card key={i} className="rounded-[3rem] border-none smooth-glass p-8 group hover:scale-[1.05] transition-all shadow-2xl">
                        <div className="space-y-4">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-lg border border-white/5 group-hover:rotate-12 transition-transform`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="label-brand text-muted-foreground/60">{stat.label}</p>
                                <p className="stat-brand text-3xl mt-1">{stat.value}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid lg:grid-cols-12 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="rounded-[3rem] border-none smooth-glass overflow-hidden shadow-2xl p-1">
                        <div className="p-10 space-y-8">
                            <div className="space-y-2">
                                <h3 className="h3-brand text-2xl text-white/90">Novo Lançamento</h3>
                                <p className="label-brand text-muted-foreground opacity-60">Adicionar registro recorrente</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="label-brand text-primary/60 ml-1">Descrição do Lançamento</Label>
                                    <Input
                                        value={newDesc}
                                        onChange={(e) => setNewDesc(e.target.value)}
                                        placeholder="Ex: Infra, Payroll, AWS..."
                                        className="h-16 rounded-2xl smooth-glass border-none focus:ring-2 focus:ring-primary/20 transition-all body-brand placeholder:opacity-40"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label className="label-brand text-primary/60 ml-1">Valor do Registro (R$)</Label>
                                    <Input
                                        type="number"
                                        value={newValue}
                                        onChange={(e) => setNewValue(e.target.value)}
                                        placeholder="0,00"
                                        className="h-16 rounded-2xl smooth-glass border-none focus:ring-2 focus:ring-primary/20 transition-all stat-brand text-3xl placeholder:opacity-20"
                                    />
                                </div>
                                <Button
                                    onClick={handleCreate}
                                    disabled={createMutation.isPending || !newDesc || !newValue}
                                    className="w-full h-20 rounded-[2rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-[1.03] active:scale-95 transition-all text-sm label-brand group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <Plus className="mr-3 h-6 w-6" /> Autenticar Registro
                                </Button>
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[3rem] border-none smooth-glass overflow-hidden shadow-2xl p-10 bg-primary/5">
                        <div className="flex gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                <TrendingDown className="h-7 w-7" />
                            </div>
                            <div className="space-y-2">
                                <p className="label-brand text-white/80">Aviso de Calibração</p>
                                <p className="body-brand text-xs text-muted-foreground opacity-70">
                                    Estes custos são injetados automaticamente no cálculo de margem (Yield Analysis).
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-8">
                    <Card className="rounded-[4rem] border-none smooth-glass overflow-hidden shadow-2xl min-h-[600px] p-2">
                        <div className="p-10 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <CreditCard className="h-8 w-8 text-primary shadow-glow" />
                                    <div>
                                        <h2 className="h3-brand text-3xl text-white/90">Pilha de Registros</h2>
                                        <p className="label-brand text-muted-foreground opacity-80 mt-1">Custos fixos em vigor</p>
                                    </div>
                                </div>
                                <Badge className="rounded-full bg-white/5 border-white/5 label-brand px-6 py-2">{costsArr.length} Registros</Badge>
                            </div>

                            <div className="grid gap-6">
                                {costsArr.map((cost: any, i: number) => (
                                    <div
                                        key={cost.id}
                                        className="group relative rounded-[2.5rem] smooth-glass border border-white/5 p-8 flex justify-between items-center transition-all hover:translate-x-2 animate-in fade-in slide-in-from-right-4 duration-500"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="flex items-center gap-10">
                                            <div className="h-16 w-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-all border border-white/5 group-hover:border-primary/20">
                                                <Wallet className="h-8 w-8 opacity-40 group-hover:opacity-100" />
                                            </div>
                                            <div className="space-y-1.5 text-left">
                                                <p className="h3-brand text-2xl text-white/90 group-hover:translate-x-1 transition-transform">
                                                    {cost.description}
                                                </p>
                                                <p className="label-brand text-primary/60 flex items-center gap-1.5">
                                                    <div className="h-1 w-1 rounded-full bg-primary/40" />
                                                    Registro de Operação Fixa
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12">
                                            <div className="text-right space-y-1">
                                                <p className="stat-brand text-4xl text-primary">
                                                    R$ {Number(cost.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                <div className="flex items-center justify-end gap-2 label-brand text-emerald-400/60 text-[9px]">
                                                    <ArrowUpRight className="h-3 w-3" /> Validade Mensal
                                                </div>
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteMutation.mutate(cost.id)}
                                                className="h-14 w-14 rounded-[1.5rem] text-destructive/20 hover:text-white hover:bg-destructive shadow-2xl transition-all group-hover:opacity-100 opacity-0"
                                            >
                                                <Trash2 className="h-6 w-6" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}

                                {costsArr.length === 0 && (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground gap-8 animate-in zoom-in duration-1000">
                                        <div className="h-40 w-40 rounded-[4rem] bg-white/[0.02] flex items-center justify-center border-4 border-dashed border-white/5">
                                            <Landmark className="h-20 w-20 opacity-5 -rotate-12" />
                                        </div>
                                        <div className="space-y-3 text-center">
                                            <p className="h2-brand text-4xl text-white/20">Vazio de Dados</p>
                                            <p className="body-brand text-sm opacity-50">Nenhum custo fixo registrado neste perímetro de operação.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

