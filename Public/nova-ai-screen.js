import {renderMarkdown} from './nova-ai-markdown.js';

export function screenAssistant({send, onChange, getMessages, getBusy}) {
  let stream, panel, video, reply, input, submit, status, hostDoc, floatingWindow, starting = false;
  const origin = location.origin;
  function stop() {
    const old = stream; stream = null;
    old?.getTracks().forEach(track => track.stop());
    panel?.remove(); panel = null; video = null;
    const floating = floatingWindow; floatingWindow = null; floating?.close();
    onChange(false);
  }
  async function start() {
    if (stream) { panel.classList.remove('minimized'); return; }
    if (starting) return;
    if (!navigator.mediaDevices?.getDisplayMedia) throw Error('Screen sharing needs a supported desktop browser on HTTPS or localhost.');
    starting = true;
    let captured;
    try {
      // The browser picker is always opened by an explicit button click.
      captured = await navigator.mediaDevices.getDisplayMedia({video: {frameRate: {ideal: 5, max: 10}}, audio: false});
      stream = captured;
      stream.getVideoTracks()[0].addEventListener('ended', stop, {once: true});
      hostDoc = document;
      try { if (parent !== window && parent.location.origin === origin) hostDoc = parent.document; } catch {}
      if (!hostDoc.getElementById('nova-screen-style')) {
        const style = hostDoc.createElement('link'); style.id = 'nova-screen-style'; style.rel = 'stylesheet'; style.href = new URL('nova-ai-screen.css', location.href).href; hostDoc.head.append(style);
      }
      const make = (tag, text, cls) => { const n = hostDoc.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
      panel = make('section', null, 'nova-screen-assistant'); panel.setAttribute('aria-label', 'Nova AI screen assistant');
      const bar = make('div', null, 'screen-assistant-bar'), logo = make('img'); logo.src = new URL('Img/app/chatgpt-flaticon.png', location.href).href; logo.alt = '';
      const title = make('strong', 'Nova AI'), badge = make('span', 'Screen on', 'screen-live-badge');
      const minimize = make('button', '−'); minimize.type = 'button'; minimize.setAttribute('aria-label', 'Minimize screen assistant'); minimize.onclick = () => panel.classList.toggle('minimized');
      const close = make('button', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Stop sharing screen'); close.onclick = stop;
      bar.append(logo, title, badge, minimize, close);
      const body = make('div', null, 'screen-assistant-body');
      video = make('video'); video.autoplay = true; video.muted = true; video.playsInline = true; video.srcObject = stream; video.setAttribute('aria-label', 'Your shared screen preview');
      const preview = make('div', null, 'screen-preview'); preview.append(video);
      const notice = make('p', 'A fresh snapshot is sent with each question. No microphone audio is shared.', 'screen-sharing-notice');
      reply = make('div', null, 'screen-assistant-reply'); reply.setAttribute('aria-live', 'polite');
      const form = make('form', null, 'screen-assistant-form'); input = make('textarea'); input.rows = 2; input.maxLength = 6000; input.placeholder = 'Ask about your screen…'; input.setAttribute('aria-label', 'Ask about your shared screen');
      submit = make('button', 'Send'); submit.type = 'submit'; status = make('p', '', 'screen-assistant-status'); status.setAttribute('role', 'status');
      form.append(input, submit); form.onsubmit = async e => {
        e.preventDefault(); if (getBusy()) return;
        const text = input.value.trim(); if (!text) return;
        status.textContent = ''; input.disabled = true; submit.disabled = true;
        try { await send(text); input.value = ''; } catch (e) { status.textContent = e.message; }
        finally { input.disabled = false; submit.disabled = false; update(); }
      };
      input.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit(); } };
      const footer = make('div', null, 'screen-assistant-footer'), full = make('button', 'Open full chat'), end = make('button', 'Stop sharing'); full.type = end.type = 'button'; end.onclick = stop;
      full.onclick = () => { if (hostDoc !== document) hostDoc.querySelector('nav [data-page="ai"]')?.click(); else panel.classList.add('minimized'); };
      const popout = make('button', 'Float over websites'); popout.type = 'button'; popout.onclick = floatPanel;
      footer.append(popout, full, end); body.append(preview, notice, reply, form, status, footer); panel.append(bar, body); hostDoc.body.append(panel);
      await video.play();
      onChange(true); update();
      if (hostDoc !== document) parent.postMessage({novaAction: 'closeAI'}, origin);
      bar.onpointerdown = e => {
        if (floatingWindow || e.target.closest('button')) return;
        const bounds = panel.getBoundingClientRect(), x = e.clientX, y = e.clientY; bar.setPointerCapture(e.pointerId);
        const win = hostDoc.defaultView;
        bar.onpointermove = move => {
          panel.style.left = Math.max(0, Math.min(win.innerWidth - bounds.width, bounds.left + move.clientX - x)) + 'px';
          panel.style.top = Math.max(0, Math.min(win.innerHeight - 44, bounds.top + move.clientY - y)) + 'px';
          panel.style.right = panel.style.bottom = 'auto';
        };
        bar.onpointerup = bar.onpointercancel = () => { bar.onpointermove = null; };
      };
    } catch (e) {
      captured?.getTracks().forEach(t => t.stop()); stop();
      if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') throw e;
    } finally { starting = false; }
  }
  async function floatPanel() {
    if (!panel) return;
    if (floatingWindow) { floatingWindow.focus(); return; }
    const hostWindow = hostDoc.defaultView;
    if (!hostWindow.documentPictureInPicture?.requestWindow) {
      status.textContent = 'Floating chat needs a browser with Document Picture-in-Picture support. Try Chrome or Edge.';
      return;
    }
    try {
      const floating = await hostWindow.documentPictureInPicture.requestWindow({width: 390, height: 620});
      if (!panel || !stream) { floating.close(); return; }
      floatingWindow = floating;
      const style = floating.document.createElement('link'); style.rel = 'stylesheet'; style.href = new URL('nova-ai-screen.css', location.href).href; floating.document.head.append(style);
      floating.document.documentElement.classList.add('nova-screen-popout');
      floating.document.title = 'Nova AI · Screen assistant';
      panel.classList.remove('minimized'); panel.style.left = panel.style.top = panel.style.right = panel.style.bottom = '';
      floating.document.body.append(panel);
      floating.addEventListener('pagehide', () => {
        if (floatingWindow !== floating) return;
        floatingWindow = null;
        if (panel && stream) { hostDoc.body.append(panel); video.play().catch(() => {}); }
      }, {once: true});
      video.play().catch(() => {});
      status.textContent = 'Keep Nova open in its tab. Share your entire screen to follow you between websites.';
    } catch (e) { status.textContent = 'Could not open floating chat: ' + e.message; }
  }
  async function capture() {
    if (!stream || stream.getVideoTracks()[0]?.readyState !== 'live') throw Error('Screen sharing has stopped. Share your screen again.');
    if (video.readyState < 2 || !video.videoWidth) throw Error('Your screen is still starting. Try again in a moment.');
    const canvas = document.createElement('canvas'), scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    for (const quality of [.8, .65, .5, .35]) { const image = canvas.toDataURL('image/jpeg', quality); if (image.length <= 900000) return image; }
    throw Error('The screen snapshot is too large. Try sharing a smaller window.');
  }
  function update() {
    if (!panel) return;
    const last = [...getMessages()].reverse().find(m => m.role === 'assistant');
    if (getBusy()) { reply.textContent = 'Nova is looking at your snapshot…'; reply.classList.add('screen-is-thinking'); }
    else { reply.classList.remove('screen-is-thinking'); if (last) renderMarkdown(reply, last.text); else reply.textContent = 'Share a question and I’ll take a look.'; }
    submit.disabled = getBusy(); input.disabled = getBusy();
  }
  window.addEventListener('pagehide', stop);
  return {start, stop, capture, update, get active() { return !!stream; }};
}
