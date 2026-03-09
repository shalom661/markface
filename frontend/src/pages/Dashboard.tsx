
import {
    Package,
    ShoppingCart,
    TrendingUp,
    Users,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    ShoppingBag,
    Activity,
    MousePointer2,
    Zap,
    Crown,
    Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const stats = [
        {
            label: "Total de Produtos",
            value: "124",
            icon: Package,
            change: "+12%",
            trend: "up",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            description: "Itens catalogados"
        },
        {
            label: "Pedidos Hoje",
            value: "18",
            icon: ShoppingCart,
            change: "+5%",
            trend: "up",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            description: "Novas transações"
        },
        {
            label: "Clientes Novos",
            value: "42",
            icon: Users,
            change: "+18%",
            trend: "up",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            description: "Geração de Leads"
        },
        {
            label: "Receita (Mês)",
            value: "R$ 45.230",
            icon: DollarSign,
            change: "-2%",
            trend: "down",
            color: "text-amber-400",
            bg: "bg-amber-500/10",
            description: "Faturamento bruto"
        },
    ];

    return (
        <div className="max-w-[1600px] mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-inner animate-pulse">
                            <Activity className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-5xl font-[900] tracking-tighter italic uppercase text-white/90">Monitor</h2>
                                <Badge variant="secondary" className="bg-primary/5 text-primary-foreground/70 border-none font-black text-[10px] uppercase tracking-widest px-2 py-0.5">Tempo Real</Badge>
                            </div>
                            <p className="text-muted-foreground text-lg font-semibold opacity-60 italic mt-1">
                                Bem-vindo ao cockpit do <span className="text-primary opacity-100 not-italic font-black">MarkFace Hub</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-3xl glass border-white/5 shadow-2xl">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status do Cluster</span>
                        <span className="text-xs font-bold text-emerald-400">Operando em 100%</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-20" />
                        <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, i) => (
                    <Card
                        key={i}
                        className="group relative overflow-hidden rounded-[2.5rem] border-none glass p-1 transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl hover:shadow-primary/5"
                    >
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("p-4 rounded-2xl shadow-xl transition-all duration-500 group-hover:rotate-6", stat.bg, stat.color)}>
                                    <stat.icon className="h-7 w-7 stroke-[2.5]" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full border shadow-inner",
                                    stat.trend === "up" ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" : "bg-red-500/5 text-red-400 border-red-500/10"
                                )}>
                                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {stat.change}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-4xl font-black tracking-tighter text-white/90">{stat.value}</h4>
                                    <span className="text-[10px] font-bold text-muted-foreground/40 italic">total</span>
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground/30 italic pt-2 border-t border-white/5 mt-4">
                                    {stat.description}
                                </p>
                            </div>
                        </CardContent>

                        {/* Decorative Background Element */}
                        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/[0.02] blur-3xl group-hover:bg-primary/5 transition-all duration-700" />
                    </Card>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="grid gap-8 lg:grid-cols-7">
                {/* Visual Chart Placeholder Area */}
                <Card className="lg:col-span-4 rounded-[3.5rem] border-none glass overflow-hidden shadow-2xl flex flex-col group">
                    <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                                <TrendingUp className="h-6 w-6 text-primary" />
                                Projeção Mensal
                            </CardTitle>
                            <CardDescription className="text-xs font-bold text-muted-foreground italic">Monitoramento de fluxo e conversão</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/5">D</Button>
                            <Button variant="secondary" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest bg-primary text-primary-foreground">S</Button>
                            <Button variant="ghost" size="sm" className="rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/5">M</Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-10 flex-1 flex items-end">
                        <div className="w-full space-y-8">
                            <div className="h-[280px] w-full flex items-end gap-3 px-2">
                                {[45, 60, 45, 70, 50, 85, 95, 65, 80, 100, 75, 90].map((h, i) => (
                                    <div
                                        key={i}
                                        className="flex-1 bg-gradient-to-t from-primary/5 to-primary/20 rounded-t-2xl hover:from-primary/20 hover:to-primary transition-all relative group cursor-pointer"
                                        style={{ height: `${h}% ` }}
                                    >
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass text-white text-[10px] font-black py-1.5 px-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                                            {h}%
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between border-t border-white/5 pt-6 px-2">
                                {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => (
                                    <span key={m} className="text-[10px] font-black text-muted-foreground/30">{m}</span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shortcuts & Actions */}
                <div className="lg:col-span-3 space-y-8">
                    <Card className="rounded-[3rem] border-none glass p-8 shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-1">
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                                    <Crown className="h-6 w-6 text-amber-400" />
                                    Atalhos Mestres
                                </h3>
                                <p className="text-[10px] font-bold text-muted-foreground italic">Operações críticas do sistema</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: "Novo Produto", icon: Package, color: "bg-blue-500", to: "/products/new" },
                                    { label: "Registrar Compra", icon: ShoppingBag, color: "bg-purple-500", to: "/purchases" },
                                    { label: "Custo de Peça", icon: DollarSign, color: "bg-emerald-500", to: "/costs" },
                                ].map((btn, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center justify-between p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group/btn"
                                    >
                                        <div className="flex items-center gap-5">
                                            <div className={cn("p-3.5 rounded-2xl text-white shadow-2xl transform transition-transform group-hover/btn:scale-110", btn.color)}>
                                                <btn.icon className="h-5 w-5 stroke-[2.5]" />
                                            </div>
                                            <div className="text-left">
                                                <span className="block font-black text-sm uppercase tracking-widest text-white/80">{btn.label}</span>
                                                <span className="text-[10px] font-bold text-muted-foreground/40 italic">Acesso Instantâneo</span>
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover/btn:opacity-100 transition-all transform group-hover/btn:translate-x-1">
                                            <MousePointer2 className="h-4 w-4 text-primary" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Sparkle effect */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Card>

                    <Card className="rounded-[3rem] border-none glass p-8 bg-primary/5 flex items-center justify-between group overflow-hidden">
                        <div className="space-y-4 relative z-10">
                            <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xl">
                                <Target className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-black text-xl uppercase tracking-tighter italic">Meta Diária</h4>
                                <p className="text-xs font-bold text-muted-foreground mt-1 underline underline-offset-4 decoration-primary/30">Faltam 12 vendas para bater o recorde</p>
                            </div>
                        </div>
                        <div className="relative h-24 w-24 flex items-center justify-center z-10">
                            <svg className="h-full w-full -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="251.2" strokeDashoffset="75" className="text-primary stroke-[10] drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                            </svg>
                            <span className="absolute font-black text-lg">70%</span>
                        </div>

                        <div className="absolute -left-10 -bottom-10 h-32 w-32 bg-primary/20 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
                    </Card>
                </div>
            </div>
        </div>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}

