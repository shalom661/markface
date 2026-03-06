# SKILLS ANTIGRAVITY — GUIA COMPLETO
## Backend + Clawdbot + Design

---

## INSTALAÇÃO BASE

```bash
# Repositório principal (978+ skills)
npx antigravity-awesome-skills

# Clawdbot (jdrhyne)
git clone https://github.com/jdrhyne/agent-skills.git
ln -s $(pwd)/agent-skills/skills/* ~/.gemini/antigravity/skills/

# Design visual (guanyang)
git clone https://github.com/guanyang/antigravity-skills.git ~/antigravity-skills
ln -s ~/antigravity-skills/skills/* ~/.gemini/antigravity/skills/
```

---

## BACKEND & ARQUITETURA

```bash
npx antigravity-awesome-skills install backend-architect
npx antigravity-awesome-skills install nodejs-principles
npx antigravity-awesome-skills install api-design-principles
npx antigravity-awesome-skills install senior-architect
npx antigravity-awesome-skills install clean-code
```

| Skill | O que faz |
|---|---|
| `backend-architect` | Planeja arquitetura antes de codar — separa services, routes e controllers |
| `nodejs-principles` | Padrões corretos de async/await, error handling e event loop |
| `api-design-principles` | Endpoints REST bem estruturados, status codes, versionamento |
| `senior-architect` | Decisões complexas de arquitetura e trade-offs de sistema |
| `clean-code` | Código legível, funções pequenas, sem duplicação (Robert C. Martin) |

---

## WEB SCRAPING

```bash
npx antigravity-awesome-skills install puppeteer-cli
npx antigravity-awesome-skills install apify-web-scraping
```

| Skill | O que faz |
|---|---|
| `puppeteer-cli` | Automação de browser, scraping, screenshots, análise de rede |
| `apify-web-scraping` | Skills oficiais Apify — anti-detecção, retry logic, extração robusta |

---

## SEGURANÇA

```bash
npx antigravity-awesome-skills install api-security-best-practices
npx antigravity-awesome-skills install auth-implementation-patterns
npx antigravity-awesome-skills install backend-security-coder
```

| Skill | O que faz |
|---|---|
| `api-security-best-practices` | Protege tokens de API, configura CORS e headers seguros |
| `auth-implementation-patterns` | JWT, rate limiting, proteção de endpoints |
| `backend-security-coder` | Revisão de segurança — sanitização de inputs, proteção contra injeção |

---

## DOCKER & INFRA

```bash
npx antigravity-awesome-skills install docker-expert
npx antigravity-awesome-skills install environment-setup-guide
npx antigravity-awesome-skills install observability-engineer
```

| Skill | O que faz |
|---|---|
| `docker-expert` | Multi-stage builds, otimização de imagem, Docker Compose |
| `environment-setup-guide` | Padroniza .env, scripts npm e estrutura de pastas |
| `observability-engineer` | Logging com Winston, métricas e monitoramento de APIs externas |

---

## CLAWDBOT (jdrhyne/agent-skills)

```bash
cp -r agent-skills/skills/elegant-reports ~/.gemini/antigravity/skills/
cp -r agent-skills/skills/planner ~/.gemini/antigravity/skills/
cp -r agent-skills/prompts/frontend-design ~/.gemini/antigravity/skills/
cp -r agent-skills/prompts/senior-engineer ~/.gemini/antigravity/skills/
cp -r agent-skills/prompts/humanizer ~/.gemini/antigravity/skills/
cp -r agent-skills/prompts/web-interface-review ~/.gemini/antigravity/skills/
cp -r agent-skills/clawdbot/clawddocs ~/.gemini/antigravity/skills/
```

| Skill | O que faz |
|---|---|
| `elegant-reports` | Gera PDFs com design Nórdico via Nutrient DWS API |
| `planner` | Planejamento persistente — mantém contexto entre sessões longas |
| `frontend-design` | Guidelines de UI: layout, tipografia, cor e componentes |
| `web-interface-review` | Revisão de acessibilidade e UX patterns |
| `senior-engineer` | Princípios de engenharia sênior para decisões de arquitetura |
| `humanizer` | Remove traços de IA de READMEs e documentação |
| `clawddocs` | Especialista em documentação com navegação por árvore de decisão |

---

## DESIGN VISUAL

### guanyang/antigravity-skills

```bash
# Já instalado pelo clone acima
# ui-ux-pro-max tem instalação especial:
uipro init --ai antigravity
```

| Skill | Comando | O que faz |
|---|---|---|
| `frontend-design` | `@[frontend-design]` | Interfaces produção-grade, evita estética genérica de IA |
| `ui-ux-pro-max` | instalação própria | Design intelligence completa — cores, fontes, layouts como designer sênior |
| `canvas-design` | `@[canvas-design]` | Posters e artes com saída PNG/PDF |
| `web-artifacts-builder` | `@[web-artifacts-builder]` | Web apps com React + Tailwind + Shadcn/ui |

### Google Labs + Anthropic (via npx skills)

```bash
npx skills add VoltAgent/awesome-agent-skills --skill google-labs-code/design-md -a antigravity
npx skills add VoltAgent/awesome-agent-skills --skill google-labs-code/enhance-prompt -a antigravity
npx skills add VoltAgent/awesome-agent-skills --skill smixs/creative-director-skill -a antigravity
npx skills add anthropics/skills --skill frontend-design -a antigravity
```

| Skill | O que faz |
|---|---|
| `design-md` | Documenta decisões de design do projeto em DESIGN.md |
| `enhance-prompt` | Melhora prompts com vocabulário UI/UX profissional |
| `creative-director` | 20+ metodologias criativas (TRIZ, SCAMPER, Synectics) — calibrado por Cannes/D&AD |
| `frontend-design` (Anthropic) | Skill oficial da Anthropic — tipografia, motion, composição espacial |

---

## PROMPT DE ATIVAÇÃO

Cole no início de cada sessão no Antigravity:

```
Use senior-architect + backend-architect to plan structure.
Use nodejs-principles + api-design-principles to scaffold the API.
Use puppeteer-cli + apify-web-scraping for browser automation.
Use api-security-best-practices + backend-security-coder for credentials.
Use docker-expert for Dockerfile with Chromium support.
Use observability-engineer for Winston logging.
Use planner to maintain context between sessions.
Use frontend-design + ui-ux-pro-max for any UI work.
Use senior-engineer for architecture decisions.
```

---

## FONTES

| Repositório | Skills | Foco |
|---|---|---|
| `sickn33/antigravity-awesome-skills` | 978+ | Backend, segurança, Docker |
| `jdrhyne/agent-skills` | ~30 | Clawdbot, design, planejamento |
| `guanyang/antigravity-skills` | 300+ | Design visual, UI/UX |
| `VoltAgent/awesome-agent-skills` | 500+ | Google Labs, Vercel, Cloudflare |
| `anthropics/skills` | oficial | Skills oficiais da Anthropic |
