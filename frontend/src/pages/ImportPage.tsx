import { useState } from 'react';
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
    ChevronRight,
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

// Static list — each type gets a card. Set available=false for not-yet-ready ones.
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
        const url = `http://localhost:8000/api/v1/import/template/${selected.key}?token=${encodedToken}`;
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
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Importação de Dados</h2>
                <p className="text-muted-foreground">
                    Importe dados em massa para o Hub utilizando planilhas Excel.
                </p>
            </div>

            {/* STEP 1 — Choose type */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                        Escolha o Tipo de Importação
                    </CardTitle>
                    <CardDescription>
                        Selecione o que você quer importar. Cada tipo tem sua própria planilha modelo.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {TEMPLATES.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => handleSelect(t)}
                                disabled={!t.available}
                                className={`text-left p-4 rounded-lg border-2 transition-all w-full ${selected?.key === t.key
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50 bg-card'
                                    } ${!t.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`p-2 rounded-md flex-shrink-0 ${selected?.key === t.key
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {t.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-sm">{t.label}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{t.description}</div>
                                        {!t.available && (
                                            <Badge variant="secondary" className="mt-2 text-[10px] px-1.5 py-0.5">Em breve</Badge>
                                        )}
                                    </div>
                                    {selected?.key === t.key && (
                                        <ChevronRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* STEP 2 — Download template */}
            {selected && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                            Baixe o Modelo: <span className="text-primary ml-1">{selected.label}</span>
                        </CardTitle>
                        <CardDescription>
                            Baixe o arquivo Excel, preencha os dados e envie de volta no Passo 3.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={downloadTemplate} disabled={downloading} className="gap-2" size="lg">
                            {downloading
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Baixando...</>
                                : <><Download className="h-4 w-4" /> Baixar Modelo de {selected.label} (.xlsx)</>
                            }
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* STEP 3 — Upload */}
            {selected && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                            Envie a Planilha Preenchida
                        </CardTitle>
                        <CardDescription>Arraste o arquivo preenchido aqui ou clique para selecionar.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div
                            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer select-none ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
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
                                <div className="flex flex-col items-center gap-2">
                                    <FileSpreadsheet className="h-10 w-10 text-primary" />
                                    <p className="font-medium text-sm">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB — clique para trocar</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Upload className="h-10 w-10" />
                                    <p className="font-medium">Arraste o arquivo aqui ou clique para selecionar</p>
                                    <p className="text-xs">Formatos: .xlsx, .xls</p>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={() => file && importMutation.mutate(file)}
                            disabled={!file || importMutation.isPending}
                            className="w-full gap-2"
                            size="lg"
                        >
                            {importMutation.isPending
                                ? <><Loader2 className="h-4 w-4 animate-spin" /> Importando...</>
                                : <><Upload className="h-4 w-4" /> Importar {selected.label}</>
                            }
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Result */}
            {importMutation.isSuccess && (
                <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-700">
                            <CheckCircle className="h-5 w-5" /> Importação Concluída
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="font-medium">{importMutation.data.message}</p>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">✅ {importMutation.data.created} criados</Badge>
                            <Badge variant="secondary">⏭ {importMutation.data.skipped} ignorados</Badge>
                            {importMutation.data.errors.length > 0 && (
                                <Badge variant="destructive">❌ {importMutation.data.errors.length} erros</Badge>
                            )}
                        </div>
                        {importMutation.data.errors.length > 0 && (
                            <div className="space-y-1 mt-2">
                                <p className="text-sm font-medium text-destructive">Erros por linha:</p>
                                {importMutation.data.errors.map((err, i) => (
                                    <div key={i} className="text-xs bg-white rounded p-2 border border-destructive/20">
                                        <span className="font-medium">Linha {err.row}:</span> {err.error}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {importMutation.isError && (
                <Card className="border-destructive/30 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Erro na Importação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-destructive">{importMutation.error.message}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
