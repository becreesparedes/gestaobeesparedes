# Changelog · BE-ESP

Todas as alterações notáveis são documentadas neste ficheiro.  
Formato: [Versionamento Semântico](https://semver.org/lang/pt-BR/)

---

## [4.0.0] — 2026-05-27

### Adicionado
- Arquitectura modular ES Modules (8 módulos + vistas lazy-loaded)
- Design system completo com tokens CSS e dark mode automático
- Estrutura OneDrive de 164 pastas (nova, alinhada com normativos)
- Navegação de 8 módulos no header: Dashboard, Gestão, Utilizadores, Pedagogia, Avaliação, Comunicação, Digital, Arquivo
- Atalhos rápidos: Novo empréstimo, Nova atividade, Novo documento, Nova publicação
- Chips de alerta contextuais em todas as vistas
- Vite 5 como bundler + GitHub Actions CI/CD automático
- PWA com Service Worker (cache-first para assets, offline fallback)
- Dark mode automático via `prefers-color-scheme`
- Refresh automático de token PKCE sem interrupção da sessão
- Export PDF melhorado (cabeçalho com faixa de cor, rodapé com paginação)
- Export Excel com 3 folhas (KPIs, Atividades, Tarefas)

### Alterado
- Estrutura de pastas OneDrive completamente reformulada (de 14 para 164 pastas)
- CSS separado em 5 ficheiros: tokens, base, layout, components, modules
- Dados estáticos movidos para JSON independentes (pops, forms, kpi, mabe, checklists, calendar, criticos)
- Destino de upload actualizado para a nova estrutura de pastas

### Removido
- Ficheiro HTML monolítico (212 KB) substituído por módulos ES6

---

## [3.4.0] — 2026-04-28

### Adicionado
- Refresh automático de token (monitorização a cada 5 min)
- Export PDF dashboard com cabeçalho profissional
- Export Excel KPI com 3 folhas
- Upload multipart para ficheiros >4 MB
- Checklist interativa com exportação PDF

### Corrigido
- Bug na query OData da pesquisa global (plicas escapadas)
- Colisão de nome na variável `el` helper vs errBox login

---

## [3.3.0] — 2026-03-15

### Adicionado
- Queue de pedidos Graph API (máx 5 paralelos)
- Retry automático em 401 e 429 com backoff exponencial
- Cache em memória com TTL por tipo de recurso
- Breadcrumb no explorador de ficheiros

---

## [3.0.0] — 2026-01-10

### Adicionado
- Versão inicial como SPA em HTML único
- Autenticação PKCE Microsoft 365
- Explorador OneDrive
- Dashboard com KPIs
- 38 POPs, F01–F18, checklists CL01–CL05
- Domínios MABE A–D
- Exportação PDF/Excel básica
