import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { Loader2, Plus } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { type CategoryField } from "@/lib/category-config"
import { SuggestedInput } from "./SuggestedInput"

interface Category {
    id: string;
    name: string;
    fields: CategoryField[];
    active: boolean;
}

interface Unit {
    id: string;
    name: string;
    symbol: string;
    active: boolean;
}

const formSchema = z.object({
    category: z.string().min(1, "Categoria é obrigatória"),
    subcategory: z.string().max(100).optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    internal_code: z.string().max(100).optional().or(z.literal("")),
    supplier_code: z.string().max(100).optional().or(z.literal("")),
    supplier_id: z.string().min(1, "Fornecedor é obrigatório"),
    unit: z.string().max(50).optional().or(z.literal("")),
    color: z.string().max(100).optional().or(z.literal("")),
    composition: z.string().max(255).optional().or(z.literal("")),
    minimum_order: z.string().optional().or(z.literal("")),
    active: z.boolean(),
    category_fields: z.record(z.string(), z.any()),
})

type FormValues = z.infer<typeof formSchema>

interface RawMaterialFormProps {
    rawMaterial?: any | null
    onSuccess?: () => void
}

export function RawMaterialForm({ rawMaterial, onSuccess }: RawMaterialFormProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>(rawMaterial?.category || "")

    const { data: categories = [] } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data } = await api.get("/categories")
            return data
        }
    })

    const { data: suppliersData } = useQuery({
        queryKey: ["suppliers"],
        queryFn: async () => {
            const { data } = await api.get("/suppliers")
            return data
        }
    })

    const { data: units = [] } = useQuery<Unit[]>({
        queryKey: ["units"],
        queryFn: async () => {
            const { data } = await api.get("/units?active_only=true")
            return data
        }
    })

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            category: rawMaterial?.category || "",
            subcategory: rawMaterial?.subcategory || "",
            description: rawMaterial?.description || "",
            internal_code: rawMaterial?.internal_code || "",
            supplier_code: rawMaterial?.supplier_code || "",
            supplier_id: rawMaterial?.supplier_id || (rawMaterial?.supplier?.id || ""),
            unit: rawMaterial?.unit || "kg",
            color: rawMaterial?.color || "",
            composition: rawMaterial?.composition || "",
            minimum_order: rawMaterial?.minimum_order?.toString() || "",
            active: rawMaterial?.active ?? true,
            category_fields: rawMaterial?.category_fields || {},
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const payload = {
                ...data,
                subcategory: data.subcategory || null,
                description: data.description || null,
                internal_code: data.internal_code || null,
                supplier_code: data.supplier_code || null,
                color: data.color || null,
                composition: data.composition || null,
                minimum_order: data.minimum_order ? Number(data.minimum_order) : null,
            }
            if (rawMaterial?.id) {
                const response = await api.put(`/raw-materials/${rawMaterial.id}`, payload)
                return response.data
            } else {
                const response = await api.post("/raw-materials", payload)
                return response.data
            }
        },
        onSuccess: async () => {
            // v1.1.4 - Improved synchronization Protocol
            // Invalidate first to mark as stale
            queryClient.invalidateQueries({ queryKey: ["raw-materials"] })

            toast({
                title: "Protocolo de Sincronização",
                description: rawMaterial ? "Matéria-prima atualizada." : "Matéria-prima cadastrada no catalogo."
            })

            // Small delay to allow DB transaction to propagate completely in Serverless
            await new Promise(resolve => setTimeout(resolve, 800));

            // Force a hard refetch before closing
            await queryClient.refetchQueries({ queryKey: ["raw-materials"] });

            form.reset()
            onSuccess?.()
        },
        onError: (error: any) => {
            toast({ variant: "destructive", title: "Erro", description: error.response?.data?.detail || "Erro ao salvar." })
        },
    })

    const renderCategoryFields = () => {
        const category = categories.find(c => c.name === selectedCategoryName);
        const fields = category?.fields || [];
        if (fields.length === 0) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-primary/5 rounded-[1.5rem] smooth-glass border-primary/10">
                <div className="col-span-full h3-brand text-sm text-primary uppercase tracking-widest mb-2 opacity-70">
                    Especificações: {selectedCategoryName}
                </div>

                {fields.map((f: CategoryField) => (
                    <FormField
                        key={f.name}
                        control={form.control}
                        name={`category_fields.${f.name}` as any}
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel className="label-brand ml-1 opacity-60">{f.label}</FormLabel>
                                <FormControl>
                                    <div className="flex gap-1">
                                        <div className="flex-1">
                                            <SuggestedInput
                                                fieldName={f.name}
                                                type={f.type}
                                                step={f.step}
                                                placeholder={f.placeholder}
                                                {...field}
                                                value={f.type === "number" ? (field.value?.value ?? field.value ?? "") : (field.value ?? "")}
                                                onChange={(e) => {
                                                    if (f.type === "number") {
                                                        const defaultUnit = units.find(u => u.id === f.unit_id)?.symbol ?? "";
                                                        const currentUnit = field.value?.unit || defaultUnit;
                                                        field.onChange({ value: e.target.value, unit: currentUnit });
                                                    } else {
                                                        field.onChange(e.target.value);
                                                    }
                                                }}
                                            />
                                        </div>
                                        {f.type === "number" && (
                                            <Select
                                                value={field.value?.unit ?? (units.find(u => u.id === f.unit_id)?.symbol ?? "")}
                                                onValueChange={(v) => {
                                                    const currentValue = field.value?.value ?? field.value ?? "";
                                                    field.onChange({ value: currentValue, unit: v });
                                                }}
                                            >
                                                <SelectTrigger className="w-[80px] h-10 rounded-xl smooth-glass border-primary/10 label-brand text-[10px] uppercase shrink-0">
                                                    <SelectValue placeholder="Un" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {units.map(u => (
                                                        <SelectItem key={u.id} value={u.symbol} className="label-brand text-[10px] uppercase">
                                                            {u.symbol}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ))}
            </div>
        )
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Categoria <span className="text-destructive">*</span></FormLabel>
                            <div className="flex gap-2">
                                <Select onValueChange={(v) => { field.onChange(v); setSelectedCategoryName(v); }} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-xl smooth-glass border-primary/10 body-brand">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={c.name} className="body-brand">{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Button type="button" size="icon" variant="ghost" asChild title="Gerenciar Categorias" className="rounded-xl smooth-glass border-primary/5 text-primary/60 hover:text-primary">
                                    <Link to="/management"><Plus className="h-4 w-4" /></Link>
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="supplier_id" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Fornecedor <span className="text-destructive">*</span></FormLabel>
                            <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-12 rounded-xl smooth-glass border-primary/10 body-brand">
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {suppliersData?.items?.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id} className="body-brand">{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button type="button" size="icon" variant="ghost" asChild title="Novo Fornecedor" className="rounded-xl smooth-glass border-primary/5 text-primary/60 hover:text-primary">
                                    <Link to="/suppliers"><Plus className="h-4 w-4" /></Link>
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                {renderCategoryFields()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="internal_code" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Cód. Interno</FormLabel>
                            <Input placeholder="MAT-001" {...field} className="h-12 rounded-xl smooth-glass border-primary/10 body-brand" />
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="supplier_code" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Cód. Fornecedor</FormLabel>
                            <Input {...field} className="h-12 rounded-xl smooth-glass border-primary/10 body-brand" />
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField control={form.control} name="unit" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Unidade *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-12 rounded-xl smooth-glass border-primary/10 body-brand">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {units.map(u => (
                                        <SelectItem key={u.id} value={u.symbol} className="body-brand">
                                            {u.name} ({u.symbol})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="color" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Cor</FormLabel>
                            <SuggestedInput fieldName="color" {...field} className="h-12 rounded-xl smooth-glass border-primary/10 body-brand" />
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="composition" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Composição</FormLabel>
                            <SuggestedInput fieldName="composition" placeholder="100% Algodão" {...field} className="h-12 rounded-xl smooth-glass border-primary/10 body-brand" />
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="minimum_order" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Pedido Mínimo</FormLabel>
                            <Input type="number" step="0.01" {...field} className="h-12 rounded-xl smooth-glass border-primary/10 body-brand" />
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="label-brand ml-1">Descrição / Notas</FormLabel>
                        <Textarea className="resize-none rounded-xl smooth-glass border-primary/10 body-brand min-h-[80px]" {...field} />
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="flex justify-end pt-2">
                    <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full md:w-auto h-12 px-8 rounded-xl bg-primary text-primary-foreground h3-brand shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all"
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Matéria-Prima
                    </Button>
                </div>
            </form>
        </Form>
    )
}
