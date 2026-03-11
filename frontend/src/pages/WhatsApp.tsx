import { useState } from 'react';
import {
    Send,
    MessageSquare,
    MoreVertical,
    Phone,
    Video,
    Search,
    CheckCheck,
    Users,
    CircleDashed,
    UserPlus,
    Filter
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MOCK_CONVERSATIONS = [
    {
        id: '1',
        name: 'Carlos Oliveira',
        lastMessage: 'Confirmado o envio do pedido 452',
        time: '14:20',
        unread: 2,
        online: true,
        avatar: 'CO'
    },
    {
        id: '2',
        name: 'Maria Fernanda',
        lastMessage: 'Qual o valor total com o frete?',
        time: '12:05',
        unread: 0,
        online: false,
        avatar: 'MF'
    },
    {
        id: '3',
        name: 'Fornecedor Tecidos',
        lastMessage: 'Nova remessa chega amanhã',
        time: 'Ontem',
        unread: 1,
        online: false,
        avatar: 'FT'
    }
];

const MOCK_MESSAGES = [
    { id: 1, sender: 'other', text: 'Boa tarde! Gostaria de saber sobre o status do meu pedido.', time: '14:10' },
    { id: 2, sender: 'me', text: 'Olá Carlos! Seu pedido já foi processado e está em fase de separação.', time: '14:15' },
    { id: 3, sender: 'other', text: 'Confirmado o envio do pedido 452?', time: '14:20' },
];

export default function WhatsApp() {
    const [selectedId, setSelectedId] = useState('1');
    const [message, setMessage] = useState('');

    const activeChat = MOCK_CONVERSATIONS.find(c => c.id === selectedId);

    return (
        <div className="h-[calc(100vh-180px)] overflow-hidden lg:h-[calc(100vh-220px)] rounded-[3rem] smooth-glass border-none shadow-3xl flex animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Sidebar Conversas */}
            <div className="w-full lg:w-[400px] border-r border-white/5 flex flex-col bg-white/[0.02]">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="h2-brand flex items-center gap-2">
                                <MessageSquare className="h-6 w-6 text-primary" />
                                Mensagens
                            </h2>
                            <Badge className="bg-primary/20 text-primary border-none shadow-none">5 Novas</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                                <CircleDashed className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="rounded-full h-10 w-10">
                                <UserPlus className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar cliente ou conversa..."
                            className="pl-12 h-14 bg-white/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30 transition-all shadow-inner"
                        />
                        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10">
                            <Filter className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
                    {MOCK_CONVERSATIONS.map((chat) => (
                        <button
                            key={chat.id}
                            onClick={() => setSelectedId(chat.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-5 rounded-[2rem] transition-all duration-300 group",
                                selectedId === chat.id
                                    ? "bg-primary shadow-2xl shadow-primary/20"
                                    : "hover:bg-white/5 border border-transparent hover:border-white/5"
                            )}
                        >
                            <div className="relative">
                                <div className={cn(
                                    "h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-lg shadow-xl",
                                    selectedId === chat.id ? "bg-white text-primary" : "bg-primary/10 text-primary"
                                )}>
                                    {chat.avatar}
                                </div>
                                {chat.online && (
                                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-4 border-background" />
                                )}
                            </div>

                            <div className="flex-1 text-left overflow-hidden space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "font-bold truncate",
                                        selectedId === chat.id ? "text-white" : "text-foreground"
                                    )}>
                                        {chat.name}
                                    </span>
                                    <span className={cn(
                                        "text-[10px] font-bold",
                                        selectedId === chat.id ? "text-white/60" : "text-muted-foreground"
                                    )}>
                                        {chat.time}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <p className={cn(
                                        "text-xs truncate opacity-70",
                                        selectedId === chat.id ? "text-white/80" : "text-muted-foreground"
                                    )}>
                                        {chat.lastMessage}
                                    </p>
                                    {chat.unread > 0 && selectedId !== chat.id && (
                                        <Badge className="bg-primary text-white border-none h-5 min-w-[20px] px-1 justify-center">
                                            {chat.unread}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Area de Chat */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-white/[0.01]">
                {activeChat ? (
                    <>
                        {/* Header do Chat */}
                        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] backdrop-blur-3xl sticky top-0 z-10">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner">
                                    {activeChat.avatar}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg leading-tight">{activeChat.name}</h3>
                                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Disponível Agora
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-sm">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-sm">
                                    <Video className="h-5 w-5 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-2xl h-12 w-12 border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-sm">
                                    <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                </Button>
                            </div>
                        </div>

                        {/* Corpo do Chat */}
                        <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar bg-[url('/chat-bg.png')] bg-repeat opacity-[0.98]">
                            {MOCK_MESSAGES.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        "flex group animate-in slide-in-from-bottom-2 duration-300",
                                        msg.sender === 'me' ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <div className={cn(
                                        "max-w-[70%] p-5 px-6 rounded-[2rem] shadow-2xl relative",
                                        msg.sender === 'me'
                                            ? "bg-primary text-white rounded-tr-sm"
                                            : "smooth-glass rounded-tl-sm text-foreground border border-white/5"
                                    )}>
                                        <p className="text-sm leading-relaxed tracking-wide font-medium">{msg.text}</p>
                                        <div className={cn(
                                            "flex items-center justify-end gap-1.5 mt-2 opacity-60",
                                            msg.sender === 'me' ? "text-white/70" : "text-muted-foreground"
                                        )}>
                                            <span className="text-[10px] font-bold">{msg.time}</span>
                                            {msg.sender === 'me' && <CheckCheck className="h-3 w-3 text-emerald-300" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input de Mensagem */}
                        <div className="p-8 pb-10 bg-white/[0.02] backdrop-blur-3xl border-t border-white/5">
                            <div className="flex items-end gap-4 max-w-5xl mx-auto">
                                <div className="flex-1 relative">
                                    <Input
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Digite sua mensagem para o cliente..."
                                        className="h-16 pr-16 bg-white/5 border-none rounded-3xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all shadow-inner text-base"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 text-muted-foreground hover:text-primary transition-all"
                                    >
                                        <Users className="h-5 w-5" />
                                    </Button>
                                </div>
                                <Button
                                    className="h-16 w-16 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all group"
                                >
                                    <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform stroke-[2.5]" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-8 animate-in fade-in zoom-in-95 duration-1000">
                        <div className="h-32 w-32 rounded-[2.5rem] bg-primary/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 rounded-[2.5rem] bg-primary animate-pulse opacity-10" />
                            <MessageSquare className="h-16 w-16 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="h3-brand">MarkFace Omnichannel</h3>
                            <p className="body-brand text-muted-foreground opacity-60 max-w-[300px]">
                                Selecione uma conversa ao lado para iniciar o atendimento centralizado.
                            </p>
                        </div>
                        <Button variant="secondary" className="rounded-2xl px-8 h-12 label-brand bg-primary/10 text-primary border-none shadow-none hover:bg-primary hover:text-white transition-all">
                            Nova Conversa
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
