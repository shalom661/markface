import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(255),
    contact_name: z.string().max(255).optional().or(z.literal("")),
    phone: z.string().max(50).optional().or(z.literal("")),
    email: z.string().email("E-mail inválido").max(255).optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface SupplierFormProps {
    supplier?: any
    onSuccess?: () => void
}

export function SupplierForm({ supplier, onSuccess }: SupplierFormProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: supplier?.name || "",
            contact_name: supplier?.contact_name || "",
            phone: supplier?.phone || "",
            email: supplier?.email || "",
            notes: supplier?.notes || "",
            active: supplier?.active ?? true,
        },
    })

    const mutation = useMutation({
        mutationFn: async (values: FormValues) => {
            const payload = {
                ...values,
                contact_name: values.contact_name || null,
                phone: values.phone || null,
                email: values.email || null,
                notes: values.notes || null,
            }

            if (supplier?.id) {
                const response = await api.put(`/suppliers/${supplier.id}`, payload)
                return response.data
            } else {
                const response = await api.post("/suppliers", payload)
                return response.data
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["suppliers"] })
            toast({
                title: "Sucesso!",
                description: supplier?.id ? "Fornecedor atualizado." : "Fornecedor cadastrado.",
            })
            form.reset()
            onSuccess?.()
        },
        onError: (error: any) => {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.response?.data?.detail || "Erro ao salvar fornecedor.",
            })
        },
    })

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Fornecedor *</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Tecidos Brilhante LTDA" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="contact_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do Contato</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: João Silva" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                    <Input placeholder="(00) 00000-0000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                                <Input placeholder="contato@fornecedor.com.br" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Detalhes adicionais sobre o fornecedor..."
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="active"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                                onValueChange={(v) => field.onChange(v === "true")}
                                defaultValue={field.value ? "true" : "false"}
                            >
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o status" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="true">Ativo</SelectItem>
                                    <SelectItem value="false">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={mutation.isPending} className="w-full md:w-auto">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {supplier?.id ? "Salvar Alterações" : "Cadastrar Fornecedor"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
