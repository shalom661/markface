import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import api from '@/lib/api';

export default function FixedCosts() {
    const queryClient = useQueryClient();
    const [newDesc, setNewDesc] = useState('');
    const [newValue, setNewValue] = useState('');

    const { data: costs } = useQuery({
        queryKey: ['fixed-costs'],
        queryFn: async () => {
            const res = await api.get('/fixed-costs');
            return res.data;
        },
    });

    const costsArr = Array.isArray(costs) ? costs : (costs?.items || []);

    const createMutation = useMutation({
        mutationFn: (newCost: any) => api.post('/fixed-costs', newCost),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fixed-costs'] });
            setNewDesc('');
            setNewValue('');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/fixed-costs/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fixed-costs'] }),
    });

    const handleCreate = () => {
        if (!newDesc || !newValue) return;
        createMutation.mutate({ description: newDesc, value: parseFloat(newValue) });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Gastos Fixos</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Novo Gasto Fixo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-end gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>Descrição</Label>
                            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Ex: Aluguel" />
                        </div>
                        <div className="w-40 space-y-2">
                            <Label>Valor Mensal (R$)</Label>
                            <Input type="number" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                        </div>
                        <Button onClick={handleCreate} disabled={createMutation.isPending}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(costsArr || []).map((cost: any) => (
                    <Card key={cost.id}>
                        <CardContent className="pt-6 flex justify-between items-center">
                            <div>
                                <p className="font-medium">{cost.description}</p>
                                <p className="text-2xl font-bold text-primary">R$ {Number(cost.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(cost.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
