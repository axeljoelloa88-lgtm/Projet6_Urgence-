(async function () {
  const TOKEN_KEY = 'urgenceplus_token'
  const getToken = () => localStorage.getItem(TOKEN_KEY) || ''

  // ── Récupérer l'id dans l'URL ────────────────────────────────
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')

  // ── Éléments DOM ─────────────────────────────────────────────
  const intRef      = document.getElementById('intRef')
  const subtitle    = document.getElementById('subtitle')
  const typeBadge   = document.getElementById('typeBadge')
  const adresse     = document.getElementById('adresse')
  const appelant    = document.getElementById('appelant')
  const heureAppel  = document.getElementById('heureAppel')
  const prioriteEl  = document.getElementById('priorite')
  const timeline    = document.getElementById('timeline')
  const vehiculeName= document.getElementById('vehiculeName')
  const agentName   = document.getElementById('agentName')
  const affectTime  = document.getElementById('affectTime')
  const delayEl     = document.getElementById('delay')
  const btnOnScene  = document.getElementById('btnOnScene')
  const btnClose    = document.getElementById('btnClose')
  const btnReport   = document.getElementById('btnReport')
  const backBtn     = document.getElementById('backBtn')
  const statusTabs  = document.getElementById('statusTabs')

  // ── Garde : pas d'id dans l'URL ─────────────────────────────
  if (!id) {
    subtitle.textContent = 'Aucune intervention sélectionnée.'
    return
  }

  // ── Appel API générique ──────────────────────────────────────
  async function api(path, opts = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken(),
      ...(opts.headers || {})
    }
    const res = await fetch(path, { ...opts, headers })
    if (res.status === 401) {
      window.location.href = '/htlm/index.html'
      throw new Error('Non autorisé')
    }
    return res.json()
  }

  // ── Formatage de la date ─────────────────────────────────────
  function fmt(t) {
    if (!t) return '—'
    return new Date(t).toLocaleString('fr-CA', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  // ── Calcul du délai en minutes et secondes ───────────────────
  function calcDelai(debut, creation) {
    if (!debut || !creation) return '—'
    const sec = Math.round((new Date(debut) - new Date(creation)) / 1000)
    if (sec < 0) return '—'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    const color = m < 2 ? '#2ec48a' : '#f35f5f'
    return `<span style="color:${color};font-weight:600">${m}m ${s}s</span>`
  }

  // ── Couleur selon statut ─────────────────────────────────────
  function statutColor(s) {
    return s === 'en_attente' ? '#f35f5f'
         : s === 'en_route'   ? '#3ba3ff'
         : s === 'sur_place'  ? '#ffbf56'
         : s === 'termine'    ? '#2ec48a'
         : '#8ea3c1'
  }

  // ── Couleur selon priorité ───────────────────────────────────
  function prioriteColor(p) {
    return p === 'critique' ? '#f35f5f'
         : p === 'haute'    ? '#ffbf56'
         : p === 'moyenne'  ? '#3ba3ff'
         : '#2ec48a'
  }

  // ── Étapes du stepper ────────────────────────────────────────
  const ETAPES = [
    { key: 'recu',       label: 'Appel reçu'  },
    { key: 'dispatche',  label: 'Dispatché'   },
    { key: 'en_route',   label: 'En route'    },
    { key: 'sur_place',  label: 'Sur place'   },
    { key: 'termine',    label: 'Terminé'     },
  ]

  const ORDRE = ['recu', 'dispatche', 'en_route', 'sur_place', 'termine']

  function renderStatusTabs(statut) {
    statusTabs.innerHTML = ''
    const idx = ORDRE.indexOf(statut)
    ETAPES.forEach((etape, i) => {
      const done    = i < idx
      const active  = i === idx
      const div = document.createElement('div')
      div.className = 'tab' + (active ? ' active' : '') + (done ? ' done' : '')
      div.innerHTML = `
        <span class="tab-icon">${done ? '✓' : i + 1}</span>
        <span>${etape.label}</span>`
      statusTabs.appendChild(div)
    })
  }

  // ── Affichage conditionnel des boutons d'action ──────────────
  function renderButtons(statut) {
    // Cacher tous les boutons par défaut
    btnOnScene.style.display = 'none'
    btnClose.style.display   = 'none'
    btnReport.style.display  = 'none'

    if (statut === 'en_route') {
      btnOnScene.style.display = 'inline-flex'  // seulement "Sur place"
    }
    if (statut === 'sur_place') {
      btnClose.style.display  = 'inline-flex'   // seulement "Clôturer"
      btnReport.style.display = 'inline-flex'
    }
    if (statut === 'termine') {
      btnReport.style.display = 'inline-flex'   // seulement "Rapport"
    }
  }

  // ── Timeline ─────────────────────────────────────────────────
  function addEvent(icon, titre, temps, detail = '') {
    const div = document.createElement('div')
    div.className = 'event'
    div.innerHTML = `
      <div class="event-dot">${icon}</div>
      <div class="event-body">
        <div class="event-title">${titre}</div>
        ${detail ? `<div class="event-detail">${detail}</div>` : ''}
        <div class="event-time">${temps}</div>
      </div>`
    timeline.appendChild(div)
  }

  function renderTimeline(intervention, appel, vehicule) {
    timeline.innerHTML = ''

    if (appel) {
      addEvent('📞', 'Appel enregistré', fmt(appel.createdAt),
        appel.description || '')
    }

    addEvent('📋', 'Intervention créée', fmt(intervention.createdAt), '')

    if (intervention.vehicule_id && vehicule) {
      addEvent('🚗', 'Véhicule assigné', fmt(intervention.updatedAt),
        `${vehicule.nom} — ${vehicule.immatriculation}`)
    }

    if (intervention.date_debut) {
      addEvent('🚨', 'En route', fmt(intervention.date_debut), '')
    }

    if (intervention.statut === 'sur_place') {
      addEvent('📍', 'Arrivée sur place', fmt(intervention.updatedAt), '')
    }

    if (intervention.date_fin) {
      addEvent('✅', 'Intervention terminée', fmt(intervention.date_fin),
        intervention.notes || '')
    }
  }

  // ── Chargement principal ─────────────────────────────────────
  async function load() {
    try {
      const intervention = await api('/api/interventions/' + id)

      // En-tête
      intRef.textContent = '#INT-' + String(intervention.id).padStart(4, '0')
      subtitle.innerHTML = `
        Créé le ${fmt(intervention.createdAt)} &nbsp;·&nbsp;
        <span style="color:${statutColor(intervention.statut)};font-weight:600">
          ${intervention.statut.replace(/_/g, ' ')}
        </span>`

      // Stepper + boutons conditionnels
      renderStatusTabs(intervention.statut)
      renderButtons(intervention.statut)

      // ── Appel lié ──
      let appel = null
      if (intervention.appel_id) {
        try { appel = await api('/api/appels/' + intervention.appel_id) }
        catch (e) { console.warn('Appel introuvable', e) }
      }

      if (appel) {
        const pc = prioriteColor(appel.priorite)
        typeBadge.innerHTML = `
          <span style="background:${pc}22;color:${pc};
            padding:2px 9px;border-radius:999px;font-size:.8rem;font-weight:600">
            ${appel.type_urgence} · ${appel.priorite}
          </span>`
        adresse.textContent   = appel.adresse  || '—'
        appelant.textContent  = appel.appelant_nom + ' — ' + appel.appelant_tel
        heureAppel.textContent = fmt(appel.createdAt)
        if (prioriteEl) prioriteEl.textContent = appel.priorite || '—'
      }

      // ── Véhicule ──
      let vehicule = null
      if (intervention.vehicule_id) {
        try {
          const liste = await api('/api/vehicules')
          vehicule = liste.find(v => v.id === intervention.vehicule_id)
          if (vehicule)
            vehiculeName.textContent = `${vehicule.nom} — ${vehicule.immatriculation}`
        } catch (e) { console.warn(e) }
      }

      // ── Agent ──
      if (intervention.agent_id) {
        try {
          const agent = await api('/api/utilisateurs/' + intervention.agent_id)
          agentName.textContent = agent.nom + ' (' + agent.role + ')'
        } catch (e) {
          agentName.textContent = 'Agent #' + intervention.agent_id
        }
      } else {
        agentName.textContent = '—'
      }

      // ── Délai d'affectation ──
      affectTime.textContent = fmt(intervention.date_debut)
      delayEl.innerHTML = calcDelai(intervention.date_debut, intervention.createdAt)

      // ── Timeline ──
      renderTimeline(intervention, appel, vehicule)

    } catch (err) {
      console.error(err)
      subtitle.textContent = 'Erreur lors du chargement.'
    }
  }

  // ── Actions boutons ──────────────────────────────────────────
  btnOnScene.addEventListener('click', async () => {
    btnOnScene.disabled = true
    try {
      await api('/api/interventions/' + id + '/statut', {
        method: 'PATCH',
        body: JSON.stringify({ statut: 'sur_place' })
      })
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      btnOnScene.disabled = false
    }
  })

  btnClose.addEventListener('click', async () => {
    if (!confirm('Confirmer la clôture de cette intervention ?')) return
    btnClose.disabled = true
    try {
      await api('/api/interventions/' + id + '/statut', {
        method: 'PATCH',
        body: JSON.stringify({ statut: 'termine', date_fin: new Date().toISOString() })
      })
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      btnClose.disabled = false
    }
  })

  btnReport.addEventListener('click', () => {
  window.location.href = '/htlm/rapports.html?intervention_id=' + id
  })

  backBtn.addEventListener('click', () => {
    window.location.href = '/htlm/dispatch.html'
  })

  // ── Socket.io ────────────────────────────────────────────────
  try {
    const socket = io()
    socket.on('statut_intervention', (data) => {
      if (String(data.id) === String(id)) load()
    })
    socket.on('statut_vehicule', () => load())
  } catch (e) {
    console.warn('Socket non disponible', e)
  }

  // ── Lancement ────────────────────────────────────────────────
  await load()

})()