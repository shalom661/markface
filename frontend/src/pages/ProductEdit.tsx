import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft, Save, Package, Scissors, Truck, Trash2, Plus, Loader2, Copy, ChevronUp, ChevronDown, Shirt
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface VariantState {
    id?: string;
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

export default function ProductEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Core Form State
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [internalCode, setInternalCode] = useState('');
    const [isActive, setIsActive] = useState(true);

    // Advanced Type State
    const [type, setType] = useState<'manufactured' | 'resale'>('manufactured');

    // Resale Specific
    const [supplierId, setSupplierId] = useState<string>('');
    const [supplierCode, setSupplierCode] = useState('');

    // Variations / BOM State
    const [variants, setVariants] = useState<VariantState[]>([]);

    // Data Fetching for the Product
    const { data: product, isLoading: isLoadingProduct } = useQuery({
        queryKey: ['products', id],
        queryFn: async () => (await api.get(`/products/${id}`)).data,
        enabled: !!id
    });

    // Populate state when product data arrives
    useEffect(() => {
        if (product) {
            setName(product.name);
            setDescription(product.description || '');
            setInternalCode(product.internal_code);
            setIsActive(product.active);
            setType(product.is_manufactured ? 'manufactured' : 'resale');
            setSupplierId(product.supplier_id || '');
            setSupplierCode(product.supplier_code || '');

            if (product.variants && product.variants.length > 0) {
                setVariants(product.variants.map((v: any, idx: number) => ({
                    id: v.id,
                    sku: v.sku,
                    attributes: {
                        size: v.attributes?.size || '',
                        color: v.attributes?.color || ''
                    },
                    materials: v.materials ? v.materials.map((m: any) => ({
                        raw_material_id: m.raw_material_id,
                        quantity: m.quantity.toString(),
                        unit_override: m.unit_override || ''
                    })) : [],
                    isExpanded: idx === 0 // Expand first one by default
                })));
            } else {
                // Should not happen if data is consistent, but fallback
                setVariants([{
                    sku: '',
                    attributes: { size: '', color: '' },
                    materials: [],
                    isExpanded: true
                }]);
            }
        }
    }, [product]);

    // Data Fetching for Dropdowns
    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => (await api.get('/suppliers')).data
    });

    const { data: rawMaterialsData } = useQuery({
        queryKey: ['raw-materials'],
        queryFn: async () => (await api.get('/raw-materials')).data
    });

    const updateMutation = useMutation({
        mutationFn: async (payload: any) => {
            const { data } = await api.put(`/products/${id}`, payload);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['products', id] });
            toast({
                title: "Produto atualizado!",
                description: "As alterações foram salvas com sucesso.",
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
            }

            toast({
                variant: "destructive",
                title: "Falha na Atualização",
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
        delete newVariant.id; // New variant doesn't have an ID
        newVariant.sku = `${source.sku}-COPY`;
        newVariant.isExpanded = true;

        setVariants([
            ...variants.map(v => ({ ...v, isExpanded: false })),
            newVariant
        ]);

        toast({
            title: "Variação duplicada",
            description: "Ajuste o SKU e os detalhes necessários."
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
            toast({ variant: "destructive", title: "Atenção", description: "O nome e o código interno são obrigatórios." });
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
                id: v.id || null,
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

        if (isManufactured) {
            payload.supplier_id = null;
            payload.supplier_code = null;
        } else {
            payload.supplier_id = supplierId;
            payload.supplier_code = supplierCode || null;
        }

        updateMutation.mutate(payload);
    };

    if (isLoadingProduct) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Carregando dados do produto...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 mt-6 animate-in slide-in-from-bottom-2 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/products')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Editar {name || 'Produto'}</h2>
                        <p className="text-muted-foreground">Atualize configurações e fichas técnicas.</p>
                    </div>
                </div>
            </div>

            {/* Type Selector (Disabled in Edit if you want, but user asked for full editing) */}
            <div className="flex bg-muted p-1 rounded-lg h-14">
                <button
                    onClick={() => setType('manufactured')}
                    className={`flex-1 flex items-center justify-center gap-2 text-md font-medium rounded-md transition-all ${type === 'manufactured' ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Scissors className="h-4 w-4" /> Próprio
                </button>
                <button
                    onClick={() => setType('resale')}
                    className={`flex-1 flex items-center justify-center gap-2 text-md font-medium rounded-md transition-all ${type === 'resale' ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Truck className="h-4 w-4" /> Revenda
                </button>
            </div>

            {/* BASIC INFO CARD */}
            <Card className="border-border/40 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Shirt className="h-5 w-5 text-primary" /> Cabeçalho Principal
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Modelo <span className="text-destructive">*</span></Label>
                            <Input value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Cód. Interno <span className="text-destructive">*</span></Label>
                            <Input value={internalCode} onChange={e => setInternalCode(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="resize-none"
                            rows={2}
                        />
                    </div>

                    {type === 'resale' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label>Fornecedor <span className="text-destructive">*</span></Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
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
                                <Input value={supplierCode} onChange={e => setSupplierCode(e.target.value)} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* VARIATIONS SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" /> Variações
                    </h3>
                    <Button onClick={handleAddVariant} variant="outline" size="sm" className="gap-2">
                        <Plus className="h-4 w-4" /> Nova Variação
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
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                        {variant.sku || `Variação ${vIdx + 1}`}
                                    </span>
                                    {(variant.attributes.color || variant.attributes.size) && (
                                        <span className="text-xs text-muted-foreground">
                                            {variant.attributes.color} {variant.attributes.size && `| Tam: ${variant.attributes.size}`}
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
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-muted-foreground">SKU <span className="text-destructive">*</span></Label>
                                        <Input
                                            value={variant.sku}
                                            onChange={e => handleVariantChange(vIdx, { sku: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-muted-foreground">Cor</Label>
                                        <Input
                                            value={variant.attributes.color}
                                            onChange={e => handleAttributeChange(vIdx, 'color', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs uppercase font-bold text-muted-foreground">Tamanho</Label>
                                        <Input
                                            value={variant.attributes.size}
                                            onChange={e => handleAttributeChange(vIdx, 'size', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {type === 'manufactured' && (
                                    <div className="space-y-4 pt-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-semibold">Ficha Técnica desta Variação</Label>
                                            <Button variant="ghost" size="sm" onClick={() => handleAddMaterial(vIdx)} className="h-7 text-xs gap-1 text-primary">
                                                <Plus className="h-3 w-3" /> Adicionar Insumo
                                            </Button>
                                        </div>

                                        <div className="space-y-3">
                                            {variant.materials.map((mat, mIdx) => (
                                                <div key={mIdx} className="grid grid-cols-12 gap-2 items-end">
                                                    <div className="col-span-6 space-y-1">
                                                        <select
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
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
                                                    <div className="col-span-2">
                                                        <Input
                                                            className="h-9"
                                                            type="number"
                                                            value={mat.quantity}
                                                            onChange={e => handleMaterialChange(vIdx, mIdx, { quantity: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="col-span-3">
                                                        <select
                                                            className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm"
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
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>
                ))}

                <Button variant="ghost" className="w-full border-dashed border h-14 text-muted-foreground hover:text-primary transition-all gap-2" onClick={handleAddVariant}>
                    <Plus className="h-4 w-4" /> Nova Variação (Tam/Cor)
                </Button>
            </div>

            {/* Bottom Actions Fixed */}
            <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-background/95 backdrop-blur-md lg:left-64 flex justify-end gap-3 z-10 shadow-lg">
                <Button variant="ghost" onClick={() => navigate('/products')}>Descartar</Button>
                <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending}
                    className="gap-2 px-10 shadow-emerald-500/20 shadow-lg bg-emerald-600 hover:bg-emerald-700"
                >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Confirmar Alterações
                </Button>
            </div>
        </div>
    );
}
