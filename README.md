# MarkFace Hub

> Backend e frontend central para gestão de produtos, estoque, pedidos e matérias-primas — inclui interface web (Hub) e importação em massa via Excel.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| API | FastAPI + Uvicorn |
| ORM | SQLAlchemy 2.0 async |
| Migrations | Alembic |
| Banco | PostgreSQL 16 |
| Fila | Redis 7 |
| Worker | Celery |
| Auth | JWT + bcrypt (passlib) |
| Schemas | Pydantic v2 |
| Testes | Pytest + httpx |
| **Frontend** | **React + Vite + shadcn/ui** |
| **Import** | **openpyxl (Excel .xlsx)** |

---

## Pré-requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24 **(Linux engine ativo)**
- Docker Compose V2 (`docker compose`)

---

## Início Rápido

### 1. Configurar variáveis de ambiente

```bash
cp .env.example .env
# Edite .env — mínimo obrigatório para produção:
#   JWT_SECRET_KEY, WOO_WEBHOOK_SECRET
```

### 2. Subir todos os serviços

```bash
docker compose up --build
```

Ao subir, a API automaticamente:
1. Aplica todas as migrations (`alembic upgrade head`)
2. Cria o usuário admin seed
3. Inicia com hot-reload (`uvicorn --reload`)

### 3. Acessar

| Interface | URL |
|-----------|-----|
| **Hub (Frontend)** | http://localhost:5173 |
| **API** | http://localhost:8000 |
| **Swagger UI** | http://localhost:8000/api/docs |
| **ReDoc** | http://localhost:8000/api/redoc |
| **Healthcheck** | http://localhost:8000/health |
| **Adminer (DB)** | http://localhost:8080 *(requer `--profile tools`)* |

> Para abrir o Adminer: `docker compose --profile tools up -d adminer`

> **Frontend dev server** (Vite, com hot-reload):
> ```bash
> cd frontend && npm install && npm run dev
> ```

---

## O que está implementado

### ✅ Seção 1 — Fundação

- **Auth JWT**: login, registro, refresh, `/me`
- **Produtos**: CRUD completo com soft-delete
- **Variantes**: SKU único, atributos livres (JSONB), preço/custo/dimensões
- **Estoque**: ajuste por delta ou valor absoluto; sem negativo
- **EventLog**: audit trail de eventos com reprocessamento via Celery
- **Healthcheck**: verifica DB + Redis

### ✅ Seção 2 — Integração WooCommerce (Webhooks Inbound)

- **Webhook assinado**: validação HMAC-SHA256 (igual ao padrão WooCommerce)
- **Pedidos inbound**: cria `Order` + `OrderItems` a partir de webhooks
- **Idempotência**: mesmo webhook enviado duas vezes não duplica nada
- **Mapeamento de SKU**: liga `OrderItem` à `ProductVariant`; SKUs sem match → `ORDER_ITEM_UNMAPPED` event
- **Reserva de estoque**: `stock_reserved += qty` ao criar pedido
- **Liberação de estoque**: `stock_reserved -= qty` ao cancelar
- **Estoque insuficiente**: retorna 200 pro Woo (evita retry spam), emite `STOCK_INSUFFICIENT` event, marca pedido como `insufficient_stock`
- **Tabela de movimentos**: `inventory_movements` — trilha auditável de todas as operações

### ✅ Seção 4 — Cadastro de Matéria-Prima (Fase 4-A)

- **Fornecedores**: CRUD completo com soft-delete
- **Matérias-Primas**: Suporte a campos dinâmicos por categoria via `JSONB`
- **Autocomplete**: Sugestão inteligente de campos repetitivos (cor, composição)
- **Duplicação**: Copia atributos de uma matéria-prima existente para facilitar cadastro

### ✅ Hub Frontend (Fase 4-A.2)

- Interface React + Vite em `http://localhost:5173`
- Páginas: Visão Geral, Produtos, Pedidos, Fornecedores, Matérias-Primas
- **Importação de dados em massa via Excel**:
  - Download de planilha modelo (`GET /api/v1/import/template/{type}`)
  - Upload e importação (`POST /api/v1/import/raw-materials`)
  - Seleção de tipo de importação com cards interativos (Matérias-Primas ✅, Fornecedores e Estoque em breve)
- JWT com validade de **8 horas** (configurável via `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`)
- Interceptor automático: sessão expirada redireciona para login

---

## Banco de Dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `users` | Usuários com roles (admin, user) |
| `products` | Produtos com soft-delete |
| `product_variants` | Variantes com SKU único |
| `inventory` | Estoque: 1 linha por variante |
| `event_log` | Audit trail de eventos do domínio |
| `orders` | Pedidos recebidos de canais externos |
| `order_items` | Itens dos pedidos (um por linha) |
| `inventory_movements` | Histórico de todas as movimentações de estoque |
| `suppliers` | Fornecedores de matéria-prima |
| `raw_materials` | Matérias-primas com atributos flexíveis |

### Migrations

```bash
# Aplicar pendentes (roda automático no start)
docker compose exec api alembic upgrade head

# Criar nova migration
docker compose exec api alembic revision --autogenerate -m "descricao"

# Ver histórico
docker compose exec api alembic history

# Reverter 1
docker compose exec api alembic downgrade -1
```

---

## Autenticação

### Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@markface.com", "password": "Admin@1234"}'
```

Resposta:
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "refresh_token": "eyJ..."
}
```

Use o token em todos os endpoints protegidos:
```bash
export TOKEN="eyJ..."
```

---

## Endpoints — Seção 1

### Auth

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/auth/register` | Criar usuário |
| POST | `/api/v1/auth/login` | Login → JWT |
| GET | `/api/v1/auth/me` | Usuário autenticado |

### Produtos & Variantes

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/products` | Criar produto |
| GET | `/api/v1/products` | Listar (paginado) |
| GET | `/api/v1/products/{id}` | Buscar por ID |
| PUT | `/api/v1/products/{id}` | Atualizar |
| DELETE | `/api/v1/products/{id}` | Soft-delete |
| POST | `/api/v1/products/{id}/variants` | Criar variante |
| GET | `/api/v1/variants` | Listar variantes |
| GET | `/api/v1/variants/{id}` | Buscar variante |
| PUT | `/api/v1/variants/{id}` | Atualizar variante |
| DELETE | `/api/v1/variants/{id}` | Desativar variante |

### Importação em Massa (Excel)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/import/templates` | Lista os tipos de importação disponíveis |
| GET | `/api/v1/import/template/{type}` | Baixa a planilha modelo (`?token=<jwt>`) |
| POST | `/api/v1/import/raw-materials` | Importa matérias-primas de uma planilha `.xlsx` |

**Tipos disponíveis:** `raw-materials` ✅ · `suppliers` (em breve) · `inventory` (em breve)

### Fornecedores & Matérias-Primas

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v1/suppliers` | Criar fornecedor |
| GET | `/api/v1/suppliers` | Listar fornecedores |
| GET | `/api/v1/suppliers/{id}` | Buscar fornecedor |
| PUT | `/api/v1/suppliers/{id}` | Atualizar fornecedor |
| DELETE | `/api/v1/suppliers/{id}` | Soft-delete do fornecedor |
| GET | `/api/v1/raw-materials/autocomplete` | Sugestão de valores (cor, composição, etc) |
| POST | `/api/v1/raw-materials` | Criar matéria-prima |
| GET | `/api/v1/raw-materials` | Listar / filtrar matérias-primas |
| POST | `/api/v1/raw-materials/{id}/duplicate` | Duplicar matéria-prima existente |
| PUT | `/api/v1/raw-materials/{id}` | Atualizar matéria-prima |
| DELETE | `/api/v1/raw-materials/{id}` | Soft-delete da matéria-prima |

### Estoque

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/inventory` | Listar todo o estoque |
| GET | `/api/v1/inventory/{variant_id}` | Estoque da variante |
| POST | `/api/v1/inventory/{variant_id}/adjust` | Ajustar estoque |

```bash
# Ajuste por delta (relativo)
curl -X POST http://localhost:8000/api/v1/inventory/{variant_id}/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"delta": 50, "reason": "Entrada NF-001"}'

# Definir absoluto
curl -X POST http://localhost:8000/api/v1/inventory/{variant_id}/adjust \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"set_absolute": 100, "reason": "Inventário físico"}'
```

### EventLog

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v1/events` | Listar eventos (filter: status, type) |
| POST | `/api/v1/events/{id}/reprocess` | Reprocessar evento |

### Health

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Verifica DB + Redis |

---

## Endpoints — Seção 2 (Webhooks WooCommerce)

> ⚠️ Estes endpoints **não usam JWT**. A segurança é feita por assinatura HMAC-SHA256.

| Método | Endpoint | Evento Woo |
|--------|----------|-----------|
| POST | `/api/v1/webhooks/woocommerce/order-created` | `order.created` |
| POST | `/api/v1/webhooks/woocommerce/order-updated` | `order.updated` |
| POST | `/api/v1/webhooks/woocommerce/order-cancelled` | `order.deleted` / `order.restored` |

Header obrigatório: `X-WC-Webhook-Signature: <base64(HMAC-SHA256(secret, raw_body))>`

### Como configurar no WooCommerce

1. WooCommerce Admin → **Settings → Advanced → Webhooks → Add webhook**
2. Configure um webhook para cada evento:

| Evento | URL de entrega |
|--------|---------------|
| Order created | `https://seu-hub.com/api/v1/webhooks/woocommerce/order-created` |
| Order updated | `https://seu-hub.com/api/v1/webhooks/woocommerce/order-updated` |
| Order deleted | `https://seu-hub.com/api/v1/webhooks/woocommerce/order-cancelled` |

3. Copie o **Secret** que o WooCommerce gera e adicione ao `.env`:
```
WOO_WEBHOOK_SECRET=cole_o_secret_aqui
```

4. Content Type: `application/json`

### Exemplo de payload WooCommerce

```json
{
  "id": 12345,
  "status": "processing",
  "currency": "BRL",
  "total": "299.85",
  "line_items": [
    {
      "id": 1,
      "name": "Camiseta Premium M Preto",
      "sku": "CAMISA-PREM-M-PRETO",
      "quantity": 3,
      "price": "99.95",
      "total": "299.85"
    }
  ]
}
```

### Regras de estoque

| Situação | Comportamento |
|----------|--------------|
| SKU mapeado, estoque ok | `stock_reserved += qty` + event `STOCK_RESERVED` |
| SKU não encontrado | `OrderItem.variant_id = NULL` + event `ORDER_ITEM_UNMAPPED` |
| Estoque insuficiente | Order status = `insufficient_stock` + event `STOCK_INSUFFICIENT` (retorna 200 pro Woo) |
| Cancelamento | `stock_reserved -= qty` (floor 0) + event `STOCK_RELEASED` |
| Webhook duplicado | Retorna 200 sem alterar nada (`no_change`) |

### Eventos gerados (EventLog)

| Evento | Quando |
|--------|--------|
| `ORDER_RECEIVED` | Sempre que chega um webhook |
| `ORDER_CREATED` | Novo pedido inserido |
| `ORDER_UPDATED` | Status do pedido mudou |
| `STOCK_RESERVED` | Estoque reservado com sucesso |
| `STOCK_RELEASED` | Reserva devolvida (cancelamento) |
| `STOCK_INSUFFICIENT` | Estoque insuficiente para o pedido |
| `ORDER_ITEM_UNMAPPED` | SKU do item não encontrado |
| `WEBHOOK_FAILED` | Exceção durante processamento do webhook |
| `ORDER_REPROCESSED` | Reprocessamento manual aplicado |
| `RECONCILE_INCONSISTENCY` | Divergência detectada na reconciliação |
| `RECONCILE_REPAIRED` | Divergência corrigida (modo repair) |

---

## Testes

```bash
# Todos os testes (37 no total)
docker compose exec api pytest -v

# Somente Seção 1
docker compose exec api pytest app/tests/test_auth.py app/tests/test_products.py app/tests/test_inventory.py -v

# Somente Seção 2 (webhooks)
docker compose exec api pytest app/tests/test_woo_webhooks.py -v

# Somente Seção 3 (hardening)
docker compose exec api pytest app/tests/test_reconciliation.py app/tests/test_reprocess.py -v

# Somente Seção 4 (matéria-prima)
docker compose exec api pytest app/tests/test_suppliers.py app/tests/test_raw_materials.py -v

# Com cobertura
docker compose exec api pytest -v --cov=app --cov-report=term-missing
```

**Resultado atual: 37/37 passing ✅**

---

## Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:

| Variável | Padrão | Obrigatório | Descrição |
|----------|--------|:-----------:|-----------|
| `JWT_SECRET_KEY` | `change-me-jwt` | ✅ prod | Secret para assinar JWTs |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | — | Validade do token (minutos). Padrão = 8h |
| `APP_SECRET_KEY` | `change-me` | ✅ prod | Secret geral da aplicação |
| `DATABASE_URL` | postgres://... | — | URL de conexão async |
| `REDIS_URL` | redis://redis:6379/0 | — | URL do Redis |
| `ADMIN_EMAIL` | admin@markface.com | — | Email do admin seed |
| `ADMIN_PASSWORD` | Admin@1234 | — | Senha do admin seed |
| `WOO_WEBHOOK_SECRET` | *(vazio)* | ✅ prod | Secret do WooCommerce (HMAC) |
| `WOO_WEBHOOK_TOLERANCE_SECONDS` | `300` | — | Tolerância temporal do webhook |
| `WOO_SKU_FIELD` | `sku` | — | Campo do SKU no payload Woo |
| `INTERNAL_API_KEY` | `change-me-internal-api-key` | ✅ prod | Chave para endpoint interno |
| `RECONCILE_REPAIR` | `false` | — | Ativa modo de reparo na reconciliação |

> ⚠️ **Nunca commite o `.env` real no repositório.**

> Em desenvolvimento (`APP_DEBUG=true`), se `WOO_WEBHOOK_SECRET` estiver vazio, a validação HMAC é ignorada para facilitar testes locais.

---

## Estrutura do Projeto

```
MARK FACE HUB/
├── .env
├── .env.example
├── docker-compose.yml
├── EXEMPLO MATÉRIA PRIMA.xlsx      # Planilha modelo de referência
├── ROADMAP.md
├── README.md
├── README_SIMPLES.md
├── frontend/                        # Hub React (Vite + shadcn/ui)
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx
│       │   ├── Products.tsx
│       │   ├── Orders.tsx
│       │   ├── Suppliers.tsx
│       │   ├── RawMaterials.tsx
│       │   └── ImportPage.tsx       # Importação via Excel
│       ├── components/
│       │   └── Layout.tsx
│       └── lib/
│           └── api.ts               # Axios client com interceptor 401
└── backend/
    ├── Dockerfile
    ├── requirements.txt
    ├── alembic.ini
    └── app/
        ├── main.py
        ├── templates/               # Planilhas modelo (.xlsx)
        │   └── template_materias_primas.xlsx
        ├── core/
        │   ├── config.py
        │   ├── security.py
        │   ├── logging.py
        │   └── deps.py
        ├── models/
        │   ├── user.py
        │   ├── product.py
        │   ├── inventory.py
        │   ├── event_log.py
        │   ├── order.py
        │   ├── supplier.py
        │   └── raw_material.py
        ├── routers/
        │   ├── auth.py
        │   ├── products.py
        │   ├── suppliers.py
        │   ├── raw_materials.py
        │   ├── import_data.py       # Importação Excel [Fase 4-A.2]
        │   ├── inventory.py
        │   ├── events.py
        │   ├── health.py
        │   └── webhooks/
        │       └── woocommerce.py
        ├── services/
        │   ├── import_service.py    # Lógica de leitura/importação Excel
        │   └── ...
        └── tests/
```

---

## Worker Celery

```bash
# Ver logs do worker
docker compose logs -f worker

# Inspecionar tarefas ativas
docker compose exec worker celery -A app.workers.celery_app inspect active
```

---

## Roadmap

- [x] **Seção 1** — Fundação: auth, produtos, estoque, EventLog
- [x] **Seção 2** — WooCommerce inbound: webhooks de pedidos + reserva de estoque
- [x] **Seção 3** — Hardening: concorrência, restrições de DB, idempotência, reprocessamento, reconciliação, logs estruturados
- [x] **Seção 4(A)** — Cadastro de Matéria-Prima e Fornecedores
- [x] **Seção 4(A.2)** — Hub Frontend (React): Dashboard, Produtos, Pedidos, Fornecedores, Matérias-Primas, Importação Excel
- [ ] **Seção 4(B)** — Ficha Técnica de Produto
- [ ] **Seção 4(C)** — Estoque de Matéria-Prima
- [ ] **Seção 4(D)** — Ordens de Serviço (Produção)
- [ ] **Seção 5** — Mercado Livre: integração de catálogo e pedidos
- [ ] **Seção 6** — Publicação de produtos no WooCommerce (outbound)
- [ ] **Seção 7** — Dashboard de monitoramento

---

## Seção 3 — Hardening

### Endpoint Interno de Reprocessamento

```
POST /internal/orders/{order_id}/reprocess
Header: X-Api-Key: <INTERNAL_API_KEY>
```

Recalcula e corrige a reserva de estoque de um pedido específico (útil após incidentes).

Resposta:
```json
{
  "order_id": "uuid",
  "deltas": [{"sku": "ABC", "delta_applied": 3, "reserved_before": 2, "reserved_after": 5}]
}
```

### Reconciliação Automática (Celery Beat)

O job `reconcile_inventory_task` roda a cada **10 minutos** verificando pedidos ativos.

| Modo | Comportamento |
|------|--------------|
| `RECONCILE_REPAIR=false` (padrão) | Apenas detecta e registra divergências em `EventLog` |
| `RECONCILE_REPAIR=true` | Detecta E corrige com `FOR UPDATE` + novo `InventoryMovement` |

### Tabela WebhookEvent (Idempotência)

Cada webhook recebido registra na tabela `webhook_events` usando como chave o `X-WC-Webhook-ID` (ou hash SHA256 do body). Em caso de reenvio, devolve `200 OK` sem reprocessar.

### Constraints de Banco

Adicionados via migration `003_hardening`:
- `CHECK (stock_available >= 0)` na tabela `inventory`
- `CHECK (stock_reserved >= 0)` na tabela `inventory`
