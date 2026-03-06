import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Loader2, Settings, Info, Layers, Trash2, Edit2, Power, ChevronDown, ChevronRight } from "lucide-react"
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
        setDynamicFields(dynamicFields.filter((_, i) => i !== index))
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
        if (dynamicFields.some(f => !f.label.trim())) {
            toast({
                variant: "destructive",
                title: "Campos incompletos",
                description: "Todos os parâmetros da categoria devem ter um nome.",
            });
            return;
        }

        const payload = {
            ...values,
            fields: dynamicFields.map(f => ({
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
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center bg-muted/10 border border-dashed rounded-xl">
                    <Info className="h-12 w-12 mb-4 opacity-20" />
                    <p>Selecione uma categoria na lista ao lado para ver seus parâmetros específicos.</p>
                </div>
            )
        }

        const fields = selectedCategory.fields || []

        return (
            <Card className="border-primary/20 shadow-lg animate-in fade-in slide-in-from-right-4 duration-300">
                <CardHeader className="bg-primary/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            {selectedCategory.name}
                        </CardTitle>
                        <Badge variant={selectedCategory.active ? "default" : "secondary"}>
                            {selectedCategory.active ? "Ativa" : "Inativa"}
                        </Badge>
                    </div>
                    <CardDescription>Parâmetros técnicos configurados para esta categoria.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {fields.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                            {fields.map(field => {
                                const unit = units.find(u => u.id === field.unit_id)
                                return (
                                    <div key={field.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{field.label}</span>
                                            {unit && <span className="text-[10px] text-muted-foreground">Unidade: {unit.name} ({unit.symbol})</span>}
                                        </div>
                                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter opacity-70">
                                            {field.type === "number" ? "Numérico" : "Texto"}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic p-4 text-center">
                            Esta categoria não possui campos específicos adicionais.
                        </div>
                    )}
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-7xl animate-in fade-in duration-500">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-black tracking-tighter text-foreground uppercase italic">Gerenciamento</h1>
                <p className="text-muted-foreground">Configurações gerais e parâmetros do MarkFace Hub.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7 space-y-4">
                    {/* Categories Section */}
                    <Card className="shadow-xl overflow-hidden border-primary/10">
                        <CardHeader
                            className="cursor-pointer hover:bg-muted/30 transition-colors flex flex-row items-center justify-between space-y-0"
                            onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                        >
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Layers className="h-5 w-5 text-primary" />
                                    Categorias de Matéria-Prima
                                </CardTitle>
                                <CardDescription>Gerencie as definições técnicas de cada tipo de material.</CardDescription>
                            </div>
                            {isCategoriesExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                        </CardHeader>
                        {isCategoriesExpanded && (
                            <CardContent className="space-y-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="pt-4">
                                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full" onClick={handleAddNew}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Nova Categoria
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[500px]">
                                            <DialogHeader>
                                                <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                                                <DialogDescription>
                                                    {editingCategory
                                                        ? "Atualize o nome e os parâmetros técnicos desta categoria."
                                                        : "Defina o nome da categoria e adicione os parâmetros técnicos que ela deve possuir."}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4 pt-4">
                                                    <FormField control={form.control} name="name" render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Nome da Categoria</FormLabel>
                                                            <FormControl><Input placeholder="Ex: Tecido, Botão..." {...field} /></FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />

                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parâmetros Específicos</Label>
                                                            <Button type="button" variant="outline" size="sm" onClick={addField} className="h-7 text-[10px] gap-1">
                                                                <Plus className="h-3 w-3" /> Adicionar Parâmetro
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {dynamicFields.map((f, i) => (
                                                                <div key={i} className="flex gap-2 items-start animate-in slide-in-from-left-2 duration-200">
                                                                    <Input
                                                                        className="flex-1 h-9 text-sm"
                                                                        placeholder="Ex: Gramatura"
                                                                        value={f.label}
                                                                        onChange={(e) => updateFieldLabel(i, e.target.value)}
                                                                    />
                                                                    <Select
                                                                        value={f.type === "text" ? "text" : f.unit_id}
                                                                        onValueChange={(v) => updateFieldTypeAndUnit(i, v)}
                                                                    >
                                                                        <SelectTrigger className="w-[140px] h-9 text-xs">
                                                                            <SelectValue placeholder="Tipo / Unidade" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="text">Texto</SelectItem>
                                                                            {units.map((u) => (
                                                                                <SelectItem key={u.id} value={u.id}>
                                                                                    {u.symbol} - {u.name}
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>

                                                                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeField(i)}>
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            {dynamicFields.length === 0 && (
                                                                <div className="text-center py-6 border border-dashed rounded-lg bg-muted/20 text-xs text-muted-foreground italic">
                                                                    Nenhum parâmetro extra definido.
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="pt-4">
                                                        <Button type="submit" disabled={mutation.isPending} className="w-full">
                                                            {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                                            {editingCategory ? "Salvar Alterações" : "Criar Categoria"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="rounded-md border overflow-hidden">
                                        <ScrollArea className="h-[300px]">
                                            <Table>
                                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                                    <TableRow>
                                                        <TableHead>Nome</TableHead>
                                                        <TableHead className="text-right">Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {isLoading ? (
                                                        <TableRow><TableCell colSpan={2} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                                                    ) : categories.length === 0 ? (
                                                        <TableRow><TableCell colSpan={2} className="text-center py-10 text-muted-foreground">Nenhuma categoria encontrada.</TableCell></TableRow>
                                                    ) : (
                                                        categories.map((cat) => (
                                                            <TableRow
                                                                key={cat.id}
                                                                className={`cursor-pointer transition-colors ${selectedCategory?.id === cat.id ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
                                                                onClick={() => setSelectedCategory(cat)}
                                                            >
                                                                <TableCell className="font-semibold">
                                                                    <div className="flex items-center gap-2">
                                                                        {cat.name}
                                                                        {!cat.active && <Badge variant="secondary" className="text-[8px] h-4 px-1">Inativa</Badge>}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => { e.stopPropagation(); toggleMutation.mutate(cat.id); }}
                                                                            className={cat.active ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 h-8 w-8" : "text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 h-8 w-8"}
                                                                            title={cat.active ? "Desativar" : "Ativar"}
                                                                        >
                                                                            <Power className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
                                                                            className="h-8 w-8"
                                                                            title="Editar"
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={(e) => { e.stopPropagation(); handleDelete(cat.id); }}
                                                                            className="text-destructive h-8 w-8"
                                                                            title="Excluir"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8"
                                                                            onClick={(e) => { e.stopPropagation(); setSelectedCategory(cat); }}
                                                                        >
                                                                            Ver
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
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Measurement Units Section */}
                    <Card className="shadow-xl overflow-hidden border-primary/10">
                        <CardHeader
                            className="cursor-pointer hover:bg-muted/30 transition-colors flex flex-row items-center justify-between space-y-0"
                            onClick={() => setIsUnitsExpanded(!isUnitsExpanded)}
                        >
                            <div className="space-y-1">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Settings className="h-5 w-5 text-primary" />
                                    Unidades de Medida
                                </CardTitle>
                                <CardDescription>Gerencie as unidades (kg, m, un) para cálculos de estoque e custo.</CardDescription>
                            </div>
                            {isUnitsExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                        </CardHeader>
                        {isUnitsExpanded && (
                            <CardContent className="space-y-6 pt-0 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="pt-4">
                                    <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full" onClick={handleAddNewUnit}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Adicionar Nova Unidade
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[400px]">
                                            <DialogHeader>
                                                <DialogTitle>{editingUnit ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
                                                <DialogDescription>
                                                    Defina o nome por extenso e o símbolo da unidade.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <Form {...unitForm}>
                                                <form onSubmit={unitForm.handleSubmit((v) => unitMutation.mutate(v))} className="space-y-4 pt-4">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="col-span-2">
                                                            <FormField control={unitForm.control} name="name" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Nome</FormLabel>
                                                                    <FormControl><Input placeholder="Ex: Quilograma" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                        <div>
                                                            <FormField control={unitForm.control} name="symbol" render={({ field }) => (
                                                                <FormItem>
                                                                    <FormLabel>Símbolo</FormLabel>
                                                                    <FormControl><Input placeholder="Ex: kg" {...field} /></FormControl>
                                                                    <FormMessage />
                                                                </FormItem>
                                                            )} />
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="pt-4">
                                                        <Button type="submit" disabled={unitMutation.isPending} className="w-full">
                                                            {unitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                                            {editingUnit ? "Salvar Alterações" : "Criar Unidade"}
                                                        </Button>
                                                    </DialogFooter>
                                                </form>
                                            </Form>
                                        </DialogContent>
                                    </Dialog>

                                    <div className="rounded-md border overflow-hidden">
                                        <ScrollArea className="h-[300px]">
                                            <Table>
                                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                                    <TableRow>
                                                        <TableHead>Unidade</TableHead>
                                                        <TableHead>Símbolo</TableHead>
                                                        <TableHead className="text-right">Ações</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {isLoadingUnits ? (
                                                        <TableRow><TableCell colSpan={3} className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto opacity-20" /></TableCell></TableRow>
                                                    ) : units.length === 0 ? (
                                                        <TableRow><TableCell colSpan={3} className="text-center py-10 text-muted-foreground">Nenhuma unidade encontrada.</TableCell></TableRow>
                                                    ) : (
                                                        units.map((u) => (
                                                            <TableRow key={u.id}>
                                                                <TableCell className="font-semibold">{u.name}</TableCell>
                                                                <TableCell><Badge variant="outline">{u.symbol}</Badge></TableCell>
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => toggleUnitMutation.mutate(u.id)}
                                                                            className={u.active ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600 h-8 w-8" : "text-amber-600 hover:bg-amber-500/10 hover:text-amber-600 h-8 w-8"}
                                                                            title={u.active ? "Desativar" : "Ativar"}
                                                                        >
                                                                            <Power className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => handleEditUnit(u)}
                                                                            className="h-8 w-8"
                                                                            title="Editar"
                                                                        >
                                                                            <Edit2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => { if (window.confirm("Excluir unidade?")) deleteUnitMutation.mutate(u.id) }}
                                                                            className="text-destructive h-8 w-8"
                                                                            title="Excluir"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
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
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>

                <div className="lg:col-span-5 h-[calc(100vh-300px)] sticky top-6">
                    {renderCategoryDetails()}
                </div>
            </div>
        </div>
    )
}
