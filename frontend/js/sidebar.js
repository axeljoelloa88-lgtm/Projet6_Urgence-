(function () {
  const tokenKey  = 'urgenceplus_token'
  const userKey   = 'urgenceplus_user'
  const token     = localStorage.getItem(tokenKey)
  const userRaw   = localStorage.getItem(userKey)
  const user      = userRaw ? JSON.parse(userRaw) : null

  // Rediriger si pas connecté
  if (!token) {
    window.location.href = '/htlm/index.html'
    return
  }

  // Page active
  const currentPage = window.location.pathname.split('/').pop()

  const menuItems = [
    { href: 'dispatch.html',   icon: '🗺️',  label: 'Dispatch'   },
    { href: 'dashboard.html',  icon: '📊',  label: 'Dashboard'  },
    { href: 'rapports.html',   icon: '📄',  label: 'Rapports'   },
  ]

  const sidebar = document.createElement('aside')
  sidebar.id = 'sidebar'
  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-icon">🚨</div>
      <div class="sidebar-logo-text">
        <span class="sidebar-app-name">Urgence+</span>
        <span class="sidebar-app-sub">Superviseur</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      ${menuItems.map(item => `
        <a href="/htlm/${item.href}"
          class="sidebar-link ${currentPage === item.href ? 'active' : ''}">
          <span class="sidebar-icon">${item.icon}</span>
          <span class="sidebar-label">${item.label}</span>
        </a>
      `).join('')}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">${user ? user.nom.charAt(0).toUpperCase() : 'S'}</div>
        <div class="sidebar-user-info">
          <span class="sidebar-user-name">${user ? user.nom : 'Superviseur'}</span>
          <span class="sidebar-user-role">${user ? user.role : ''}</span>
        </div>
      </div>
      <button id="logoutBtn" class="sidebar-logout" title="Déconnexion">⏻</button>
    </div>
  `

  // Styles
  const style = document.createElement('style')
  style.textContent = `
    body {
      display: flex;
      min-height: 100vh;
      margin: 0;
    }
    #sidebar {
      width: 220px;
      min-height: 100vh;
      background: #0d1624;
      border-right: 1px solid #13213f;
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0; left: 0;
      z-index: 200;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 20px 16px;
      border-bottom: 1px solid #13213f;
    }
    .sidebar-logo-icon {
      width: 36px; height: 36px;
      background: #f35f5f;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .sidebar-app-name {
      display: block;
      font-size: .95rem;
      font-weight: 700;
      color: #e8eeff;
    }
    .sidebar-app-sub {
      display: block;
      font-size: .7rem;
      color: #8ea3c1;
      letter-spacing: .06em;
      text-transform: uppercase;
    }
    .sidebar-nav {
      flex: 1;
      padding: 16px 10px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      text-decoration: none;
      color: #8ea3c1;
      font-size: .88rem;
      transition: all .15s;
    }
    .sidebar-link:hover {
      background: #111b2b;
      color: #e8eeff;
    }
    .sidebar-link.active {
      background: #0d2040;
      color: #3ba3ff;
      font-weight: 600;
    }
    .sidebar-icon { font-size: 16px; flex-shrink: 0; }
    .sidebar-footer {
      padding: 14px 12px;
      border-top: 1px solid #13213f;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .sidebar-user { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
    .sidebar-avatar {
      width: 32px; height: 32px;
      background: #1f3a5f;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .85rem; font-weight: 700;
      color: #3ba3ff; flex-shrink: 0;
    }
    .sidebar-user-name {
      display: block;
      font-size: .82rem;
      color: #e8eeff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-user-role {
      display: block;
      font-size: .7rem;
      color: #8ea3c1;
      text-transform: capitalize;
    }
    .sidebar-logout {
      background: transparent;
      border: 1px solid #13213f;
      color: #8ea3c1;
      width: 32px; height: 32px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      flex-shrink: 0;
      transition: all .15s;
    }
    .sidebar-logout:hover {
      border-color: #f35f5f;
      color: #f35f5f;
    }
    .page-content {
      margin-left: 220px;
      flex: 1;
      min-height: 100vh;
    }
  `

  document.head.appendChild(style)
  document.body.insertBefore(sidebar, document.body.firstChild)

  // Envelopper le contenu existant dans .page-content
  const content = document.createElement('div')
  content.className = 'page-content'
  while (document.body.children.length > 1) {
    content.appendChild(document.body.children[1])
  }
  document.body.appendChild(content)

  // Déconnexion
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem(tokenKey)
    localStorage.removeItem(userKey)
    localStorage.removeItem('urgenceplus_role')
    window.location.href = '/htlm/index.html'
  })

})()