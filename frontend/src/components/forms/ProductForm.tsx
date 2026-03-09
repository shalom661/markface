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
    description: z.string().optional().or(z.literal("")),
    internal_code: z.string().min(1, "Código interno é obrigatório").max(120),
    active: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

interface ProductFormProps {
    product?: any | null
    onSuccess?: () => void
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: product?.name || "",
            description: product?.description || "",
            internal_code: product?.internal_code || "",
            active: product?.active ?? true,
        },
    })

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const payload = {
                ...data,
                description: data.description || null,
            }
            if (product?.id) {
                const response = await api.put(`/products/${product.id}`, payload)
                return response.data
            } else {
                const response = await api.post("/products", payload)
                return response.data
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast({
                title: "Sucesso!",
                description: product ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso.",
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
                            <FormLabel className="label-brand ml-1">Nome do Produto <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: Pijama de Seda, Camiseta Básica"
                                    {...field}
                                    className="h-12 rounded-xl smooth-glass border-primary/10 body-brand"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="internal_code"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Código Interno <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="Ex: PIJ-INV-001"
                                    {...field}
                                    className="h-12 rounded-xl smooth-glass border-primary/10 body-brand"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="label-brand ml-1">Descrição</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Detalhes sobre o produto..."
                                    className="resize-none rounded-xl smooth-glass border-primary/10 body-brand min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={mutation.isPending}
                        className="w-full sm:w-auto h-12 px-8 rounded-xl bg-primary text-primary-foreground h3-brand shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all"
                    >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Produto
                    </Button>
                </div>
            </form>
        </Form>
    )
}
