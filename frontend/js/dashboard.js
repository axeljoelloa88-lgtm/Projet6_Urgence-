(function () {
  const TOKEN_KEY = 'urgenceplus_token'
  const getToken  = () => localStorage.getItem(TOKEN_KEY) || ''

  let currentInterventions = []
  let currentAppels        = []
  let currentVehicules     = []

  // ── API ──────────────────────────────────────────────────────
  async function api(path) {
    const res = await fetch(path, {
      headers: {
        'Authorization': 'Bearer ' + getToken(),
        'Content-Type':  'application/json'
      }
    })
    if (res.status === 401) {
      window.location.href = '/htlm/index.html'
      throw new Error('Non autorisé')
    }
    return res.json()
  }

  // ── Chargement ───────────────────────────────────────────────
  async function loadAll() {
    try {
      const [interventions, appels, vehicules] = await Promise.all([
        api('/api/interventions'),
        api('/api/appels'),
        api('/api/vehicules')
      ])
      currentInterventions = Array.isArray(interventions) ? interventions : []
      currentAppels        = Array.isArray(appels)        ? appels        : []
      currentVehicules     = Array.isArray(vehicules)     ? vehicules     : []
      render()
    } catch (e) { console.error(e) }
  }

  // ── Utilitaires ──────────────────────────────────────────────
  function fmt(t) {
    if (!t) return '—'
    return new Date(t).toLocaleString('fr-CA', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function calcDelaiSec(debut, creation) {
    if (!debut || !creation) return null
    const sec = Math.round((new Date(debut) - new Date(creation)) / 1000)
    return sec < 0 ? null : sec
  }

  function fmtDelai(sec) {
    if (sec === null) return '—'
    return `${Math.floor(sec / 60)}m ${sec % 60}s`
  }

  function statutColor(s) {
    return s === 'en_attente' ? '#f35f5f'
         : s === 'en_route'   ? '#3ba3ff'
         : s === 'sur_place'  ? '#ffbf56'
         : s === 'termine'    ? '#2ec48a' : '#8b94a6'
  }

  function typeColor(t) {
    return t === 'incendie' ? '#f35f5f'
         : t === 'medical'  ? '#2ec48a'
         : t === 'accident' ? '#ffbf56' : '#8ea3c1'
  }

  // ── Rendu principal ──────────────────────────────────────────
  function render() {
    renderKPI()
    renderTypeChart()
    renderWeekChart()
    renderVehiculeStats()
    renderTable()
    updateLastUpdate()
  }

  // ── KPI ──────────────────────────────────────────────────────
  function renderKPI() {
    const actives = currentInterventions.filter(iv => iv.statut !== 'termine')
    document.getElementById('kpiActives').textContent = actives.length

    const dispo = currentVehicules.filter(v => v.statut === 'disponible').length
    document.getElementById('kpiDispo').textContent = dispo
    document.getElementById('kpiDispoSub').textContent =
      `sur ${currentVehicules.length} véhicules`

    // Temps moyen affectation
    const delais = currentInterventions
      .map(iv => calcDelaiSec(iv.date_debut, iv.createdAt))
      .filter(d => d !== null)
    const moy = delais.length
      ? Math.round(delais.reduce((a,b) => a+b, 0) / delais.length)
      : null
    document.getElementById('kpiDelai').textContent = fmtDelai(moy)
    const delaiEl = document.getElementById('kpiDelaiTrend')
    if (moy !== null) {
      const ok = moy < 120
      delaiEl.textContent = ok ? '✓ Objectif atteint' : '⚠ Objectif dépassé'
      delaiEl.className   = 'kpi-trend ' + (ok ? 'trend-ok' : 'trend-up')
    }

    // Appels aujourd'hui
    const today = new Date().toISOString().slice(0,10)
    const appelsDuJour = currentAppels.filter(a =>
      String(a.createdAt).slice(0,10) === today
    )
    document.getElementById('kpiAppels').textContent = appelsDuJour.length
    document.getElementById('kpiAppelsSub').textContent =
      `${currentAppels.length} au total`
  }

  // ── Répartition par type ─────────────────────────────────────
  function renderTypeChart() {
    const types  = ['incendie','medical','accident','autre']
    const labels = ['Incendie','Médical','Accident','Autre']
    const counts = types.map(t =>
      currentAppels.filter(a => a.type_urgence === t).length
    )
    const total = counts.reduce((a,b) => a+b, 0) || 1

    const el = document.getElementById('typeChart')
    el.innerHTML = types.map((t, i) => `
      <div class="bar-row">
        <span class="bar-label">${labels[i]}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.round(counts[i]/total*100)}%;background:${typeColor(t)}"></div>
        </div>
        <span class="bar-val">${counts[i]}</span>
      </div>`).join('')
  }

  // ── Appels 7 derniers jours ──────────────────────────────────
  function renderWeekChart() {
    const days  = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push(d.toISOString().slice(0,10))
    }

    const counts = days.map(day =>
      currentAppels.filter(a => String(a.createdAt).slice(0,10) === day).length
    )
    const max = Math.max(...counts, 1)
    const labels = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

    const el = document.getElementById('weekChart')
    el.innerHTML = days.map((day, i) => {
      const pct   = Math.round(counts[i] / max * 100)
      const isToday = day === today.toISOString().slice(0,10)
      const color = isToday ? '#3ba3ff' : '#2ec48a'
      return `
        <div class="chart-col">
          <span class="chart-val">${counts[i] || ''}</span>
          <div class="chart-bar"
            style="height:${Math.max(pct,4)}%;background:${color};opacity:${isToday?1:.7}">
          </div>
          <span class="chart-day" style="color:${isToday?'#3ba3ff':'var(--muted)'}">
            ${labels[i]}
          </span>
        </div>`
    }).join('')
  }

  // ── Statut véhicules ─────────────────────────────────────────
  function renderVehiculeStats() {
    const el = document.getElementById('vehiculeStats')
    const ordered = [...currentVehicules].sort((a,b) => {
      const r = { disponible:0, en_mission:1, hors_service:2 }
      return (r[a.statut]||3) - (r[b.statut]||3)
    })

    el.innerHTML = ordered.map(v => {
      const color =
        v.statut === 'disponible'  ? '#2ec48a' :
        v.statut === 'en_mission'  ? '#3ba3ff' : '#8b94a6'
      const icon =
        v.type === 'ambulance'      ? '🚑' :
        v.type === 'camion_pompier' ? '🚒' : '🚓'

      // Mission liée
      const iv = currentInterventions.find(i =>
        i.vehicule_id === v.id && i.statut !== 'termine'
      )
      const appel = iv ? currentAppels.find(a => a.id === iv.appel_id) : null

      return `
        <div style="display:flex;align-items:center;gap:10px;
          padding:10px 0;border-bottom:1px solid rgba(255,255,255,.04);">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
            background:${color};flex-shrink:0"></span>
          <div style="flex:1;min-width:0">
            <div style="font-size:.85rem;font-weight:500">${icon} ${v.nom}</div>
            <div style="font-size:.75rem;color:#8ea3c1;margin-top:2px">
              ${appel
                ? `INT-${String(iv.id).padStart(4,'0')} · ${appel.type_urgence}`
                : v.statut === 'hors_service' ? 'Hors service' : 'Disponible'
              }
            </div>
          </div>
          <span style="background:${color}22;color:${color};
            padding:2px 9px;border-radius:999px;font-size:.72rem;font-weight:600">
            ${v.statut.replace(/_/g,' ')}
          </span>
        </div>`
    }).join('')
  }

  // ── Table interventions récentes ─────────────────────────────
  function renderTable() {
    const tbody = document.getElementById('interventionTable')
    const recent = [...currentInterventions]
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8)

    tbody.innerHTML = recent.map(iv => {
      const appel  = currentAppels.find(a => a.id === iv.appel_id)
      const sc     = statutColor(iv.statut)
      const tc     = typeColor(appel?.type_urgence)
      const delai  = calcDelaiSec(iv.date_debut, iv.createdAt)
      const delaiOk = delai !== null && delai < 120

      return `
        <tr style="cursor:pointer" onclick="window.location='/htlm/intervention.html?id=${iv.id}'">
          <td style="color:var(--accent);font-family:monospace">
            INT-${String(iv.id).padStart(4,'0')}
          </td>
          <td>
            <span class="pill" style="background:${tc}22;color:${tc}">
              ${appel ? appel.type_urgence : '—'}
            </span>
          </td>
          <td style="color:var(--muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${appel ? appel.adresse || '—' : '—'}
          </td>
          <td>
            <span class="pill" style="background:${sc}22;color:${sc}">
              ${iv.statut.replace(/_/g,' ')}
            </span>
          </td>
          <td style="color:${delaiOk ? '#2ec48a' : delai ? '#f35f5f' : '#8ea3c1'};font-weight:600">
            ${fmtDelai(delai)}
          </td>
        </tr>`
    }).join('')

    if (recent.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="5" style="text-align:center;color:var(--muted);
          padding:20px;font-style:italic">Aucune intervention</td></tr>`
    }
  }

  // ── Dernière mise à jour ─────────────────────────────────────
  function updateLastUpdate() {
    document.getElementById('lastUpdate').textContent =
      'Dernière mise à jour : ' +
      new Date().toLocaleTimeString('fr-CA', { hour:'2-digit', minute:'2-digit', second:'2-digit' })
  }

  // ── Socket.io ────────────────────────────────────────────────
  function initSocket() {
    try {
      const socket = io()
      socket.on('connect',              () => console.log('🔌 Dashboard connecté'))
      socket.on('nouvel_appel',         () => loadAll())
      socket.on('nouvelle_intervention',() => loadAll())
      socket.on('statut_intervention',  () => loadAll())
      socket.on('statut_vehicule',      () => loadAll())
      socket.on('intervention_assignee',() => loadAll())
    } catch (e) { console.warn('Socket non dispo', e) }
  }

  // ── Init ─────────────────────────────────────────────────────
  initSocket()
  loadAll()

  // Rafraîchissement toutes les 30 secondes
  setInterval(loadAll, 30000)

})()