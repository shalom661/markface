import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    Plus,
    Loader2,
    Trash2,
    ChevronDown,
    ChevronRight,
    Terminal,
    Database,
    Layers,
    Cpu,
    Settings,
    Binary,
    ShieldCheck,
    Activity,
    Power,
    Edit2,
    Calculator,
    Info
} from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const categorySchema = z.object({
    name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
})

interface CategoryField {
    name: string;
    label: string;
    type: "text" | "number";
    unit_id?: string;
}

interface Category {
    id: string;
    name: string;
    fields: CategoryField[];
    active: boolean;
}

const unitSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    symbol: z.string().min(1, "Símbolo é obrigatório"),
})

interface Unit {
    id: string;
    name: string;
    symbol: string;
    active: boolean;
}

export default function Management() {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dynamicFields, setDynamicFields] = useState<{ label: string, type: "text" | "number", unit_id?: string }[]>([])

    const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false)
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null)

    // Collapse states - Start collapsed as requested
    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false)
    const [isUnitsExpanded, setIsUnitsExpanded] = useState(true)

    const { data: categories = [], isLoading } = useQuery<Category[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const { data } = await api.get("/categories")
            return data
        }
    })

    const { data: units = [], isLoading: isLoadingUnits } = useQuery<Unit[]>({
        queryKey: ["units"],
        queryFn: async () => {
            const { data } = await api.get("/units")
            return data
        }
    })

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "" },
    })

    const unitForm = useForm<z.infer<typeof unitSchema>>({
        resolver: zodResolver(unitSchema),
        defaultValues: { name: "", symbol: "" },
    })

    const addField = () => {
        setDynamicFields([...dynamicFields, { label: "", type: "text" }])
    }

    const removeField = (index: number) => {
        setDynamicFields(dynamicFields.filter((_, i: number) => i !== index))
    }

    const updateFieldLabel = (index: number, label: string) => {
        const updated = [...dynamicFields]
        updated[index].label = label
        setDynamicFields(updated)
    }

    const updateFieldTypeAndUnit = (index: number, value: string) => {
        const updated = [...dynamicFields]
        if (value === "text") {
            updated[index].type = "text"
            updated[index].unit_id = undefined
        } else {
            updated[index].type = "number"
            updated[index].unit_id = value
        }
        setDynamicFields(updated)
    }

    const mutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingCategory) {
                const response = await api.put(`/categories/${editingCategory.id}`, data)
                return response.data
            } else {
                const response = await api.post("/categories", data)
                return response.data
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            toast({
                title: "Sucesso",
                description: editingCategory ? "Categoria atualizada." : "Categoria adicionada."
            })
            form.reset()
            setDynamicFields([])
            setEditingCategory(null)
            setIsDialogOpen(false)
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.response?.data?.detail || "Erro ao salvar categoria."
            })
        }
    })

    const toggleMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/categories/${id}/toggle-active`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            toast({ title: "Status atualizado", description: "O status da categoria foi alterado." })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/categories/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["categories"] })
            toast({ title: "Excluída", description: "Categoria removida permanentemente." })
            if (selectedCategory?.id === deleteMutation.variables) setSelectedCategory(null)
        },
        onError: () => {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir. Verifique se existem matérias-primas vinculadas." })
        }
    })

    // Unit Mutations
    const unitMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingUnit) {
                const response = await api.put(`/units/${editingUnit.id}`, data)
                return response.data
            } else {
                const response = await api.post("/units", data)
                return response.data
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] })
            toast({
                title: "Sucesso",
                description: editingUnit ? "Unidade atualizada." : "Unidade adicionada."
            })
            unitForm.reset()
            setEditingUnit(null)
            setIsUnitDialogOpen(false)
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.response?.data?.detail || "Erro ao salvar unidade."
            })
        }
    })

    const toggleUnitMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.patch(`/units/${id}/toggle-active`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] })
            toast({ title: "Status atualizado", description: "O status da unidade foi alterado." })
        }
    })

    const deleteUnitMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/units/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["units"] })
            toast({ title: "Excluída", description: "Unidade removida permanentemente." })
        },
        onError: () => {
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível excluir a unidade." })
        }
    })

    const handleSave = (values: z.infer<typeof categorySchema>) => {
        if (dynamicFields.some((f: any) => !f.label.trim())) {
            toast({
                variant: "destructive",
                title: "Campos incompletos",
                description: "Todos os parâmetros da categoria devem ter um nome.",
            });
            return;
        }

        const payload = {
            ...values,
            fields: dynamicFields.map((f: any) => ({
                ...f,
                name: f.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
            }))
        }
        mutation.mutate(payload)
    }

    const handleEdit = (cat: Category) => {
        setEditingCategory(cat)
        form.setValue("name", cat.name)
        setDynamicFields(cat.fields.map(f => ({ label: f.label, type: f.type, unit_id: f.unit_id })))
        setIsDialogOpen(true)
    }

    const handleAddNew = () => {
        setEditingCategory(null)
        form.reset({ name: "" })
        setDynamicFields([])
        setIsDialogOpen(true)
    }

    const handleDelete = (id: string) => {
        if (window.confirm("ATENÇÃO: Deseja realmente EXCLUIR esta categoria permanentemente? Esta ação falhará se houverem matérias-primas cadastradas nela.")) {
            deleteMutation.mutate(id)
        }
    }

    const handleEditUnit = (unit: Unit) => {
        setEditingUnit(unit)
        unitForm.reset({ name: unit.name, symbol: unit.symbol })
        setIsUnitDialogOpen(true)
    }

    const handleAddNewUnit = () => {
        setEditingUnit(null)
        unitForm.reset({ name: "", symbol: "" })
        setIsUnitDialogOpen(true)
    }

    const renderCategoryDetails = () => {
        if (!selectedCategory) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center smooth-glass rounded-[3rem] border-dashed border-2 border-white/5 animate-in fade-in zoom-in duration-700">
                    <div className="h-24 w-24 rounded-[2rem] bg-white/[0.02] flex items-center justify-center mb-8 border border-white/5">
                        <Terminal className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="h2-brand text- white/20">Setor Vazio</p>
                    <p className="label-brand opacity-30 italic max-w-xs">Selecione uma categoria na infraestrutura ao lado para inspecionar parâmetros.</p>
                </div>
            )
        }

        const fields = selectedCategory.fields || []

        return (
            <Card className="rounded-[3rem] smooth-glass animate-in fade-in slide-in-from-right-10 duration-1000 relative">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <Database className="h-40 w-40" />
                </div>
                <CardHeader className="bg-primary/5 p-12">
                    <div className="flex items-center justify-between mb-4">
                        <CardTitle className="h2-brand italic uppercase text-white flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <Layers className="h-6 w-6" />
                            </div>
                            {selectedCategory.name}
                        </CardTitle>
                        <Badge className={`h-9 px-5 rounded-full label-brand border-none shadow-xl ${selectedCategory.active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            {selectedCategory.active ? "Ativo" : "Inativo"}
                        </Badge>
                    </div>
                    <CardDescription className="label-brand text-sm opacity-40">Definições técnicas e campos de dados.</CardDescription>
                </CardHeader>
                <CardContent className="p-12">
                    {fields.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {fields.map((field: CategoryField, i: number) => {
                                const unit = units.find((u: Unit) => u.id === field.unit_id)
                                return (
                                    <div
                                        key={field.name}
                                        className="group flex items-center justify-between p-8 rounded-[2rem] bg-background/40 hover:bg-background/60 transition-all hover:translate-x-3 duration-500 animate-in fade-in slide-in-from-right-6 shadow-sm"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                                                <Cpu className="h-6 w-6 opacity-40 group-hover:opacity-100" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="h3-brand italic uppercase group-hover:text-primary transition-colors">{field.label}</span>
                                                {unit && (
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-[9px] uppercase font-black tracking-[0.15em] rounded-md h-5 px-2 bg-primary/10 text-primary border-none">Unidade</Badge>
                                                        <span className="text-xs font-bold text-muted-foreground italic opacity-50">{unit.name} ({unit.symbol})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Badge className="px-5 py-2 rounded-xl label-brand bg-primary/5 text-primary border-none shadow-lg group-hover:scale-110 transition-transform">
                                            {field.type === "number" ? "Numérico" : "Texto"}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground italic text-center gap-8 bg-white/[0.01] rounded-[3rem] border-4 border-dashed border-white/5">
                            <Info className="h-16 w-16 opacity-5" />
                            <div className="space-y-2">
                                <p className="h2-brand text-white/10">Vácuo Detectado</p>
                                <p className="label-brand opacity-20 max-w-[280px]">Esta categoria não possui parâmetros registrados no banco de dados.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Elite Management Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-6">
                    <div className="flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-2xl transition-transform hover:scale-110 duration-500">
                            <Settings className="h-10 w-10 animate-spin-slow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="h1-brand">Gerenciamento</h1>
                                <Badge className="bg-primary/10 text-primary border-none label-brand px-3 py-1 rounded-full text-[10px]">Sistema</Badge>
                            </div>
                            <p className="text-muted-foreground body-brand opacity-60">
                                Orquestração de <span className="text-primary font-medium">Categorias & Unidades</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-6">
                    <Card className="rounded-[2.5rem] smooth-glass p-6 py-8 flex flex-col items-center justify-center min-w-[200px] shadow-2xl hover:scale-105 transition-all">
                        <Binary className="h-6 w-6 text-primary mb-3 opacity-40" />
                        <p className="label-brand">Categorias</p>
                        <p className="stat-brand mt-2">{categories.length}</p>
                    </Card>
                    <Card className="rounded-[2.5rem] smooth-glass p-6 py-8 flex flex-col items-center justify-center min-w-[200px] shadow-2xl hover:scale-105 transition-all">
                        <Cpu className="h-6 w-6 text-secondary mb-3 opacity-40" />
                        <p className="label-brand">Unidades</p>
                        <p className="stat-brand mt-2">{units.length}</p>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-12">
                    {/* Categories Section */}
                    <Card className="rounded-[4rem] smooth-glass overflow-hidden transition-all">
                        <CardHeader
                            className="cursor-pointer hover:bg-white/[0.02] transition-all flex flex-row items-center justify-between p-12"
                            onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                        >
                            <div className="flex items-center gap-8">
                                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 shadow-glow-amber">
                                    <Layers className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="h2-brand uppercase text-white/90">Categorias</CardTitle>
                                    <CardDescription className="label-brand opacity-40">Estruturação de modalidades operacionais.</CardDescription>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-muted-foreground group">
                                {isCategoriesExpanded ? <ChevronDown className="h-5 w-5 animate-bounce-subtle" /> : <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                            </div>
                        </CardHeader>
                        {isCategoriesExpanded && (
                            <CardContent className="p-12 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full h-16 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-[1.01] active:scale-95 transition-all label-brand group relative overflow-hidden" onClick={handleAddNew}>
                                            <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            <Plus className="h-5 w-5 mr-3" />
                                            Nova Categoria
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[650px] rounded-[3rem] border-none glass-dark border-white/10 shadow-4xl p-0 overflow-hidden backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                                        <DialogHeader className="p-12 bg-primary/5">
                                            <div className="flex items-center gap-6 mb-4">
                                                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                                    <Layers className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <DialogTitle className="h2-brand text-3xl italic uppercase text-white leading-none">
                                                        {editingCategory ? "Alterar Categoria" : "Nova Categoria"}
                                                    </DialogTitle>
                                                    <DialogDescription className="label-brand opacity-40 mt-2">
                                                        Definição de metadados e estrutura técnica.
                                                    </DialogDescription>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        <div className="p-12 space-y-10">
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-10">
                                                    <FormField control={form.control} name="name" render={({ field }) => (
                                                        <FormItem className="space-y-3">
                                                            <FormLabel className="label-brand text-primary opacity-60 ml-1">Nome Identificador</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Ex: FIBRA, LINHAGEM..."
                                                                    className="h-12 rounded-xl bg-background/50 border-none focus:ring-primary/20 transition-all body-brand placeholder:opacity-20"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="label-brand italic" />
                                                        </FormItem>
                                                    )} />

                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between px-2">
                                                            <div className="space-y-1">
                                                                <Label className="label-brand text-primary/60 italic">Parâmetros de Hardware</Label>
                                                                <p className="label-brand text-muted-foreground/40 italic">Campos injetados no sistema</p>
                                                            </div>
                                                            <Button type="button" variant="outline" size="sm" onClick={addField} className="h-10 rounded-xl smooth-glass border-white/5 label-brand gap-2 hover:bg-primary/10 hover:text-primary transition-all">
                                                                <Plus className="h-4 w-4" /> Adicionar Parâmetro
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                                            {dynamicFields.map((f: any, i: number) => (
                                                                <div key={i} className="flex gap-4 items-center animate-in slide-in-from-right-4 duration-300 group" style={{ animationDelay: `${i * 50}ms` }}>
                                                                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center label-brand italic text-muted-foreground/20 border border-white/5 group-hover:border-primary/20 group-hover:text-primary transition-all shrink-0">
                                                                        {i + 1}
                                                                    </div>
                                                                    <Input
                                                                        className="flex-1 h-14 rounded-xl glass-dark border-none text-sm font-bold placeholder:italic placeholder:opacity-10"
                                                                        placeholder="Label do Campo"
                                                                        value={f.label}
                                                                        onChange={(e) => updateFieldLabel(i, e.target.value)}
                                                                    />
                                                                    <Select
                                                                        value={f.type === "text" ? "text" : f.unit_id}
                                                                        onValueChange={(v) => updateFieldTypeAndUnit(i, v)}
                                                                    >
                                                                        <SelectTrigger className="w-[180px] h-14 rounded-xl glass-dark border-none label-brand italic">
                                                                            <SelectValue placeholder="Protocolo" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="glass-dark border-white/10 rounded-2xl">
                                                                            <SelectItem value="text" className="label-brand italic py-3">Protocolo Texto</SelectItem>
                                                                            {units.map((u) => (
                                                                                <SelectItem key={u.id} value={u.id} className="label-brand italic py-3">
                                                                                    {u.symbol} - Numérico (Dec)
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    <Button type="button" variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-destructive/20 hover:text-white hover:bg-destructive shadow-2xl transition-all" onClick={() => removeField(i)}>
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            {dynamicFields.length === 0 && (
                                                                <div className="text-center py-12 rounded-[2.5rem] bg-white/[0.01] border-4 border-dashed border-white/5 label-brand italic text-muted-foreground/30">
                                                                    Sem Parâmetros.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="pt-8">
                                                        <Button type="submit" disabled={mutation.isPending} className="w-full h-20 rounded-[2rem] bg-primary text-primary-foreground shadow-4xl shadow-primary/40 label-brand hover:scale-[1.03] active:scale-95 transition-all">
                                                            {mutation.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-3 italic" /> : <ShieldCheck className="h-6 w-6 mr-3" />}
                                                            {editingCategory ? "Confirmar Alterações" : "Forjar Categoria"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <div className="rounded-[2.5rem] bg-background/20 overflow-hidden shadow-inner">
                                    <ScrollArea className="h-[500px]">
                                        <Table>
                                            <TableHeader className="bg-primary/5 sticky top-0 z-10">
                                                <TableRow className="hover:bg-transparent border-none">
                                                    <TableHead className="label-brand text-primary py-8 px-10">Categoria</TableHead>
                                                    <TableHead className="w-[280px] text-right px-10 label-brand text-primary">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="text-center py-20">
                                                            <div className="relative inline-block">
                                                                <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <Activity className="h-6 w-6 text-primary animate-pulse" />
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : categories.length === 0 ? (
                                                    <TableRow><TableCell colSpan={2} className="text-center py-32 label-brand italic text-muted-foreground/40">Mapeamento de Entidades Vazio.</TableCell></TableRow>
                                                ) : (
                                                    categories.map((cat: Category, i: number) => (
                                                        <TableRow
                                                            key={cat.id}
                                                            className={`group border-b border-primary/5 transition-all hover:bg-primary/5 cursor-pointer animate-in fade-in slide-in-from-left-4 duration-500 ${selectedCategory?.id === cat.id ? "bg-primary/10 border-l-[6px] border-l-primary" : ""}`}
                                                            style={{ animationDelay: `${i * 100}ms` }}
                                                            onClick={() => setSelectedCategory(cat)}
                                                        >
                                                            <TableCell className="py-8 px-10">
                                                                <div className="flex items-center gap-6">
                                                                    <div className={`h-3 w-3 rounded-full ${cat.active ? "bg-primary shadow-glow accent-primary" : "bg-muted"}`} />
                                                                    <div>
                                                                        <p className="h3-brand text-white/90 italic tracking-tighter leading-none uppercase group-hover:translate-x-1 transition-transform">{cat.name}</p>
                                                                        <p className="label-brand opacity-20 mt-1.5 uppercase">ID: {cat.id.substring(0, 8)}</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right py-8 px-10">
                                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0 duration-500">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(cat.id); }}
                                                                        className={`h-12 w-12 rounded-xl transition-all shadow-2xl ${cat.active ? "text-emerald-400 hover:bg-emerald-400/20" : "text-amber-400 hover:bg-amber-400/20"}`}
                                                                    >
                                                                        <Power className="h-6 w-6" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
                                                                        className="h-12 w-12 rounded-xl text-primary hover:bg-primary/20 transition-all shadow-2xl"
                                                                    >
                                                                        <Edit2 className="h-5 w-5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}
                                                                        className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/20 transition-all shadow-2xl"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="secondary"
                                                                        className="h-12 px-8 rounded-xl label-brand italic bg-white text-black hover:bg-primary transition-all shadow-2xl"
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); }}
                                                                    >
                                                                        Inspecionar
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Measurement Units Section */}
                    <Card className="rounded-[4rem] smooth-glass overflow-hidden transition-all">
                        <CardHeader
                            className="cursor-pointer hover:bg-white/[0.02] transition-all flex flex-row items-center justify-between p-12"
                            onClick={() => setIsUnitsExpanded(!isUnitsExpanded)}
                        >
                            <div className="flex items-center gap-8">
                                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-500 shadow-glow-emerald">
                                    <Calculator className="h-7 w-7" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="h2-brand uppercase text-white/90">Unidades de Medida</CardTitle>
                                    <CardDescription className="label-brand opacity-40">Orquestração de metadados métricos.</CardDescription>
                                </div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center text-muted-foreground group">
                                {isUnitsExpanded ? <ChevronDown className="h-5 w-5 animate-bounce-subtle" /> : <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                            </div>
                        </CardHeader>
                        {isUnitsExpanded && (
                            <CardContent className="p-12 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full h-16 rounded-2xl bg-foreground text-background shadow-2xl hover:scale-[1.01] active:scale-95 transition-all label-brand italic group relative overflow-hidden" onClick={handleAddNewUnit}>
                                            <div className="absolute inset-0 bg-primary/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            <Plus className="h-5 w-5 mr-3" />
                                            Nova Unidade
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[550px] rounded-[3rem] border-none glass-dark border-white/10 shadow-4xl p-0 overflow-hidden backdrop-blur-3xl">
                                        <DialogHeader className="p-12 bg-white/5 border-b border-white/5">
                                            <DialogTitle className="h2-brand text-4xl">Forjar Unidade</DialogTitle>
                                            <DialogDescription className="label-brand opacity-40 mt-2">Sincronização de unidades padrão.</DialogDescription>
                                        </DialogHeader>
                                        <div className="p-12">
                                            <Form {...unitForm}>
                                                <form onSubmit={unitForm.handleSubmit((v) => unitMutation.mutate(v))} className="space-y-10">
                                                    <div className="grid gap-10">
                                                        <FormField control={unitForm.control} name="name" render={({ field }) => (
                                                            <FormItem className="space-y-2">
                                                                <FormLabel className="label-brand text-primary/60 ml-1">Nome do Protocolo</FormLabel>
                                                                <FormControl><Input className="h-14 rounded-xl smooth-glass border-none h3-brand placeholder:opacity-10" placeholder="Ex: Metros, Gramas..." {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField control={unitForm.control} name="symbol" render={({ field }) => (
                                                            <FormItem className="space-y-2">
                                                                <FormLabel className="label-brand text-primary/60 ml-1">Cifra do Sistema</FormLabel>
                                                                <FormControl><Input className="h-14 rounded-xl smooth-glass border-none body-brand text-primary placeholder:opacity-10" placeholder="m/g/un" {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>

                                                    <DialogFooter className="pt-8">
                                                        <Button type="submit" disabled={unitMutation.isPending} className="w-full h-20 rounded-[2rem] bg-white text-black shadow-4xl label-brand hover:scale-[1.03] transition-all">
                                                            {unitMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Plus className="h-6 w-6 mr-3" />}
                                                            {editingUnit ? "Corrigir Protocolo" : "Autorizar Nó"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <div className="rounded-[2.5rem] border border-white/5 overflow-hidden glass-dark shadow-2xl">
                                    <ScrollArea className="h-[450px]">
                                        <Table>
                                            <TableHeader className="bg-white/5 sticky top-0 z-10">
                                                <TableRow className="hover:bg-transparent border-none">
                                                    <TableHead className="label-brand text-primary py-8 px-10">Identidade da Entidade</TableHead>
                                                    <TableHead className="label-brand text-primary py-8 px-10">Cifra</TableHead>
                                                    <TableHead className="w-[180px] text-right px-10 label-brand text-primary">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isLoadingUnits ? (
                                                    <TableRow><TableCell colSpan={3} className="text-center py-20"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary/40" /></TableCell></TableRow>
                                                ) : units.length === 0 ? (
                                                    <TableRow><TableCell colSpan={3} className="text-center py-32 label-brand italic text-muted-foreground/40">Banco de Dados de Unidades Vazio.</TableCell></TableRow>
                                                ) : (
                                                    units.map((u: Unit, i: number) => (
                                                        <TableRow
                                                            key={u.id}
                                                            className="group border-b border-white/5 transition-all hover:bg-white/[0.02] animate-in fade-in slide-in-from-right-4 duration-500"
                                                            style={{ animationDelay: `${i * 50}ms` }}
                                                        >
                                                            <TableCell className="h3-brand text-white/90 py-8 px-10">{u.name}</TableCell>
                                                            <TableCell className="py-8 px-10">
                                                                <Badge className="rounded-xl px-5 py-2 bg-primary/10 border-none text-primary text-sm font-black italic uppercase tracking-widest shadow-glow">{u.symbol}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right py-8 px-10">
                                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0 duration-500">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => toggleUnitMutation.mutate(u.id)}
                                                                        className={`h-12 w-12 rounded-xl transition-all shadow-2xl ${u.active ? "text-emerald-400 hover:bg-emerald-400/20" : "text-amber-400 hover:bg-amber-400/20"}`}
                                                                    >
                                                                        <Power className="h-6 w-6" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleEditUnit(u)}
                                                                        className="h-12 w-12 rounded-xl text-primary hover:bg-primary/20 transition-all shadow-2xl"
                                                                    >
                                                                        <Edit2 className="h-5 w-5" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => { if (window.confirm("Protocol Delete?")) deleteUnitMutation.mutate(u.id) }}
                                                                        className="h-12 w-12 rounded-xl text-destructive hover:bg-destructive/20 transition-all shadow-2xl"
                                                                    >
                                                                        <Trash2 className="h-5 w-5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-5 h-[calc(100vh-180px)] sticky top-12">
                    {renderCategoryDetails()}

                    <Card className="mt-12 rounded-[2.5rem] smooth-glass p-10 bg-primary/5 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <ShieldCheck className="h-16 w-16" />
                        </div>
                        <div className="flex gap-8 items-center">
                            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-glow">
                                <Activity className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="label-brand text-primary">Status do Sistema</p>
                                <p className="label-brand italic opacity-40">
                                    Parâmetros globais que afetam a construção dinâmica de formulários no Hub.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
