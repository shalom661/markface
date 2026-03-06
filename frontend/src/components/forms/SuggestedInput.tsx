import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import api from "@/lib/api"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"

interface SuggestedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    fieldName: string;
}

export const SuggestedInput = React.forwardRef<HTMLInputElement, SuggestedInputProps>(
    ({ fieldName, ...props }, ref) => {
        const listId = `suggestions-${fieldName}`

        const { data: suggestions = [], isLoading } = useQuery({
            queryKey: ["autocomplete", fieldName, props.value],
            queryFn: async () => {
                const { data } = await api.get("/raw-materials/autocomplete", {
                    params: {
                        field: fieldName,
                        prefix: typeof props.value === "string" ? props.value : "",
                        limit: 10
                    }
                })
                return data.values as string[]
            },
            staleTime: 0,
        })

        return (
            <div className="relative w-full">
                <Input
                    {...props}
                    ref={ref}
                    list={listId}
                    autoComplete="off"
                />
                <datalist id={listId}>
                    {suggestions.map((val) => (
                        <option key={val} value={val} />
                    ))}
                </datalist>
                {isLoading && (
                    <div className="absolute right-2 top-2.5">
                        <Loader2 className="h-4 w-4 animate-spin opacity-20" />
                    </div>
                )}
            </div>
        )
    }
)

SuggestedInput.displayName = "SuggestedInput"
