(function () {
  const tokenKey = 'urgenceplus_token'
  const userKey  = 'urgenceplus_user'
  const token    = localStorage.getItem(tokenKey)
  const userRaw  = localStorage.getItem(userKey)
  const user     = userRaw ? JSON.parse(userRaw) : null

  if (!token) {
    window.location.href = '/htlm/index.html'
    return
  }

  const currentPage = window.location.pathname.split('/').pop()

  const svg = {
    shield:    `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>`,
    dispatch:  `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>`,
    dashboard: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
    reports:   `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    logout:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  }

  const menuItems = [
    { href: 'dispatch.html',  icon: svg.dispatch,  label: 'Dispatch'  },
    { href: 'dashboard.html', icon: svg.dashboard, label: 'Dashboard' },
    { href: 'rapports.html',  icon: svg.reports,   label: 'Rapports'  },
  ]

  const sidebar = document.createElement('aside')
  sidebar.id = 'sidebar'
  sidebar.innerHTML = `
    <div class="sb-logo">
      <div class="sb-logo-icon">${svg.shield}</div>
      <div>
        <span class="sb-name">Urgence+</span>
        <span class="sb-sub">Superviseur</span>
      </div>
    </div>
    <nav class="sb-nav">
      ${menuItems.map(item => `
        <a href="/htlm/${item.href}" class="sb-link ${currentPage === item.href ? 'active' : ''}">
          <span class="sb-icon">${item.icon}</span>
          <span>${item.label}</span>
        </a>
      `).join('')}
    </nav>
    <div class="sb-footer">
      <div class="sb-user">
        <div class="sb-avatar">${user ? user.nom.charAt(0).toUpperCase() : 'S'}</div>
        <div class="sb-user-info">
          <span class="sb-user-name">${user ? user.nom : 'Superviseur'}</span>
          <span class="sb-user-role">${user ? user.role : ''}</span>
        </div>
      </div>
      <button id="logoutBtn" class="sb-logout" title="Déconnexion">${svg.logout}</button>
    </div>
  `

  const style = document.createElement('style')
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    body {
      display: flex;
      min-height: 100vh;
      margin: 0;
      font-family: Inter, system-ui, -apple-system, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    #sidebar {
      width: 220px;
      min-height: 100vh;
      background: #06101e;
      border-right: 1px solid rgba(255,255,255,.06);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0;
      z-index: 200;
      animation: sb-in .35s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes sb-in {
      from { transform: translateX(-100%); opacity: 0; }
      to   { transform: translateX(0);     opacity: 1; }
    }

    .sb-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px 18px;
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .sb-logo-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #ef4444, #b91c1c);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      color: #fff; flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(239,68,68,.35);
    }
    .sb-name {
      display: block;
      font-size: .9rem; font-weight: 700;
      color: #f1f5f9; letter-spacing: -.01em;
    }
    .sb-sub {
      display: block;
      font-size: .65rem; color: #475569;
      letter-spacing: .1em; text-transform: uppercase;
      margin-top: 1px;
    }

    .sb-nav {
      flex: 1;
      padding: 12px 8px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .sb-link {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      text-decoration: none;
      color: #475569;
      font-size: .85rem; font-weight: 500;
      transition: all .18s ease;
      position: relative;
    }
    .sb-link:hover { background: rgba(255,255,255,.04); color: #94a3b8; }
    .sb-link.active { background: rgba(59,130,246,.1); color: #60a5fa; }
    .sb-link.active::before {
      content: '';
      position: absolute; left: 0; top: 50%;
      transform: translateY(-50%);
      width: 3px; height: 16px;
      border-radius: 0 2px 2px 0;
      background: #3b82f6;
    }
    .sb-icon {
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }

    .sb-footer {
      padding: 12px 10px;
      border-top: 1px solid rgba(255,255,255,.06);
      display: flex; align-items: center; gap: 8px;
    }
    .sb-user { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .sb-avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(59,130,246,.12);
      border: 1px solid rgba(59,130,246,.2);
      display: flex; align-items: center; justify-content: center;
      font-size: .8rem; font-weight: 700; color: #60a5fa; flex-shrink: 0;
    }
    .sb-user-info { min-width: 0; }
    .sb-user-name {
      display: block; font-size: .8rem; font-weight: 500;
      color: #cbd5e1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sb-user-role {
      display: block; font-size: .65rem; color: #334155; text-transform: capitalize;
    }
    .sb-logout {
      background: transparent;
      border: 1px solid rgba(255,255,255,.07);
      color: #334155;
      width: 30px; height: 30px; border-radius: 8px;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: all .18s;
    }
    .sb-logout:hover {
      border-color: rgba(239,68,68,.4);
      color: #ef4444;
      background: rgba(239,68,68,.07);
    }

    .page-content {
      margin-left: 220px;
      flex: 1;
      min-height: 100vh;
    }
  `

  document.head.appendChild(style)
  document.body.insertBefore(sidebar, document.body.firstChild)

  const content = document.createElement('div')
  content.className = 'page-content'
  while (document.body.children.length > 1) {
    content.appendChild(document.body.children[1])
  }
  document.body.appendChild(content)

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
    localStorage.removeItem('urgenceplus_role')
    window.location.href = '/htlm/index.html'
  })
})()
