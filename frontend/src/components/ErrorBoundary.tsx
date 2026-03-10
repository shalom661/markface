import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground font-sans">
                    <div className="max-w-md w-full glass rounded-[2.5rem] border-destructive/20 p-10 text-center space-y-8 animate-in zoom-in duration-500 shadow-2xl shadow-destructive/10">
                        <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                            <AlertCircle className="h-10 w-10" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="h2-brand text-3xl italic">Crash de Kernel</h2>
                            <p className="body-brand text-muted-foreground opacity-70">
                                Ocorreu uma falha crítica na interface de dados. O sistema foi interrompido para proteger a integridade dos registros.
                            </p>
                        </div>

                        <div className="text-xs font-mono bg-black/40 p-4 rounded-xl border border-white/5 text-left overflow-auto max-h-32 scrollbar-hide opacity-50">
                            {this.state.error?.message || "Erro desconhecido"}
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={() => window.location.reload()}
                                className="h-12 rounded-2xl bg-primary text-primary-foreground label-brand flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reiniciar Protocolo
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    this.setState({ hasError: false });
                                    window.location.href = "/";
                                }}
                                className="h-12 rounded-2xl border-white/5 text-muted-foreground label-brand hover:bg-white/5"
                            >
                                <Home className="h-4 w-4 mr-2" />
                                Voltar à Base
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
