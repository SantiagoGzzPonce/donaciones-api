'use strict';
// El contenido dinámico se inserta con textContent para evitar XSS.
(function () {
  const $ = (id) => document.getElementById(id);
  let token = sessionStorage.getItem('token');
  let me = null;

  const show = (msg, isError) => { $('message').textContent = msg; $('message').style.color = isError ? '#b3261e' : '#1f8a4c'; };

  async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = 'Bearer ' + token;
    const res = await fetch(path, { ...options, headers });
    if (res.status === 204) return {};
    const body = await res.json();
    if (!res.ok) throw new Error((body.details || [body.error]).join('. '));
    return body;
  }

  const formData = (form) => {
    const data = {};
    new FormData(form).forEach((v, k) => { if (String(v).trim() !== '') data[k] = String(v); });
    return data;
  };

  function setSession(t, user) {
    token = t; me = user;
    if (t) sessionStorage.setItem('token', t); else sessionStorage.removeItem('token');
    $('auth-section').hidden = !!t;
    $('donor-section').hidden = !t;
    $('session').hidden = !t;
    $('whoami').textContent = user ? user.name + ' (' + user.role + ')' : '';
    if (t) loadDonors();
  }

  async function loadDonors() {
    const q = $('search').value.trim();
    const { donors } = await api('/api/donors' + (q ? '?q=' + encodeURIComponent(q) : ''));
    const tbody = $('donor-rows');
    tbody.replaceChildren();
    donors.forEach((d) => {
      const tr = document.createElement('tr');
      [d.name, d.email, d.type, d.phone || '—'].forEach((val) => {
        const td = document.createElement('td'); td.textContent = val; tr.appendChild(td);
      });
      const td = document.createElement('td');
      if (me && me.role === 'admin') {
        const btn = document.createElement('button');
        btn.className = 'danger'; btn.type = 'button'; btn.textContent = 'Eliminar';
        btn.addEventListener('click', async () => {
          try { await api('/api/donors/' + d.id, { method: 'DELETE' }); show('Donante eliminado'); loadDonors(); }
          catch (e) { show(e.message, true); }
        });
        td.appendChild(btn);
      }
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }

  $('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify(formData(e.target)) }); setSession(r.token, r.user); show('Bienvenido/a'); }
    catch (err) { show(err.message, true); }
  });

  $('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(formData(e.target)) }); setSession(r.token, r.user); show('Cuenta creada'); }
    catch (err) { show(err.message, true); }
  });

  $('donor-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try { await api('/api/donors', { method: 'POST', body: JSON.stringify(formData(e.target)) }); e.target.reset(); show('Donante registrado'); loadDonors(); }
    catch (err) { show(err.message, true); }
  });

  $('search').addEventListener('input', () => loadDonors().catch((err) => show(err.message, true)));
  $('logout').addEventListener('click', () => { setSession(null, null); show('Sesión cerrada'); });

  if (token) api('/api/auth/me').then((r) => setSession(token, r.user)).catch(() => setSession(null, null));
})();
