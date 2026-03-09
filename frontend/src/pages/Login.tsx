import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, Zap, ArrowRight, Activity, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('admin@markface.com');
    const [password, setPassword] = useState('Admin@1234');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [systemInitializing, setSystemInitializing] = useState(false);
    const navigate = useNavigate();

    React.useEffect(() => {
        // Check if backend is alive
        const checkHealth = async () => {
            try {
                const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
                const start = Date.now();
                await fetch(`${apiBase}/health`);
                const duration = Date.now() - start;
                // If it took more than 2s, it was likely a cold start
                if (duration > 2000) {
                    console.log('Cold start detected');
                }
            } catch (e) {
                setSystemInitializing(true);
            }
        };
        checkHealth();
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });
            localStorage.setItem('token', response.data.access_token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0a0a0c] selection:bg-primary/30 selection:text-white">
            {/* Ultra Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[180px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-violet-600/5 blur-[200px] animate-pulse-slow delay-1000" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[40%] rounded-full bg-blue-600/5 blur-[150px] animate-pulse-slow delay-500" />
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-[440px] px-6 animate-in fade-in zoom-in slide-in-from-bottom-6 duration-1000 flex flex-col items-center">
                <div className="mb-8 text-center space-y-4">
                    <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl group-hover:blur-[100px] transition-all duration-1000 opacity-60" />
                        <img
                            src="/markface-white.png"
                            alt="MarkFace Logo"
                            className="relative h-20 md:h-24 object-contain drop-shadow-[0_0_20px_rgba(var(--primary),0.3)] animate-float"
                        />
                    </div>

                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-6 bg-white/10" />
                        <p className="text-muted-foreground text-[9px] font-black tracking-[0.4em] uppercase opacity-40 italic">Hub de Inteligência</p>
                        <div className="h-px w-6 bg-white/10" />
                    </div>
                </div>

                <Card className="w-full rounded-[2.5rem] border border-white/5 glass-dark shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative group/card">
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30 group-hover/card:opacity-100 transition-opacity duration-1000" />

                    <CardHeader className="p-10 pb-4 text-center space-y-1">
                        <CardTitle className="text-3xl font-[1000] text-white tracking-tighter uppercase italic">Portal de Acesso</CardTitle>
                        <CardDescription className={cn(
                            "text-[10px] font-bold italic uppercase tracking-widest transition-colors duration-500",
                            systemInitializing ? "text-primary animate-pulse" : "text-muted-foreground/40"
                        )}>
                            {systemInitializing ? "Otimizando Motores (Acordando Servidor)..." : "Inicializando protocolos de autenticação..."}
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleLogin} className="p-10 pt-0 space-y-6">
                        {error && (
                            <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-3 flex items-center gap-3 text-[10px] text-destructive font-black uppercase italic tracking-wider animate-in slide-in-from-top-4 duration-500">
                                <Activity className="h-3 w-3 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 italic ml-4">Identificação de Credencial</Label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@markface.com"
                                        className="h-14 pl-12 pr-6 rounded-[1.2rem] glass border-none focus:ring-4 focus:ring-primary/20 text-lg font-bold tracking-tight transition-all placeholder:opacity-10"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" title="Senha" className="text-[9px] font-black uppercase tracking-[0.2em] text-primary/60 italic ml-4">Cifra de Acesso</Label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-14 pl-12 pr-6 rounded-[1.2rem] glass border-none focus:ring-4 focus:ring-primary/20 text-lg font-bold tracking-tight transition-all placeholder:opacity-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-16 rounded-[1.2rem] text-lg font-[1000] italic uppercase tracking-[0.2em] bg-primary text-primary-foreground shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group relative overflow-hidden"
                            disabled={loading}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            {loading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Sincronizando...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    <span>Autorizar</span>
                                    <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                                </div>
                            )}
                        </Button>

                        <div className="text-center pt-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic cursor-pointer hover:text-primary transition-colors">
                                Redefinição de Protocolo Esquecido &mdash; Contate o Admin
                            </span>
                        </div>
                    </form>
                </Card>

                <div className="mt-8 flex flex-col items-center space-y-3 opacity-20">
                    <p className="text-[8px] font-black tracking-[0.5em] text-white uppercase italic">
                        &copy; 2026 Mark Face Systems
                    </p>
                    <div className="flex gap-3">
                        <Zap className="h-2 w-2 text-primary" />
                        <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <Activity className="h-2 w-2 text-primary" />
                    </div>
                </div>
            </div>
        </div>
    );
}
