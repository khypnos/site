/* Module Synchronisation Diapos de correction QCM : déclenche le workflow GitHub Actions via Edge Function. */
import { supabase } from '/espace-client/auth.js?v=private-ca2dcf52bea4152e';

(function () {
  'use strict';

  var FUNCTION_URL = 'https://fbxiynomlxrjasbbcipp.supabase.co/functions/v1/sync-qcm-slides-v2';
  var ACTIONS_URL = 'https://github.com/khypnos/publi_khypnos/actions';
  var TIMEOUT_MS = 25000;
  var KEY_LOG = 'khypnos-slides-sync-log';
  var MAX_LINES = 300;

  var btn, logEl, consoleEl, stateEl, lastEl, elapsedEl;
  var lines = [];
  var running = false;
  var timer = null;
  var initialized = false;

  function $(id) { return document.getElementById(id); }
  function hhmmss(d) { return d.toLocaleTimeString('fr-FR', { hour12: false }); }

  function setTone(tone, label) {
    if (consoleEl) consoleEl.dataset.tone = tone;
    if (stateEl) stateEl.textContent = label;
  }

  function render(entry, persist) {
    if (!logEl) return;
    var empty = logEl.querySelector('.qcm-empty');
    if (empty) empty.remove();

    var li = document.createElement('li');
    li.dataset.level = entry.level;

    var t = document.createElement('time');
    t.textContent = entry.time;

    var s = document.createElement('span');
    s.textContent = entry.msg;

    li.appendChild(t);
    li.appendChild(s);
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;

    if (persist) {
      lines.push(entry);
      if (lines.length > MAX_LINES) {
        lines.shift();
        if (logEl.firstChild) logEl.removeChild(logEl.firstChild);
      }
      try { localStorage.setItem(KEY_LOG, JSON.stringify(lines)); } catch (e) {}
    }
  }

  function log(level, msg) {
    render({ level: level, msg: msg, time: hhmmss(new Date()) }, true);
  }

  function showEmpty() {
    if (!logEl) return;
    var li = document.createElement('li');
    li.className = 'qcm-empty';
    li.textContent = 'Aucune synchronisation lancée. Le journal s\'affichera ici.';
    logEl.appendChild(li);
  }

  function restore() {
    if (!logEl) return;
    try { lines = JSON.parse(localStorage.getItem(KEY_LOG) || '[]'); } catch (e) { lines = []; }
    if (!lines.length) { showEmpty(); return; }
    lines.forEach(function (l) { render(l, false); });
    var last = lines[lines.length - 1];
    if (lastEl && last) {
      lastEl.textContent = 'Journal conservé · dernière ligne à ' + last.time;
    }
  }

  function startClock() {
    if (!elapsedEl) return;
    var t0 = Date.now();
    elapsedEl.textContent = '0 s';
    timer = setInterval(function () {
      elapsedEl.textContent = Math.round((Date.now() - t0) / 1000) + ' s';
    }, 1000);
  }

  function stopClock() {
    clearInterval(timer);
    timer = null;
  }

  async function synchroniserSlides() {
    if (running) return;

    if (!window.confirm(
      'Déclencher la synchronisation des diapos de correction QCM (Google Drive → Supabase) sur la branche pipeline/correction_slides ?'
    )) {
      log('info', 'ℹ️ Synchronisation des diapos annulée avant l\'envoi.');
      return;
    }

    running = true;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Déclenchement en cours…';
    if (consoleEl) consoleEl.setAttribute('aria-busy', 'true');
    setTone('working', 'En cours');
    log('info', '🚀 Vérification de la session et envoi de la demande…');
    startClock();

    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
    var t0 = Date.now();

    try {
      var sessionRes = await supabase.auth.getSession();
      var token = sessionRes && sessionRes.data && sessionRes.data.session
        ? sessionRes.data.session.access_token
        : null;

      if (!token) {
        throw new Error('SESSION_ADMIN_ABSENTE');
      }

      var response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({}),
        signal: ctrl.signal
      });

      var raw = await response.text();
      var data;
      try { data = JSON.parse(raw); } catch (e) { data = {}; }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || ('HTTP_' + response.status));
      }

      log('ok', '✅ Workflow "' + (data.workflow || 'sync-qcm-slides.yml') + '" déclenché sur la branche "' + (data.ref || 'pipeline/correction_slides') + '".');
      log('info', 'ℹ️ La conversion WebP et l\'envoi vers Supabase s\'exécutent dans GitHub Actions (' + (data.actions_url || ACTIONS_URL) + ').');
      setTone('success', 'Lancé');
    } catch (err) {
      console.error(err);
      if (err && err.name === 'AbortError') {
        log('error', '❌ Délai dépassé lors du déclenchement. Vérifie l\'onglet GitHub Actions.');
      } else {
        log('error', '❌ Échec du déclenchement : ' + (err && err.message ? err.message : err));
      }
      setTone('error', 'Échec');
    } finally {
      clearTimeout(to);
      stopClock();
      var sec = Math.round((Date.now() - t0) / 1000);
      if (lastEl) {
        lastEl.textContent = 'Dernière exécution : ' + new Date().toLocaleString('fr-FR') + ' (' + sec + ' s)';
      }
      running = false;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = 'Synchroniser les diapos';
      if (consoleEl) consoleEl.setAttribute('aria-busy', 'false');
    }
  }

  function copyLog() {
    var text = lines.map(function (l) { return '[' + l.time + '] ' + l.msg; }).join('\n');
    if (!text) return;
    var done = function () { log('info', 'ℹ️ Journal copié dans le presse-papiers.'); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
  }

  function clearLog() {
    if (running) return;
    lines = [];
    try { localStorage.removeItem(KEY_LOG); } catch (e) {}
    if (logEl) logEl.textContent = '';
    showEmpty();
    setTone('idle', 'En attente');
    if (lastEl) lastEl.textContent = '';
    if (elapsedEl) elapsedEl.textContent = '–';
  }

  function init() {
    if (initialized) return;
    btn = $('slides-sync-btn');
    if (!btn) return;
    initialized = true;

    logEl = $('slides-log');
    consoleEl = $('slides-console');
    stateEl = $('slides-state');
    lastEl = $('slides-last');
    elapsedEl = $('slides-elapsed');

    restore();
    btn.addEventListener('click', synchroniserSlides);
    var copyBtn = $('slides-copy');
    var clearBtn = $('slides-clear');
    if (copyBtn) copyBtn.addEventListener('click', copyLog);
    if (clearBtn) clearBtn.addEventListener('click', clearLog);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();