/**
 * main.js — Bootstrap e router da aplicação BE-ESP v4
 *
 * Fluxo de arranque:
 *   1. Verificar callback OAuth2
 *   2. Verificar sessão guardada / renovar token
 *   3. Mostrar ecrã de login OU arrancar app
 */

import { handleCallback, getStoredSession, refreshAccessToken,
         startDemo, startLogin, logout, startTokenMonitor,
         getRedirectUri } from './core/auth.js';
import { getState, setState } from './core/store.js';
import { loadLocal, syncNow, saveLocal, verifyIntegrity, addHistory } from './core/sync.js';
import { showToast }            from './utils/toast.js';
import { installModalListeners, openModal, closeModal } from './utils/modal.js';
import { installKeyboardShortcuts } from './utils/keyboard.js';
import { toggleSidebar, closeSidebar, setSyncStatus, setText } from './utils/dom.js';
import { esc } from './utils/format.js';

/* ── Importação lazy das vistas ── */
const VIEW_MODULES = {
  dashboard:    () => import('./views/dashboard.js'),
  alertas:      () => import('./views/alertas.js'),
  tarefas:      () => import('./views/tarefas.js'),
  calendario:   () => import('./views/calendario.js'),
  ficheiros:    () => import('./views/ficheiros.js'),
  pesquisa:     () => import('./views/pesquisa.js'),
  pops:         () => import('./views/pops.js'),
  formularios:  () => import('./views/formularios.js'),
  checklists:   () => import('./views/checklists.js'),
  kpi:          () => import('./views/kpi.js'),
  mabe:         () => import('./views/mabe.js'),
  evidencias:   () => import('./views/evidencias.js'),
  relatorios:   () => import('./views/relatorios.js'),
  atividades:   () => import('./views/atividades.js'),
  historico:    () => import('./views/historico.js'),
  criticos:     () => import('./views/criticos.js'),
  partilhas:    () => import('./views/partilhas.js'),
  comunicacao:  () => import('./views/comunicacao.js'),
  digital:      () => import('./views/digital.js'),
  arquivo:      () => import('./views/arquivo.js'),
};

const _rendered = new Set(); // vistas já inicializadas

/* ══════════════════════════════════
   TEMPLATE HTML DA APP
══════════════════════════════════ */
function _buildAppShell() {
  document.getElementById('app').innerHTML = `

  <!-- ══ ECRÃ DE LOGIN ══ -->
  <div class="login-screen show" id="login-screen" role="main" aria-label="Início de sessão">
    <div class="login-card">
      <div class="login-logo" role="img" aria-label="Biblioteca Escolar">📚</div>
      <h1 class="login-title">BE-ESP · Biblioteca Escolar</h1>
      <p class="login-sub">Escola Secundária de Paredes · Sistema de Gestão Integrada v4.0</p>
      <div class="login-err" id="login-err" role="alert"></div>
      <div class="login-config">
        <strong>⚙️ URI de redireccionamento (Azure AD · tipo SPA):</strong><br>
        <code id="redirect-uri" style="user-select:all;font-size:.72rem;word-break:break-all">A calcular…</code><br><br>
        <strong>Permissões necessárias:</strong>
        <code>Files.ReadWrite</code> <code>User.Read</code> <code>offline_access</code>
      </div>
      <div class="form-row" style="margin-bottom:10px">
        <div class="form-group">
          <label class="form-label" for="cfg-client-id">Client ID (Azure AD)</label>
          <input id="cfg-client-id" class="form-input" style="font-family:var(--font-mono);font-size:.7rem"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" autocomplete="off" spellcheck="false">
        </div>
        <div class="form-group">
          <label class="form-label" for="cfg-tenant">Tenant (domínio ou "common")</label>
          <input id="cfg-tenant" class="form-input" placeholder="common" value="common">
        </div>
      </div>
      <button class="btn-ms365" id="btn-login">
        <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>
        Entrar com Microsoft 365
      </button>
      <button class="btn-demo" id="btn-demo">🎭 Modo demonstração (sem OneDrive)</button>
      <p class="login-note">Os dados ficam exclusivamente no OneDrive da escola. Nunca são armazenados nos servidores desta aplicação.</p>
    </div>
  </div>

  <!-- ══ APP SHELL ══ -->
  <div class="app" id="app-shell" style="display:none" role="application">

    <!-- Offline banner -->
    <div class="offline-banner" id="offline-banner" role="status">
      ⚠️ Sem ligação à internet — a utilizar dados em cache local
    </div>

    <!-- Header -->
    <header class="header" role="banner">
      <button class="header-menu-btn" id="menu-btn" onclick="toggleSidebar()"
        aria-label="Abrir menu" aria-expanded="false" aria-controls="sidebar">☰</button>

      <button class="header-logo" onclick="goView('dashboard')" aria-label="Ir para o Dashboard">
        <div class="header-logo-icon" aria-hidden="true">📚</div>
        <div>
          <div class="header-logo-text">BE-ESP</div>
          <span class="header-logo-sub">Biblioteca Escolar</span>
        </div>
      </button>

      <!-- Navegação principal (8 módulos) -->
      <nav class="header-nav" role="navigation" aria-label="Módulos principais">
        <button class="nav-btn active" id="nav-dashboard"   onclick="goView('dashboard')"   aria-current="page"><span class="nav-btn-icon">🏠</span><span>Dashboard</span></button>
        <button class="nav-btn" id="nav-gestao"             onclick="goView('gestao')"       data-mod="gestao"><span class="nav-btn-icon">📚</span><span>Gestão</span></button>
        <button class="nav-btn" id="nav-utilizadores"       onclick="goView('utilizadores')" data-mod="utilizadores"><span class="nav-btn-icon">👥</span><span>Utilizadores</span></button>
        <button class="nav-btn" id="nav-pedagogia"          onclick="goView('pedagogia')"    data-mod="pedagogia"><span class="nav-btn-icon">🎓</span><span>Pedagogia</span></button>
        <button class="nav-btn" id="nav-avaliacao"          onclick="goView('avaliacao')"    data-mod="avaliacao"><span class="nav-btn-icon">📊</span><span>Avaliação</span></button>
        <button class="nav-btn" id="nav-comunicacao"        onclick="goView('comunicacao')"  data-mod="comunicacao"><span class="nav-btn-icon">📣</span><span>Comunicação</span></button>
        <button class="nav-btn" id="nav-digital"            onclick="goView('digital')"      data-mod="digital"><span class="nav-btn-icon">💻</span><span>Digital</span></button>
        <button class="nav-btn" id="nav-arquivo"            onclick="goView('arquivo')"      data-mod="arquivo"><span class="nav-btn-icon">🗃️</span><span>Arquivo</span></button>
      </nav>

      <div class="header-right">
        <!-- Sync -->
        <div class="header-sync" role="status" aria-live="polite">
          <div class="sync-dot" id="sync-dot" aria-hidden="true"></div>
          <span id="sync-text">—</span>
        </div>
        <!-- Sincronizar -->
        <button class="header-icon-btn" onclick="syncNow()" aria-label="Sincronizar com OneDrive" title="Sincronizar (Ctrl+R)">🔄</button>
        <!-- Carregar ficheiro -->
        <button class="header-icon-btn" onclick="openModal('modal-upload')" aria-label="Carregar ficheiro" title="Carregar ficheiro">⬆️</button>
        <!-- Alertas -->
        <div style="position:relative">
          <button class="header-icon-btn" onclick="goView('alertas')" aria-label="Alertas" title="Alertas">🔔</button>
          <div class="header-badge hidden" id="header-badge-alerts" aria-label="alertas" role="status">0</div>
        </div>
        <!-- Perfil -->
        <button class="user-avatar" id="user-avatar" onclick="openModal('modal-perfil')" aria-label="Perfil do utilizador">?</button>
      </div>
    </header>

    <div class="app-body">

      <!-- Overlay sidebar (mobile) -->
      <div class="sidebar-overlay" id="sb-overlay" onclick="toggleSidebar()" aria-hidden="true"></div>

      <!-- Sidebar -->
      <nav class="sidebar" id="sidebar" aria-label="Navegação lateral" role="navigation">

        <div class="sidebar-section">
          <span class="sidebar-label">Principal</span>
          <button class="sb-item active" id="sb-dashboard" onclick="goView('dashboard')" data-mod="dashboard" aria-current="page">
            <span class="sb-item-icon" aria-hidden="true">🏠</span>
            <span class="sb-item-label">Dashboard</span>
          </button>
          <button class="sb-item" id="sb-alertas" onclick="goView('alertas')" data-mod="dashboard">
            <span class="sb-item-icon" aria-hidden="true">🔔</span>
            <span class="sb-item-label">Alertas e Prazos</span>
            <span class="sb-item-badge" id="sb-badge-alertas">0</span>
          </button>
          <button class="sb-item" id="sb-tarefas" onclick="goView('tarefas')" data-mod="dashboard">
            <span class="sb-item-icon" aria-hidden="true">✅</span>
            <span class="sb-item-label">Tarefas</span>
            <span class="sb-item-badge" id="sb-badge-tarefas">0</span>
          </button>
          <button class="sb-item" id="sb-calendario" onclick="goView('calendario')" data-mod="dashboard">
            <span class="sb-item-icon" aria-hidden="true">📅</span>
            <span class="sb-item-label">Calendário</span>
          </button>
        </div>

        <div class="sidebar-divider" role="separator"></div>
        <div class="sidebar-section">
          <span class="sidebar-label">OneDrive</span>
          <button class="sb-item" id="sb-ficheiros"  onclick="goView('ficheiros')"  data-mod="gestao">
            <span class="sb-item-icon" aria-hidden="true">📁</span>
            <span class="sb-item-label">Explorador</span>
          </button>
          <button class="sb-item" id="sb-pesquisa"   onclick="goView('pesquisa')"   data-mod="gestao">
            <span class="sb-item-icon" aria-hidden="true">🔍</span>
            <span class="sb-item-label">Pesquisa Global</span>
          </button>
          <button class="sb-item" id="sb-criticos"   onclick="goView('criticos')"   data-mod="gestao">
            <span class="sb-item-icon" aria-hidden="true">⚡</span>
            <span class="sb-item-label">Doc. Críticos</span>
          </button>
          <button class="sb-item" id="sb-partilhas"  onclick="goView('partilhas')"  data-mod="gestao">
            <span class="sb-item-icon" aria-hidden="true">🔗</span>
            <span class="sb-item-label">Partilhado Comigo</span>
          </button>
        </div>

        <div class="sidebar-divider" role="separator"></div>
        <div class="sidebar-section">
          <span class="sidebar-label">Gestão Documental</span>
          <button class="sb-item" id="sb-pops"          onclick="goView('pops')"         data-mod="gestao">
            <span class="sb-item-icon" aria-hidden="true">📋</span>
            <span class="sb-item-label">POPs</span>
          </button>
          <button class="sb-item" id="sb-formularios"   onclick="goView('formularios')"  data-mod="gestao">
            <span class="sb-item-icon" aria-hidden="true">📝</span>
            <span class="sb-item-label">Formulários F01–F18</span>
          </button>
          <button class="sb-item" id="sb-checklists"    onclick="goView('checklists')"   data-mod="gestao">
            <span class="sb-item-icon" aria-hidden="true">☑️</span>
            <span class="sb-item-label">Checklists</span>
          </button>
        </div>

        <div class="sidebar-divider" role="separator"></div>
        <div class="sidebar-section">
          <span class="sidebar-label">Avaliação</span>
          <button class="sb-item" id="sb-kpi"           onclick="goView('kpi')"           data-mod="avaliacao">
            <span class="sb-item-icon" aria-hidden="true">📈</span>
            <span class="sb-item-label">Indicadores KPI</span>
          </button>
          <button class="sb-item" id="sb-mabe"          onclick="goView('mabe')"          data-mod="avaliacao">
            <span class="sb-item-icon" aria-hidden="true">🏆</span>
            <span class="sb-item-label">MABE</span>
          </button>
          <button class="sb-item" id="sb-evidencias"    onclick="goView('evidencias')"    data-mod="avaliacao">
            <span class="sb-item-icon" aria-hidden="true">🗂️</span>
            <span class="sb-item-label">Evidências</span>
          </button>
          <button class="sb-item" id="sb-relatorios"    onclick="goView('relatorios')"    data-mod="avaliacao">
            <span class="sb-item-icon" aria-hidden="true">📑</span>
            <span class="sb-item-label">Relatórios</span>
          </button>
        </div>

        <div class="sidebar-divider" role="separator"></div>
        <div class="sidebar-section">
          <span class="sidebar-label">Operações</span>
          <button class="sb-item" id="sb-atividades"    onclick="goView('atividades')"    data-mod="pedagogia">
            <span class="sb-item-icon" aria-hidden="true">📖</span>
            <span class="sb-item-label">Atividades</span>
          </button>
          <button class="sb-item" id="sb-historico"     onclick="goView('historico')"     data-mod="dashboard">
            <span class="sb-item-icon" aria-hidden="true">🕐</span>
            <span class="sb-item-label">Histórico</span>
          </button>
        </div>

        <div class="sidebar-foot">
          BE-ESP v4 · <span id="sb-sync">—</span>
        </div>
      </nav>

      <!-- Main -->
      <main class="app-main" id="main-area" tabindex="-1">

        <!-- Atalhos rápidos (visíveis em todas as vistas) -->
        <div class="shortcuts pad" id="quick-shortcuts" style="padding-bottom:0;margin-bottom:-4px">
          <button class="shortcut" onclick="openModal('modal-emprestimo')" aria-label="Novo empréstimo">
            <span class="shortcut-icon">📗</span><span>Novo empréstimo</span>
          </button>
          <button class="shortcut" onclick="openModal('modal-nova-ativ')" aria-label="Nova atividade">
            <span class="shortcut-icon">📅</span><span>Nova atividade</span>
          </button>
          <button class="shortcut" onclick="openModal('modal-upload')" aria-label="Novo documento">
            <span class="shortcut-icon">📎</span><span>Novo documento</span>
          </button>
          <button class="shortcut" onclick="openModal('modal-newsletter')" aria-label="Nova publicação">
            <span class="shortcut-icon">📣</span><span>Nova publicação</span>
          </button>
        </div>

        <!-- Chips de alerta (topo, todas as vistas) -->
        <div class="pad" id="alert-chips-bar" style="padding-top:var(--sp-3);padding-bottom:0">
          <div class="alert-chips" id="alert-chips" role="status" aria-live="polite"></div>
        </div>

        <!-- Vistas — cada módulo injeta aqui o seu HTML -->
        <div id="view-dashboard"    class="view active"></div>
        <div id="view-alertas"      class="view"></div>
        <div id="view-tarefas"      class="view"></div>
        <div id="view-calendario"   class="view"></div>
        <div id="view-ficheiros"    class="view"></div>
        <div id="view-pesquisa"     class="view"></div>
        <div id="view-pops"         class="view"></div>
        <div id="view-formularios"  class="view"></div>
        <div id="view-checklists"   class="view"></div>
        <div id="view-kpi"          class="view"></div>
        <div id="view-mabe"         class="view"></div>
        <div id="view-evidencias"   class="view"></div>
        <div id="view-relatorios"   class="view"></div>
        <div id="view-atividades"   class="view"></div>
        <div id="view-historico"    class="view"></div>
        <div id="view-criticos"     class="view"></div>
        <div id="view-partilhas"    class="view"></div>
        <div id="view-comunicacao"  class="view"></div>
        <div id="view-digital"      class="view"></div>
        <div id="view-arquivo"      class="view"></div>
        <!-- Vistas de módulo (hub) -->
        <div id="view-gestao"       class="view"></div>
        <div id="view-utilizadores" class="view"></div>
        <div id="view-pedagogia"    class="view"></div>
        <div id="view-avaliacao"    class="view"></div>
      </main>
    </div>

  </div><!-- /app-shell -->

  <!-- Toast -->
  <div class="toast" id="toast" role="status" aria-live="assertive"></div>

  <!-- Hint de atalhos -->
  <div class="shortcut-hint" aria-hidden="true">Ctrl+K pesquisa · Esc fecha · Alt+D dashboard</div>

  <!-- ══ MODAIS ══ -->
  <!-- Modal Upload -->
  <div class="modal-overlay" id="modal-upload" role="dialog" aria-modal="true" aria-labelledby="modal-upload-title" aria-hidden="true">
    <div class="modal">
      <h3 id="modal-upload-title">⬆️ Carregar para OneDrive</h3>
      <p class="modal-sub">Nomenclatura normalizada · Destino automático por tipo de documento</p>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="up-type">Tipo de documento</label>
          <select class="form-select" id="up-type" onchange="calcUploadPath()">
            <option value="">Selecionar…</option>
            <option value="POP">POP</option><option value="F">Formulário preenchido</option>
            <option value="CL">Checklist executada</option><option value="EV">Evidência MABE</option>
            <option value="AT">Relatório de Atividade</option><option value="NL">Newsletter</option>
            <option value="RAA">RAA</option><option value="MABE">Relatório MABE</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="up-mabe">Domínio MABE</label>
          <select class="form-select" id="up-mabe" onchange="calcUploadPath()">
            <option value="">—</option><option>A</option><option>B</option><option>C</option><option>D</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="up-desc">Descrição / Referência</label>
          <input class="form-input" id="up-desc" placeholder="Ex: Sessao_8A_Portugues" oninput="calcUploadPath()">
        </div>
        <div class="form-group">
          <label class="form-label" for="up-resp">Responsável</label>
          <select class="form-select" id="up-resp"><option>PB</option><option>AO</option><option>DC</option></select>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:var(--sp-3)">
        <label class="form-label" for="up-path">Destino no OneDrive (automático)</label>
        <input class="form-input" id="up-path" readonly style="background:var(--grey-50);font-family:var(--font-mono);font-size:.68rem" aria-readonly="true">
      </div>
      <div class="upload-zone" id="upload-zone" role="button" tabindex="0"
        aria-label="Clique ou arraste ficheiros aqui"
        onclick="document.getElementById('file-input').click()"
        onkeydown="if(event.key==='Enter'||event.key===' ')document.getElementById('file-input').click()"
        ondragover="event.preventDefault();this.classList.add('drag')"
        ondragleave="this.classList.remove('drag')"
        ondrop="dropFiles(event)">
        <div style="font-size:26px;margin-bottom:5px" aria-hidden="true">📎</div>
        <strong>Clique ou arraste ficheiros</strong><br>
        <span style="font-size:.72rem">Qualquer tipo · Até 250 MB por ficheiro</span>
        <input type="file" id="file-input" style="display:none" multiple onchange="pickFiles(event)" aria-label="Seleccionar ficheiros">
      </div>
      <div id="up-preview" style="margin-top:var(--sp-2)" aria-live="polite"></div>
      <div class="up-bar-wrap" id="up-bar-wrap" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="up-bar" id="up-bar"></div>
      </div>
      <div class="up-status" id="up-status" aria-live="polite"></div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="doUpload()" id="btn-do-upload">⬆️ Enviar</button>
        <button class="btn btn-ghost"   onclick="closeModal('modal-upload')">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- Modal Nova Tarefa -->
  <div class="modal-overlay" id="modal-new-task" role="dialog" aria-modal="true" aria-labelledby="modal-task-title" aria-hidden="true">
    <div class="modal">
      <h3 id="modal-task-title">✅ Nova Tarefa</h3>
      <p class="modal-sub">Guardada localmente com data e utilizador</p>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="nt-title">Título <span class="required">*</span></label>
          <input class="form-input" id="nt-title" placeholder="Descreva a tarefa…" required aria-required="true">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="nt-prio">Prioridade</label>
          <select class="form-select" id="nt-prio">
            <option value="h">🔴 Alta</option><option value="m" selected>🟡 Média</option><option value="l">🟢 Baixa</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="nt-date">Prazo</label>
          <input class="form-input" type="date" id="nt-date">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="nt-resp">Responsável</label>
          <select class="form-select" id="nt-resp"><option>PB</option><option>AO</option><option>DC</option></select>
        </div>
        <div class="form-group">
          <label class="form-label" for="nt-mabe">Domínio MABE</label>
          <select class="form-select" id="nt-mabe"><option>—</option><option>A</option><option>B</option><option>C</option><option>D</option></select>
        </div>
      </div>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="nt-notes">Notas</label>
          <textarea class="form-textarea" id="nt-notes"></textarea>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="addTask()">✅ Adicionar</button>
        <button class="btn btn-ghost"   onclick="closeModal('modal-new-task')">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- Modal Nova Atividade -->
  <div class="modal-overlay" id="modal-nova-ativ" role="dialog" aria-modal="true" aria-labelledby="modal-ativ-title" aria-hidden="true">
    <div class="modal">
      <h3 id="modal-ativ-title">📖 Registar Atividade</h3>
      <p class="modal-sub">Cria pasta normalizada no OneDrive com estrutura padrão</p>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="na-nome">Nome <span class="required">*</span></label>
          <input class="form-input" id="na-nome" oninput="calcAtivPath()" required aria-required="true">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="na-tipo">Tipo</label>
          <select class="form-select" id="na-tipo" onchange="calcAtivPath()">
            <option>PPL</option><option>Articulação</option><option>Projeto</option>
            <option>Clube Leitura</option><option>Exposição</option><option>Formação</option><option>Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="na-data">Data</label>
          <input class="form-input" type="date" id="na-data" oninput="calcAtivPath()" onchange="calcAtivPath()">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="na-pub">Público-alvo</label>
          <input class="form-input" id="na-pub" placeholder="Ex: 8.º ano">
        </div>
        <div class="form-group">
          <label class="form-label" for="na-part">Participantes</label>
          <input class="form-input" type="number" id="na-part" placeholder="0" min="0">
        </div>
      </div>
      <div class="form-group" style="margin-bottom:var(--sp-3)">
        <label class="form-label" for="na-path">Pasta OneDrive a criar</label>
        <input class="form-input" id="na-path" readonly style="background:var(--grey-50);font-family:var(--font-mono);font-size:.68rem" aria-readonly="true">
      </div>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="na-desc">Descrição</label>
          <textarea class="form-textarea" id="na-desc"></textarea>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="criarAtividade()">📁 Criar + registar</button>
        <button class="btn btn-ghost"   onclick="closeModal('modal-nova-ativ')">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- Modal Novo Evento -->
  <div class="modal-overlay" id="modal-new-event" role="dialog" aria-modal="true" aria-labelledby="modal-event-title" aria-hidden="true">
    <div class="modal">
      <h3 id="modal-event-title">📅 Novo Evento</h3>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="ev-title">Título <span class="required">*</span></label>
          <input class="form-input" id="ev-title" required aria-required="true">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="ev-date">Data <span class="required">*</span></label>
          <input class="form-input" type="date" id="ev-date" required aria-required="true">
        </div>
        <div class="form-group">
          <label class="form-label" for="ev-mabe">Domínio MABE</label>
          <select class="form-select" id="ev-mabe"><option>D</option><option>A</option><option>B</option><option>C</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="ev-resp">Responsável</label>
          <select class="form-select" id="ev-resp"><option>PB</option><option>AO</option><option>DC</option></select>
        </div>
        <div class="form-group">
          <label class="form-label" for="ev-tipo">Tipo</label>
          <select class="form-select" id="ev-tipo"><option>Prazo</option><option>Atividade</option><option>Reunião</option></select>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="addEvent()">✅ Adicionar</button>
        <button class="btn btn-ghost"   onclick="closeModal('modal-new-event')">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- Modal Perfil -->
  <div class="modal-overlay" id="modal-perfil" role="dialog" aria-modal="true" aria-labelledby="modal-perfil-title" aria-hidden="true">
    <div class="modal">
      <h3 id="modal-perfil-title">👤 Perfil</h3>
      <div class="card" style="margin-bottom:var(--sp-3)">
        <div style="display:flex;gap:var(--sp-3);align-items:center">
          <div class="profile-avatar" id="p-avatar" aria-hidden="true">?</div>
          <div>
            <div style="font-weight:700" id="p-nome">—</div>
            <div style="font-size:.75rem;color:var(--grey-500)" id="p-email">—</div>
          </div>
        </div>
        <div style="margin-top:var(--sp-3);font-size:.72rem;color:var(--grey-500)">
          Última sincronização: <span id="p-sync">—</span><br>
          Modo: <span id="p-modo">—</span>
        </div>
      </div>
      <div style="background:var(--grey-100);border-radius:var(--r-sm);padding:var(--sp-3);font-size:.72rem;margin-bottom:var(--sp-3)">
        <strong>Atalhos de teclado:</strong><br>
        <kbd style="background:var(--white);border:1px solid var(--grey-200);border-radius:4px;padding:1px 5px;font-size:.65rem">Ctrl+K</kbd> Pesquisa global &nbsp;
        <kbd style="background:var(--white);border:1px solid var(--grey-200);border-radius:4px;padding:1px 5px;font-size:.65rem">Esc</kbd> Fechar modal &nbsp;
        <kbd style="background:var(--white);border:1px solid var(--grey-200);border-radius:4px;padding:1px 5px;font-size:.65rem">Alt+D</kbd> Dashboard
      </div>
      <div class="modal-actions">
        <button class="btn btn-ghost btn-sm"  onclick="closeModal('modal-perfil')">Fechar</button>
        <button class="btn btn-danger btn-sm" onclick="logout()">🔒 Terminar sessão</button>
      </div>
    </div>
  </div>

  <!-- Modal Novo Empréstimo (placeholder) -->
  <div class="modal-overlay" id="modal-emprestimo" role="dialog" aria-modal="true" aria-labelledby="modal-emp-title" aria-hidden="true">
    <div class="modal">
      <h3 id="modal-emp-title">📗 Novo Empréstimo</h3>
      <p class="modal-sub">Registo rápido — use o BiblioNet para gestão completa</p>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="emp-user">Utilizador</label>
          <input class="form-input" id="emp-user" placeholder="Nome ou número de aluno">
        </div>
      </div>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="emp-doc">Documento (N.º Inv. ou título)</label>
          <input class="form-input" id="emp-doc" placeholder="Ex: INV-2024-0042">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="emp-data">Data empréstimo</label>
          <input class="form-input" type="date" id="emp-data">
        </div>
        <div class="form-group">
          <label class="form-label" for="emp-dev">Devolução prevista</label>
          <input class="form-input" type="date" id="emp-dev">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="registarEmprestimo()">📗 Registar</button>
        <button class="btn btn-ghost"   onclick="closeModal('modal-emprestimo')">Cancelar</button>
      </div>
    </div>
  </div>

  <!-- Modal Newsletter placeholder -->
  <div class="modal-overlay" id="modal-newsletter" role="dialog" aria-modal="true" aria-labelledby="modal-nl-title" aria-hidden="true">
    <div class="modal">
      <h3 id="modal-nl-title">📣 Nova Publicação</h3>
      <p class="modal-sub">Registar nova edição da newsletter ou publicação nas redes sociais</p>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="nl-titulo">Título</label>
          <input class="form-input" id="nl-titulo" placeholder="Ex: Newsletter Maio 2026">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="nl-tipo">Tipo</label>
          <select class="form-select" id="nl-tipo">
            <option>Newsletter</option><option>Instagram</option><option>Facebook</option>
            <option>Website</option><option>Outro</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="nl-data">Data</label>
          <input class="form-input" type="date" id="nl-data">
        </div>
      </div>
      <div class="form-row solo">
        <div class="form-group">
          <label class="form-label" for="nl-desc">Descrição / notas</label>
          <textarea class="form-textarea" id="nl-desc" style="min-height:60px"></textarea>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-primary" onclick="registarPublicacao()">📣 Registar</button>
        <button class="btn btn-ghost"   onclick="closeModal('modal-newsletter')">Cancelar</button>
      </div>
    </div>
  </div>

  `;
}

/* ══════════════════════════════════
   ROUTER — goView()
══════════════════════════════════ */
export async function goView(id) {
  /* 1. Esconder todas as vistas */
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

  /* 2. Desactivar todos os botões nav */
  document.querySelectorAll('.nav-btn, .sb-item').forEach(b => {
    b.classList.remove('active');
    b.removeAttribute('aria-current');
  });

  /* 3. Activar vista */
  const view = document.getElementById('view-' + id);
  if (view) {
    view.classList.add('active');
    document.getElementById('main-area')?.focus();
  }

  /* 4. Activar nav header + sidebar */
  const navBtn = document.getElementById('nav-' + id);
  if (navBtn) { navBtn.classList.add('active'); navBtn.setAttribute('aria-current', 'page'); }
  const sbBtn  = document.getElementById('sb-' + id);
  if (sbBtn)  { sbBtn.classList.add('active');  sbBtn.setAttribute('aria-current', 'page'); }

  /* 5. Fechar sidebar em mobile */
  closeSidebar();

  /* 6. Guardar vista activa */
  setState('activeView', id);

  /* 7. Carregar módulo lazy (só na primeira vez) */
  if (VIEW_MODULES[id]) {
    const mod = await VIEW_MODULES[id]();
    if (!_rendered.has(id)) {
      _rendered.add(id);
      mod.init?.(document.getElementById('view-' + id));
    } else {
      mod.refresh?.(document.getElementById('view-' + id));
    }
  }
}

/* ══════════════════════════════════
   UPLOAD (exposto globalmente)
══════════════════════════════════ */
const UP = { files: [], uploading: false };

window.calcUploadPath = function() {
  const type = document.getElementById('up-type')?.value ?? '';
  const mabe = document.getElementById('up-mabe')?.value ?? '';
  const desc = (document.getElementById('up-desc')?.value ?? '').trim().replace(/\s+/g,'_').replace(/[<>:"/\\|?*]/g,'');
  const date = new Date().toISOString().slice(0,10);
  const resp = document.getElementById('up-resp')?.value ?? 'PB';
  const DEST = {
    POP:'02_Organização_e_Operação/01_Gestão_Documental',
    F:  '09_Formulários_e_Modelos/01_Formulários_Operacionais',
    CL: '09_Formulários_e_Modelos/04_Checklists_Operacionais',
    EV: mabe ? {A:'03_Pedagogia_e_Literacias',B:'03_Pedagogia_e_Literacias',C:'03_Pedagogia_e_Literacias',D:'07_Avaliação_e_Melhoria'}[mabe] ?? '07_Avaliação_e_Melhoria' : '07_Avaliação_e_Melhoria',
    AT: '03_Pedagogia_e_Literacias/04_Atividades_Pedagógicas',
    NL: '06_Comunicação_e_Imagem/02_Newsletter_e_Notícias',
    RAA:'07_Avaliação_e_Melhoria/05_Relatórios_Anuais',
    MABE:'07_Avaliação_e_Melhoria/01_MABE',
    OUTRO:'10_Arquivo_Histórico/03_2025-2026',
  };
  const pasta = type ? (DEST[type] ?? 'BE-ESP') : 'BE-ESP';
  const pref  = type && desc ? `${type}_${desc}_${date}_${resp}` : desc || '(sem nome)';
  const el    = document.getElementById('up-path');
  if (el) el.value = `BE-ESP/${pasta}/${pref}`;
};

window.calcAtivPath = function() {
  const nome = (document.getElementById('na-nome')?.value ?? '').trim()
    .replace(/\s+/g,'_').replace(/[<>:"/\\|?*]/g,'').slice(0,40);
  const tipo = document.getElementById('na-tipo')?.value ?? 'Outro';
  const data = document.getElementById('na-data')?.value ?? new Date().toISOString().slice(0,7);
  const mes  = data.slice(0,7);
  const abr  = {PPL:'PPL',Articulação:'ART',Projeto:'PRJ','Clube Leitura':'CLB',Exposição:'EXP',Formação:'FRM',Outro:'AT'}[tipo] ?? 'AT';
  const pasta = `AT_${mes}_${abr}_${nome || 'Nova_Atividade'}`;
  const el    = document.getElementById('na-path');
  if (el) el.value = `BE-ESP/03_Pedagogia_e_Literacias/04_Atividades_Pedagógicas/${pasta}`;
};

window.pickFiles = e => {
  _upAddFiles(Array.from(e.target.files ?? []));
  e.target.value = '';
};
window.dropFiles = e => {
  e.preventDefault();
  document.getElementById('upload-zone')?.classList.remove('drag');
  _upAddFiles(Array.from(e.dataTransfer?.files ?? []));
};

function _upAddFiles(files) {
  const MAX = 250 * 1024 * 1024;
  const bad = [];
  files.forEach(f => {
    if (f.size > MAX) { bad.push(f.name); return; }
    if (!UP.files.some(x => x.name === f.name && x.size === f.size)) UP.files.push(f);
  });
  if (bad.length) showToast('⚠️ Ficheiros demasiado grandes: ' + bad.join(', '), 'warn');
  _upRender();
}
function _upRender() {
  const { fmtSize: fs } = { fmtSize: b => b < 1024 ? b+' B' : b < 1024**2 ? (b/1024).toFixed(1)+' KB' : (b/1024**2).toFixed(1)+' MB' };
  const div = document.getElementById('up-preview');
  if (!div) return;
  div.innerHTML = UP.files.map((f,i) =>
    `<div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--grey-100);border-radius:var(--r-sm);margin-bottom:4px;font-size:.75rem">
      <span>📄</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500">${esc(f.name)}</span>
      <span style="color:var(--grey-400)">${fs(f.size)}</span>
      <button class="btn-icon" style="padding:2px 5px;font-size:11px" onclick="_upRemove(${i})" aria-label="Remover ${esc(f.name)}">✕</button>
    </div>`
  ).join('');
}
window._upRemove = i => { UP.files.splice(i,1); _upRender(); };

window.doUpload = async function() {
  if (UP.uploading || !UP.files.length) {
    if (!UP.files.length) showToast('⚠️ Seleccione pelo menos um ficheiro', 'warn');
    return;
  }
  const { gGetByPath, gCreateFolder, gUpload } = await import('./core/graph.js');
  const { cacheClear } = await import('./core/cache.js');

  UP.uploading = true;
  const btn    = document.getElementById('btn-do-upload');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ A enviar…'; }

  const type  = document.getElementById('up-type')?.value  ?? 'OUTRO';
  const mabe  = document.getElementById('up-mabe')?.value  ?? '';
  const desc  = (document.getElementById('up-desc')?.value ?? '').trim().replace(/\s+/g,'_').replace(/[<>:"/\\|?*]/g,'');
  const resp  = document.getElementById('up-resp')?.value  ?? 'PB';
  const date  = new Date().toISOString().slice(0,10);
  const pasta = (document.getElementById('up-path')?.value ?? '').split('/').slice(1,-1).join('/');

  let pastaId;
  try {
    const r = await gGetByPath(pasta);
    pastaId  = r.id;
  } catch {
    const rootId = getState('rootId');
    const criada = await gCreateFolder(rootId, pasta.split('/').pop());
    pastaId = criada.id;
  }

  let ok = 0, erros = [];
  for (let i = 0; i < UP.files.length; i++) {
    const f   = UP.files[i];
    const ext = f.name.includes('.') ? '.' + f.name.split('.').pop() : '';
    const base = f.name.replace(/\.[^.]+$/, '').replace(/\s+/g,'_').replace(/[<>:"/\\|?*]/g,'').slice(0,60);
    const nome = [type,desc,date,resp].filter(Boolean).join('_') + '_' + base + ext;
    const bar  = document.getElementById('up-bar');
    const wrap = document.getElementById('up-bar-wrap');
    const stat = document.getElementById('up-status');
    if (wrap) wrap.style.display = 'block';
    try {
      await gUpload(pastaId, nome, f, (pct, msg) => {
        if (bar)  bar.style.width = pct + '%';
        if (stat) stat.textContent = msg;
        wrap?.setAttribute('aria-valuenow', String(pct));
      });
      addHistory('Ficheiro carregado', nome, pasta);
      ok++;
    } catch (e) { erros.push(f.name + ': ' + e.message.slice(0,80)); }
  }

  cacheClear();
  showToast(ok ? `✅ ${ok} ficheiro(s) carregado(s)` : '❌ Todos os uploads falharam', ok ? 'ok' : 'danger');
  if (erros.length) console.warn('Erros upload:', erros);

  UP.files     = []; UP.uploading = false;
  if (btn) { btn.disabled = false; btn.textContent = '⬆️ Enviar'; }
  const wrap = document.getElementById('up-bar-wrap');
  if (wrap) wrap.style.display = 'none';
  const div = document.getElementById('up-preview');
  if (div) div.innerHTML = '';
  setTimeout(() => closeModal('modal-upload'), 700);
};

/* ══════════════════════════════════
   TAREFAS (exposto globalmente)
══════════════════════════════════ */
window.addTask = function() {
  const titleEl = document.getElementById('nt-title');
  const title   = titleEl?.value.trim();
  if (!title) { showToast('⚠️ Título obrigatório', 'warn'); titleEl?.focus(); return; }
  const tasks = getState('tasks') ?? [];
  tasks.unshift({
    id: Date.now(), title,
    prio:  document.getElementById('nt-prio')?.value ?? 'm',
    date:  document.getElementById('nt-date')?.value ?? '',
    resp:  document.getElementById('nt-resp')?.value ?? 'PB',
    mabe:  document.getElementById('nt-mabe')?.value ?? '—',
    notes: document.getElementById('nt-notes')?.value ?? '',
    done: false,
    createdBy: getState('user')?.displayName ?? '—',
    createdAt: new Date().toLocaleString('pt-PT'),
  });
  setState('tasks', tasks);
  saveLocal();
  closeModal('modal-new-task');
  if (titleEl) titleEl.value = '';
  addHistory('Tarefa criada', title);
  showToast('✅ Tarefa adicionada', 'ok');
  goView('tarefas');
};

window.addEvent = function() {
  const title = document.getElementById('ev-title')?.value.trim();
  const date  = document.getElementById('ev-date')?.value;
  if (!title || !date) { showToast('⚠️ Título e data obrigatórios', 'warn'); return; }
  const dt    = new Date(date);
  const mes   = dt.toLocaleDateString('pt-PT', { month: 'long' });
  const mesC  = mes.charAt(0).toUpperCase() + mes.slice(1);
  const events = getState('events') ?? [];
  events.push({ title, date, mes: mesC, m: document.getElementById('ev-mabe')?.value ?? 'D', resp: document.getElementById('ev-resp')?.value ?? 'PB' });
  setState('events', events);
  saveLocal();
  closeModal('modal-new-event');
  showToast('📅 Evento adicionado', 'ok');
};

window.criarAtividade = async function() {
  const nome = document.getElementById('na-nome')?.value.trim();
  if (!nome) { showToast('⚠️ Nome obrigatório', 'warn'); return; }
  const tipo  = document.getElementById('na-tipo')?.value  ?? 'Outro';
  const data  = document.getElementById('na-data')?.value  ?? new Date().toISOString().slice(0,10);
  const pub   = document.getElementById('na-pub')?.value.trim()  ?? '';
  const part  = parseInt(document.getElementById('na-part')?.value) || 0;
  const desc  = document.getElementById('na-desc')?.value.trim()  ?? '';
  const pasta = document.getElementById('na-path')?.value ?? '';

  if (!getState('demo') && getState('rootId')) {
    try {
      const { gGetByPath, gCreateFolder } = await import('./core/graph.js');
      let paiId;
      try { paiId = (await gGetByPath('BE-ESP/03_Pedagogia_e_Literacias/04_Atividades_Pedagógicas')).id; }
      catch { paiId = getState('rootId'); }
      await gCreateFolder(paiId, pasta.split('/').pop());
    } catch (e) { showToast('⚠️ Pasta não criada: ' + e.message.slice(0,60), 'warn'); }
  }

  const atividades = getState('atividades') ?? [];
  atividades.unshift({ id: Date.now(), nome, tipo, data, pub, part, desc,
    pasta: pasta.split('/').pop(),
    createdAt: new Date().toLocaleString('pt-PT'),
    createdBy: getState('user')?.displayName ?? '—' });
  setState('atividades', atividades);
  saveLocal();
  closeModal('modal-nova-ativ');
  addHistory('Atividade criada', nome, pasta);
  showToast('✅ Atividade registada', 'ok');
  ['na-nome','na-pub','na-desc'].forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
  const p = document.getElementById('na-part'); if (p) p.value = '';
};

window.registarEmprestimo = function() {
  const user = document.getElementById('emp-user')?.value.trim();
  const doc  = document.getElementById('emp-doc')?.value.trim();
  if (!user || !doc) { showToast('⚠️ Utilizador e documento obrigatórios', 'warn'); return; }
  addHistory('Empréstimo registado', doc, user);
  closeModal('modal-emprestimo');
  showToast('📗 Empréstimo registado', 'ok');
  ['emp-user','emp-doc','emp-data','emp-dev'].forEach(id => { const e = document.getElementById(id); if(e) e.value=''; });
};

window.registarPublicacao = function() {
  const titulo = document.getElementById('nl-titulo')?.value.trim();
  if (!titulo) { showToast('⚠️ Título obrigatório', 'warn'); return; }
  const tipo = document.getElementById('nl-tipo')?.value ?? 'Newsletter';
  const data = document.getElementById('nl-data')?.value ?? new Date().toISOString().slice(0,10);
  const desc = document.getElementById('nl-desc')?.value ?? '';
  const nl   = getState('newsletter') ?? [];
  nl.unshift({ id: Date.now(), titulo, tipo, data, desc, createdAt: new Date().toLocaleString('pt-PT') });
  setState('newsletter', nl);
  saveLocal();
  closeModal('modal-newsletter');
  addHistory('Publicação registada', titulo);
  showToast('📣 Publicação registada', 'ok');
};

/* ══════════════════════════════════
   EXPÔR GLOBAIS NECESSÁRIOS
══════════════════════════════════ */
window.goView       = goView;
window.syncNow      = syncNow;
window.openModal    = openModal;
window.closeModal   = closeModal;
window.toggleSidebar = toggleSidebar;
window.logout       = logout;

/* ══════════════════════════════════
   ARRANQUE DA APP
══════════════════════════════════ */
async function boot() {
  /* Mostrar URI de redireccionamento */
  const uriEl = document.getElementById('redirect-uri');
  if (uriEl) uriEl.textContent = getRedirectUri();

  /* Pré-preencher campos guardados */
  const cid = localStorage.getItem('be_cid');
  const tid = localStorage.getItem('be_tid');
  if (cid) { const el = document.getElementById('cfg-client-id'); if (el) el.value = cid; }
  if (tid) { const el = document.getElementById('cfg-tenant');    if (el) el.value = tid; }

  /* Listeners de login */
  document.getElementById('btn-login')?.addEventListener('click', async () => {
    const cid = document.getElementById('cfg-client-id')?.value.trim();
    const tid = document.getElementById('cfg-tenant')?.value.trim() ?? 'common';
    try { await startLogin(cid, tid); }
    catch (e) { _showLoginErr(e.message); }
  });
  document.getElementById('btn-demo')?.addEventListener('click', () => {
    startDemo();
    _launchApp();
  });

  /* Verificar callback OAuth2 */
  try {
    const isCallback = await handleCallback();
    if (isCallback) { await _launchApp(); return; }
  } catch (e) { _showLoginErr(e.message); return; }

  /* Sessão guardada válida */
  const session = getStoredSession();
  if (session) {
    setState('token', session.token);
    setState('user',  session.user);
    await _launchApp();
    return;
  }

  /* Token expirado mas há refresh token */
  const hasRefresh = !!localStorage.getItem('be_refresh');
  const savedUser  = JSON.parse(localStorage.getItem('be_user') ?? 'null');
  if (hasRefresh && savedUser) {
    setState('user', savedUser);
    const ok = await refreshAccessToken();
    if (ok) { await _launchApp(); return; }
  }

  /* Modo offline com cache local */
  if (!navigator.onLine && savedUser) {
    setState('user', savedUser); setState('demo', true);
    await _launchApp();
    showToast('⚠️ Sem ligação — modo offline com cache', 'warn');
    return;
  }

  /* Mostrar ecrã de login */
  document.getElementById('login-screen')?.classList.add('show');
}

async function _launchApp() {
  /* Esconder login, mostrar app */
  document.getElementById('login-screen')?.classList.remove('show');
  document.getElementById('app-shell').style.display = 'flex';

  /* Carregar dados locais */
  loadLocal();
  verifyIntegrity();

  /* Actualizar UI do utilizador */
  _updateUserUI();

  /* Sincronizar */
  if (!getState('demo')) startTokenMonitor();
  await syncNow();

  /* Instalar listeners globais */
  installModalListeners();
  installKeyboardShortcuts();

  /* Online/Offline */
  window.addEventListener('online', () => {
    document.getElementById('offline-banner')?.classList.remove('show');
    if (!getState('demo')) startTokenMonitor();
    syncNow();
  });
  window.addEventListener('offline', () => {
    document.getElementById('offline-banner')?.classList.add('show');
    setSyncStatus('Offline — cache local', 'error');
  });
  if (!navigator.onLine) document.getElementById('offline-banner')?.classList.add('show');

  /* Carregar dashboard */
  await goView('dashboard');

  /* Badges iniciais */
  _updateBadges();
}

function _updateUserUI() {
  const u = getState('user');
  const initial = (u?.displayName ?? '?')[0].toUpperCase();
  const av = document.getElementById('user-avatar');
  const pAv = document.getElementById('p-avatar');
  if (av)  av.textContent  = initial;
  if (pAv) pAv.textContent = initial;
  setText('p-nome',  u?.displayName ?? '—');
  setText('p-email', u?.mail        ?? '—');
  setText('p-modo',  getState('demo') ? 'Demonstração' : 'Microsoft 365 OneDrive');
}

function _showLoginErr(msg) {
  const el = document.getElementById('login-err');
  if (!el) return;
  el.textContent = msg; el.style.display = 'block';
}

export function _updateBadges() {
  const alerts  = _countAlerts();
  const pending = (getState('tasks') ?? []).filter(t => !t.done).length;

  setText('sb-badge-alertas', alerts);
  setText('sb-badge-tarefas', pending);

  const hb = document.getElementById('header-badge-alerts');
  if (hb) {
    hb.textContent = alerts;
    hb.classList.toggle('hidden', alerts === 0);
  }

  /* Chips de alerta no topo */
  const chips = document.getElementById('alert-chips');
  if (chips) {
    const items = _getAlertChips();
    chips.innerHTML = items.map(a =>
      `<div class="alert-chip chip-${a.type}" role="status">${a.icon} ${esc(a.label)}</div>`
    ).join('');
    document.getElementById('alert-chips-bar').style.display = items.length ? '' : 'none';
  }
}

function _countAlerts() {
  const m = new Date().getMonth() + 1;
  return ALERT_RULES.filter(r => r.monthly ? new Date().getDate() <= (r.day ?? 5) + 5 : r.month && Math.abs(m - r.month) <= 1).length;
}

function _getAlertChips() {
  const atrasos  = (getState('tasks') ?? []).filter(t => !t.done && t.date && new Date(t.date) < new Date()).length;
  const pendente = (getState('atividades') ?? []).filter(a => !a.relatorio).length;
  const result   = [];
  if (atrasos  > 0) result.push({ type:'danger', icon:'⚠️', label: `${atrasos} empréstimo(s) em atraso` });
  if (pendente > 0) result.push({ type:'warn',   icon:'🕐', label: `${pendente} atividade(s) pendente(s)` });
  const m = new Date().getMonth() + 1;
  ALERT_RULES.filter(r => r.month && Math.abs(m - r.month) <= 1).slice(0,2).forEach(r =>
    result.push({ type:'info', icon:'ℹ️', label: r.title })
  );
  return result;
}

const ALERT_RULES = [
  { id:'bkp',     title:'Backup BiblioNet',           monthly:true, day:5,  type:'warn' },
  { id:'insp1',   title:'Inspeção semestral S1',       month:10,             type:'warn' },
  { id:'insp2',   title:'Inspeção semestral S2',       month:4,              type:'warn' },
  { id:'desbaste',title:'Desbaste anual',              month:3,              type:'info' },
  { id:'mabe',    title:'Autoavaliação MABE',          month:5,              type:'warn' },
  { id:'raa',     title:'RAA — prazo 30 junho',        month:6,              type:'danger'},
  { id:'paa',     title:'PAA-BE — prazo 30 setembro',  month:9,              type:'info' },
  { id:'qsat',    title:'Questionários de satisfação', month:5,              type:'info' },
  { id:'rgpd',    title:'Revisão anual RGPD',          month:9,              type:'info' },
];

export { ALERT_RULES, _updateBadges as updateBadges };

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
window.addEventListener('beforeunload', () => {
  import('./core/auth.js').then(m => m.stopTokenMonitor());
});

window.addEventListener('resize', () => {
  const hint = document.querySelector('.shortcut-hint');
  if (hint && window.innerWidth > 900) hint.style.left = 'calc(var(--sidebar-w) + 18px)';
});

/* Registar Service Worker */
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/public/sw.js').catch(() => {})
  );
}

/* Arrancar */
_buildAppShell();
boot();
