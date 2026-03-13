import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Search, MoreVertical, Paperclip, Smile, ShieldCheck, ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Message {
    id: string;
    sender: 'me' | 'other';
    text: string;
    time: string;
    status: 'sent' | 'delivered' | 'read' | 'received';
}

interface Conversation {
    id: string;
    name: string;
    phoneNumber: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    avatar?: string;
}

const MOCK_CONVERSATIONS: Conversation[] = [
    {
        id: '1',
        name: 'Cliente Teste',
        phoneNumber: '5511990115302',
        lastMessage: 'Sincronizado com Meta API',
        time: format(new Date(), 'HH:mm', { locale: ptBR }),
        unread: 0,
        online: true,
        avatar: 'CT'
    }
];

export default function WhatsApp() {
    const [selectedId, setSelectedId] = useState('1');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'error' | 'checking'>('checking');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { toast } = useToast();
    const scrollRef = useRef<HTMLDivElement>(null);

    const activeChat = MOCK_CONVERSATIONS.find(c => c.id === selectedId);

    const fetchHistory = useCallback(async (showLoading = false) => {
        if (!activeChat) return;
        if (showLoading) setIsLoading(true);

        try {
            const response = await api.get(`/whatsapp/history/${activeChat.phoneNumber}`);
            setMessages(response.data);
            setConnectionStatus('online');
            setErrorMessage(null);
        } catch (error: any) {
            console.error("Erro ao carregar histórico:", error);
            if (error.response?.status === 400) {
                setConnectionStatus('error');
                setErrorMessage("Erro na Meta Cloud API. Verifique seu token.");
            }
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [activeChat]);

    // Initial Load
    useEffect(() => {
        fetchHistory(true);
    }, [fetchHistory]);

    // Real-time Sync (2s Polling)
    useEffect(() => {
        const interval = setInterval(() => {
            if (!isSending) fetchHistory(false);
        }, 2000);
        return () => clearInterval(interval);
    }, [fetchHistory, isSending]);

    // Auto Scroll
    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!message.trim() || !activeChat || isSending) return;

        setIsSending(true);
        const textToSend = message;
        setMessage('');

        try {
            await api.post('/whatsapp/send', {
                to: activeChat.phoneNumber,
                message: textToSend
            });
            await fetchHistory(false);
        } catch (error: any) {
            console.error("Erro ao enviar:", error);
            const detail = error.response?.data?.detail || "Erro ao conectar com a Meta.";
            setErrorMessage(detail);
            setConnectionStatus('error');
            setMessage(textToSend); // Restore text
            toast({
                variant: "destructive",
                title: "Falha no envio",
                description: detail
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-64px)] w-full overflow-hidden bg-[#0a0a0a]">
            {/* Sidebar */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-[#0f0f0f]">
                <div className="p-4 border-b border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-foreground">Conversas</h2>
                        <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <Input
                            placeholder="Buscar contato..."
                            className="bg-primary/5 border-none pl-10 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {MOCK_CONVERSATIONS.map((chat) => (
                        <div
                            key={chat.id}
                            onClick={() => setSelectedId(chat.id)}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${selectedId === chat.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'hover:bg-white/5 border-l-2 border-transparent'
                                }`}
                        >
                            <Avatar className="w-12 h-12 border border-white/10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-medium">
                                    {chat.avatar}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-foreground truncate">{chat.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{chat.time}</span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{chat.lastMessage}</p>
                            </div>
                        </div>
                    ))}
                </ScrollArea>
            </div>

            {/* Chat Area */}
            {activeChat ? (
                <div className="flex-1 flex flex-col relative">
                    {/* Header */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-[#0f0f0f]/80 backdrop-blur-md z-10">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-white/10">
                                <AvatarFallback className="bg-blue-600 text-white text-xs">{activeChat.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{activeChat.name}</span>
                                <div className="flex items-center gap-1.5">
                                    {connectionStatus === 'online' ? (
                                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-green-500/30 bg-green-500/10 text-green-500 gap-1 flex">
                                            <ShieldCheck className="w-2.5 h-2.5" /> Meta Cloud API Oficial
                                        </Badge>
                                    ) : connectionStatus === 'error' ? (
                                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-red-500/30 bg-red-500/10 text-red-500 gap-1 flex">
                                            <ShieldAlert className="w-2.5 h-2.5" /> Conexão Meta Expirada
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="h-4 px-1.5 text-[9px] border-white/10 bg-white/5 text-white/40 gap-1 flex animate-pulse">
                                            <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Verificando...
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea ref={scrollRef} className="flex-1 p-6 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-[0.03] absolute inset-0 pt-16 pb-20 pointer-events-none" />

                    <ScrollArea ref={scrollRef} className="flex-1 p-6 pt-20 pb-24 z-0">
                        <div className="max-w-4xl mx-auto space-y-4">
                            {/* History Alert */}
                            <div className="flex justify-center mb-8">
                                <div className="bg-white/5 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-muted-foreground/40" />
                                    <span className="text-[10px] text-muted-foreground/40 uppercase font-medium tracking-wider">Início do histórico seguro no Hub</span>
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                                    <p className="text-muted-foreground text-sm italic">Sincronizando com a Meta...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-20 opacity-30">
                                    <Smile className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-foreground">Nenhuma mensagem registrada ainda.</p>
                                    <p className="text-xs">As conversas aparecem aqui conforme são sincronizadas.</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] group relative px-4 py-2.5 rounded-2xl ${msg.sender === 'me'
                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                            : 'bg-[#1e1e1e] text-white/90 rounded-tl-none border border-white/5'
                                            }`}>
                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                            <div className="flex items-center justify-end gap-1.5 mt-1 opacity-50">
                                                <span className="text-[9px] uppercase">{msg.time}</span>
                                                {msg.sender === 'me' && (
                                                    <span className="text-[10px]">✓✓</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>

                    {/* Meta Error Banner */}
                    {errorMessage && connectionStatus === 'error' && (
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-lg px-6 z-20">
                            <Card className="bg-red-500/10 border-red-500/20 backdrop-blur-md p-3 flex items-center gap-3">
                                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-red-500">Erro de Sincronia</p>
                                    <p className="text-[10px] text-red-500/70 truncate">{errorMessage}</p>
                                </div>
                                <Button size="sm" variant="ghost" className="text-[10px] text-red-500 hover:bg-red-500/10 h-7" asChild>
                                    <a href="/api/v1/whatsapp/debug" target="_blank">Debug</a>
                                </Button>
                            </Card>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 bg-[#0f0f0f]/80 backdrop-blur-md border-t border-white/5 space-y-4 z-10">
                        <div className="max-w-4xl mx-auto flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="text-white/30 hover:text-white shrink-0">
                                <Paperclip className="w-5 h-5" />
                            </Button>
                            <div className="flex-1 relative">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Escreva sua mensagem..."
                                    className="bg-white/5 border-none text-white placeholder:text-white/20 h-11 pr-12 focus-visible:ring-1 focus-visible:ring-blue-500"
                                />
                                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                                    <Smile className="w-5 h-5" />
                                </Button>
                            </div>
                            <Button
                                onClick={handleSendMessage}
                                disabled={!message.trim() || isSending || connectionStatus === 'error'}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 h-11 rounded-xl transition-all shadow-lg active:scale-95 disabled:scale-100 disabled:opacity-50"
                            >
                                {isSending ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
                    <div className="text-center space-y-4 opacity-20">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-medium text-foreground">Mensagens Criptografadas</h3>
                        <p className="text-sm max-w-xs text-muted-foreground">
                            Selecione um contato para sincronizar sua conversa oficial através da Meta Cloud API.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
