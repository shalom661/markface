import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, Save, Plus, Trash2, Package, Scissors, Shirt, Copy, ChevronDown, ChevronUp
} from 'lucide-react';

import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface VariantState {
    sku: string;
    attributes: {
        size: string;
        color: string;
    };
    materials: Array<{
        raw_material_id: string;
        quantity: string;
        unit_override?: string;
    }>;
    isExpanded?: boolean;
}

export default function ProductCreate() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Core Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [internalCode, setInternalCode] = useState('');
    const [isActive] = useState(true);

    // Advanced Type State
    const [type, setType] = useState<'manufactured' | 'resale'>('manufactured');

    // Resale Specific
    const [supplierId, setSupplierId] = useState<string>('');
    const [supplierCode, setSupplierCode] = useState('');

    // Variations / BOM State
    const [variants, setVariants] = useState<VariantState[]>([
        {
            sku: '',
            attributes: { size: '', color: '' },
            materials: [],
            isExpanded: true
        }
    ]);

    // Data Fetching for Dropdowns
    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => (await api.get('/suppliers')).data
    });

    const { data: rawMaterialsData } = useQuery({
        queryKey: ['raw-materials'],
        queryFn: async () => (await api.get('/raw-materials')).data
    });

    const createMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.post('/products', payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast({
                title: "Produto criado!",
                description: "O produto e suas variações foram salvos com sucesso.",
            });
            navigate('/products');
        },
        onError: (err: any) => {
            let errorMsg = "Ocorreu um erro inesperado.";
            const detail = err.response?.data?.detail;

            if (typeof detail === 'string') {
                errorMsg = detail;
            } else if (Array.isArray(detail)) {
                errorMsg = detail.map((d: any) => `${d.loc?.join('.') || 'Erro'}: ${d.msg}`).join('\n');
            } else if (err.message) {
                errorMsg = err.message;
            }

            toast({
                variant: "destructive",
                title: "Falha na Criação",
                description: <pre className="whitespace-pre-wrap font-sans text-xs">{errorMsg}</pre>,
            });
        }
    });

    const handleAddVariant = () => {
        setVariants([
            ...variants.map(v => ({ ...v, isExpanded: false })),
            {
                sku: '',
                attributes: { size: '', color: '' },
                materials: [],
                isExpanded: true
            }
        ]);
    };

    const handleDuplicateVariant = (index: number) => {
        const source = variants[index];
        const newVariant = JSON.parse(JSON.stringify(source));
        newVariant.sku = ''; // Don't duplicate SKU
        newVariant.isExpanded = true;

        setVariants([
            ...variants.map(v => ({ ...v, isExpanded: false })),
            newVariant
        ]);

        toast({
            title: "Variação duplicada",
            description: "A nova variação foi criada com os mesmos insumos da anterior."
        });
    };

    const handleRemoveVariant = (index: number) => {
        if (variants.length === 1) {
            toast({ variant: "destructive", title: "Ação negada", description: "O produto deve ter pelo menos uma variação." });
            return;
        }
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleVariantChange = (index: number, updates: Partial<VariantState>) => {
        const newVariants = [...variants];
        newVariants[index] = { ...newVariants[index], ...updates };
        setVariants(newVariants);
    };

    const handleAttributeChange = (index: number, key: 'size' | 'color', value: string) => {
        const newVariants = [...variants];
        newVariants[index].attributes = { ...newVariants[index].attributes, [key]: value };
        setVariants(newVariants);
    };

    // Material logic per variant
    const handleAddMaterial = (variantIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].materials.push({ raw_material_id: '', quantity: '1.0' });
        setVariants(newVariants);
    };

    const handleRemoveMaterial = (variantIndex: number, materialIndex: number) => {
        const newVariants = [...variants];
        newVariants[variantIndex].materials = newVariants[variantIndex].materials.filter((_, i) => i !== materialIndex);
        setVariants(newVariants);
    };

    const handleMaterialChange = (variantIndex: number, materialIndex: number, updates: any) => {
        const newVariants = [...variants];
        newVariants[variantIndex].materials[materialIndex] = { ...newVariants[variantIndex].materials[materialIndex], ...updates };
        setVariants(newVariants);
    };

    const handleSave = () => {
        if (!name.trim() || !internalCode.trim()) {
            toast({ variant: "destructive", title: "Atenção", description: "Preencha o nome e o código interno do produto." });
            return;
        }

        const isManufactured = type === 'manufactured';

        if (!isManufactured && !supplierId) {
            toast({ variant: "destructive", title: "Atenção", description: "O fornecedor é obrigatório para produtos de revenda." });
            return;
        }

        // Validate variants
        for (const [idx, v] of variants.entries()) {
            if (!v.sku.trim()) {
                toast({ variant: "destructive", title: "Atenção", description: `O SKU da variação ${idx + 1} é obrigatório.` });
                return;
            }
        }

        const payload: any = {
            name,
            description: description || null,
            active: isActive,
            is_manufactured: isManufactured,
            internal_code: internalCode,
            variants: variants.map(v => ({
                sku: v.sku,
                attributes: v.attributes,
                active: true,
                materials: isManufactured ? v.materials
                    .filter(m => m.raw_material_id && parseFloat(m.quantity) > 0)
                    .map(m => ({
                        raw_material_id: m.raw_material_id,
                        quantity: parseFloat(m.quantity),
                        unit_override: m.unit_override || null
                    })) : []
            }))
        };

        if (!isManufactured) {
            payload.supplier_id = supplierId;
            payload.supplier_code = supplierCode || null;
        }

        createMutation.mutate(payload);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 mt-6">
            {/* Header Area */}
            <div className="flex items-center gap-4 mb-8">
                <Button variant="outline" size="icon" onClick={() => navigate('/products')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Novo Produto</h2>
                    <p className="text-muted-foreground">Configure variaçōes e ficha técnica individual.</p>
                </div>
            </div>

            {/* Type Selector */}
            <div className="flex bg-muted/50 p-1 mb-6 rounded-lg h-14">
                <button
                    onClick={() => setType('manufactured')}
                    className={`flex-1 flex items-center justify-center gap-2 text-lg rounded-md transition-all ${type === 'manufactured' ? 'bg-primary text-primary-foreground shadow' : 'hover:bg-background/50 text-muted-foreground'}`}
                >
                    <Scissors className="h-5 w-5" /> Fabricação Própria
                </button>
                <button
                    onClick={() => setType('resale')}
                    className={`flex-1 flex items-center justify-center gap-2 text-lg rounded-md transition-all ${type === 'resale' ? 'bg-card shadow' : 'hover:bg-background/50 text-muted-foreground'}`}
                >
                    <Package className="h-5 w-5" /> Revenda
                </button>
            </div>

            {/* BASIC INFO CARD */}
            <Card className="border-border/40 shadow-sm backdrop-blur-sm bg-card/95">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shirt className="h-5 w-5 text-primary" /> Informações do Cabeçalho
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Produto <span className="text-destructive">*</span></Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Camiseta Básica Algodão" />
                        </div>
                        <div className="space-y-2">
                            <Label>Código Interno <span className="text-destructive">*</span></Label>
                            <Input value={internalCode} onChange={e => setInternalCode(e.target.value)} placeholder="Ex: MOD-001" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Descrição geral do modelo..."
                            className="resize-none"
                            rows={2}
                        />
                    </div>

                    {type === 'resale' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label>Fornecedor <span className="text-destructive">*</span></Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                    value={supplierId}
                                    onChange={e => setSupplierId(e.target.value)}
                                >
                                    <option value="">Selecione o fornecedor...</option>
                                    {suppliersData?.items?.map((sup: any) => (
                                        <option key={sup.id} value={sup.id}>{sup.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Cód. no Fornecedor</Label>
                                <Input value={supplierCode} onChange={e => setSupplierCode(e.target.value)} placeholder="Opcional" />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* VARIATIONS SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" /> Variações & Ficha Técnica
                    </h3>
                    <Button onClick={handleAddVariant} variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Adicionar Variação
                    </Button>
                </div>

                {variants.map((variant, vIdx) => (
                    <Card key={vIdx} className={`border-border/40 shadow-sm overflow-hidden transition-all duration-200 ${variant.isExpanded ? 'ring-1 ring-primary/20' : ''}`}>
                        <div
                            className="bg-muted/30 p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => handleVariantChange(vIdx, { isExpanded: !variant.isExpanded })}
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                    {vIdx + 1}
                                </div>
                                <div>
                                    <span className="font-medium text-sm">
                                        {variant.sku || `Variação ${vIdx + 1}`}
                                    </span>
                                    {(variant.attributes.color || variant.attributes.size) && (
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({variant.attributes.color} / {variant.attributes.size})
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground"
                                    onClick={(e) => { e.stopPropagation(); handleDuplicateVariant(vIdx); }}
                                    title="Clonar esta variação"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleRemoveVariant(vIdx); }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                {variant.isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
                            </div>
                        </div>

                        {variant.isExpanded && (
                            <CardContent className="p-6 space-y-6 animate-in fade-in duration-300">
                                {/* SKU and ATTRIBUTES */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-muted-foreground">SKU <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={variant.sku}
                                            onChange={e => handleVariantChange(vIdx, { sku: e.target.value })}
                                            placeholder="Ex: MOD001-P-PRETO"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-muted-foreground">Cor</Label>
                                        <Input
                                            value={variant.attributes.color}
                                            onChange={e => handleAttributeChange(vIdx, 'color', e.target.value)}
                                            placeholder="Ex: Preto"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-muted-foreground">Tamanho</Label>
                                        <Input
                                            value={variant.attributes.size}
                                            onChange={e => handleAttributeChange(vIdx, 'size', e.target.value)}
                                            placeholder="Ex: G"
                                        />
                                    </div>
                                </div>

                                {/* BOM Section per variant */}
                                {type === 'manufactured' && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">Insumos desta Variação</Label>
                                            <Button variant="ghost" size="sm" onClick={() => handleAddMaterial(vIdx)} className="h-7 text-xs gap-1 text-primary">
                                                <Plus className="h-3 w-3" /> Adicionar Matéria Prima
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {variant.materials.map((mat, mIdx) => (
                                                <div key={mIdx} className="grid grid-cols-12 gap-2 items-end">
                                                    <div className="col-span-6 lg:col-span-6 space-y-1">
                                                        <select
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                            value={mat.raw_material_id}
                                                            onChange={e => handleMaterialChange(vIdx, mIdx, { raw_material_id: e.target.value })}
                                                        >
                                                            <option value="">Selecione o insumo...</option>
                                                            {rawMaterialsData?.items?.map((rm: any) => (
                                                                <option key={rm.id} value={rm.id}>
                                                                    {rm.description} ({rm.unit})
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-3 lg:col-span-2">
                                                        <Input
                                                            className="h-9"
                                                            type="number"
                                                            placeholder="Qtd"
                                                            value={mat.quantity}
                                                            onChange={e => handleMaterialChange(vIdx, mIdx, { quantity: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 lg:col-span-3">
                                                        <select
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                            value={mat.unit_override || ''}
                                                            onChange={e => handleMaterialChange(vIdx, mIdx, { unit_override: e.target.value })}
                                                        >
                                                            <option value="">Unidade Padrão</option>
                                                            <option value="metrose">Metros</option>
                                                            <option value="gramas">Gramas</option>
                                                            <option value="unidades">Unidades</option>
                                                            <option value="litros">Litros</option>
                                                            <option value="kg">Kg</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 flex justify-end">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-9 w-9 text-destructive"
                                                            onClick={() => handleRemoveMaterial(vIdx, mIdx)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {variant.materials.length === 0 && (
                                                <div className="border border-dashed rounded-md p-6 text-center text-muted-foreground text-xs bg-muted/20">
                                                    Nenhum insumo configurado para esta variação.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                ))}

                <Button variant="ghost" className="w-full border-dashed border h-16 text-muted-foreground hover:text-primary transition-all gap-2" onClick={handleAddVariant}>
                    <Plus className="h-4 w-4" /> Criar Outra Variação (Ex: Tamanho Diferente)
                </Button>
            </div>

            {/* Bottom Actions Fixed */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-md lg:left-64 flex justify-end gap-3 z-10 shadow-lg">
                <Button variant="ghost" onClick={() => navigate('/products')}>Cancelar</Button>
                <Button
                    onClick={handleSave}
                    disabled={createMutation.isPending}
                    className="gap-2 px-10 shadow-primary/20 shadow-lg"
                >
                    <Save className="h-4 w-4" />
                    {createMutation.isPending ? "Salvando Tudo..." : "Finalizar Cadastro"}
                </Button>
            </div>
        </div>
    );
}
