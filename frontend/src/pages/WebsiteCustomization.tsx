import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Layout,
    Image as ImageIcon,
    Star,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    ArrowLeft,
    Menu as MenuIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Card } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// --- Types ---

interface Banner {
    id: string;
    image_url: string;
    link_url?: string;
    duration: number;
    active: boolean;
    order: number;
}

interface ProductCategory {
    id: string;
    name: string;
    slug: string;
    parent_id?: string;
    active: boolean;
    show_in_menu: boolean;
    is_featured: boolean;
    order: number;
    children?: ProductCategory[];
}


export default function WebsiteCustomization() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('banners');

    // --- Queries ---

    const { data: banners } = useQuery<Banner[]>({
        queryKey: ['site-banners'],
        queryFn: async () => (await api.get('/site/banners')).data,
    });

    const { data: categories } = useQuery<ProductCategory[]>({
        queryKey: ['product-categories'],
        queryFn: async () => (await api.get('/product-categories?root_only=true')).data,
    });


    // --- Mutations ---

    const updateBanner = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => 
            api.put(`/site/banners/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-banners'] });
            toast.success("Banner atualizado");
        }
    });

    const deleteBanner = useMutation({
        mutationFn: async (id: string) => api.delete(`/site/banners/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-banners'] });
            toast.success("Banner removido");
        }
    });

    const createBanner = useMutation({
        mutationFn: async (data: any) => api.post('/site/banners', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['site-banners'] });
            toast.success("Banner criado");
        }
    });

    const updateCategory = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => 
            api.put(`/product-categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
            toast.success("Categoria atualizada");
        }
    });

    const createCategory = useMutation({
        mutationFn: async (data: any) => api.post('/product-categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
            toast.success("Categoria criada");
        }
    });

    const deleteCategory = useMutation({
        mutationFn: async (id: string) => api.delete(`/product-categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['product-categories'] });
            toast.success("Categoria removida");
        }
    });


    const renderFeaturedSections = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="h3-brand text-xl">Destaques da Home</h3>
                    <p className="text-xs text-muted-foreground body-brand font-medium">Organize vitrines de produtos e categorias especiais</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <Card className="p-8 smooth-glass border-none rounded-[2rem]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/10">
                            <Star className="h-6 w-6 fill-current" />
                        </div>
                        <div>
                            <h4 className="h4-brand text-lg">Categorias em Destaque</h4>
                            <p className="text-sm text-muted-foreground body-brand">Estes itens aparecerão em blocos especiais na sua página inicial</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories?.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => updateCategory.mutate({ id: cat.id, data: { is_featured: !cat.is_featured }})}
                                className={`p-4 rounded-2xl border transition-all text-left space-y-2 group ${cat.is_featured ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/20' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                            >
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${cat.is_featured ? 'bg-amber-500/20 text-amber-400 shadow-lg shadow-amber-500/20' : 'bg-white/5 text-muted-foreground'}`}>
                                    <Star className={`h-4 w-4 ${cat.is_featured ? 'fill-current' : ''}`} />
                                </div>
                                <span className={`text-[11px] font-bold body-brand leading-tight block uppercase tracking-tight ${cat.is_featured ? 'text-amber-200' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                    {cat.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </Card>

                <Card className="p-12 text-center smooth-glass border-none rounded-[3rem] opacity-60">
                    <Layout className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <h3 className="h3-brand text-lg mb-2">Vitrines Personalizadas</h3>
                    <p className="body-brand text-muted-foreground text-sm max-w-sm mx-auto">
                        A funcionalidade de selecionar produtos individuais para vitrines será disponibilizada em uma atualização futura.
                    </p>
                </Card>
            </div>
        </div>
    );
    const renderBanners = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="h3-brand text-xl">Banners Rotativos</h3>
                <Button 
                    onClick={() => createBanner.mutate({ image_url: '', duration: 5, active: true, order: (banners?.length || 0) })}
                    className="rounded-xl flex items-center gap-2 bg-blue-600 hover:bg-blue-700 font-bold"
                >
                    <Plus className="h-4 w-4" /> Adicionar Banner
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners?.map((banner) => (
                    <Card key={banner.id} className="p-4 smooth-glass border-none rounded-3xl space-y-4">
                        <div className="aspect-[21/9] rounded-2xl bg-muted overflow-hidden relative group">
                            {banner.image_url ? (
                                <img src={banner.image_url} alt="Banner Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                                    <ImageIcon className="h-12 w-12" />
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="destructive" className="h-8 w-8 rounded-lg shadow-xl shadow-destructive/20" onClick={() => deleteBanner.mutate(banner.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">Título do Banner</label>
                                    <Input 
                                        value={banner.title || ''} 
                                        onChange={(e) => updateBanner.mutate({ id: banner.id, data: { title: e.target.value }})}
                                        placeholder="Ex: Verão 2024"
                                        className="h-10 rounded-xl bg-white/5 border-white/5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">Subtítulo / Descrição</label>
                                    <Input 
                                        value={banner.subtitle || ''} 
                                        onChange={(e) => updateBanner.mutate({ id: banner.id, data: { subtitle: e.target.value }})}
                                        placeholder="Ex: Nova coleção disponível"
                                        className="h-10 rounded-xl bg-white/5 border-white/5"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">URL da Imagem</label>
                                    <Input 
                                        value={banner.image_url} 
                                        onChange={(e) => updateBanner.mutate({ id: banner.id, data: { image_url: e.target.value }})}
                                        placeholder="https://exemplo.com/imagem.jpg"
                                        className="h-10 rounded-xl bg-white/5 border-white/5"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">Duração (s)</label>
                                        <Input 
                                            type="number"
                                            value={banner.duration} 
                                            onChange={(e) => updateBanner.mutate({ id: banner.id, data: { duration: parseInt(e.target.value) }})}
                                            className="h-10 rounded-xl bg-white/5 border-white/5"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground ml-1 font-bold">Link (Opcional)</label>
                                        <Input 
                                            value={banner.link_url || ''} 
                                            onChange={(e) => updateBanner.mutate({ id: banner.id, data: { link_url: e.target.value }})}
                                            placeholder="/categoria/novidades"
                                            className="h-10 rounded-xl bg-white/5 border-white/5"
                                        />
                                    </div>
                                </div>
                            </div>
                    </Card>
                ))}
            </div>
        </div>
    );



    const renderCategories = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h3 className="h3-brand text-xl">Estrutura de Categorias</h3>
                    <p className="text-xs text-muted-foreground body-brand">Defina as categorias principais e secundárias do seu site</p>
                </div>
                <Button 
                    onClick={() => createCategory.mutate({ name: 'Nova Categoria', active: true, show_in_menu: true, order: 0 })}
                    className="rounded-xl flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" /> Nova Categoria Pai
                </Button>
            </div>

            <div className="space-y-4">
                {categories?.map((cat) => (
                    <Card key={cat.id} className="p-1 smooth-glass border-none rounded-3xl overflow-hidden">
                        <div className="p-4 flex items-center justify-between group">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                    <Layout className="h-5 w-5" />
                                </div>
                                <div className="flex-1 max-w-sm">
                                    <Input 
                                        value={cat.name}
                                        onChange={(e) => updateCategory.mutate({ id: cat.id, data: { name: e.target.value }})}
                                        className="h-10 border-transparent bg-transparent hover:bg-white/5 focus:bg-white/5 body-brand text-lg"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className={`rounded-full px-3 h-8 flex items-center gap-2 transition-all ${cat.show_in_menu ? 'bg-blue-500/20 text-blue-400' : 'text-muted-foreground'}`}
                                        onClick={() => updateCategory.mutate({ id: cat.id, data: { show_in_menu: !cat.show_in_menu }})}
                                    >
                                        {cat.show_in_menu ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                        <span className="text-[10px] uppercase font-bold tracking-wider">{cat.show_in_menu ? 'No Menu' : 'Oculto'}</span>
                                    </Button>
                                    <Badge variant="outline" className="h-8 px-3 rounded-full border-white/5 text-[10px] uppercase font-bold tracking-wider">
                                        ID: {cat.slug}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 rounded-lg hover:bg-blue-500/10 text-blue-400"
                                    onClick={() => createCategory.mutate({ name: 'Nova Subcategoria', parent_id: cat.id, active: true, show_in_menu: true, order: 0 })}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => deleteCategory.mutate(cat.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Subcategories */}
                        {cat.children && cat.children.length > 0 && (
                            <div className="p-4 pt-0 space-y-2 pl-14">
                                {cat.children.map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 group/sub">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                                            <Input 
                                                value={sub.name}
                                                onChange={(e) => updateCategory.mutate({ id: sub.id, data: { name: e.target.value }})}
                                                className="h-8 border-transparent bg-transparent hover:bg-white/10 focus:bg-white/10 body-brand text-sm py-0 flex-1 max-w-[200px]"
                                            />
                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className={`rounded-full px-2 h-6 flex items-center gap-2 transition-all ${sub.show_in_menu ? 'bg-blue-500/10 text-blue-400' : 'text-muted-foreground'}`}
                                                onClick={() => updateCategory.mutate({ id: sub.id, data: { show_in_menu: !sub.show_in_menu }})}
                                            >
                                                {sub.show_in_menu ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md opacity-0 group-hover/sub:opacity-100 transition-opacity hover:bg-destructive/10 text-destructive" onClick={() => deleteCategory.mutate(sub.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl" onClick={() => navigate('/website')}>
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="h1-brand text-3xl">Personalizar Site</h1>
                        <p className="body-brand text-muted-foreground text-xs">Configure banners, menus e seções de destaque</p>
                    </div>
                </div>
                <div className="flex gap-2">
                   <Badge variant="outline" className="h-8 px-4 rounded-full bg-blue-500/5 text-blue-400 border-blue-500/20">
                       Design Joge Style
                   </Badge>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
                <TabsList className="bg-transparent h-auto p-0 gap-2 border-b border-white/5 w-full justify-start rounded-none">
                    <TabsTrigger value="banners" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-transparent rounded-none h-12 px-6 flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" /> Banners
                    </TabsTrigger>
                    <TabsTrigger value="menu" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-transparent rounded-none h-12 px-6 flex items-center gap-2">
                        <MenuIcon className="h-4 w-4" /> Menu & Categorias
                    </TabsTrigger>
                    <TabsTrigger value="featured" className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary border-transparent rounded-none h-12 px-6 flex items-center gap-2">
                        <Star className="h-4 w-4" /> Seções de Destaque
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="banners" className="mt-0">
                    {renderBanners()}
                </TabsContent>

                <TabsContent value="menu" className="mt-0">
                    {renderCategories()}
                </TabsContent>

                <TabsContent value="featured" className="mt-0">
                    {renderFeaturedSections()}
                </TabsContent>
            </Tabs>
        </div>
    );
}
