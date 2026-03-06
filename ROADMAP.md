# MarkFace Hub — Resumo do Projeto 🗺️

> Aqui você acompanha **tudo que já foi feito** e **o que ainda vai ser feito** no Hub, em linguagem simples.

---

## ✅ Fase 1 — Base do sistema

> *Construir a fundação: login, produtos, estoque e histórico de eventos.*

- [x] Login com email e senha (sistema de autenticação com JWT)
- [x] Cadastrar produtos (nome, marca, descrição)
- [x] Cadastrar variantes de produto (tamanho, cor, etc.) com SKU único
- [x] Controlar estoque de cada variante (adicionar, subtrair ou definir valor exato)
- [x] Estoque nunca fica negativo — o sistema bloqueia automaticamente
- [x] Histórico de eventos: tudo que acontece fica registrado (quem mexeu, quando, por quê)
- [x] Usuário administrador criado automaticamente ao ligar o sistema
- [x] Verificação de saúde do sistema (`/health`)
- [x] Testes automáticos: **14 testes passando** ✅

---

## ✅ Fase 2 — Receber pedidos do WooCommerce

> *Quando alguém comprar na loja, o Hub fica sabendo automaticamente e já separa o estoque.*

- [x] O WooCommerce envia uma notificação (webhook) para o Hub quando um pedido é feito
- [x] O Hub verifica se a notificação é autêntica com uma assinatura secreta (HMAC)
- [x] O Hub cria o pedido internamente com todos os itens
- [x] O estoque dos produtos do pedido é reservado automaticamente
- [x] Se o pedido chegar duplicado (WooCommerce às vezes reenvia), o Hub ignora
- [x] Se um pedido for cancelado, o estoque reservado é devolvido
- [x] Se o SKU não existe no Hub, o item é registrado sem mexer no estoque (e um alerta é criado)
- [x] Se não há estoque suficiente, o Hub registra o alerta e não deixa o saldo ficar negativo
- [x] Testes automáticos: **20 testes passando** ✅

---

## ✅ Fase 3 — Blindagem e confiabilidade do sistema (Hardening)

> *Garantir que o Hub funcione corretamente mesmo sob pressão: pedidos simultâneos, reenvios, quedas de servidor.*

- [x] **Sem corrida de estoque:** dois pedidos chegando ao mesmo tempo não conseguem "roubar" a mesma unidade — o banco trava a linha enquanto processa um, o outro espera
- [x] **Regras no banco de dados:** o próprio banco de dados impede que o estoque reservado fique negativo (uma segunda camada de proteção)
- [x] **Idempotência real:** cada webhook recebe um "número de identificação único" — se chegar de novo, é bloqueado antes mesmo de começar a processar
- [x] **Endpoint de reprocessamento manual:** se algo der errado (ex: servidor caiu no meio de um pedido), você pode pedir para o Hub corrigir um pedido específico com um comando
- [x] **Verificação automática a cada 10 minutos:** o Hub fica conferindo se o estoque reservado bate com os movimentos registrados. Se não bater, registra um alerta. Com uma opção habilitada, ele corrige automaticamente
- [x] **Logs detalhados:** cada processamento de pedido gera um log com tempo de resposta, resultado e detalhes do estoque (formato profissional)
- [x] Testes automáticos: **26 testes passando** ✅

---

## 🔜 Fase 4 — Sistema interno completo (ERP Têxtil)

> *Controle total da empresa por dentro: matéria-prima, produção, fornecedores, ordens de serviço.*

---

### ✅ Fase 4-A — Cadastro de Matéria-Prima ← CONCLUÍDA

> **Implementada e validada com testes.**

#### O que foi construído:

**Fornecedores**
- [x] Cadastro de fornecedores (nome, contato, telefone, email, observações)
- [x] Listar, editar e remover fornecedores
- [x] Fornecedor vinculado a cada matéria-prima

**Matérias-primas**
- [x] Campos gerais para todos os tipos:
  - Data, Categoria, Sub-categoria, Descrição
  - Código interno (preenchido manualmente)
  - Código do produto no fornecedor
  - Fornecedor (seleção da lista cadastrada)
  - Unidade de medida (m, kg, unidade, rolo, etc.)
  - Cor, Composição, Pedido mínimo
- [x] Campos específicos por categoria:
  - **Tecidos**: tipo, rendimento (comprimento de 1kg), largura, gramatura, estampa, info para etiqueta
  - **Botões**: tipo, tamanho, furos, tem pezinho
  - **Zíper**: tipo, comprimento, cursor, cor dos dentes, cor do cursor
  - **Elástico**: largura
  - **Linha**: resistência, aplicação (overlock/reta/galoneira/bordado), espessura, nº de cabos
  - **Etiqueta**: largura, comprimento
  - **Bordado**: largura, comprimento, nº de pontos
  - **Embalagem**: largura, comprimento
  - **Fio de Acabamento**: tipo, largura, comprimento, diâmetro, espessura
  - **Renda**: tipo, comprimento
  - **Gola**: tipo, largura, comprimento, estampa

**Autocomplete inteligente**
- [x] Qualquer campo que se repete (cor, composição, tipo de tecido, etc.) oferece sugestão dos valores já usados
- [x] Se digitar um valor novo, ele é salvo automaticamente e fica disponível nos próximos cadastros
- [x] Funciona para: cor, composição, unidade de medida, sub-categoria, e todos os campos de tipo específico por categoria

**Duplicar produto**
- [x] Botão/endpoint para copiar um produto já cadastrado
- [x] Útil para mesmo produto de fornecedor diferente — copia tudo, só muda o que for diferente
- [x] Código interno fica em branco para o usuário preencher o novo

**Filtros e busca**
- [x] Filtrar por categoria (ex: ver só tecidos)
- [x] Filtrar por fornecedor
- [x] Buscar por código interno ou descrição

---

### ✅ Fase 4-A.2 — Hub Frontend + Importação Excel ← CONCLUÍDA

> **Interface visual completa e importação em massa via planilha.**

#### O que foi construído:

**Interface Visual (React + Vite)**
- [x] Hub acessível em `http://localhost:5173` com login, menu lateral e 5 páginas
- [x] Página **Visão Geral** com cards de resumo (Produtos, Matérias-Primas, Fornecedores, Pedidos)
- [x] Página **Produtos** — listagem dos produtos cadastrados
- [x] Página **Pedidos** — listagem de pedidos recebidos
- [x] Página **Fornecedores** — listagem e cadastro
- [x] Página **Matérias-Primas** — listagem e cadastro
- [x] Menu lateral com navegação e botão de logout
- [x] Sessão JWT de 8 horas (sem precisar relogar durante o dia)
- [x] Interceptor automático: sessão expirada redireciona sozinha para o login

**Importação em Massa via Excel**
- [x] Página **Importar Dados** com fluxo de 3 passos
- [x] **Passo 1:** cards interativos para escolher o tipo de importação
  - Matérias-Primas (✅ disponível)
  - Fornecedores (em breve)
  - Estoque (em breve)
- [x] **Passo 2:** botão para baixar a planilha modelo do servidor
- [x] **Passo 3:** área de drag-and-drop para enviar a planilha preenchida
- [x] Endpoint `GET /api/v1/import/template/{type}?token=<jwt>` — serve o arquivo `.xlsx` real do servidor
- [x] Endpoint `POST /api/v1/import/raw-materials` — lê a planilha e importa linha por linha
- [x] Resultado detalhado: quantidade criada, ignorada, e erros com número de linha
- [x] Planilha modelo baseada exatamente no arquivo `EXEMPLO MATÉRIA PRIMA.xlsx` fornecido pelo usuário

---

### 🔜 Fase 4-B — Ficha Técnica de Produto ← PRÓXIMA

- [ ] Para cada produto acabado, definir quais matérias-primas ele usa e em que quantidade
- [ ] Ex: Pijama Tamanho M usa 1,2m de tecido + 3 botões + 0,5m de elástico
- [ ] Base para calcular custo de produção e consumo de estoque
- [ ] Emissão de PDF da ficha para ser enviada à costureira

---

### 🔜 Fase 4-C — Estoque de Matéria-Prima

- [ ] Pegar cada matéria-prima cadastrada e atribuir quantidade
- [ ] Registrar entradas (compra) e saídas (uso na produção)
- [ ] Alertas quando estoque estiver abaixo do pedido mínimo

---

### 🔜 Fase 4-D — Ordens de Serviço (Produção)

- [ ] Criar lote de produção: qual produto, quantidade, prazo, responsável
- [ ] Consumo automático de matéria-prima com base na ficha técnica
- [ ] Acompanhar status: Aberta → Em produção → Concluída

---

### 🔜 Fase 4-E — Fornecedores e Entradas de Estoque

- [ ] Registrar compra de matéria-prima com valor e quantidade
- [ ] Histórico de compras por fornecedor

---

## 📊 Resumo geral

| Fase | O que é | Status |
|------|---------|--------|
| 1 | Base: login, produtos, estoque, histórico | ✅ Concluída |
| 2 | Receber pedidos do WooCommerce | ✅ Concluída |
| 3 | Blindagem e confiabilidade | ✅ Concluída |
| 4-A | Cadastro de Matéria-Prima e Fornecedores | ✅ Concluída |
| 4-A.2 | Hub Frontend + Importação Excel | ✅ Concluída |
| 4-B | Ficha Técnica de Produto | 🔜 Próxima |
| 4-C | Estoque de Matéria-Prima | 🔜 Planejada |
| 4-D | Ordens de Serviço (Produção) | 🔜 Planejada |
| 5 | Integração com Mercado Livre | 🔜 Planejada |
| 6 | Publicar produtos no WooCommerce | 🔜 Planejada |
| 7 | Dashboard visual | 🔜 Planejada |

---

> 📌 Este arquivo é atualizado a cada nova fase concluída. A última atualização foi na conclusão da **Fase 4-A.2** (Hub Frontend + Importação Excel).
