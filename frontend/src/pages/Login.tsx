import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, ShieldCheck, Zap, ArrowRight, Activity, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('admin@markface.com');
    const [password, setPassword] = useState('Admin@1234');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

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
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0a0c] selection:bg-primary/30 selection:text-white">
            {/* Ultra Dynamic Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[180px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full bg-violet-600/5 blur-[200px] animate-pulse-slow delay-1000" />
                <div className="absolute top-[20%] right-[-5%] w-[30%] h-[40%] rounded-full bg-blue-600/5 blur-[150px] animate-pulse-slow delay-500" />

                {/* Mesh Gradient Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
            </div>

            <div className="relative z-10 w-full max-w-[500px] p-8 animate-in fade-in zoom-in slide-in-from-bottom-12 duration-1000">
                <div className="mb-14 text-center space-y-6">
                    <div className="relative inline-block group">
                        <div className="absolute inset-0 bg-primary/30 blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-50" />
                        <div className="relative inline-block p-6 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-transparent border border-white/10 mb-2 backdrop-blur-xl group-hover:scale-110 transition-transform duration-500">
                            <ShieldCheck className="h-12 w-12 text-primary" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-8xl font-[1000] tracking-[calc(-0.06em)] text-white uppercase italic leading-[0.85] flex flex-col items-center">
                            MARK<span className="text-primary italic animate-pulse-subtle">FACE</span>
                        </h1>
                        <div className="flex items-center justify-center gap-3">
                            <div className="h-px w-8 bg-white/10" />
                            <p className="text-muted-foreground text-[10px] font-black tracking-[0.4em] uppercase opacity-40 italic">Premium Intelligence Hub</p>
                            <div className="h-px w-8 bg-white/10" />
                        </div>
                    </div>
                </div>

                <Card className="rounded-[3.5rem] border border-white/5 glass-dark shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden relative group/card">
                    {/* Interior Glow */}
                    <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-30 group-hover/card:opacity-100 transition-opacity duration-1000" />

                    <CardHeader className="p-14 pb-8 text-center space-y-2">
                        <CardTitle className="text-4xl font-[1000] text-white tracking-tighter uppercase italic">Access Portal</CardTitle>
                        <CardDescription className="text-sm font-bold text-muted-foreground/40 italic uppercase tracking-widest">
                            Inizializando protocolos de autenticação...
                        </CardDescription>
                    </CardHeader>

                    <form onSubmit={handleLogin} className="p-14 pt-0 space-y-10">
                        {error && (
                            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-5 flex items-center gap-4 text-xs text-destructive font-black uppercase italic tracking-wider animate-in slide-in-from-top-4 duration-500">
                                <Activity className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic ml-4">Credential ID</Label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@markface.com"
                                        className="h-20 pl-16 pr-8 rounded-[1.5rem] glass border-none focus:ring-4 focus:ring-primary/20 text-xl font-bold tracking-tight transition-all placeholder:opacity-10 placeholder:italic"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label htmlFor="password" title="Senha" className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 italic ml-4">Access Cipher</Label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-500 group-focus-within/input:text-primary transition-colors" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="h-20 pl-16 pr-8 rounded-[1.5rem] glass border-none focus:ring-4 focus:ring-primary/20 text-xl font-bold tracking-tight transition-all placeholder:opacity-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-20 rounded-[1.5rem] text-xl font-[1000] italic uppercase tracking-[0.3em] bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-[1.03] active:scale-95 transition-all group relative overflow-hidden"
                            disabled={loading}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            {loading ? (
                                <div className="flex items-center gap-4">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                    <span>Syncing...</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-4">
                                    <span>Authorize</span>
                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                                </div>
                            )}
                        </Button>

                        <div className="text-center pt-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30 italic cursor-pointer hover:text-primary transition-colors">
                                Forgotten Protocol Reset &mdash; Contact Admin
                            </span>
                        </div>
                    </form>
                </Card>

                <div className="mt-16 flex flex-col items-center space-y-4 opacity-30 group-hover:opacity-100 transition-opacity duration-1000">
                    <p className="text-[10px] font-black tracking-[0.5em] text-white uppercase italic">
                        &copy; 2026 Mark Face Systems
                    </p>
                    <div className="flex gap-4">
                        <Zap className="h-3 w-3 text-primary" />
                        <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <Activity className="h-3 w-3 text-primary" />
                    </div>
                </div>
            </div>
        </div>
    );
}
