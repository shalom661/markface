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
            <div className="flex flex-col items-center justify-center p-20 space-y-6 min-h-[60vh] animate-in fade-in duration-700">
                <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <Loader2 className="h-10 w-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="space-y-2 text-center">
                    <p className="text-2xl font-black tracking-tight text-primary">Carregando Modelo</p>
                    <p className="text-muted-foreground font-medium animate-pulse">Sincronizando dados com o servidor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-32 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/products')}
                        className="h-12 w-12 rounded-2xl border-primary/20 hover:bg-primary/5 transition-all"
                    >
                        <ChevronLeft className="h-6 w-6 text-primary" />
                    </Button>
                    <div>
                        <h2 className="text-4xl font-extrabold tracking-tight">Editar Produto</h2>
                        <p className="text-muted-foreground text-lg mt-1">Atualizando: <span className="text-primary font-bold">{name || '---'}</span></p>
                    </div>
                </div>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-2 gap-4 p-1.5 bg-muted/30 rounded-3xl glass border-white/20 h-20">
                <button
                    onClick={() => setType('manufactured')}
                    className={`flex items-center justify-center gap-3 text-lg font-bold rounded-2xl transition-all duration-300 ${type === 'manufactured'
                            ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[0.98]'
                            : 'hover:bg-background/50 text-muted-foreground'
                        }`}
                >
                    <Scissors className={`h-6 w-6 ${type === 'manufactured' ? 'animate-bounce' : ''}`} />
                    Produção Própria
                </button>
                <button
                    onClick={() => setType('resale')}
                    className={`flex items-center justify-center gap-3 text-lg font-bold rounded-2xl transition-all duration-300 ${type === 'resale'
                            ? 'bg-card text-foreground shadow-xl scale-[0.98] border border-primary/10'
                            : 'hover:bg-background/50 text-muted-foreground'
                        }`}
                >
                    <Truck className={`h-6 w-6 ${type === 'resale' ? 'animate-bounce' : ''}`} />
                    Revenda Externa
                </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* BASIC INFO CARD */}
                <Card className="rounded-3xl border-none glass overflow-hidden shadow-2xl">
                    <CardHeader className="border-b border-primary/10 bg-primary/5 p-8">
                        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Shirt className="h-6 w-6" />
                            </div>
                            Identificação do Modelo
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold ml-1">Nome do Modelo <span className="text-destructive">*</span></Label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="h-12 rounded-xl border-primary/10 focus:border-primary/30 transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold ml-1">Código Interno <span className="text-destructive">*</span></Label>
                                <Input
                                    value={internalCode}
                                    onChange={e => setInternalCode(e.target.value)}
                                    className="h-12 rounded-xl border-primary/10 focus:border-primary/30 transition-all font-mono"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold ml-1">Descrição</Label>
                            <Textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="resize-none rounded-xl border-primary/10 focus:border-primary/30 transition-all min-h-[100px]"
                                rows={3}
                            />
                        </div>

                        {type === 'resale' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold ml-1">Fornecedor <span className="text-destructive">*</span></Label>
                                    <select
                                        className="flex h-12 w-full rounded-xl border border-primary/10 bg-background px-4 py-2 text-sm font-medium transition-all focus:ring-2 focus:ring-primary/20 outline-none"
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
                                    <Label className="text-sm font-semibold ml-1">Cód. no Fornecedor</Label>
                                    <Input
                                        value={supplierCode}
                                        onChange={e => setSupplierCode(e.target.value)}
                                        className="h-12 rounded-xl border-primary/10 focus:border-primary/30"
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* VARIATIONS SECTION */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                <Package className="h-6 w-6" />
                            </div>
                            <h3 className="text-2xl font-bold tracking-tight">Variações & Engenharia</h3>
                        </div>
                        <Button
                            onClick={handleAddVariant}
                            variant="outline"
                            className="h-11 rounded-xl border-primary/20 hover:bg-primary/5 gap-2 px-5 font-bold"
                        >
                            <Plus className="h-5 w-5" /> Adicionar Grade
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {variants.map((variant, vIdx) => (
                            <div key={vIdx} className="group">
                                <Card className={`rounded-3xl border-none glass overflow-hidden transition-all duration-300 shadow-lg ${variant.isExpanded ? 'ring-2 ring-primary/30 shadow-2xl' : 'hover:shadow-xl'}`}>
                                    <div
                                        className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${variant.isExpanded ? 'bg-primary/5' : 'hover:bg-primary/5'}`}
                                        onClick={() => handleVariantChange(vIdx, { isExpanded: !variant.isExpanded })}
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                                                {vIdx + 1}
                                            </div>
                                            <div>
                                                <div className="font-bold text-lg">
                                                    {variant.sku || <span className="text-muted-foreground italic font-normal text-sm">SKU não definido</span>}
                                                </div>
                                                <div className="flex gap-2 mt-1">
                                                    {variant.attributes.color && (
                                                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                                            {variant.attributes.color}
                                                        </span>
                                                    )}
                                                    {variant.attributes.size && (
                                                        <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                                                            Tam: {variant.attributes.size}
                                                        </span>
                                                    )}
                                                    {type === 'manufactured' && variant.materials.length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                                                            {variant.materials.length} Insumos
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all"
                                                onClick={(e) => { e.stopPropagation(); handleDuplicateVariant(vIdx); }}
                                                title="Duplicar Grade"
                                            >
                                                <Copy className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                                                onClick={(e) => { e.stopPropagation(); handleRemoveVariant(vIdx); }}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                            <div className={`transition-transform duration-300 ${variant.isExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>

                                    {variant.isExpanded && (
                                        <CardContent className="p-8 pt-2 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="h-px bg-primary/10 w-full mb-6" />

                                            {/* SKU and ATTRIBUTES */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">SKU desta Variação <span className="text-destructive">*</span></Label>
                                                    <Input
                                                        value={variant.sku}
                                                        onChange={e => handleVariantChange(vIdx, { sku: e.target.value })}
                                                        className="h-11 rounded-xl border-primary/10 font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Cor / Estampa</Label>
                                                    <Input
                                                        value={variant.attributes.color}
                                                        onChange={e => handleAttributeChange(vIdx, 'color', e.target.value)}
                                                        className="h-11 rounded-xl border-primary/10"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Tamanho / Grade</Label>
                                                    <Input
                                                        value={variant.attributes.size}
                                                        onChange={e => handleAttributeChange(vIdx, 'size', e.target.value)}
                                                        className="h-11 rounded-xl border-primary/10"
                                                    />
                                                </div>
                                            </div>

                                            {/* BOM Section per variant */}
                                            {type === 'manufactured' && (
                                                <div className="space-y-6 pt-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1 h-5 bg-primary rounded-full" />
                                                            <Label className="text-base font-bold text-foreground">Ficha Técnica Detalhada</Label>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAddMaterial(vIdx)}
                                                            className="h-9 px-4 rounded-xl text-xs font-bold gap-2 text-primary hover:bg-primary/5 border border-primary/10 transition-all"
                                                        >
                                                            <Plus className="h-4 w-4" /> Adicionar Componente
                                                        </Button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        {variant.materials.map((mat, mIdx) => (
                                                            <div key={mIdx} className="grid grid-cols-12 gap-3 items-end p-4 rounded-2xl bg-muted/20 border border-primary/5 hover:border-primary/20 transition-all">
                                                                <div className="col-span-12 lg:col-span-5 space-y-1.5">
                                                                    <Label className="text-[10px] font-bold text-muted-foreground ml-1">Insumo Selecionado</Label>
                                                                    <select
                                                                        className="flex h-11 w-full rounded-xl border border-primary/10 bg-background px-4 py-2 text-sm font-medium transition-all outline-none"
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
                                                                <div className="col-span-6 lg:col-span-3 space-y-1.5">
                                                                    <Label className="text-[10px] font-bold text-muted-foreground ml-1">Quantidade</Label>
                                                                    <Input
                                                                        className="h-11 rounded-xl border-primary/10 text-center font-bold"
                                                                        type="number"
                                                                        value={mat.quantity}
                                                                        onChange={e => handleMaterialChange(vIdx, mIdx, { quantity: e.target.value })}
                                                                    />
                                                                </div>
                                                                <div className="col-span-4 lg:col-span-3 space-y-1.5">
                                                                    <Label className="text-[10px] font-bold text-muted-foreground ml-1">Unid. Override</Label>
                                                                    <select
                                                                        className="flex h-11 w-full rounded-xl border border-primary/10 bg-background px-3 py-2 text-xs font-medium transition-all outline-none"
                                                                        value={mat.unit_override || ''}
                                                                        onChange={e => handleMaterialChange(vIdx, mIdx, { unit_override: e.target.value })}
                                                                    >
                                                                        <option value="">Padrão do Insumo</option>
                                                                        <option value="metrose">Metros</option>
                                                                        <option value="gramas">Gramas</option>
                                                                        <option value="unidades">Unidades</option>
                                                                        <option value="litros">Litros</option>
                                                                        <option value="kg">Kg</option>
                                                                    </select>
                                                                </div>
                                                                <div className="col-span-2 lg:col-span-1 flex justify-end">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-11 w-11 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                                                                        onClick={() => handleRemoveMaterial(vIdx, mIdx)}
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {variant.materials.length === 0 && (
                                                            <div className="border-2 border-dashed border-primary/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center bg-primary/5">
                                                                <Scissors className="h-10 w-10 text-primary/20 mb-3" />
                                                                <p className="text-muted-foreground font-medium">Nenhum insumo configurado.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    )}
                                </Card>
                            </div>
                        ))}

                        <Button
                            variant="ghost"
                            className="w-full border-2 border-dashed border-primary/20 h-24 rounded-3xl text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/40 transition-all gap-3 text-lg font-bold"
                            onClick={handleAddVariant}
                        >
                            <Plus className="h-6 w-6" /> Adicionar Outra Variação na Grade
                        </Button>
                    </div>
                </div>
            </div>

            {/* Bottom Actions Fixed */}
            <div className="fixed bottom-0 left-0 right-0 p-6 border-t border-primary/10 bg-background/80 backdrop-blur-xl lg:left-64 flex justify-between items-center z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/products')}
                    className="h-12 px-8 rounded-xl font-bold hover:bg-muted"
                >
                    Descartar Alterações
                </Button>
                <div className="flex gap-4">
                    <Button
                        onClick={handleSave}
                        disabled={updateMutation.isPending}
                        className="h-14 px-12 rounded-2xl text-lg font-black bg-emerald-600 text-white shadow-2xl shadow-emerald-500/30 hover:bg-emerald-700 hover:scale-105 active:scale-95 transition-all gap-3"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="h-6 w-6 animate-spin" />
                        ) : (
                            <Save className="h-6 w-6" />
                        )}
                        {updateMutation.isPending ? "Gravando..." : "Confirmar e Salvar"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
