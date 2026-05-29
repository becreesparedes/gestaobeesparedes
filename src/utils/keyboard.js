/**
 * keyboard.js — Atalhos de teclado globais
 */
import { closeAllModals } from './modal.js';
import { goView }         from '../main.js';

export function installKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    /* Esc — fecha qualquer modal aberto */
    if (e.key === 'Escape') {
      closeAllModals();
      return;
    }
    /* Ctrl+K — pesquisa global */
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      goView('pesquisa');
      setTimeout(() => document.getElementById('search-global-q')?.focus(), 80);
      return;
    }
    /* Alt+D — dashboard */
    if (e.altKey && e.key === 'd') {
      e.preventDefault();
      goView('dashboard');
      return;
    }
    /* Alt+T — tarefas */
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      goView('tarefas');
      return;
    }
    /* Alt+F — ficheiros */
    if (e.altKey && e.key === 'f') {
      e.preventDefault();
      goView('ficheiros');
      return;
    }
  });
}
