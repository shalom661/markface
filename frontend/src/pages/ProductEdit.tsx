import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ChevronLeft,
    Save,
    Package,
    Scissors,
    Truck,
    Trash2,
    Plus,
    Loader2
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

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

    // Manufactured Specific (Bill of Materials)
    const [materials, setMaterials] = useState<Array<{ raw_material_id: string, quantity: string }>>([]);

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

            if (product.materials) {
                setMaterials(product.materials.map((m: any) => ({
                    raw_material_id: m.raw_material_id,
                    quantity: m.quantity.toString()
                })));
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

    const handleAddMaterial = () => {
        setMaterials([...materials, { raw_material_id: '', quantity: '1.0' }]);
    };

    const handleRemoveMaterial = (index: number) => {
        setMaterials(materials.filter((_, i) => i !== index));
    };

    const handleMaterialChange = (index: number, field: 'raw_material_id' | 'quantity', value: string) => {
        const newMaterials = [...materials];
        newMaterials[index][field] = value;
        setMaterials(newMaterials);
    };

    const handleSave = () => {
        if (!name.trim()) {
            toast({ variant: "destructive", title: "Atenção", description: "O nome do produto é obrigatório." });
            return;
        }

        if (!internalCode.trim()) {
            toast({ variant: "destructive", title: "Atenção", description: "O código interno é obrigatório." });
            return;
        }

        const isManufactured = type === 'manufactured';

        if (!isManufactured && !supplierId) {
            toast({ variant: "destructive", title: "Atenção", description: "O fornecedor é obrigatório para produtos de revenda." });
            return;
        }

        const payload: any = {
            name,
            description: description || null,
            active: isActive,
            is_manufactured: isManufactured,
            internal_code: internalCode,
        };

        if (isManufactured) {
            const validMaterials = materials.filter(m => m.raw_material_id && parseFloat(m.quantity) > 0);
            payload.materials = validMaterials.map(m => ({
                raw_material_id: m.raw_material_id,
                quantity: parseFloat(m.quantity)
            }));
            payload.supplier_id = null;
            payload.supplier_code = null;
        } else {
            payload.supplier_id = supplierId;
            payload.supplier_code = supplierCode || null;
            payload.materials = [];
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
        <div className="max-w-[900px] mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate('/products')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Editar Produto</h2>
                        <p className="text-muted-foreground">
                            Atualize as informações de {name || 'produto'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => navigate('/products')}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            <Separator />

            {/* TAB SELECTOR - Now read only / disabled logic could be applied here if needed, but per request we allow all edits */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg w-full max-w-md">
                <button
                    onClick={() => setType('manufactured')}
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'manufactured' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Package className="h-4 w-4" /> Fabricação Própria
                </button>
                <button
                    onClick={() => setType('resale')}
                    className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${type === 'resale' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <Truck className="h-4 w-4" /> Revenda
                </button>
            </div>

            {/* CORE DATA CARD */}
            <Card className="border-border/40 shadow-sm">
                <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                    <CardDescription>Dados essenciais de identificação do produto.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome do Produto <span className="text-destructive">*</span></Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pijama Inverno Soft" />
                        </div>
                        <div className="space-y-2">
                            <Label>Código Interno <span className="text-destructive">*</span></Label>
                            <Input value={internalCode} onChange={e => setInternalCode(e.target.value)} placeholder="Ex: PIJ-INV-001" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Detalhes adicionais sobre a peça..."
                            className="resize-none"
                            rows={3}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary Accent-primary"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                            />
                            <span className="text-sm font-medium">Produto Ativo</span>
                        </label>
                    </div>
                </CardContent>
            </Card>

            {/* FABRICAÇÃO PRÓPRIA TAB */}
            {type === 'manufactured' && (
                <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle>Ficha Técnica (Bill of Materials)</CardTitle>
                            <CardDescription>
                                Atualize as matérias-primas necessárias para construir este produto.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {materials.map((mat, idx) => (
                                <div key={idx} className="flex items-end gap-3 p-4 border rounded-lg bg-muted/10 group hover:border-primary/30 transition-colors">
                                    <div className="flex-1 space-y-2">
                                        <Label className="text-xs text-muted-foreground">Insumo</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={mat.raw_material_id}
                                            onChange={e => handleMaterialChange(idx, 'raw_material_id', e.target.value)}
                                        >
                                            <option value="">Selecione a matéria prima...</option>
                                            {rawMaterialsData?.items?.map((rm: any) => (
                                                <option key={rm.id} value={rm.id}>
                                                    [{rm.category}] {rm.description} ({rm.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label className="text-xs text-muted-foreground">Quantidade</Label>
                                        <Input
                                            type="number"
                                            min="0.001"
                                            step="0.001"
                                            value={mat.quantity}
                                            onChange={e => handleMaterialChange(idx, 'quantity', e.target.value)}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleRemoveMaterial(idx)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            {materials.length === 0 && (
                                <div className="text-center p-8 border-2 border-dashed border-border/50 rounded-lg text-muted-foreground">
                                    <Scissors className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p>Nenhuma matéria-prima adicionada.</p>
                                </div>
                            )}

                            <Button variant="outline" className="w-full border-dashed gap-2" onClick={handleAddMaterial}>
                                <Plus className="h-4 w-4" /> Adicionar Insumo
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* REVENDA TAB */}
            {type === 'resale' && (
                <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <Card className="border-border/40 shadow-sm">
                        <CardHeader>
                            <CardTitle>Dados do Fornecedor</CardTitle>
                            <CardDescription>Para produtos que você apenas compra e revende sem modificação.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <Label>Código no Fornecedor (Opcional)</Label>
                                    <Input
                                        value={supplierCode}
                                        onChange={e => setSupplierCode(e.target.value)}
                                        placeholder="Ex: REF-ABC-999"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
