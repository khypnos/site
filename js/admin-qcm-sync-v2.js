/* Module Synchronisation QCM : appelle la WebApp Google Apps Script et affiche un journal. */
(function () {
  'use strict';
  var WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbzdvo_5cbQhM4s4IjvhoowDMpzi1-FLB4s9S2cG6EbMiCTHHtitzdckCyJ0SllzOc_rig/exec';
  var TIMEOUT_MS = 6 * 60 * 1000; // Apps Script s'arrête à 6 min
  var KEY_SECRET = 'khypnos-qcm-sync-secret';
  var KEY_LOG = 'khypnos-qcm-sync-log';
  var MAX_LINES = 300;

  var btn, secretInput, logEl, consoleEl, stateEl, lastEl, elapsedEl;
  var lines = [];
  var running = false;
  var timer = null;

  function $(id) { return document.getElementById(id); }
  function hhmmss(d) { return d.toLocaleTimeString('fr-FR', { hour12: false }); }

  function setTone(tone, label) {
    consoleEl.dataset.tone = tone;
    stateEl.textContent = label;
  }

  function render(entry, persist) {
    var empty = logEl.querySelector('.qcm-empty');
    if (empty) empty.remove();
    var li = document.createElement('li');
    li.dataset.level = entry.level;
    var t = document.createElement('time');
    t.textContent = entry.time;
    var s = document.createElement('span');
    s.textContent = entry.msg;
    li.appendChild(t); li.appendChild(s);
    logEl.appendChild(li);
    logEl.scrollTop = logEl.scrollHeight;
    if (persist) {
      lines.push(entry);
      if (lines.length > MAX_LINES) { lines.shift(); if (logEl.firstChild) logEl.removeChild(logEl.firstChild); }
      try { localStorage.setItem(KEY_LOG, JSON.stringify(lines)); } catch (e) {}
    }
  }

  function log(level, msg) { render({ level: level, msg: msg, time: hhmmss(new Date()) }, true); }

  function levelOf(msg) {
    if (/^\s*(✅|🎉)/.test(msg)) return 'ok';
    if (/^\s*(⚠️|ℹ️)/.test(msg)) return 'warn';
    if (/^\s*(❌)/.test(msg)) return 'error';
    return 'info';
  }

  function showEmpty() {
    var li = document.createElement('li');
    li.className = 'qcm-empty';
    li.textContent = 'Aucune synchronisation lancée. Le journal s\'affichera ici.';
    logEl.appendChild(li);
  }

  function restore() {
    try { lines = JSON.parse(localStorage.getItem(KEY_LOG) || '[]'); } catch (e) { lines = []; }
    if (!lines.length) { showEmpty(); return; }
    lines.forEach(function (l) { render(l, false); });
    var last = lines[lines.length - 1];
    lastEl.textContent = 'Journal conservé · dernière ligne à ' + last.time;
  }

  function startClock() {
    var t0 = Date.now();
    elapsedEl.textContent = '0 s';
    timer = setInterval(function () {
      elapsedEl.textContent = Math.round((Date.now() - t0) / 1000) + ' s';
    }, 1000);
  }
  function stopClock() { clearInterval(timer); timer = null; }

  async function synchroniser() {
    if (running) return;
    var secret = secretInput.value.trim();
    if (!secret) {
      setTone('warning', 'Clé requise');
      log('warn', '⚠️ Saisis la clé de la WebApp avant de lancer la synchronisation.');
      secretInput.focus();
      return;
    }
    if (!window.confirm('Lancer la synchronisation ?\n\nLes onglets actifs de _Mapping_Config seront entièrement réécrits dans QCM_inAPP.')) {
      log('sys', 'Synchronisation annulée avant l\'envoi.');
      return;
    }
    try { sessionStorage.setItem(KEY_SECRET, secret); } catch (e) {}

    running = true;
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Synchronisation en cours…';
    consoleEl.setAttribute('aria-busy', 'true');
    setTone('working', 'En cours');
    log('sys', '── Nouvelle synchronisation ──');
    log('info', '🚀 Requête envoyée à la WebApp Google Apps Script…');
    startClock();

    var ctrl = new AbortController();
    var to = setTimeout(function () { ctrl.abort(); }, TIMEOUT_MS);
    var t0 = Date.now();

    try {
      var response = await fetch(WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // évite le pré-vol CORS
        body: JSON.stringify({ secret: secret }),
        signal: ctrl.signal
      });
      log('sys', 'Réponse HTTP ' + response.status + ' reçue après ' + Math.round((Date.now() - t0) / 1000) + ' s.');
      var raw = await response.text();
      var data;
      try { data = JSON.parse(raw); }
      catch (e) {
        log('error', '❌ Réponse non JSON (accès WebApp ou déploiement à vérifier) :\n' + raw.slice(0, 300).replace(/\s+/g, ' '));
        setTone('error', 'Échec');
        return;
      }

      var serverLogs = (data.details && data.details.logs) || [];
      serverLogs.forEach(function (m) { log(levelOf(String(m)), String(m)); });

      if (data.success) {
        var n = data.details && data.details.updatedSheets;
        log('ok', '✅ Synchronisation réussie : ' + n + ' onglet(s) réécrit(s) dans QCM_inAPP.');
        setTone('success', 'Terminée');
      } else {
        log('error', '❌ Erreur : ' + (data.error || 'inconnue'));
        if (/autoris/i.test(String(data.error))) log('warn', 'La clé saisie ne correspond pas à WEBAPP_SECRET.');
        setTone('error', 'Échec');
      }
    } catch (err) {
      console.error(err);
      if (err && err.name === 'AbortError') {
        log('error', '❌ Délai dépassé (6 min). La synchro a peut-être abouti : vérifie QCM_inAPP.');
      } else if (!navigator.onLine) {
        log('error', '❌ Le navigateur est hors ligne (connexion coupée, mode hors ligne ou VPN). La requête n\'a pas été envoyée.');
      } else {
        log('error', '❌ Requête bloquée avant d\'atteindre la WebApp : ' + (err && err.message ? err.message : err));
        log('warn', 'Pistes : déploiement « Tout le monde » de la WebApp, CSP du site (connect-src), bloqueur de contenu, URL /exec correcte.');
      }
      setTone('error', 'Échec');
    } finally {
      clearTimeout(to);
      stopClock();
      lastEl.textContent = 'Dernière exécution : ' + new Date().toLocaleString('fr-FR') + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)';
      running = false;
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = 'Synchroniser QCM_inAPP';
      consoleEl.setAttribute('aria-busy', 'false');
    }
  }

  function copyLog() {
    var text = lines.map(function (l) { return '[' + l.time + '] ' + l.msg; }).join('\n');
    if (!text) return;
    var done = function () { log('sys', 'Journal copié dans le presse-papiers.'); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
  }

  function clearLog() {
    if (running) return;
    lines = [];
    try { localStorage.removeItem(KEY_LOG); } catch (e) {}
    logEl.textContent = '';
    showEmpty();
    setTone('idle', 'En attente');
    lastEl.textContent = '';
  }

  document.addEventListener('DOMContentLoaded', function () {
    btn = $('sync-btn');
    if (!btn) return;
    secretInput = $('qcm-secret');
    logEl = $('qcm-log');
    consoleEl = $('qcm-console');
    stateEl = $('qcm-state');
    lastEl = $('qcm-last');
    elapsedEl = $('qcm-elapsed');
    try { secretInput.value = sessionStorage.getItem(KEY_SECRET) || ''; } catch (e) {}
    restore();
    btn.addEventListener('click', synchroniser);
    $('qcm-copy').addEventListener('click', copyLog);
    $('qcm-clear').addEventListener('click', clearLog);
  });
})();
