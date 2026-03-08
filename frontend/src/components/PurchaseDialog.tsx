import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface PurchaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'raw_material' | 'resale_product';
}

export default function PurchaseDialog({ open, onOpenChange, type }: PurchaseDialogProps) {
    const queryClient = useQueryClient();
    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [notes, setNotes] = useState('');

    const suppliersArr = Array.isArray(suppliers) ? suppliers : [];
    const rawMaterialsArr = Array.isArray(rawMaterials) ? rawMaterials : [];
    const productsArr = Array.isArray(products) ? products : [];

    const { data: rawMaterials = [] } = useQuery({
        queryKey: ['raw-materials'],
        queryFn: async () => {
            const res = await api.get('/raw-materials');
            return res.data;
        },
        enabled: type === 'raw_material',
    });

    const { data: products = [] } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/products');
            return res.data;
        },
        enabled: type === 'resale_product',
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/purchases', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
            toast.success('Compra registrada com sucesso!');
            onOpenChange(false);
            setItems([]);
            setSupplierId('');
        },
    });

    const addItem = () => {
        setItems([...items, { id: '', quantity: 1, unit_price: 0 }]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const totalValue = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);

    const handleSubmit = () => {
        if (!supplierId || items.length === 0) {
            toast.error('Preencha o fornecedor e adicione itens.');
            return;
        }

        const payload = {
            purchase_date: new Date().toISOString(),
            type: type,
            supplier_id: supplierId,
            total_value: totalValue,
            notes,
            items: items.map(item => ({
                raw_material_id: type === 'raw_material' ? item.id : null,
                variant_id: type === 'resale_product' ? item.id : null,
                quantity: parseFloat(item.quantity),
                unit_price: parseFloat(item.unit_price),
                total_price: item.quantity * item.unit_price
            }))
        };

        createMutation.mutate(payload);
    };

    // Get options for items (raw materials or product variants)
    const itemOptions = type === 'raw_material'
        ? rawMaterialsArr
        : productsArr.filter((p: any) => !p.is_manufactured).flatMap((p: any) =>
            (p.variants || []).map((v: any) => ({
                id: v.id,
                name: `${p.name} (${Object.entries(v.attributes || {}).map(([, v]) => v).join('/')})`
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
                                {suppliersArr.map((s: any) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name || 'Sem Nome'}</SelectItem>
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
                                            {(itemOptions || []).map((opt: any) => (
                                                <SelectItem key={opt.id} value={opt.id}>{opt.name || 'Sem Identificação'}</SelectItem>
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
