export interface CategoryField {
    name: string;
    label: string;
    type: "text" | "number" | "select";
    placeholder?: string;
    step?: string;
    options?: string[];
    unit_id?: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryField[]> = {
    "tecidos": [
        { name: "tipo_tecido", label: "Tipo de Tecido", type: "text", placeholder: "Ex: Meia Malha" },
        { name: "rendimento", label: "Rendimento (m/kg)", type: "number", step: "0.01" },
        { name: "largura", label: "Largura (m)", type: "number", step: "0.01" },
        { name: "gramatura", label: "Gramatura (g/m²)", type: "number" },
        { name: "estampa", label: "Estampa", type: "text" },
        { name: "info_etiqueta", label: "Info p/ Etiqueta", type: "text" },
    ],
    "botões": [
        { name: "tipo", label: "Tipo", type: "text" },
        { name: "tamanho", label: "Tamanho", type: "text" },
        { name: "furos", label: "Furos", type: "number" },
        { name: "pezinho", label: "Tem Pezinho?", type: "text", placeholder: "Sim/Não" },
    ],
    "zíper": [
        { name: "tipo", label: "Tipo", type: "text" },
        { name: "comprimento", label: "Comprimento (cm)", type: "number" },
        { name: "cursor", label: "Cursor", type: "text" },
        { name: "cor_dentes", label: "Cor dos Dentes", type: "text" },
        { name: "cor_cursor", label: "Cor do Cursor", type: "text" },
    ],
    "elástico": [
        { name: "largura", label: "Largura (mm)", type: "number" },
    ],
    "linha": [
        { name: "resistencia", label: "Resistência", type: "text" },
        { name: "aplicacao", label: "Aplicação", type: "text", placeholder: "Ex: Overlock, Reta" },
        { name: "espessura", label: "Espessura", type: "text" },
        { name: "cabos", label: "Nº de Cabos", type: "number" },
    ],
    "etiqueta": [
        { name: "largura", label: "Largura (cm)", type: "number", step: "0.1" },
        { name: "comprimento", label: "Comprimento (cm)", type: "number", step: "0.1" },
    ],
    "bordado": [
        { name: "largura", label: "Largura (cm)", type: "number", step: "0.1" },
        { name: "comprimento", label: "Comprimento (cm)", type: "number", step: "0.1" },
        { name: "pontos", label: "Nº de Pontos", type: "number" },
    ],
    "embalagem": [
        { name: "largura", label: "Largura (cm)", type: "number", step: "0.1" },
        { name: "comprimento", label: "Comprimento (cm)", type: "number", step: "0.1" },
    ],
    "fio de acabamento": [
        { name: "tipo", label: "Tipo", type: "text" },
        { name: "largura", label: "Largura", type: "text" },
        { name: "comprimento", label: "Comprimento", type: "text" },
        { name: "diametro", label: "Diâmetro", type: "text" },
        { name: "espessura", label: "Espessura", type: "text" },
    ],
    "renda": [
        { name: "tipo", label: "Tipo", type: "text" },
        { name: "comprimento", label: "Comprimento", type: "text" },
        { name: "largura", label: "Largura", type: "text" },
        { name: "espessura", label: "Espessura", type: "text" },
    ],
    "gola": [
        { name: "tipo", label: "Tipo", type: "text" },
        { name: "largura", label: "Largura", type: "text" },
        { name: "comprimento", label: "Comprimento", type: "text" },
        { name: "estampa", label: "Estampa", type: "text" },
        { name: "espessura", label: "Espessura", type: "text" },
    ]
};
