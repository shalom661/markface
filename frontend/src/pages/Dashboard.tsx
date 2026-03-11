import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Link } from 'react-router-dom';
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
import { cn } from "@/lib/utils";

export default function Dashboard() {
    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const response = await api.get('/stats/dashboard');
            return response.data;
        }
    });

    const stats = [
        {
            label: "Total de Produtos",
            value: isLoading ? "..." : dashboardData?.stats.total_products.toString(),
            icon: Package,
            change: dashboardData?.stats.products_change || "+0%",
            trend: "up",
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            description: "Itens catalogados"
        },
        {
            label: "Pedidos Hoje",
            value: isLoading ? "..." : dashboardData?.stats.orders_today.toString(),
            icon: ShoppingCart,
            change: dashboardData?.stats.orders_change || "+0%",
            trend: "up",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            description: "Novas transações"
        },
        {
            label: "Clientes Novos",
            value: isLoading ? "..." : dashboardData?.stats.active_customers.toString(),
            icon: Users,
            change: dashboardData?.stats.customers_change || "+0%",
            trend: "up",
            color: "text-purple-400",
            bg: "bg-purple-500/10",
            description: "Geração de Leads"
        },
        {
            label: "Receita (Mês)",
            value: isLoading ? "..." : `R$ ${parseFloat(dashboardData?.stats.monthly_revenue || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            icon: DollarSign,
            change: dashboardData?.stats.revenue_change || "+0%",
            trend: "up",
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
                                <h1 className="h1-brand">Monitor</h1>
                                <Badge variant="secondary" className="bg-primary/5 text-primary-foreground/70 label-brand px-2 py-0.5 border-none shadow-sm">Tempo Real</Badge>
                            </div>
                            <p className="body-brand text-muted-foreground opacity-80 mt-1">
                                Bem-vindo ao cockpit do <span className="text-primary font-bold">MarkFace Hub</span>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-3xl smooth-glass shadow-2xl">
                    <div className="flex flex-col items-end">
                        <span className="label-brand text-muted-foreground">Status do Sistema</span>
                        <span className="text-xs font-bold text-emerald-400">Dados Sincronizados</span>
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
                        className="group relative overflow-hidden rounded-[2.5rem] border-none smooth-glass p-1 transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl hover:shadow-primary/5"
                    >
                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className={cn("p-4 rounded-2xl shadow-xl transition-all duration-500 group-hover:rotate-6", stat.bg, stat.color)}>
                                    <stat.icon className="h-7 w-7 stroke-[2.5]" />
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 label-brand px-3 py-1.5 rounded-full shadow-inner border-none",
                                    stat.trend === "up" ? "bg-emerald-500/5 text-emerald-400" : "bg-red-500/5 text-red-400"
                                )}>
                                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {stat.change}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <p className="label-brand text-muted-foreground/80">{stat.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="stat-brand text-white/90">{stat.value}</h4>
                                    <span className="label-brand text-muted-foreground/60">total</span>
                                </div>
                                <p className="label-brand text-muted-foreground/40 pt-3 mt-3">
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
            <div className="grid gap-8 lg:grid-cols-10">
                {/* Visual Chart Placeholder Area */}
                <Card className="lg:col-span-6 rounded-[3.5rem] border-none smooth-glass overflow-hidden shadow-2xl flex flex-col group">
                    <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="h2-brand uppercase flex items-center gap-3">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Projeção Mensal
                            </CardTitle>
                            <CardDescription className="label-brand text-muted-foreground opacity-80">Monitoramento de fluxo e conversão</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="rounded-xl label-brand bg-primary/5">D</Button>
                            <Button variant="secondary" size="sm" className="rounded-xl label-brand bg-primary text-primary-foreground">S</Button>
                            <Button variant="ghost" size="sm" className="rounded-xl label-brand bg-primary/5">M</Button>
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
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 smooth-glass text-white label-brand py-1.5 px-3 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform scale-50 group-hover:scale-100">
                                            {h}%
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between border-t border-white/5 pt-6 px-2">
                                {['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'].map(m => (
                                    <span key={m} className="label-brand text-muted-foreground/50">{m}</span>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Shortcuts & Actions */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Real-time Notifications */}
                    <Card className="rounded-[3rem] border-none smooth-glass p-8 shadow-2xl relative overflow-hidden group min-h-[400px]">
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="h3-brand uppercase flex items-center gap-3">
                                        <Activity className="h-5 w-5 text-emerald-400" />
                                        Atividade Recente
                                    </h3>
                                    <p className="label-brand">Notificações em tempo real</p>
                                </div>
                                <Badge className="bg-primary/10 text-primary border-none">3 Pendentes</Badge>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { type: 'whatsapp', title: 'Mensagem de Carlos', desc: 'Confirmado o envio do pedido...', time: '2m atrás', color: 'bg-emerald-500' },
                                    { type: 'order', title: 'Novo Pedido #842', desc: 'Cliente: Maria Fernanda', time: '15m atrás', color: 'bg-blue-500' },
                                    { type: 'inventory', title: 'Estoque Baixo', desc: 'Tecido Algodão (Preto)', time: '1h atrás', color: 'bg-amber-500' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group/item">
                                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg text-white", item.color)}>
                                            {item.type === 'whatsapp' ? <MessageSquare className="h-5 w-5" /> : item.type === 'order' ? <ShoppingCart className="h-5 w-5" /> : <Package className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1 space-y-0.5 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold truncate">{item.title}</span>
                                                <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate opacity-70 group-hover/item:opacity-100 transition-opacity">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Button variant="ghost" className="w-full rounded-2xl h-12 text-muted-foreground hover:text-primary border border-dashed border-white/10 hover:border-primary/30">
                                Ver todas as notificações
                            </Button>
                        </div>
                    </Card>

                    <Card className="rounded-[3rem] border-none smooth-glass p-8 shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-8">
                            <div className="space-y-1">
                                <h3 className="h3-brand uppercase flex items-center gap-3">
                                    <MessageSquare className="h-5 w-5 text-primary" />
                                    Atendimento WhatsApp
                                </h3>
                                <p className="label-brand">Fila de espera centralizada</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-10 w-10 rounded-xl bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                                            U{i}
                                        </div>
                                    ))}
                                    <div className="h-10 w-10 rounded-xl bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                        +5
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    <span className="text-white font-bold">8 clientes</span> aguardando
                                </p>
                            </div>

                            <Button className="w-full h-14 rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 group/btn" asChild>
                                <Link to="/whatsapp" className="flex items-center justify-center gap-2">
                                    Abrir Central de Chat
                                    <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                </Link>
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

