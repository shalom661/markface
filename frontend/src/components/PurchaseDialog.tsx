import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";

interface PurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'raw_material' | 'resale_product';
}

export default function PurchaseDialog({ open, onOpenChange, type }: PurchaseDialogProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [notes, setNotes] = useState('');

    // Pre-populate with one empty item when dialog opens
    useEffect(() => {
        if (open && items.length === 0) {
            setItems([{ id: '', quantity: 1, unit_price: 0 }]);
        }
    }, [open]);

    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const res = await api.get('/suppliers', { params: { page_size: 100 } });
            return res.data;
        },
        enabled: open,
    });

    const { data: rawMaterialsData } = useQuery({
        queryKey: ['raw-materials', type],
        queryFn: async () => {
            const res = await api.get('/raw-materials', { params: { page_size: 100 } });
            return res.data;
        },
        enabled: open && type === 'raw_material',
    });

    const { data: productsData } = useQuery({
        queryKey: ['products', type],
        queryFn: async () => {
            const res = await api.get('/products', { params: { page_size: 100 } });
            return res.data;
        },
        enabled: open && type === 'resale_product',
    });

    const suppliersArr = Array.isArray(suppliersData) ? suppliersData : (suppliersData?.items || []);
    const rawMaterialsArr = Array.isArray(rawMaterialsData) ? rawMaterialsData : (rawMaterialsData?.items || []);
    const productsArr = Array.isArray(productsData) ? productsData : (productsData?.items || []);

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/purchases', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
            toast({
                title: "Sucesso",
                description: "Compra registrada com sucesso!",
            });
            onOpenChange(false);
            setItems([]);
            setSupplierId('');
            setNotes('');
        },
        onError: (error: any) => {
            const detail = error.response?.data?.detail;
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: typeof detail === 'string' ? detail : 'Verifique os dados da compra e tente novamente.',
            });
        }
    });

    const addItem = () => {
        setItems([...items, { id: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i: number) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const totalValue = items.reduce((acc: number, item: any) => acc + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);

    const handleSubmit = () => {
        const validItems = items.filter(item => item.id && Number(item.quantity) > 0);

        if (!supplierId) {
            toast({
                variant: "destructive",
                title: "Campo Obrigatório",
                description: "Selecione um fornecedor.",
            });
            return;
        }

        if (validItems.length === 0) {
            toast({
                variant: "destructive",
                title: "Itens Inválidos",
                description: "Adicione pelo menos um item com quantidade válida.",
            });
            return;
        }

        const calculatedTotal = validItems.reduce((acc, item) => acc + (Number(item.quantity) * Number(item.unit_price)), 0);

        const payload = {
            purchase_date: new Date().toISOString(),
            type: type,
            supplier_id: supplierId,
            total_value: calculatedTotal,
            notes,
            items: validItems.map(item => ({
                raw_material_id: type === 'raw_material' ? item.id : null,
                variant_id: type === 'resale_product' ? item.id : null,
                quantity: Number(item.quantity),
                unit_price: Number(item.unit_price),
                total_price: Number(item.quantity) * Number(item.unit_price)
            }))
        };

        createMutation.mutate(payload);
    };

    const itemOptions = type === 'raw_material'
        ? rawMaterialsArr.map((m: any) => ({
            id: m.id,
            name: `${m.internal_code || 'S/C'} - ${m.description || 'Sem Descrição'}`
        }))
        : productsArr.flatMap((p: any) =>
            (p.variants || []).filter((v: any) => v).map((v: any) => ({
                id: v.id,
                name: `${p.name || 'Sem Nome'} (${Object.entries(v.attributes || {}).map(([, v]) => v).join('/')})`
            }))
        );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Compra - {type === 'raw_material' ? 'Matéria-Prima' : 'Revenda'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Fornecedor</Label>
                        <Select value={supplierId} onValueChange={setSupplierId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o fornecedor" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliersArr.filter((s: any) => s).map((s: any) => (
                                    <SelectItem key={s.id || Math.random()} value={s.id || ''}>{s.name || 'Sem Nome'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-lg font-semibold">Itens</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4 mr-2" /> Adicionar Item
                            </Button>
                        </div>

                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-end border p-3 rounded-lg bg-muted/30">
                                <div className="col-span-6 space-y-1">
                                    <Label className="text-xs">Item</Label>
                                    <Select value={item.id} onValueChange={(val) => handleItemChange(index, 'id', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(itemOptions || []).filter((opt: any) => opt).map((opt: any) => (
                                                <SelectItem key={opt.id || Math.random()} value={opt.id || ''}>{opt.name || 'Sem Identificação'}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <Label className="text-xs">Qtd</Label>
                                    <Input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-3 space-y-1">
                                    <Label className="text-xs">Preço Unit.</Label>
                                    <Input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                        <Label>Notas</Label>
                        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observações extras..." />
                    </div>

                    <div className="pt-4 border-t flex justify-between items-center">
                        <span className="text-lg font-bold">Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                        {createMutation.isPending ? 'Salvando...' : 'Salvar Compra'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
