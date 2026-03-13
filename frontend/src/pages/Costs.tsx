import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import {
    Calculator,
    PieChart,
    Info,
    Activity,
    BarChart3,
    Settings,
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SalesModalityForm from '@/components/forms/SalesModalityForm';
import { useToast } from '@/hooks/use-toast';

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
    const [selectedModality, setSelectedModality] = React.useState<string>('');
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingModality, setEditingModality] = React.useState<SalesModality | null>(null);
    const [isExporting, setIsExporting] = React.useState(false);
    const { toast } = useToast();

    const { data: fixedCosts = [], isLoading: loadingFixed } = useQuery<FixedCost[]>({
        queryKey: ['fixed-costs'],
        queryFn: async () => {
            const res = await api.get('/fixed-costs');
            return res.data;
        },
    });

    const { data: modalities = [], isLoading: loadingModalities, refetch: refetchModalities } = useQuery<SalesModality[]>({
        queryKey: ['sales-modalities'],
        queryFn: async () => {
            const res = await api.get('/sales-modalities');
            return res.data;
        },
    });

    React.useEffect(() => {
        if (modalities && modalities.length > 0 && !selectedModality) {
            setSelectedModality(modalities[0].id);
        }
    }, [modalities, selectedModality]);

    const handleDeleteModality = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta modalidade?')) return;
        try {
            await api.delete(`/sales-modalities/${id}`);
            toast({ title: "Modalidade Excluída", description: "O registro foi removido com sucesso." });
            refetchModalities();
        } catch (error) {
            toast({ title: "Erro ao Excluir", description: "Não foi possível remover a modalidade.", variant: "destructive" });
        }
    };

    const handleExport = async () => {
        if (!selectedModality) {
            toast({ title: "Atenção", description: "Selecione uma modalidade para exportar.", variant: "destructive" });
            return;
        }
        setIsExporting(true);
        try {
            const response = await api.get(`/finance/export-costs/${selectedModality}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `relatorio_precos_${selectedModality}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast({ title: "Sucesso", description: "Planilha exportada com sucesso!" });
        } catch (error) {
            toast({ title: "Erro na Exportação", description: "Não foi possível gerar a planilha.", variant: "destructive" });
        } finally {
            setIsExporting(false);
        }
    };

    const fixedCostsArr = Array.isArray(fixedCosts) ? fixedCosts : [];
    const modalitiesArr = Array.isArray(modalities) ? modalities : [];
    const totalFixed = fixedCostsArr.reduce((acc: number, curr: FixedCost) => acc + Number(curr.value || 0), 0);
    const modality = modalitiesArr.find(m => m.id === selectedModality) || modalitiesArr[0] || { id: 'default', name: 'Nenhuma', tax_percent: 0, fixed_fee: 0, extra_cost: 0 };

    if (loadingFixed || loadingModalities) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6 animate-pulse">
            <div className="relative">
                <Calculator className="h-16 w-16 text-primary/20" />
                <div className="absolute inset-0 animate-ping opacity-10 bg-primary rounded-full scale-[2]" />
            </div>
            <p className="label-brand text-muted-foreground italic text-xs">Sincronizando Hub de Custos...</p>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-10">
                <div className="flex items-center gap-6">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-3xl border border-primary/10">
                        <BarChart3 className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="h1-brand text-4xl text-foreground mb-1">Cálculo de Custos</h1>
                        <p className="label-brand text-muted-foreground opacity-70 text-xs">
                            Hub de inteligência para <span className="text-primary not-italic font-black">Margens & Rateio</span>.
                        </p>
                    </div>
                </div>

                <div className="w-full lg:w-auto flex flex-col items-end gap-4">
                    <Card className="rounded-[2.5rem] border-none smooth-glass p-6 relative overflow-hidden group hover:scale-[1.02] transition-all shadow-2xl min-w-[320px]">
                        <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
                            <PieChart className="h-24 w-24" />
                        </div>
                        <div className="relative z-10 space-y-2">
                            <p className="label-brand text-muted-foreground/60 flex items-center gap-2 text-[10px]">
                                <Activity className="h-3 w-3" /> Gastos Operacionais Fixos (Rateio)
                            </p>
                            <p className="stat-brand text-3xl text-primary">
                                R$ {totalFixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="label-brand text-muted-foreground/30 text-[9px]">Base de Cálculo: 1.000 Unidades/Mês</p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Main Action Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="rounded-[3rem] border-none smooth-glass p-8 flex flex-col justify-between space-y-8 shadow-3xl">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <h2 className="label-brand text-xs uppercase tracking-tighter text-primary">Exportação de Preços</h2>
                        </div>
                        <p className="body-brand text-sm text-muted-foreground/80 leading-relaxed">
                            Selecione uma modalidade de venda para gerar um relatório completo em Excel. O cálculo considera:
                            <br /><span className="text-primary font-semibold">✓ Preço Médio das Matérias-Primas</span>
                            <br /><span className="text-primary font-semibold">✓ Rateio de Gastos Fixos</span>
                            <br /><span className="text-primary font-semibold">✓ Taxas e Custos da Modalidade</span>
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="label-brand text-primary/60 ml-2 text-[10px]">Modalidade de Venda</Label>
                            <div className="flex gap-2">
                                <Select value={selectedModality} onValueChange={setSelectedModality}>
                                    <SelectTrigger className="h-12 rounded-2xl smooth-glass border-none focus:ring-2 focus:ring-primary/20 transition-all body-brand text-xs uppercase flex-1">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="smooth-glass border-white/5 rounded-2xl">
                                        {modalitiesArr.map(m => (
                                            <SelectItem key={m.id} value={m.id} className="label-brand py-4">
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="h-12 w-12 rounded-2xl border-white/5 hover:bg-white/5 p-0">
                                            <Settings className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="smooth-glass border-white/5 sm:max-w-[500px] rounded-[2.5rem] overflow-hidden">
                                        <DialogHeader>
                                            <DialogTitle className="h2-brand text-2xl">Canais de Venda</DialogTitle>
                                            <DialogDescription className="label-brand">Configure taxas por modalidade.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
                                            {isFormOpen ? (
                                                <div className="space-y-4">
                                                    <SalesModalityForm
                                                        initialData={editingModality}
                                                        onSuccess={() => { setIsFormOpen(false); setEditingModality(null); refetchModalities(); }}
                                                    />
                                                    <Button variant="ghost" className="w-full label-brand text-[10px]" onClick={() => { setIsFormOpen(false); setEditingModality(null); }}>Voltar</Button>
                                                </div>
                                            ) : (
                                                <>
                                                    {modalitiesArr.map(m => (
                                                        <div key={m.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                                                            <div className="text-left">
                                                                <p className="body-brand text-xs uppercase">{m.name}</p>
                                                                <p className="label-brand text-[9px] text-muted-foreground">Taxa: {m.tax_percent}%</p>
                                                            </div>
                                                            <div className="flex gap-1">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => { setEditingModality(m); setIsFormOpen(true); }}><Edit2 className="h-3.5 w-3.5" /></Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteModality(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <Button className="w-full h-12 rounded-xl label-brand text-xs" onClick={() => { setEditingModality(null); setIsFormOpen(true); }}>Nova Modalidade</Button>
                                                </>
                                            )}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>

                        <Button
                            className="w-full h-14 rounded-2xl label-brand bg-primary hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 text-xs gap-3"
                            onClick={handleExport}
                            disabled={isExporting}
                        >
                            {isExporting ? <Activity className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                            EXPORTAR PLANILHA (XLSX)
                        </Button>
                    </div>
                </Card>

                <div className="grid grid-cols-1 gap-6">
                    <Card className="rounded-[3rem] border-none smooth-glass p-8 space-y-6 shadow-3xl">
                        <div className="flex items-center gap-3">
                            <div className="h-2 w-2 rounded-full bg-amber-400" />
                            <h2 className="label-brand text-xs uppercase tracking-tighter text-amber-400">Resumo da Modalidade</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="label-brand text-muted-foreground text-xs">Carga Tributária</span>
                                <span className="stat-brand text-foreground">{modality.tax_percent}%</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/5">
                                <span className="label-brand text-muted-foreground text-xs">Taxa Fixa</span>
                                <span className="stat-brand text-foreground">R$ {Number(modality.fixed_fee).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="label-brand text-muted-foreground text-xs">Custos Extras</span>
                                <span className="stat-brand text-foreground">R$ {Number(modality.extra_cost).toFixed(2)}</span>
                            </div>
                        </div>
                    </Card>

                    <div className="flex items-center gap-4 p-6 rounded-[2.5rem] smooth-glass border-none">
                        <Info className="h-5 w-5 text-primary animate-pulse" />
                        <p className="label-brand text-muted-foreground/40 text-[10px] leading-relaxed">
                            A exportação gera um arquivo compatível com Excel e Google Sheets, contendo o <span className="text-primary font-black">Preço de Venda Sugerido</span> para cada item do seu estoque.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

