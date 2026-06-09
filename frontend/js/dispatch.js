(function(){
  const API = ''
  const tokenKey = 'urgenceplus_token'
  const incidentList = document.getElementById('incidentList')
  const vehicleList = document.getElementById('vehicleList')
  const interventionsActiveEl = document.getElementById('interventionsActive')
  const vehiclesEnRouteEl = document.getElementById('vehiclesEnRoute')
  const meanAffectEl = document.getElementById('meanAffect')
  const callsTodayEl = document.getElementById('callsToday')
  const assignModal = document.getElementById('assignModal')
  const modalInterventionId = document.getElementById('modalInterventionId')
  const vehSelect = document.getElementById('vehSelect')
  const cancelAssign = document.getElementById('cancelAssign')
  const confirmAssign = document.getElementById('confirmAssign')
  const toast = document.getElementById('toast')
  const filterButtons = document.querySelectorAll('.filter-button')

  let currentInterventions = []
  let currentVehicules = []
  let currentAppels = []
  let currentAssignId = null
  let currentFilter = 'all'
  let map
  let mapMarkers = []

  // ── Utilitaires ─────────────────────────────────────────────
  function showToast(msg, ms=3000){
    toast.textContent = msg
    toast.style.display = 'block'
    setTimeout(()=> toast.style.display='none', ms)
  }

  function getToken(){
    return localStorage.getItem(tokenKey)
  }

  async function apiFetch(path, opts={}){
    const headers = opts.headers || {}
    const t = getToken()
    if(t) headers['Authorization'] = 'Bearer '+t
    headers['Content-Type'] = headers['Content-Type'] || 'application/json'
    opts.headers = headers
    try{
      const res = await fetch(API+path, opts)
      if(res.status===401){
        showToast('Session expirée — redirection...')
        setTimeout(()=> window.location.href='/htlm/index.html', 1500)
        throw new Error('Unauthorized')
      }
      const txt = await res.text()
      try{ return JSON.parse(txt) }catch(e){ return txt }
    }catch(err){ console.error('apiFetch', err); throw err }
  }

  // ── Chargement des données ───────────────────────────────────
  async function loadInterventions(){
    try{
      const data = await apiFetch('/api/interventions')
      currentInterventions = Array.isArray(data) ? data : []
      renderDashboard()
    }catch(e){ console.error(e) }
  }

  async function loadVehicules(){
    try{
      const data = await apiFetch('/api/vehicules')
      currentVehicules = Array.isArray(data) ? data : []
      renderDashboard()
    }catch(e){ console.error(e) }
  }

  async function loadAppels(){
    try{
      const data = await apiFetch('/api/appels')
      currentAppels = Array.isArray(data) ? data : []
      renderDashboard()
    }catch(e){ console.error(e) }
  }

  // ── Statistiques ─────────────────────────────────────────────
  function computeStats(){
    // Seulement les interventions NON terminées
    const activeInterventions = currentInterventions.filter(iv => iv.statut !== 'termine')
    const vehiclesEnRoute = currentVehicules.filter(v => v.statut === 'en_mission').length

    const times = currentInterventions
      .filter(iv => iv.date_debut && iv.createdAt)
      .map(iv => new Date(iv.date_debut) - new Date(iv.createdAt))
    const meanAffect = times.length
      ? Math.round(times.reduce((a,b)=>a+b,0) / times.length / 1000)
      : null

    const today = new Date().toISOString().slice(0,10)
    const callsToday = currentAppels
      .filter(a => String(a.createdAt).slice(0,10) === today).length

    interventionsActiveEl.textContent = activeInterventions.length
    vehiclesEnRouteEl.textContent = vehiclesEnRoute
    meanAffectEl.textContent = meanAffect === null
      ? '--'
      : `${Math.floor(meanAffect/60)}m ${meanAffect % 60}s`
    callsTodayEl.textContent = callsToday
  }

  // ── Rendu principal ──────────────────────────────────────────
  function renderDashboard(){
    renderIncidentList()
    renderVehicleList()
    computeStats()
    renderMap()
  }

  // Filtrer par type ET exclure les terminés
  function getActiveInterventions() {
  return currentInterventions.filter(iv => {
    // Exclure les terminés
    if (iv.statut === 'termine') return false

    // Filtre véhicule — pas d'incidents
    if (currentFilter === 'vehicule') return false

    // Filtre "tous" — afficher tout
    if (currentFilter === 'all') return true

    // Filtre par type — chercher l'appel lié
    const appel = currentAppels.find(a => a.id === iv.appel_id)

    // Si l'appel n'est pas trouvé, afficher quand même
    if (!appel) return true

    return appel.type_urgence === currentFilter
  })
}

  // ── Liste des incidents actifs ───────────────────────────────
  function renderIncidentList(){
    incidentList.innerHTML = ''

    // 1. Appels reçus sans intervention
    const appelsSansIntervention = currentAppels.filter(a => {
      if (a.statut !== 'recu') return false
      const existe = currentInterventions.find(iv => iv.appel_id === a.id)
      return !existe
    })

    if (appelsSansIntervention.length > 0) {
      const header = document.createElement('li')
      header.style.cssText = 'padding:8px 18px;font-size:.72rem;color:var(--danger);text-transform:uppercase;letter-spacing:.1em;background:rgba(243,95,95,.05);'
      header.textContent = '⚠ En attente de dispatch'
      incidentList.appendChild(header)

      appelsSansIntervention.forEach(appel => {
        const pc = appel.priorite === 'critique' ? '#f35f5f'
                : appel.priorite === 'haute'    ? '#ffbf56'
                : appel.priorite === 'moyenne'  ? '#3ba3ff' : '#2ec48a'
        const li = document.createElement('li')
        li.className = 'card-item'
        li.innerHTML = `
          <strong style="color:#fff;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
              background:var(--danger);margin-right:8px;vertical-align:middle;"></span>
            ${appel.type_urgence.charAt(0).toUpperCase() + appel.type_urgence.slice(1)}
            — ${appel.adresse || 'Adresse inconnue'}
          </strong>
          <span style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="color:#8ea3c1">${appel.appelant_nom}</span>
            <span style="background:${pc}22;color:${pc};
              padding:2px 8px;border-radius:999px;font-size:.8rem;">${appel.priorite}</span>
            <span style="background:rgba(243,95,95,.15);color:var(--danger);
              padding:2px 8px;border-radius:999px;font-size:.8rem;">Non dispatché</span>
          </span>`

        // Bouton créer intervention
        const btn = document.createElement('button')
        btn.className = 'btn primary'
        btn.style.marginTop = '10px'
        btn.textContent = '+ Créer intervention'
        btn.addEventListener('click', async (e) => {
          e.stopPropagation()
          btn.disabled = true
          try {
            await apiFetch('/api/interventions', {
              method: 'POST',
              body: JSON.stringify({ appel_id: appel.id })
            })
            showToast('✓ Intervention créée')
            await Promise.all([loadInterventions(), loadAppels()])
          } catch (err) {
            showToast('✗ Erreur création intervention')
            btn.disabled = false
          }
        })
        li.appendChild(btn)
        incidentList.appendChild(li)
      })
    }

    const filtered = getActiveInterventions()

    if (filtered.length === 0 && appelsSansIntervention.length === 0) {
      incidentList.innerHTML = '<li class="card-item" style="color:#8ea3c1;font-style:italic">Aucun incident actif</li>'
      return
    }

    filtered.forEach(iv => {
      const appel = currentAppels.find(a => a.id === iv.appel_id)

      // Couleur selon statut intervention
      const statusColor =
        iv.statut === 'en_attente' ? '#f35f5f' :
        iv.statut === 'en_route'   ? '#3ba3ff' :
        iv.statut === 'sur_place'  ? '#ffbf56' : '#2ec48a'

      // Badge priorité
      const prioriteColor =
        appel?.priorite === 'critique' ? '#f35f5f' :
        appel?.priorite === 'haute'    ? '#ffbf56' :
        appel?.priorite === 'moyenne'  ? '#3ba3ff' : '#2ec48a'

      const li = document.createElement('li')
      li.className = 'card-item'
      li.style.cursor = 'pointer'
      li.innerHTML = `
        <strong style="color:#fff;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
            background:${statusColor};margin-right:8px;vertical-align:middle;"></span>
          ${appel ? appel.type_urgence.charAt(0).toUpperCase() + appel.type_urgence.slice(1) : 'Incident'}
          — ${appel ? appel.adresse : 'Adresse inconnue'}
        </strong>
        <span style="display:flex;align-items:center;gap:8px;margin-top:4px;">
          <span style="color:#8ea3c1">${appel ? appel.appelant_nom : 'Sans appel'}</span>
          <span style="background:${statusColor}22;color:${statusColor};
            padding:2px 8px;border-radius:999px;font-size:.8rem;">
            ${iv.statut.replace(/_/g,' ')}
          </span>
          ${appel?.priorite ? `<span style="background:${prioriteColor}22;color:${prioriteColor};
            padding:2px 8px;border-radius:999px;font-size:.8rem;">${appel.priorite}</span>` : ''}
        </span>`

      li.addEventListener('click', (e) => {
        if(e.target.tagName !== 'BUTTON')
          window.location.href = `/htlm/intervention.html?id=${iv.id}`
      })

      // Bouton assigner
      const btn = document.createElement('button')
      btn.className = 'btn secondary'
      btn.style.marginTop = '10px'
      if(iv.vehicule_id){
        btn.textContent = '✓ Assigné'
        btn.disabled = true
        btn.style.opacity = '0.5'
      } else {
        btn.textContent = 'Assigner véhicule'
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          openAssignModal(iv.id)
        })
      }
      li.appendChild(btn)
      incidentList.appendChild(li)
    })
  }

  // ── Liste des véhicules ──────────────────────────────────────
  function renderVehicleList() {
    vehicleList.innerHTML = ''
    document.getElementById('vehicleCount').textContent = currentVehicules.length

    const ordered = [...currentVehicules].sort((a, b) => {
      const rank = { disponible: 0, en_mission: 1, hors_service: 2 }
      return (rank[a.statut] || 3) - (rank[b.statut] || 3)
    })

    ordered.forEach(v => {
      const color =
        v.statut === 'disponible'  ? '#2ec48a' :
        v.statut === 'en_mission'  ? '#3ba3ff' : '#8b94a6'

      const typeIcon =
        v.type === 'ambulance'         ? '🚑' :
        v.type === 'camion_pompier'    ? '🚒' : '🚓'

      // Chercher l'intervention active liée à ce véhicule
      const intervention = currentInterventions.find(iv =>
        iv.vehicule_id === v.id && iv.statut !== 'termine'
      )

      // Chercher l'appel lié à cette intervention
      const appel = intervention
        ? currentAppels.find(a => a.id === intervention.appel_id)
        : null

      const li = document.createElement('li')
      li.className = 'card-item'
      li.innerHTML = `
        <strong>
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;
            background:${color};margin-right:8px;vertical-align:middle;"></span>
          ${typeIcon} ${v.nom}
        </strong>
        <span style="display:flex;align-items:center;gap:8px;margin-top:4px;">
          <span style="color:#8ea3c1">${v.immatriculation}</span>
          <span style="background:${color}22;color:${color};
            padding:2px 8px;border-radius:999px;font-size:.8rem;">
            ${v.statut.replace(/_/g, ' ')}
          </span>
        </span>
        ${intervention && appel ? `
          <span style="display:flex;align-items:center;gap:6px;margin-top:6px;
            padding:6px 10px;background:rgba(59,163,255,.07);
            border:1px solid rgba(59,163,255,.15);border-radius:8px;font-size:.78rem;">
            <span style="color:#3ba3ff">📍</span>
            <span style="color:#8ea3c1">
              <strong style="color:#e8eeff">INT-${String(intervention.id).padStart(4,'0')}</strong>
              · ${appel.type_urgence} · ${appel.adresse || 'Adresse inconnue'}
            </span>
          </span>` : ''}
        ${intervention && !appel ? `
          <span style="display:block;margin-top:6px;font-size:.78rem;color:#8ea3c1;">
            📍 INT-${String(intervention.id).padStart(4,'0')}
          </span>` : ''}
        ${v.statut === 'disponible' ? `
          <span style="display:block;margin-top:6px;font-size:.78rem;
            color:var(--success);font-style:italic;">
            Aucune mission assignée
          </span>` : ''}
        ${v.statut === 'hors_service' ? `
          <span style="display:block;margin-top:6px;font-size:.78rem;
            color:var(--grey);font-style:italic;">
            Hors service
          </span>` : ''}`

      // Clic → ouvrir la fiche intervention
      if (intervention) {
        li.style.cursor = 'pointer'
        li.addEventListener('click', () => {
          window.location.href = `/htlm/intervention.html?id=${intervention.id}`
        })
      }

      vehicleList.appendChild(li)
    })
  }

  // ── Carte Leaflet ────────────────────────────────────────────
  function initMap(){
    if(map) return
    map = L.map('map', { zoomControl:true }).setView([45.51, -73.57], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:'&copy; OpenStreetMap contributors'
    }).addTo(map)
  }

  function clearMapMarkers(){
    mapMarkers.forEach(m => map.removeLayer(m))
    mapMarkers = []
  }

  function renderMap(){
    if(!map) initMap()
    clearMapMarkers()
    const points = []

    // Marqueurs incidents actifs seulement
    getActiveInterventions().forEach(iv => {
      const appel = currentAppels.find(a => a.id === iv.appel_id)
      if(!appel || !appel.latitude || !appel.longitude) return

      const color =
        iv.statut === 'en_attente' ? '#f35f5f' :
        iv.statut === 'en_route'   ? '#3ba3ff' :
        iv.statut === 'sur_place'  ? '#ffbf56' : '#2ec48a'

      const marker = L.circleMarker(
        [appel.latitude, appel.longitude],
        { radius:10, color, fillColor:color, fillOpacity:0.75, weight:2 }
      ).addTo(map)

      marker.bindPopup(`
        <strong>${appel.type_urgence.toUpperCase()}</strong><br>
        ${appel.adresse}<br>
        <span style="color:${color}">${iv.statut.replace(/_/g,' ')}</span><br>
        Priorité : ${appel.priorite || 'N/A'}
      `)
      mapMarkers.push(marker)
      points.push([appel.latitude, appel.longitude])
    })

    // Marqueurs véhicules
    if(currentFilter === 'all' || currentFilter === 'vehicule'){
      currentVehicules.forEach(v => {
        if(!v.latitude || !v.longitude) return
        const color =
          v.statut === 'disponible' ? '#2ec48a' :
          v.statut === 'en_mission' ? '#3ba3ff' : '#8b94a6'
        const marker = L.marker([v.latitude, v.longitude]).addTo(map)
        marker.bindPopup(`
          <strong>${v.nom}</strong><br>
          ${v.immatriculation}<br>
          <span style="color:${color}">${v.statut.replace(/_/g,' ')}</span>
        `)
        mapMarkers.push(marker)
        points.push([v.latitude, v.longitude])
      })
    }

    if(points.length){
      map.fitBounds(L.latLngBounds(points).pad(0.2))
    }
  }

  // ── Modal assignation ────────────────────────────────────────
  function openAssignModal(interventionId){
    currentAssignId = interventionId
    modalInterventionId.textContent = interventionId
    vehSelect.innerHTML = ''

    const disponibles = currentVehicules.filter(v => v.statut === 'disponible')
    const autres = currentVehicules.filter(v => v.statut !== 'disponible')

    if(disponibles.length === 0){
      const opt = document.createElement('option')
      opt.textContent = 'Aucun véhicule disponible'
      opt.disabled = true
      vehSelect.appendChild(opt)
      confirmAssign.disabled = true
    } else {
      confirmAssign.disabled = false
      disponibles.concat(autres).forEach(v => {
        const opt = document.createElement('option')
        opt.value = v.id
        opt.disabled = v.statut !== 'disponible'
        const typeIcon =
          v.type === 'ambulance'      ? '🚑' :
          v.type === 'camion_pompier' ? '🚒' : '🚓'
        opt.textContent = `${typeIcon} ${v.nom} (${v.immatriculation}) — ${v.statut.replace(/_/g,' ')}`
        vehSelect.appendChild(opt)
      })
    }
    assignModal.style.display = 'flex'
  }

  cancelAssign.addEventListener('click', () => {
    assignModal.style.display = 'none'
  })

  confirmAssign.addEventListener('click', async () => {
    const vehId = parseInt(vehSelect.value, 10)
    if(!vehId || !currentAssignId) return

    assignModal.style.display = 'none'
    confirmAssign.disabled = true

    try{
      await apiFetch(`/api/interventions/${currentAssignId}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({ vehicule_id: vehId, statut: 'en_route' })
      })
      showToast('✓ Véhicule assigné avec succès')
      await Promise.all([loadInterventions(), loadVehicules()])
    }catch(e){
      console.error(e)
      showToast('✗ Erreur lors de l\'assignation')
      assignModal.style.display = 'flex'
    }finally{
      confirmAssign.disabled = false
    }
  })

  // ── Filtres ──────────────────────────────────────────────────
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'))
      button.classList.add('active')
      currentFilter = button.dataset.filter
      renderDashboard()
    })
  })

  // ── Socket.io ────────────────────────────────────────────────
  function initSocket(){
    try{
      const socket = io()
      socket.on('connect', () => console.log('🔌 Socket connecté'))
      socket.on('nouvel_appel', () => {
        showToast('📞 Nouvel appel reçu')
        Promise.all([loadAppels(), loadInterventions()])
      })
      socket.on('nouvelle_intervention', () => {
        showToast('🚨 Nouvelle intervention')
        Promise.all([loadInterventions(), loadAppels()])
      })
      socket.on('intervention_assignee', () => {
        showToast('✓ Intervention assignée')
        Promise.all([loadInterventions(), loadVehicules()])
      })
      socket.on('statut_vehicule', () => {
        showToast('🚗 Statut véhicule mis à jour')
        loadVehicules()
      })
    }catch(e){ console.warn('Socket init échoué', e) }
  }

  // ── Initialisation ───────────────────────────────────────────
  ;(function init(){
    const token = localStorage.getItem(tokenKey)
    if(!token){
      window.location.href = '/htlm/index.html'
      return
    }
    initSocket()
    Promise.all([loadInterventions(), loadVehicules(), loadAppels()])

    // Rafraîchissement automatique toutes les 30 secondes
    setInterval(() => {
      Promise.all([loadInterventions(), loadVehicules(), loadAppels()])
    }, 30000)
  })()

})()