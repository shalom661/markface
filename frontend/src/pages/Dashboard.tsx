import React from 'react';

export default function Dashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
                <p className="text-muted-foreground">
                    Bem-vindo ao MarkFace Hub.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Placeholder metric cards */}
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Total de Produtos</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">120</div>
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow">
                    <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium">Pedidos Hoje</h3>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="text-2xl font-bold">14</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
