/*
 * Altus Skate Fest — JavaScript puro, sem dependências e sem build.
 * O conteúdo essencial e os links de inscrição funcionam mesmo sem JavaScript.
 */
(() => {
  'use strict';

  const EVENT_START = new Date('2026-11-07T18:00:00-03:00').getTime();
  const EVENT_END = new Date('2026-11-09T00:00:00-03:00').getTime();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Menu: fechamento por link, Escape e mudança para uma tela maior.
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  const desktopWidth = window.matchMedia('(min-width: 801px)');
  const setMenuOpen = (open, restoreFocus = false) => {
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (restoreFocus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => setMenuOpen(mobileNav.hidden));
  mobileNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenuOpen(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !mobileNav.hidden) setMenuOpen(false, true);
    if (event.key === 'Tab' && !mobileNav.hidden) {
      const links = [...mobileNav.querySelectorAll('a')];
      const lastLink = links[links.length - 1];
      if (event.shiftKey && document.activeElement === menuButton) {
        event.preventDefault();
        lastLink.focus();
      } else if (!event.shiftKey && document.activeElement === lastLink) {
        event.preventDefault();
        menuButton.focus();
      }
    }
  });
  desktopWidth.addEventListener('change', (event) => { if (event.matches) setMenuOpen(false); });

  // Programação: abas acessíveis. Sem JS, os dois dias ficam visíveis.
  const tabList = document.querySelector('.schedule-tabs');
  const tabs = [...document.querySelectorAll('.day-tab')];
  const setDay = (tab) => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.dataset.panel).hidden = !active;
    });
  };
  tabList.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    const panel = document.getElementById(tab.dataset.panel);
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    panel.setAttribute('role', 'tabpanel');
    panel.tabIndex = 0;
    tab.addEventListener('click', () => setDay(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(index + 1) % tabs.length];
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(index + tabs.length - 1) % tabs.length];
      if (event.key === 'Home') next = tabs[0];
      if (event.key === 'End') next = tabs[tabs.length - 1];
      if (next) { event.preventDefault(); setDay(next); next.focus(); }
    });
  });
  setDay(tabs[0]);
  document.documentElement.classList.add('tabs-ready');

  // Contagem baseada no horário de Brasília. Atualiza corretamente após o evento.
  const clock = document.querySelector('.countdown');
  const clockStatus = document.querySelector('#countdown-status');
  const units = {
    days: document.querySelector('#count-days'),
    hours: document.querySelector('#count-hours'),
    minutes: document.querySelector('#count-minutes'),
    seconds: document.querySelector('#count-seconds'),
  };
  const updateCountdown = () => {
    const now = Date.now();
    const remaining = Math.max(0, EVENT_START - now);
    if (remaining === 0) {
      clock.hidden = true;
      clockStatus.hidden = false;
      clockStatus.textContent = now < EVENT_END ? 'O festival começou. Confira a programação e venha pra pista!' : 'O rolê de 2026 ficou na história. Até a próxima edição!';
      document.querySelector('#countdown-title').textContent = now < EVENT_END ? 'É DIA DE ALTUS.' : 'VALEU POR ESSE ROLÊ.';
      return false;
    }
    const totalSeconds = Math.floor(remaining / 1000);
    const values = { days: Math.floor(totalSeconds / 86400), hours: Math.floor(totalSeconds / 3600) % 24, minutes: Math.floor(totalSeconds / 60) % 60, seconds: totalSeconds % 60 };
    Object.entries(values).forEach(([key, value]) => { units[key].textContent = String(value).padStart(2, '0'); });
    return true;
  };
  let timer;
  if (updateCountdown()) timer = window.setInterval(() => { if (!updateCountdown()) window.clearInterval(timer); }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateCountdown(); });

  // Faixa animada com controle explícito de pausa.
  const ticker = document.querySelector('.ticker');
  const tickerButton = document.querySelector('.ticker-toggle');
  tickerButton.addEventListener('click', () => {
    const paused = ticker.classList.toggle('is-paused');
    tickerButton.setAttribute('aria-pressed', String(paused));
    tickerButton.setAttribute('aria-label', paused ? 'Retomar faixa animada' : 'Pausar faixa animada');
    tickerButton.firstElementChild.textContent = paused ? '▶' : 'Ⅱ';
  });
  const syncMotionPreference = () => { tickerButton.hidden = reduceMotion.matches; };
  syncMotionPreference();
  reduceMotion.addEventListener('change', syncMotionPreference);

  // Aparição por rolagem: anima só uma vez e respeita movimento reduzido.
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 35px 0px' });
    document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
    document.documentElement.classList.add('reveals-ready');
    // Foco por teclado também revela o conteúdo imediatamente.
    document.addEventListener('focusin', (event) => {
      const section = event.target.closest('.reveal');
      if (section) section.classList.add('is-visible');
    });
    window.addEventListener('beforeprint', () => document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible')));
  }

  // Destaca a seção atual no menu sem alterar o histórico de navegação.
  if ('IntersectionObserver' in window) {
    const navLinks = [...document.querySelectorAll('.desktop-nav a')];
    const sectionObserver = new IntersectionObserver((entries) => {
      const visible = entries.find((entry) => entry.isIntersecting);
      if (!visible) return;
      navLinks.forEach((link) => {
        if (link.hash === '#' + visible.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
    navLinks.forEach((link) => { const section = document.querySelector(link.hash); if (section) sectionObserver.observe(section); });
  }

  // Painel de patrocinadores: diálogo nativo, Escape e zoom com rolagem.
  const dialog = document.querySelector('#sponsors-dialog');
  const openSponsors = document.querySelector('#open-sponsors');
  const closeSponsors = document.querySelector('#close-sponsors');
  const zoomSponsors = document.querySelector('#zoom-sponsors');
  const imageViewport = document.querySelector('.dialog-image-viewport');
  if (typeof dialog.showModal === 'function') {
    openSponsors.addEventListener('click', () => {
      imageViewport.classList.remove('zoomed');
      zoomSponsors.setAttribute('aria-pressed', 'false');
      zoomSponsors.textContent = 'Ampliar logos +';
      dialog.showModal();
    });
    closeSponsors.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      }
    });
    zoomSponsors.addEventListener('click', () => {
      const zoomed = imageViewport.classList.toggle('zoomed');
      zoomSponsors.setAttribute('aria-pressed', String(zoomed));
      zoomSponsors.textContent = zoomed ? 'Ajustar à tela −' : 'Ampliar logos +';
      imageViewport.scrollTo(0, 0);
    });
    dialog.addEventListener('close', () => openSponsors.focus());
  } else {
    openSponsors.addEventListener('click', () => window.open('assets/patrocinadores.png', '_blank', 'noopener,noreferrer'));
  }
})();
