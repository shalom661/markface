import React, { useState, useEffect } from 'react';
import {
    Send,
    MessageSquare,
    CheckCheck,
    Loader2,
    Search
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { cn } from "@/lib/utils";

interface Message {
    id: number;
    sender: 'me' | 'other';
    text: string;
    time: string;
}

const MOCK_CONVERSATIONS = [
    {
        id: '1',
        name: 'Carlos Oliveira',
        phoneNumber: '5511999999999', // Exemplo
        lastMessage: 'Confirmado o envio do pedido 452',
        time: '14:20',
        unread: 2,
        online: true,
        avatar: 'CO'
    },
    {
        id: '2',
        name: 'Cliente Teste',
        phoneNumber: '5511990115302', // Número para teste do usuário
        lastMessage: 'Qual o valor total com o frete?',
        time: '12:05',
        unread: 0,
        online: false,
        avatar: 'CT'
    }
];

export default function WhatsApp() {
    const [selectedId, setSelectedId] = useState('1');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const { toast } = useToast();

    const activeChat = MOCK_CONVERSATIONS.find(c => c.id === selectedId);

    // Fetch history when activeChat changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (!activeChat) return;

            try {
                const response = await api.get(`/whatsapp/history/${activeChat.phoneNumber}`);
                setMessages(response.data);
            } catch (error) {
                console.error("Erro ao carregar histórico:", error);
            }
        };

        fetchHistory();
    }, [selectedId, activeChat]);

    // Live polling for new messages every 2 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            if (!activeChat || isSending) return;

            try {
                const response = await api.get(`/whatsapp/history/${activeChat.phoneNumber}`);
                if (response.data.length !== messages.length) {
                    setMessages(response.data);
                }
            } catch (error) {
                console.error("Erro no polling de mensagens:", error);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [selectedId, activeChat, messages.length, isSending]);

    const handleSendMessage = async () => {
        if (!message.trim() || !activeChat || isSending) return;

        setIsSending(true);
        const currentMessage = message;
        setMessage(''); // Clear input immediately for better UX

        try {
            await api.post('/whatsapp/send', {
                to: activeChat.phoneNumber,
                message: currentMessage
            });

            // Re-fetch history to get the official message state from DB
            const response = await api.get(`/whatsapp/history/${activeChat.phoneNumber}`);
            setMessages(response.data);

            toast({
                title: "Mensagem enviada",
                description: "Sua mensagem foi entregue com sucesso.",
            });
        } catch (error: any) {
            console.error("Erro ao enviar mensagem:", error);
            setMessage(currentMessage); // Restore message on error
            toast({
                variant: "destructive",
                title: "Erro ao enviar",
                description: error.response?.data?.detail || "Não foi possível enviar a mensagem.",
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="h-full w-full overflow-hidden border-none shadow-none flex animate-in fade-in duration-700">
            {/* Sidebar Conversas */}
            <div className="w-full lg:w-[400px] border-r border-white/5 flex flex-col bg-white/[0.02]">
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <h2 className="h2-brand flex items-center gap-2">
                                <MessageSquare className="h-6 w-6 text-primary" />
                                Mensagens
                            </h2>
                            <Badge className="bg-primary/20 text-primary border-none shadow-none">Integração Ativa</Badge>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Buscar cliente ou conversa..."
                            className="pl-12 h-14 bg-white/5 border-none rounded-2xl focus-visible:ring-1 focus-visible:ring-primary/30 transition-all shadow-inner"
                        />
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
                            </div>

                            <div className="flex-1 text-left overflow-hidden space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className={cn(
                                        "font-bold truncate",
                                        selectedId === chat.id ? "text-white" : "text-foreground"
                                    )}>
                                        {chat.name}
                                    </span>
                                </div>
                                <p className={cn(
                                    "text-xs truncate opacity-70",
                                    selectedId === chat.id ? "text-white/80" : "text-muted-foreground"
                                )}>
                                    {chat.phoneNumber}
                                </p>
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
                                        Meta Cloud API Oficial
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Corpo do Chat */}
                        <div className="flex-1 overflow-y-auto p-12 space-y-8 custom-scrollbar">
                            {messages.map((msg: Message) => (
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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Digite sua mensagem para o cliente..."
                                        disabled={isSending}
                                        className="h-16 pr-16 bg-white/5 border-none rounded-3xl focus-visible:ring-1 focus-visible:ring-primary/20 transition-all shadow-inner text-base"
                                    />
                                </div>
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isSending || !message.trim()}
                                    className="h-16 w-16 rounded-3xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all group"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform stroke-[2.5]" />
                                    )}
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
                                Selecione uma conversa ao lado para iniciar o atendimento real via WhatsApp.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
