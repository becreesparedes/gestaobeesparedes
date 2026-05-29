# 📚 BE-ESP v4 · Biblioteca Escolar

**Gestão integrada da Biblioteca Escolar · Escola Secundária de Paredes**  
Leitura, literacias, comunicação e avaliação MABE

---

## Sobre o projeto

Aplicação web progressiva (PWA) para gestão completa da Biblioteca Escolar, integrada com Microsoft 365 / OneDrive. Corre inteiramente no browser — sem servidor, sem base de dados própria. Os dados ficam no OneDrive da escola.

### Módulos

| Módulo | Descrição |
|--------|-----------|
| 🏠 Dashboard | KPIs, alertas, agenda e ficheiros recentes |
| 📚 Gestão | Aquisição, tratamento técnico, conservação, desbaste |
| 👥 Utilizadores | Registo, empréstimos, apoio, ocorrências |
| 🎓 Pedagogia | Articulação curricular, literacias, leitura, projetos |
| 📊 Avaliação | MABE, indicadores, plano de melhoria, relatórios |
| 📣 Comunicação | Newsletter, redes sociais, identidade visual |
| 💻 Digital | BiblioNet, SharePoint, RGPD, equipamentos |
| 🗃️ Arquivo | Anos letivos fechados e documentos finais |

---

## Instalação e desenvolvimento

### Pré-requisitos

- Node.js 20+
- npm 10+
- Conta Microsoft 365 com OneDrive (para produção)

### Arranque rápido

```bash
# Clonar o repositório
git clone https://github.com/SEU-USERNAME/be-esp-v4.git
cd be-esp-v4

# Instalar dependências
npm install

# Arrancar em modo de desenvolvimento
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

### Build para produção

```bash
npm run build
# A pasta dist/ contém os ficheiros estáticos prontos a publicar
```

---

## Configuração Microsoft 365

### 1. Registar a aplicação no Azure AD

1. Aceder a [portal.azure.com](https://portal.azure.com) → Azure Active Directory → Registos de aplicações → Nova aplicação
2. Nome: `BE-ESP`
3. Tipos de conta suportados: **Apenas esta organização** (ou `Contas em qualquer diretório`)
4. URI de redireccionamento: `Aplicação de página única (SPA)` → `https://SEU-USERNAME.github.io/be-esp-v4/`

### 2. Permissões API

Em **Permissões de API**, adicionar permissões delegadas do Microsoft Graph:
- `Files.ReadWrite` — leitura e escrita de ficheiros OneDrive
- `User.Read` — dados do utilizador autenticado
- `offline_access` — refresh token para renovação automática

### 3. Configurar na aplicação

Na interface de login, introduzir:
- **Client ID**: o ID da aplicação registada no Azure AD
- **Tenant**: o domínio da escola (ex: `esparedes.pt`) ou `common`

---

## Estrutura OneDrive

A aplicação usa a seguinte estrutura de pastas no OneDrive (164 pastas):

```
BE-ESP/
├── 00_Entrada_e_Ativos/
├── 01_Governança_e_Normativos/
├── 02_Organização_e_Operação/
├── 03_Pedagogia_e_Literacias/
├── 04_Recursos_e_Coleção/
├── 05_Utilizadores_e_Serviços/
├── 06_Comunicação_e_Imagem/
├── 07_Avaliação_e_Melhoria/
├── 08_Gestão_Digital_e_TIC/
├── 09_Formulários_e_Modelos/
└── 10_Arquivo_Histórico/
```

O ficheiro ZIP com a estrutura completa está disponível em [Releases](../../releases).

---

## Publicar no GitHub Pages

1. Fork / clone do repositório
2. Activar GitHub Pages: **Settings → Pages → Source: GitHub Actions**
3. Fazer push para `main` — o workflow `deploy.yml` trata do build e deploy automaticamente

---

## Stack técnica

| Camada | Tecnologia |
|--------|------------|
| UI | HTML5 + CSS Custom Properties |
| Lógica | JavaScript ES Modules (sem frameworks) |
| Build | Vite 5 |
| Autenticação | Microsoft Identity Platform (PKCE) |
| Dados | Microsoft Graph API + OneDrive |
| Export PDF | jsPDF 2.5 |
| Export Excel | SheetJS (xlsx) 0.18 |
| PWA | Service Worker + Web Manifest |
| CI/CD | GitHub Actions → GitHub Pages |

---

## Contribuir

1. Fork
2. `git checkout -b feature/nome-da-funcionalidade`
3. Commit + push
4. Pull Request para `main`

---

## Licença

MIT © Escola Secundária de Paredes — Professor Bibliotecário

---

*BE-ESP v4 · Biblioteca Escolar — gestão integrada, leitura e inovação*
