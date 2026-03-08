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
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-12 text-center glass rounded-[3rem] border-dashed border-2 border-white/5 animate-in fade-in zoom-in duration-700">
                    <div className="h-24 w-24 rounded-[2rem] bg-white/[0.02] flex items-center justify-center mb-8 border border-white/5">
                        <Terminal className="h-10 w-10 opacity-20" />
                    </div>
                    <p className="text-2xl font-[1000] italic uppercase tracking-tighter text-white/20 leading-none mb-2">Null Sector</p>
                    <p className="text-sm font-bold opacity-30 italic max-w-xs">Selecione uma categoria na infraestrutura ao lado para injetar parâmetros no buffer.</p>
                </div>
            )
        }

        const fields = selectedCategory.fields || []

        return (
            <Card className="rounded-[3rem] border-none glass shadow-3xl overflow-hidden animate-in fade-in slide-in-from-right-10 duration-1000 relative">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                    <Database className="h-40 w-40" />
                </div>
                <CardHeader className="bg-primary/5 p-10 border-b border-primary/10">
                    <div className="flex items-center justify-between mb-4">
                        <CardTitle className="text-4xl font-[1000] tracking-tighter italic uppercase text-white flex items-center gap-6">
                            <div className="p-5 rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 shadow-glow">
                                <Layers className="h-8 w-8" />
                            </div>
                            {selectedCategory.name}
                        </CardTitle>
                        <Badge className={`h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em] italic border-none shadow-2xl ${selectedCategory.active ? "bg-primary text-primary-foreground" : "bg-white/5 text-muted-foreground"}`}>
                            {selectedCategory.active ? "Alpha Active" : "Disabled Node"}
                        </Badge>
                    </div>
                    <CardDescription className="text-base font-bold italic opacity-40 uppercase tracking-widest">Protocolos técnicos e definições de buffer.</CardDescription>
                </CardHeader>
                <CardContent className="p-10">
                    {fields.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                            {fields.map((field: CategoryField, i: number) => {
                                const unit = units.find((u: Unit) => u.id === field.unit_id)
                                return (
                                    <div
                                        key={field.name}
                                        className="group flex items-center justify-between p-8 rounded-[2rem] glass-dark hover:glass border border-white/5 transition-all hover:translate-x-3 duration-500 animate-in fade-in slide-in-from-right-6"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all">
                                                <Cpu className="h-6 w-6 opacity-40 group-hover:opacity-100" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <span className="font-[1000] text-2xl italic tracking-tighter text-white/90 uppercase group-hover:text-primary transition-colors">{field.label}</span>
                                                {unit && (
                                                    <div className="flex items-center gap-3">
                                                        <Badge variant="outline" className="text-[9px] uppercase font-black tracking-[0.15em] rounded-md h-5 px-2 bg-primary/10 text-primary border-none">Unit Mapping</Badge>
                                                        <span className="text-xs font-bold text-muted-foreground italic opacity-50">{unit.name} ({unit.symbol})</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Badge className="px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] italic bg-white/5 text-primary border border-primary/10 shadow-lg group-hover:scale-110 transition-transform">
                                            {field.type === "number" ? "Float64" : "String"}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground italic text-center gap-8 bg-white/[0.01] rounded-[3rem] border-4 border-dashed border-white/5">
                            <Info className="h-16 w-16 opacity-5" />
                            <div className="space-y-2">
                                <p className="text-3xl font-[1000] italic uppercase tracking-tighter text-white/10 leading-none">Vacuum Found</p>
                                <p className="text-sm font-bold opacity-20 max-w-[280px]">Esta categoria não possui parâmetros de hardware registrados no buffer central.</p>
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
                        <div className="h-20 w-20 rounded-[2.5rem] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-3xl border border-primary/10 transition-transform hover:scale-110 duration-500">
                            <Settings className="h-10 w-10 animate-spin-slow" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-7xl font-[1000] tracking-[calc(-0.05em)] italic uppercase text-white leading-none">Admin</h1>
                                <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">Core Infrastructure</Badge>
                            </div>
                            <p className="text-muted-foreground text-2xl font-semibold opacity-40 italic tracking-tight">
                                Orquestração de <span className="text-primary not-italic font-black text-white/80">Categorias & Unidades</span> sistêmicas.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Stats (Optional for visual flair) */}
                <div className="flex gap-6">
                    <Card className="rounded-[2.5rem] border-none glass p-6 py-8 flex flex-col items-center justify-center min-w-[200px] shadow-2xl hover:scale-105 transition-all">
                        <Binary className="h-6 w-6 text-primary mb-3 opacity-40" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Categories Injected</p>
                        <p className="text-4xl font-[1000] text-white italic tracking-tighter leading-none mt-2">{categories.length}</p>
                    </Card>
                    <Card className="rounded-[2.5rem] border-none glass p-6 py-8 flex flex-col items-center justify-center min-w-[200px] shadow-2xl hover:scale-105 transition-all">
                        <Cpu className="h-6 w-6 text-emerald-400 mb-3 opacity-40" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">Units Active</p>
                        <p className="text-4xl font-[1000] text-white italic tracking-tighter leading-none mt-2">{units.length}</p>
                    </Card>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-7 space-y-12">
                    {/* Categories Section */}
                    <Card className="rounded-[4rem] border-none glass overflow-hidden shadow-3xl transition-all p-1">
                        <CardHeader
                            className="cursor-pointer hover:bg-white/[0.02] transition-all flex flex-row items-center justify-between p-12 border-b border-white/5"
                            onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                        >
                            <div className="flex items-center gap-8">
                                <div className="p-5 rounded-[1.5rem] bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-glow-amber">
                                    <Layers className="h-8 w-8" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-4xl font-[1000] tracking-tighter uppercase italic text-white/90 leading-none">Database Nodes</CardTitle>
                                    <CardDescription className="text-[10px] font-black italic uppercase tracking-[0.2em] opacity-40">Estruturação técnica de categorias operacionais.</CardDescription>
                                </div>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group">
                                {isCategoriesExpanded ? <ChevronDown className="h-6 w-6 animate-bounce-subtle" /> : <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />}
                            </div>
                        </CardHeader>
                        {isCategoriesExpanded && (
                            <CardContent className="p-12 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full h-20 rounded-[2rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-[1.02] active:scale-95 transition-all text-sm font-black uppercase tracking-[0.3em] italic group relative overflow-hidden" onClick={handleAddNew}>
                                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            <Plus className="h-6 w-6 mr-4" />
                                            Initialize New Node
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[650px] rounded-[3rem] border-none glass-dark border-white/10 shadow-4xl p-0 overflow-hidden backdrop-blur-3xl animate-in zoom-in-95 duration-500">
                                        <DialogHeader className="p-12 bg-primary/5 border-b border-primary/10">
                                            <div className="flex items-center gap-6 mb-4">
                                                <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                                    <Layers className="h-8 w-8" />
                                                </div>
                                                <div>
                                                    <DialogTitle className="text-4xl font-[1000] tracking-tighter italic uppercase text-white leading-none">
                                                        {editingCategory ? "Alter Node" : "Spawn Node"}
                                                    </DialogTitle>
                                                    <DialogDescription className="text-[10px] font-black italic uppercase tracking-[0.2em] opacity-40 mt-2 text-primary/60">
                                                        Definição de metadados e estrutura técnica.
                                                    </DialogDescription>
                                                </div>
                                            </div>
                                        </DialogHeader>
                                        <div className="p-12 space-y-10">
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-10">
                                                    <FormField control={form.control} name="name" render={({ field }) => (
                                                        <FormItem className="space-y-4">
                                                            <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic ml-1">Identity Tag</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Ex: FIBRA_CARBONO, LINHAGEM_A..."
                                                                    className="h-20 rounded-2xl glass border-none focus:ring-4 focus:ring-primary/20 transition-all text-2xl font-[1000] italic tracking-tighter uppercase placeholder:opacity-20"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="text-[10px] uppercase font-black italic" />
                                                        </FormItem>
                                                    )} />

                                                    <div className="space-y-6">
                                                        <div className="flex items-center justify-between px-2">
                                                            <div className="space-y-1">
                                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic">Hardware Params</Label>
                                                                <p className="text-[9px] font-bold text-muted-foreground/40 italic uppercase">Campos injetados no buffer</p>
                                                            </div>
                                                            <Button type="button" variant="outline" size="sm" onClick={addField} className="h-10 rounded-xl glass border-white/5 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-primary/10 hover:text-primary transition-all">
                                                                <Plus className="h-4 w-4" /> Add Param
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
                                                            {dynamicFields.map((f: any, i: number) => (
                                                                <div key={i} className="flex gap-4 items-center animate-in slide-in-from-right-4 duration-300 group" style={{ animationDelay: `${i * 50}ms` }}>
                                                                    <div className="h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-[10px] italic text-muted-foreground/20 border border-white/5 group-hover:border-primary/20 group-hover:text-primary transition-all shrink-0">
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
                                                                        <SelectTrigger className="w-[180px] h-14 rounded-xl glass-dark border-none text-[10px] font-black uppercase italic">
                                                                            <SelectValue placeholder="Protocol" />
                                                                        </SelectTrigger>
                                                                        <SelectContent className="glass-dark border-white/10 rounded-2xl">
                                                                            <SelectItem value="text" className="text-[10px] font-black uppercase italic py-3">String Protocol</SelectItem>
                                                                            {units.map((u) => (
                                                                                <SelectItem key={u.id} value={u.id} className="text-[10px] font-black uppercase italic py-3">
                                                                                    {u.symbol} - Float64
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
                                                                <div className="text-center py-12 rounded-[2.5rem] bg-white/[0.01] border-4 border-dashed border-white/5 text-[10px] font-black italic uppercase tracking-widest text-muted-foreground/30">
                                                                    Null Buffer Parameters.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="pt-8">
                                                        <Button type="submit" disabled={mutation.isPending} className="w-full h-20 rounded-[2rem] bg-primary text-primary-foreground shadow-4xl shadow-primary/40 text-sm font-[1000] italic uppercase tracking-[0.3em] hover:scale-[1.03] active:scale-95 transition-all">
                                                            {mutation.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-3 italic" /> : <ShieldCheck className="h-6 w-6 mr-3" />}
                                                            {editingCategory ? "Commit Changes" : "Forge Category"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <div className="rounded-[2.5rem] border border-white/5 overflow-hidden glass-dark shadow-2xl">
                                    <ScrollArea className="h-[500px]">
                                        <Table>
                                            <TableHeader className="bg-white/5 sticky top-0 z-10">
                                                <TableRow className="hover:bg-transparent border-none">
                                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] italic text-primary py-8 px-10">System Node</TableHead>
                                                    <TableHead className="w-[280px] text-right px-10 text-[10px] font-black uppercase tracking-[0.2em] italic text-primary">Actions</TableHead>
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
                                                    <TableRow><TableCell colSpan={2} className="text-center py-32 text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/40">Zero Entity Mapping.</TableCell></TableRow>
                                                ) : (
                                                    categories.map((cat: Category, i: number) => (
                                                        <TableRow
                                                            key={cat.id}
                                                            className={`group border-b border-white/5 transition-all hover:bg-primary/5 cursor-pointer animate-in fade-in slide-in-from-left-4 duration-500 ${selectedCategory?.id === cat.id ? "bg-primary/10 border-l-[10px] border-l-primary" : ""}`}
                                                            style={{ animationDelay: `${i * 100}ms` }}
                                                            onClick={() => setSelectedCategory(cat)}
                                                        >
                                                            <TableCell className="py-8 px-10">
                                                                <div className="flex items-center gap-6">
                                                                    <div className={`h-4 w-4 rounded-full ${cat.active ? "bg-primary shadow-glow animate-pulse" : "bg-white/10"}`} />
                                                                    <div>
                                                                        <p className="text-2xl font-[1000] text-white/90 italic tracking-tighter leading-none uppercase group-hover:translate-x-2 transition-transform">{cat.name}</p>
                                                                        <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic mt-2">UUID: {cat.id.substring(0, 8)}... :: Protocol Alpha</p>
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
                                                                        className="h-12 px-8 rounded-xl font-black text-[10px] italic uppercase tracking-[0.2em] bg-white text-black hover:bg-primary transition-all shadow-2xl"
                                                                        onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); }}
                                                                    >
                                                                        Inspect
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
                    <Card className="rounded-[4rem] border-none glass overflow-hidden shadow-3xl p-1">
                        <CardHeader
                            className="cursor-pointer hover:bg-white/[0.02] transition-all flex flex-row items-center justify-between p-12 border-b border-white/5"
                            onClick={() => setIsUnitsExpanded(!isUnitsExpanded)}
                        >
                            <div className="flex items-center gap-8">
                                <div className="p-5 rounded-[1.5rem] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-glow-emerald">
                                    <Calculator className="h-8 w-8" />
                                </div>
                                <div className="space-y-2">
                                    <CardTitle className="text-4xl font-[1000] tracking-tighter uppercase italic text-white/90 leading-none">Standard Units</CardTitle>
                                    <CardDescription className="text-[10px] font-black italic uppercase tracking-[0.2em] opacity-40">Orquestração de metadados métricos (SI).</CardDescription>
                                </div>
                            </div>
                            <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center text-muted-foreground group">
                                {isUnitsExpanded ? <ChevronDown className="h-6 w-6 animate-bounce-subtle" /> : <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />}
                            </div>
                        </CardHeader>
                        {isUnitsExpanded && (
                            <CardContent className="p-12 space-y-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full h-20 rounded-[2rem] bg-white text-black shadow-2xl hover:scale-[1.02] active:scale-95 transition-all text-sm font-black uppercase tracking-[0.3em] italic group relative overflow-hidden" onClick={handleAddNewUnit}>
                                            <div className="absolute inset-0 bg-primary/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                            <Plus className="h-6 w-6 mr-4" />
                                            Register Standard
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[550px] rounded-[3rem] border-none glass-dark border-white/10 shadow-4xl p-0 overflow-hidden backdrop-blur-3xl">
                                        <DialogHeader className="p-12 bg-white/5 border-b border-white/5">
                                            <DialogTitle className="text-4xl font-[1000] tracking-tighter italic uppercase text-white leading-none">Forge Unit</DialogTitle>
                                            <DialogDescription className="text-[10px] font-black italic uppercase tracking-[0.2em] opacity-40 mt-2">Sincronização de unidades padrão.</DialogDescription>
                                        </DialogHeader>
                                        <div className="p-12">
                                            <Form {...unitForm}>
                                                <form onSubmit={unitForm.handleSubmit((v) => unitMutation.mutate(v))} className="space-y-10">
                                                    <div className="grid gap-10">
                                                        <FormField control={unitForm.control} name="name" render={({ field }) => (
                                                            <FormItem className="space-y-4">
                                                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic ml-1">Protocol Name</FormLabel>
                                                                <FormControl><Input className="h-20 rounded-2xl glass border-none text-2xl font-[1000] italic tracking-tighter uppercase placeholder:opacity-10" placeholder="Ex: Metros, Gramas..." {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <FormField control={unitForm.control} name="symbol" render={({ field }) => (
                                                            <FormItem className="space-y-4">
                                                                <FormLabel className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic ml-1">System Cipher</FormLabel>
                                                                <FormControl><Input className="h-20 rounded-2xl glass border-none text-5xl font-[1000] italic tracking-tighter uppercase text-primary placeholder:opacity-10" placeholder="m/g/un" {...field} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                    </div>

                                                    <DialogFooter className="pt-8">
                                                        <Button type="submit" disabled={unitMutation.isPending} className="w-full h-20 rounded-[2rem] bg-white text-black shadow-4xl text-sm font-[1000] italic uppercase tracking-[0.3em] hover:scale-[1.03] transition-all">
                                                            {unitMutation.isPending ? <Loader2 className="h-6 w-6 animate-spin mr-3" /> : <Plus className="h-6 w-6 mr-3" />}
                                                            {editingUnit ? "Patch Protocol" : "Authorize Node"}
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
                                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] italic text-primary py-8 px-10">Entity Identity</TableHead>
                                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] italic text-primary py-8 px-10">Cipher</TableHead>
                                                    <TableHead className="w-[180px] text-right px-10 text-[10px] font-black uppercase tracking-[0.2em] italic text-primary">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {isLoadingUnits ? (
                                                    <TableRow><TableCell colSpan={3} className="text-center py-20"><Loader2 className="h-12 w-12 animate-spin mx-auto text-primary/40" /></TableCell></TableRow>
                                                ) : units.length === 0 ? (
                                                    <TableRow><TableCell colSpan={3} className="text-center py-32 text-[10px] font-black uppercase italic tracking-widest text-muted-foreground/40">Empty Unit Database.</TableCell></TableRow>
                                                ) : (
                                                    units.map((u: Unit, i: number) => (
                                                        <TableRow
                                                            key={u.id}
                                                            className="group border-b border-white/5 transition-all hover:bg-white/[0.02] animate-in fade-in slide-in-from-right-4 duration-500"
                                                            style={{ animationDelay: `${i * 50}ms` }}
                                                        >
                                                            <TableCell className="font-[1000] text-2xl italic tracking-tighter text-white/90 uppercase py-8 px-10">{u.name}</TableCell>
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

                    <Card className="mt-12 rounded-[3xl] border-none glass overflow-hidden shadow-2xl p-10 bg-primary/5 border border-primary/10 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-5">
                            <ShieldCheck className="h-20 w-20" />
                        </div>
                        <div className="flex gap-8 items-center">
                            <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20 shrink-0 shadow-glow">
                                <Activity className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest italic text-white/80">Infrastructure Status</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed italic opacity-40">
                                    Todos os parâmetros definidos aqui afetam diretamente a construção dinâmica de formulários na <span className="text-primary italic">Matéria-Prima Hub</span>.
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
