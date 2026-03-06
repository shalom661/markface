# MarkFace Hub — Guia Simples 🟢

> Este arquivo explica **o que é o Hub**, **o que já foi construído** e **como você usa no dia a dia** — sem precisar saber programar.

---

## O que é o MarkFace Hub?

O Hub é um **sistema central** que fica rodando no seu computador. Ele é o **cérebro** da operação:

- Guarda o cadastro de todos os seus **produtos** e **variantes** (tamanhos, cores, etc.)
- Controla o **estoque** de cada variante
- Recebe **pedidos do WooCommerce** automaticamente
- Gerencia **matérias-primas e fornecedores**
- Permite **importar dados em massa via Excel** (planilha modelo pré-configurada)
- Registra um **histórico de tudo** que aconteceu

> Pensa no Hub como o "Backoffice" da sua loja com uma interface visual simples, acessível pelo navegador.

---

## Como o Hub está organizado por dentro

Você não precisa mexer nesses arquivos, mas é bom saber o que cada parte faz:

| O que é | Para que serve |
|---------|---------------|
| **API** | É o "balcão de atendimento" — recebe todas as requisições (do WooCommerce, de você mesmo, de futuras integrações) |
| **Banco de dados (PostgreSQL)** | É onde tudo fica salvo de verdade: produtos, estoque, pedidos |
| **Fila (Redis + Celery)** | Fila de tarefas em segundo plano — como um assistente que processa coisas sem travar a operação principal |
| **EventLog** | Um diário: registra tudo que acontece (produto criado, estoque ajustado, pedido recebido, etc.) |

---

## O que já está pronto ✅

### Parte 1 — Base de tudo

- ✅ Você pode **criar produtos** no Hub (nome, marca, descrição)
- ✅ Cada produto pode ter **variantes** — ex: "Camiseta Preta" pode ter variante "Tamanho M" com o SKU `CAM-PRETA-M`
- ✅ Cada variante tem seu próprio **estoque** (quantidade disponível)
- ✅ Você pode **ajustar o estoque** manualmente: somar (+50 unidades entraram) ou definir um valor fixo (100 unidades após inventário)
- ✅ O sistema tem **login com senha** — você precisa estar autenticado para usar
- ✅ Tem um **histórico de eventos** que registra tudo automaticamente

### Parte 2 — Receber pedidos do WooCommerce

- ✅ Quando alguém **faz um pedido na sua loja WooCommerce**, o Hub recebe a notificação automaticamente (isso se chama "webhook")
- ✅ O Hub **verifica se o pedido é autêntico** (via assinatura secreta) — ninguém consegue mandar dados falsos
- ✅ O Hub **cria o pedido** lá dentro com todos os itens
- ✅ **Reserva o estoque** dos produtos do pedido automaticamente
- ✅ Se o mesmo pedido chegar duas vezes (o WooCommerce às vezes reenviar), o Hub **ignora a duplicata** — sem bagunçar o estoque
- ✅ Se o **pedido for cancelado** no WooCommerce, o Hub **devolve a reserva** de estoque
- ✅ Se um SKU do pedido não existe no Hub, o Hub registra o item assim mesmo, avisa com um evento (`ORDER_ITEM_UNMAPPED`) e **não mexe no estoque**
- ✅ Se o estoque de algum item for zero, o Hub **não deixa o saldo ficar negativo** e registra um alerta (`STOCK_INSUFFICIENT`)

### Parte 3 — Blindagem do sistema (Hardening)

- ✅ **Sem corrida dupla de estoque:** Não importa se dois pedidos chegarem ao mesmo tempo — o banco de dados **trava a linha** enquanto processa um, o outro espera. Exemplo: dois clientes comprando a última unidade ao mesmo tempo — só um vai conseguir.
- ✅ **Estoque nunca fica negativo no banco:** Regras no próprio banco de dados (chamadas de *constraints*) impedem qualquer operação que levaria `stock_reserved` abaixo de zero.
- ✅ **Idempotência real via tabela WebhookEvent:** Além de verificar o pedido, o Hub agora salⷚ cada webhook recebido numa tabela separada usando um ID único. Mesmo que o WooCommerce reenvie dezenas de vezes, o segundo envio é bloqueado *antes* de qualquer processamento.
- ✅ **Endpoint de reprocessamento manual:** Se algo der errado (exemplo: servidor caiu no meio de um processamento), você pode chamar um endpoint interno para corrigir automaticamente a reserva de um pedido específico.
- ✅ **Job de reconciliação automática (a cada 10 minutos):** Um processo rodando em segundo plano verifica se o estoque reservado bate com os movimentos registrados. Se encontrar divergência, registra um alerta. Com a opção `RECONCILE_REPAIR=true`, ele também corrige automaticamente.
- ✅ **Logs estruturados:** Todo processamento de webhook gera logs detalhados (em formato JSON) com tempo de resposta, resultado e detalhes do estoque. Isso facilita muito o diagnóstico de problemas.

### Parte 4 — Matérias-Primas, Fornecedores e Importação

- ✅ Você pode **cadastrar Fornecedores** (nome, contato, telefone).
- ✅ Você pode **cadastrar Matérias-Primas** (tecidos, botões, elásticos) associadas aos fornecedores.
- ✅ O sistema se adapta ao tipo: se for tecido, pede rendimento e gramatura; se for botão, pede tamanho e furos.
- ✅ O sistema tem **autocomplete**: se você digitar "Algodão" uma vez, ele sugere nas próximas.
- ✅ Tem botão para **duplicar** matéria-prima (facilita cadastrar um mesmo tecido de cores diferentes).

### Parte 5 — Interface Visual (Hub Frontend)

- ✅ O Hub tem agora uma **interface visual** acessível no navegador em `http://localhost:5173`
- ✅ Páginas disponíveis: **Visão Geral**, **Produtos**, **Pedidos**, **Fornecedores**, **Matérias-Primas**
- ✅ **Importação em massa de Matérias-Primas via Excel** (página "Importar Dados"):
  1. Escolhe o tipo (Matérias-Primas, Fornecedores, Estoque)
  2. Baixa a planilha modelo já formatada
  3. Preenche e faz upload — o sistema identifica e importa tudo automaticamente
- ✅ Sessão dura **8 horas** sem precisar fazer login novamente
- ✅ Se a sessão expirar, o sistema redireciona automaticamente para o login

---

## Como ligar e desligar o Hub

Tudo roda via **Docker** (um programa que embrulha tudo junto). Você não precisa instalar Python, banco de dados, etc. — o Docker cuida disso.

### Ligar tudo pela primeira vez

```bash
# Na pasta raiz do projeto
docker compose up --build
```

Aguarde aparecer `Application startup complete` no terminal — significa que está pronto.

### Nas próximas vezes (já foi ligado antes)

```bash
docker compose up
```

### Desligar

```bash
docker compose down
```

### Ver os logs (o que está acontecendo)

```bash
# Todos os serviços
docker compose logs -f

# Só a API
docker compose logs -f api
```

---

## Como acessar o Hub

Depois de ligar, abra no navegador:

| O que | Endereço |
|-------|---------|
| **Hub (Interface Visual)** | http://localhost:5173 |
| **Interface interativa da API** (Swagger) | http://localhost:8000/api/docs |
| **Documentação alternativa** (ReDoc) | http://localhost:8000/api/redoc |
| **Verificação de saúde** | http://localhost:8000/health |

> O **Hub** (`localhost:5173`) é a forma mais fácil de usar o sistema — interface visual com menus, botões e tabelas. O Swagger é para uso avançado e testes de API.

---

## Primeiro acesso — Fazer login

O Hub já vem com um **usuário administrador** criado automaticamente:

- **Email:** `admin@markface.com`
- **Senha:** `Admin@1234`

> Você pode mudar essas credenciais no arquivo `.env` antes de ligar o Hub.

### Como fazer login pelo Hub (recomendado)

1. Abra http://localhost:5173
2. Digite o email e senha
3. Clique em **Entrar** — você ficará logado por **8 horas**

### Como fazer login pelo Swagger (uso avançado)

1. Abra http://localhost:8000/api/docs
2. Clique em `POST /api/v1/auth/login`
3. Clique em **"Try it out"**
4. Preencha email e senha e clique **Execute**
5. Copie o `access_token` da resposta
6. No topo da página, clique em **"Authorize 🔒"**
7. Cole o token no campo e clique **Authorize**
8. Agora todos os outros botões funcionarão no seu nome

---

## Como usar o Hub no dia a dia

### Usar a Interface Visual (Recomendado)

1. Abra `http://localhost:5173` no navegador
2. Faça login com `admin@markface.com` / `Admin@1234`
3. Use o menu lateral para navegar pelas seções:
   - **Visão Geral** — resumo do sistema
   - **Produtos** — veja e gerencie produtos
   - **Pedidos** — pedidos recebidos do WooCommerce
   - **Fornecedores** — cadastre e edite fornecedores
   - **Matérias-Primas** — cadastre matérias-primas
   - **Importar Dados** — importe planilhas Excel em massa

### Importar Matérias-Primas em Massa (Excel)

1. No Hub → clique em **"Importar Dados"** no menu lateral
2. Clique no card **"Matérias-Primas"**
3. Clique em **"Baixar Modelo"** — você receberá uma planilha Excel pré-configurada
4. Preencha as linhas com suas matérias-primas seguindo o modelo
5. Arraste o arquivo de volta para o Hub e clique **"Importar"**
6. O sistema mostra quantos itens foram criados, ignorados e se houve algum erro por linha

### Cadastrar um produto (via Swagger)

1. No Swagger → `POST /api/v1/products`
2. Preencha: `name` (obrigatório), `brand`, `description`
3. Execute — você receberá o `id` do produto criado

### Cadastrar uma variante (tamanho, cor, etc.)

1. No Swagger → `POST /api/v1/products/{id}/variants`
2. Preencha o `id` do produto criado antes
3. Preencha: `sku` (código único — **não pode repetir**), `price_default`, e opcionalmente `attributes` como `{"size": "M", "color": "preto"}`

> Ao criar a variante, o estoque dela já é criado automaticamente com **zero unidades**.

### Adicionar estoque

1. No Swagger → `POST /api/v1/inventory/{variant_id}/adjust`
2. Preencha o `variant_id` (o ID da variante)
3. Use `delta` para somar ou subtrair: `{"delta": 50, "reason": "Entrada NF-001"}`
4. Ou use `set_absolute` para definir um valor exato: `{"set_absolute": 100, "reason": "Inventário físico"}`

> O estoque **nunca fica negativo** — o Hub bloqueia automaticamente.

### Ver o estoque atual

1. No Swagger → `GET /api/v1/inventory/{variant_id}`
2. Você verá `stock_available` (disponível para venda) e `stock_reserved` (separado por pedidos)

### Ver o histórico de eventos

1. No Swagger → `GET /api/v1/events`
2. Você verá um log de tudo: produtos criados, estoques ajustados, pedidos recebidos, etc.

---

## Como configurar o WooCommerce para enviar pedidos ao Hub

> Faça isso **depois** de ter o Hub rodando em um servidor com endereço público (ou usando uma ferramenta como [ngrok](https://ngrok.com) para testes locais).

### Passo a passo

1. No painel do WordPress: **WooCommerce → Settings → Advanced → Webhooks**
2. Clique em **"Add webhook"**
3. Configure assim:

| Campo | Valor |
|-------|-------|
| Status | Active |
| Topic | **Order created** |
| Delivery URL | `https://SEU-SERVIDOR/api/v1/webhooks/woocommerce/order-created` |
| Secret | *(o WooCommerce gera automaticamente — copie ele)* |

4. Repita para criar mais 2 webhooks:
   - **Order updated** → `/api/v1/webhooks/woocommerce/order-updated`
   - **Order deleted** → `/api/v1/webhooks/woocommerce/order-cancelled`

5. Abra o arquivo `.env` na raiz do projeto e cole o secret:
```
WOO_WEBHOOK_SECRET=cole_o_secret_que_o_woo_gerou_aqui
```

6. Reinicie o Hub:
```bash
docker compose down && docker compose up
```

Pronto! Agora toda vez que alguém comprar na sua loja, o Hub saberá automaticamente.

---

## O que acontece quando um pedido chega

```
Cliente compra na loja WooCommerce
           ↓
WooCommerce envia notificação para o Hub
           ↓
Hub verifica se a notificação é autêntica (HMAC)
           ↓
Hub cria o pedido com os itens
           ↓
Para cada item:
  ├── SKU encontrado + estoque ok  →  reserva o estoque
  ├── SKU não encontrado           →  registra item sem estoque, gera alerta
  └── Estoque insuficiente         →  registra alerta, não deixa ficar negativo
           ↓
Hub retorna OK para o WooCommerce
```

---

## Arquivo de configuração (.env)

O arquivo `.env` (na raiz do projeto) controla o comportamento do Hub. As variáveis mais importantes:

| Variável | O que é |
|----------|---------|
| `JWT_SECRET_KEY` | Senha secreta para os tokens de login — **troque para algo longo e aleatório em produção** |
| `ADMIN_EMAIL` | Email do usuário administrador criado automaticamente |
| `ADMIN_PASSWORD` | Senha do administrador |
| `WOO_WEBHOOK_SECRET` | O secret copiado do WooCommerce (necessário para receber pedidos) |
| `DATABASE_URL` | Endereço do banco de dados (não mexa se estiver usando o Docker) |
| `INTERNAL_API_KEY` | Chave secreta para o endpoint de reprocessamento manual |
| `RECONCILE_REPAIR` | `false` = só detecta divergências / `true` = detecta E corrige automaticamente |

> ⚠️ **Nunca compartilhe o `.env` com ninguém nem suba ele para o GitHub.**

---

## Rodando os testes

Os testes verificam que tudo está funcionando corretamente. Rode sempre depois de uma mudança:

```bash
docker compose exec api pytest -v
```

Resultado esperado: **37 testes passando ✅**

---

## Situações comuns e como resolver

| Problema | O que fazer |
|----------|------------|
| Hub não sobe | Verifique se o Docker Desktop está aberto e com Linux engine ativo |
| Interface não abre | Confirme que o servidor frontend está rodando (`cd frontend && npm run dev`) |
| Login falha | Confirme email/senha no `.env` e que o seed rodou |
| "Sessão expirada" | Faça logout e login novamente (agora dura 8h) |
| Erro ao baixar planilha | Faça logout e login novamente para obter um token fresco |
| WooCommerce não envia webhooks | Confirme que o `WOO_WEBHOOK_SECRET` no `.env` é igual ao do Woo |
| Pedido chegou mas estoque não reservou | Verifique se o SKU do produto no Woo é igual ao cadastrado no Hub |
| Estoque ficou como "needs_review" | Algum SKU do pedido não existe no Hub — cadastre a variante com aquele SKU |

---

## Próximas funcionalidades planejadas

- [ ] **Ficha Técnica** de produto: quais matérias-primas usa e em que quantidade
- [ ] **Estoque de matéria-prima**: entradas, saídas e alertas de estoque mínimo
- [ ] **Ordens de Serviço**: criar lote de produção e consumir matéria-prima automaticamente
- [ ] Importação via Excel de **Fornecedores** e **Estoque** (cards "Em breve" já visíveis no Hub)
- [ ] Integração com **Mercado Livre** (receber pedidos de lá também)
- [ ] Publicação de produtos direto no WooCommerce pelo Hub
- [ ] Dashboard visual para ver estoque e pedidos numa tela só

---

## Como usar o endpoint de reprocessamento (ferramenta avançada)

Se um pedido ficou com estoque errado por algum motivo (ex: queda de servidor), você pode corrigir:

```
curl -X POST http://localhost:8000/internal/orders/{ID_DO_PEDIDO}/reprocess \
     -H "X-Api-Key: sua-chave-interna"
```

O Hub vai verificar o estoque reservado para aquele pedido e corrigir qualquer divergência automaticamente.

> O `ID_DO_PEDIDO` é o UUID interno do pedido (apareçe na resposta do webhook ou no EventLog).
> A `sua-chave-interna` é o valor de `INTERNAL_API_KEY` no `.env`.
