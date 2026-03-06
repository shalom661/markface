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

const formSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(255),
    email: z.string().email("E-mail inválido").max(255).optional().or(z.literal("")),
    phone: z.string().max(50).optional().or(z.literal("")),
    tax_id: z.string().max(50).optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface CustomerFormProps {
    customer?: any | null
    onSuccess?: () => void
}

export function CustomerForm({ customer, onSuccess }: CustomerFormProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: customer?.name || "",
            email: customer?.email || "",
            phone: customer?.phone || "",
            tax_id: customer?.tax_id || "",
            address: customer?.address || "",
            active: customer?.active ?? true,
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const payload = {
                ...data,
                email: data.email || null,
                phone: data.phone || null,
                tax_id: data.tax_id || null,
                address: data.address || null,
            }
            if (customer?.id) {
                const response = await api.put(`/customers/${customer.id}`, payload)
                return response.data
            } else {
                const response = await api.post("/customers", payload)
                return response.data
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["customers"] })
            toast({
                title: "Sucesso!",
                description: customer ? "Cliente atualizado com sucesso." : "Cliente cadastrado com sucesso.",
            })
            form.reset()
            onSuccess?.()
        },
        onError: (error: any) => {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro ao salvar",
                description: error.response?.data?.detail || "Verifique os campos e tente novamente.",
            })
        },
    })

    function onSubmit(data: FormValues) {
        mutation.mutate(data)
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Completo / Razão Social *</FormLabel>
                            <FormControl>
                                <Input placeholder="João da Silva ou MarkFace LTDA" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>E-mail</FormLabel>
                                <FormControl>
                                    <Input placeholder="cliente@exemplo.com" {...field} />
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
                    name="tax_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>CPF / CNPJ</FormLabel>
                            <FormControl>
                                <Input placeholder="Documento do cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Rua, Número, Bairro, Cidade - UF"
                                    className="resize-none"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Cliente
                    </Button>
                </div>
            </form>
        </Form>
    )
}
