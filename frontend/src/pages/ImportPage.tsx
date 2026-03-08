import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Download,
    Upload,
    FileSpreadsheet,
    CheckCircle,
    AlertCircle,
    Loader2,
    Scissors,
    Truck,
    Archive,
    Sparkles,
    FileUp,
    Check
} from 'lucide-react';

interface TemplateOption {
    key: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    available: boolean;
    importEndpoint: string;
}

interface ImportResult {
    message: string;
    created: number;
    skipped: number;
    errors: Array<{ row: number; error: string }>;
}

const TEMPLATES: TemplateOption[] = [
    {
        key: 'raw-materials',
        label: 'Matérias-Primas',
        description: 'Tecidos, Botões, Zíperes, Elásticos, Bordados, etc.',
        icon: <Scissors className="h-5 w-5" />,
        available: true,
        importEndpoint: '/import/raw-materials',
    },
    {
        key: 'suppliers',
        label: 'Fornecedores',
        description: 'Cadastro de fornecedores de matéria-prima.',
        icon: <Truck className="h-5 w-5" />,
        available: false,
        importEndpoint: '/import/suppliers',
    },
    {
        key: 'inventory',
        label: 'Estoque',
        description: 'Entrada em estoque de matérias-primas ou produtos acabados.',
        icon: <Archive className="h-5 w-5" />,
        available: false,
        importEndpoint: '/import/inventory',
    },
];

export default function ImportPage() {
    const [selected, setSelected] = useState<TemplateOption | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [downloading] = useState(false);

    const downloadTemplate = () => {
        if (!selected) return;
        const token = localStorage.getItem('token');
        const encodedToken = encodeURIComponent(token ?? '');
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const url = `${baseUrl}/import/template/${selected.key}?token=${encodedToken}`;
        window.open(url, '_blank');
    };

    const importMutation = useMutation<ImportResult, Error, File>({
        mutationFn: async (uploadFile) => {
            const formData = new FormData();
            formData.append('file', uploadFile);
            const { data } = await api.post(selected!.importEndpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
    });

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped?.name.match(/\.(xlsx|xls)$/i)) setFile(dropped);
    };

    const handleSelect = (t: TemplateOption) => {
        if (!t.available) return;
        setSelected(t);
        setFile(null);
        importMutation.reset();
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <FileUp className="h-6 w-6" />
                        </div>
                        <h2 className="text-4xl font-extrabold tracking-tight">Importação em Massa</h2>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">
                        Integração inteligente com planilhas Excel para cadastro massivo.
                    </p>
                </div>
                <div className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">Motor v3.0 Active</span>
                </div>
            </div>

            {/* STEP 1 — Choose type */}
            <Card className="rounded-[2.5rem] border-none glass shadow-2xl overflow-hidden transition-all duration-500">
                <CardHeader className="border-b border-primary/5 p-8 bg-primary/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground text-lg font-black shadow-lg shadow-primary/20">1</div>
                        <div>
                            <CardTitle className="text-2xl font-black">Configuração Inicial</CardTitle>
                            <CardDescription className="font-medium text-sm">Selecione o domínio de dados para importação.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => handleSelect(t)}
                                disabled={!t.available}
                                className={`group relative text-left p-6 rounded-[2rem] border-2 transition-all duration-300 ${selected?.key === t.key
                                    ? 'border-primary bg-primary/10 shadow-xl shadow-primary/5'
                                    : 'border-white/5 hover:border-primary/50 bg-white/5'
                                    } ${!t.available ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex flex-col gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${selected?.key === t.key
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110'
                                        : 'bg-white/10 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground'
                                        }`}>
                                        {t.icon}
                                    </div>
                                    <div>
                                        <div className="font-black text-lg mb-1">{t.label}</div>
                                        <div className="text-xs font-semibold text-muted-foreground leading-relaxed italic">{t.description}</div>
                                    </div>

                                    {!t.available ? (
                                        <div className="absolute top-4 right-4">
                                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter px-2">Dev Flow</Badge>
                                        </div>
                                    ) : selected?.key === t.key && (
                                        <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground animate-in zoom-in duration-300">
                                            <Check className="h-3 w-3 stroke-[4]" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* STEP 2 — Download template */}
                <div className={`transition-all duration-500 transform ${selected ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-40 pointer-events-none'}`}>
                    <Card className="h-full rounded-[2.5rem] border-none glass shadow-xl overflow-hidden flex flex-col">
                        <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-primary text-primary-foreground text-lg font-black shadow-lg shadow-primary/20">2</div>
                                <CardTitle className="text-2xl font-black italic underline decoration-primary/40 underline-offset-8">Draft & Modelo</CardTitle>
                            </div>
                            <CardDescription className="space-y-4 font-medium leading-relaxed">
                                <p>Utilize nossa arquitetura de planilha para garantir 100% de precisão na sincronização.</p>
                                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                                        <Sparkles className="h-4 w-4" />
                                        Smart Columns Engine
                                    </div>
                                    <p className="text-xs text-muted-foreground">O sistema detecta campos personalizados automaticamente. Mantenha os headers intactos para melhor performance.</p>
                                </div>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 mt-auto flex items-center justify-center border-t border-white/5 bg-primary/[0.01]">
                            <button
                                onClick={downloadTemplate}
                                disabled={!selected || downloading}
                                className="group relative w-full h-20 rounded-3xl bg-secondary hover:bg-primary text-secondary-foreground hover:text-primary-foreground transition-all duration-500 overflow-hidden shadow-lg hover:shadow-primary/30 disabled:opacity-50"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3 font-black text-lg">
                                    {downloading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6 group-hover:-translate-y-1 transition-transform" />}
                                    <span>Download de Template</span>
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </button>
                        </CardContent>
                    </Card>
                </div>

                {/* STEP 3 — Upload */}
                <div className={`transition-all duration-500 delay-100 transform ${selected ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-40 pointer-events-none'}`}>
                    <Card className="h-full rounded-[2.5rem] border-none glass shadow-xl overflow-hidden flex flex-col">
                        <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-500 text-white text-lg font-black shadow-lg shadow-indigo-500/20">3</div>
                                <CardTitle className="text-2xl font-black italic underline decoration-indigo-500/40 underline-offset-8 text-indigo-100">Deploy de Dados</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 flex-1 flex flex-col gap-6">
                            <div
                                className={`relative group border-2 border-dashed rounded-[2rem] p-12 text-center transition-all duration-500 cursor-pointer select-none overflow-hidden ${dragOver
                                    ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02] shadow-2xl shadow-indigo-500/20'
                                    : 'border-white/10 hover:border-indigo-500/50 bg-white/5 hover:bg-white/[0.07]'
                                    }`}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('xlsx-input')?.click()}
                            >
                                <input
                                    id="xlsx-input"
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) setFile(f);
                                    }}
                                />
                                {file ? (
                                    <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                                        <div className="h-20 w-20 rounded-3xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
                                            <FileSpreadsheet className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <p className="font-black text-xl text-emerald-100 truncate max-w-[200px] mx-auto">{file.name}</p>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">{(file.size / 1024).toFixed(1)} KB — PRONTO</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-muted-foreground group-hover:text-indigo-300 transition-colors">
                                        <div className={`h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-indigo-500/40 transition-all ${dragOver ? 'animate-bounce' : ''}`}>
                                            <Upload className="h-10 w-10" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">Arraste para importar</p>
                                            <p className="text-xs uppercase tracking-tighter mt-1 opacity-60">Suporta .xlsx e .xls legíveis</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => file && importMutation.mutate(file)}
                                disabled={!file || importMutation.isPending}
                                className="group relative w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all duration-300 disabled:opacity-40 shadow-xl hover:shadow-indigo-600/30"
                            >
                                <div className="relative z-10 flex items-center justify-center gap-3">
                                    {importMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />}
                                    <span>{importMutation.isPending ? 'PROCESSANDO...' : 'EXECUTAR IMPORTAÇÃO'}</span>
                                </div>
                            </button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Result */}
            {importMutation.isSuccess && (
                <Card className="rounded-[2.5rem] border-none glass-dark bg-emerald-500/[0.03] overflow-hidden animate-in slide-in-from-top-4 duration-700">
                    <CardHeader className="p-8 border-b border-emerald-500/10">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-black text-emerald-100">Transação Finalizada</CardTitle>
                                <p className="text-emerald-500/60 text-sm font-bold uppercase tracking-widest">{importMutation.data.message}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20 text-center">
                                <p className="text-[10px] font-black uppercase text-emerald-500 tracking-tighter mb-1">Criados</p>
                                <p className="text-4xl font-black text-emerald-50">{importMutation.data.created}</p>
                            </div>
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/10 text-center">
                                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter mb-1">Ignorados</p>
                                <p className="text-4xl font-black text-white">{importMutation.data.skipped}</p>
                            </div>
                            <div className={`rounded-3xl p-6 border text-center ${importMutation.data.errors.length > 0 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-white/5 border-white/10 opacity-30'}`}>
                                <p className="text-[10px] font-black uppercase tracking-tighter mb-1">Erros</p>
                                <p className="text-4xl font-black">{importMutation.data.errors.length}</p>
                            </div>
                            <div className="bg-primary/10 rounded-3xl p-6 border border-primary/20 text-center">
                                <p className="text-[10px] font-black uppercase text-primary tracking-tighter mb-1">Status</p>
                                <p className="text-xl font-black text-primary mt-2">100% OK</p>
                            </div>
                        </div>

                        {importMutation.data.errors.length > 0 && (
                            <div className="space-y-4">
                                <p className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" /> Relatório de Inconsistências
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {importMutation.data.errors.map((err, i) => (
                                        <div key={i} className="flex items-center gap-4 p-4 glass-dark rounded-2xl border-white/5 hover:border-destructive/30 transition-colors">
                                            <div className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive flex-shrink-0 flex items-center justify-center font-black text-xs">
                                                L {err.row}
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground italic leading-tight">{err.error}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {importMutation.isError && (
                <Card className="rounded-[2.5rem] border-none glass shadow-2xl bg-destructive/5 overflow-hidden animate-in zoom-in duration-500">
                    <CardHeader className="p-8 border-b border-destructive/10">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-destructive text-white flex items-center justify-center">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <CardTitle className="text-2xl font-black text-destructive">Falha na Integridade</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <p className="text-lg font-medium text-muted-foreground italic leading-relaxed">
                            {importMutation.error.message}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
