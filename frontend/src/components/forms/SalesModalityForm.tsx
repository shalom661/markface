import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Loader2, ShieldCheck } from 'lucide-react';

interface SalesModalityFormProps {
    initialData?: any;
    onSuccess: () => void;
}

export default function SalesModalityForm({ initialData, onSuccess }: SalesModalityFormProps) {
    const { toast } = useToast();
    const [loading, setLoading] = React.useState(false);

    const { register, handleSubmit } = useForm({
        defaultValues: initialData || {
            name: '',
            tax_percent: 0,
            fixed_fee: 0,
            extra_cost: 0
        }
    });

    const onSubmit = async (data: any) => {
        setLoading(true);
        try {
            if (initialData?.id) {
                await api.put(`/sales-modalities/${initialData.id}`, data);
                toast({ title: "Modalidade Atualizada", description: "As taxas foram salvas com sucesso." });
            } else {
                await api.post('/sales-modalities', data);
                toast({ title: "Modalidade Criada", description: "A nova modalidade já está disponível para cálculo." });
            }
            onSuccess();
        } catch (error) {
            toast({
                title: "Erro ao Salvar",
                description: "Não foi possível processar a requisição.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
                <Label className="label-brand ml-1">Nome da Modalidade</Label>
                <Input
                    {...register('name', { required: true })}
                    placeholder="Ex: Mercado Livre, Site Próprio, Whitelabel"
                    className="h-14 rounded-xl smooth-glass border-primary/10 text-sm body-brand placeholder:opacity-20"
                />
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="label-brand ml-1">Taxa Variável (%)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('tax_percent', { valueAsNumber: true })}
                        className="h-14 rounded-xl smooth-glass border-primary/10 text-sm body-brand"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="label-brand ml-1">Taxa Fixa (R$)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('fixed_fee', { valueAsNumber: true })}
                        className="h-14 rounded-xl smooth-glass border-primary/10 text-sm body-brand"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="label-brand ml-1">Custo Extra (R$)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        {...register('extra_cost', { valueAsNumber: true })}
                        className="h-14 rounded-xl smooth-glass border-primary/10 text-sm body-brand"
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-2xl bg-primary text-primary-foreground h3-brand text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <ShieldCheck className="h-5 w-5 mr-2" />}
                {initialData ? 'Confirmar Alterações' : 'Inicializar Modalidade'}
            </Button>
        </form>
    );
}
