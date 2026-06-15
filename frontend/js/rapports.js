(function () {
  const TOKEN_KEY = 'urgenceplus_token'
  const USER_KEY  = 'urgenceplus_user'
  const getToken  = () => localStorage.getItem(TOKEN_KEY) || ''
  const getUser   = () => JSON.parse(localStorage.getItem(USER_KEY) || '{}')

  let currentRapports      = []
  let currentInterventions = []
  let currentAppels        = []
  let currentVehicules     = []
  let currentRapportPDF    = null
  let currentUtilisateurs = []

  // ── API ──────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Bearer ' + getToken(),
        ...(opts.headers || {})
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
      const [rapports, interventions, appels, vehicules,  utilisateurs] = await Promise.all([
        api('/api/rapports'),
        api('/api/interventions'),
        api('/api/appels'),
        api('/api/vehicules'),
        api('/api/utilisateurs')
      ])
      currentRapports      = Array.isArray(rapports)      ? rapports      : []
      currentInterventions = Array.isArray(interventions) ? interventions : []
      currentAppels        = Array.isArray(appels)        ? appels        : []
      currentVehicules     = Array.isArray(vehicules)     ? vehicules     : []
      currentUtilisateurs  = Array.isArray(utilisateurs)  ? utilisateurs  : []
      renderTable()
      peuplerSelectIntervention()
    } catch (e) { console.error(e) }

    const params = new URLSearchParams(window.location.search)
    const interventionId = params.get('intervention_id')
    if (interventionId) {
        document.getElementById('modalCreer').classList.add('open')
        document.getElementById('selectIntervention').value = interventionId
        document.getElementById('selectIntervention').dispatchEvent(new Event('change'))
    }

  }

  // ── Utilitaires ──────────────────────────────────────────────
  function fmt(t) {
    if (!t) return '—'
    return new Date(t).toLocaleString('fr-CA', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  function calcDelai(debut, creation) {
    if (!debut || !creation) return null
    const sec = Math.round((new Date(debut) - new Date(creation)) / 1000)
    return sec < 0 ? null : sec
  }

  function fmtDelai(sec) {
    if (sec === null) return '—'
    return `${Math.floor(sec / 60)}m ${sec % 60}s`
  }

  // ── Table des rapports ───────────────────────────────────────
  function renderTable(filtre = '') {
    const tbody = document.getElementById('rapportsTable')
    const liste = filtre
      ? currentRapports.filter(r =>
          r.titre?.toLowerCase().includes(filtre.toLowerCase()) ||
          String(r.intervention_id).includes(filtre)
        )
      : currentRapports

    if (liste.length === 0) {
      tbody.innerHTML = `
        <tr><td colspan="6" class="empty-state">
          Aucun rapport trouvé
        </td></tr>`
      return
    }

    tbody.innerHTML = liste.map(r => {
      const auteur = currentUtilisateurs.find(u => u.id === r.auteur_id)
      return `
        <tr>
          <td style="font-family:monospace;color:var(--accent)">
            RPT-${String(r.id).padStart(4,'0')}
          </td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
            ${r.titre}
          </td>
          <td style="color:var(--muted)">
            ${r.intervention_id
              ? `INT-${String(r.intervention_id).padStart(4,'0')}`
              : '—'}
          </td>
          <td style="color:var(--muted)">${auteur ? auteur.nom : 'Auteur #' + r.auteur_id}</td>
          <td style="color:var(--muted)">${fmt(r.createdAt)}</td>
          <td>
            <div style="display:flex;gap:6px">
              <button class="btn ghost sm" onclick="ouvrirPDF(${r.id})">
                👁 Aperçu
              </button>
              <button class="btn success sm" onclick="exporterPDF(${r.id})">
                ⬇ PDF
              </button>
            </div>
          </td>
        </tr>`
    }).join('')
  }

  // ── Peupler le select interventions ─────────────────────────
  function peuplerSelectIntervention() {
    const select = document.getElementById('selectIntervention')

    // Interventions terminées sans rapport existant
    const disponibles = currentInterventions.filter(iv => {
      if (iv.statut !== 'termine') return false
      const rapportExiste = currentRapports.find(r => r.intervention_id === iv.id)
      return !rapportExiste
    })

    select.innerHTML = '<option value="">-- Choisir une intervention --</option>'

    if (disponibles.length === 0) {
      select.innerHTML += '<option disabled>Aucune intervention sans rapport</option>'
      return
    }

    disponibles.forEach(iv => {
      const appel = currentAppels.find(a => a.id === iv.appel_id)
      const opt   = document.createElement('option')
      opt.value   = iv.id
      opt.textContent = `INT-${String(iv.id).padStart(4,'0')} — ${appel ? appel.type_urgence + ' · ' + (appel.adresse || '') : 'Intervention'}`
      select.appendChild(opt)
    })
  }

  // ── Afficher les données auto quand on choisit une intervention
  document.getElementById('selectIntervention').addEventListener('change', function () {
    const ivId = parseInt(this.value)
    if (!ivId) {
      document.getElementById('autoData').innerHTML =
        '<div style="color:var(--muted);font-size:.82rem;font-style:italic">Sélectionnez une intervention</div>'
      return
    }

    const iv     = currentInterventions.find(i => i.id === ivId)
    const appel  = iv ? currentAppels.find(a => a.id === iv.appel_id) : null
    const veh    = iv?.vehicule_id ? currentVehicules.find(v => v.id === iv.vehicule_id) : null
    const delai  = calcDelai(iv?.date_debut, iv?.createdAt)

    const rows = [
      ['Intervention',       `INT-${String(ivId).padStart(4,'0')}`],
      ['Type urgence',       appel?.type_urgence || '—'],
      ['Priorité',           appel?.priorite || '—'],
      ['Adresse',            appel?.adresse || '—'],
      ['Appelant',           appel ? `${appel.appelant_nom} — ${appel.appelant_tel}` : '—'],
      ['Heure appel',        fmt(appel?.createdAt)],
      ['Véhicule assigné',   veh ? `${veh.nom} (${veh.immatriculation})` : '—'],
      ['Heure départ',       fmt(iv?.date_debut)],
      ['Heure clôture',      fmt(iv?.date_fin)],
      ['Délai affectation',  fmtDelai(delai)],
      ['Durée intervention', iv?.date_debut && iv?.date_fin
        ? fmtDelai(Math.round((new Date(iv.date_fin) - new Date(iv.date_debut)) / 1000))
        : '—'],
    ]

    document.getElementById('autoData').innerHTML = rows.map(([k, v]) => `
      <div class="auto-row">
        <span class="auto-key">${k}</span>
        <span class="auto-val">${v}</span>
      </div>`).join('')

    // Pré-remplir le titre
    document.getElementById('inputTitre').placeholder =
      `Rapport INT-${String(ivId).padStart(4,'0')} — ${new Date().toLocaleDateString('fr-CA')}`
  })

  // ── Sauvegarder un rapport ───────────────────────────────────
  document.getElementById('btnSauvegarder').addEventListener('click', async () => {
    const ivId     = parseInt(document.getElementById('selectIntervention').value)
    const etat     = document.getElementById('inputEtat').value.trim()
    const actions  = document.getElementById('inputActions').value.trim()
    const resultat = document.getElementById('inputResultat').value.trim()
    const notes    = document.getElementById('inputNotes').value.trim()

    if (!ivId) {
      alert('Veuillez sélectionner une intervention.')
      return
    }
    if (!etat && !actions && !resultat) {
      alert('Veuillez remplir au moins un champ de la partie manuelle.')
      return
    }

    // Construire le contenu combiné
    const contenu = [
      etat     ? `ÉTAT SUR PLACE:\n${etat}`          : '',
      actions  ? `ACTIONS EFFECTUÉES:\n${actions}`   : '',
      resultat ? `RÉSULTAT:\n${resultat}`             : '',
      notes    ? `NOTES SUPPLÉMENTAIRES:\n${notes}`  : '',
    ].filter(Boolean).join('\n\n')

    try {
      document.getElementById('btnSauvegarder').disabled = true
      await api('/api/rapports', {
        method: 'POST',
        body: JSON.stringify({
          contenu,
          intervention_id: ivId
        })
      })
      fermerModalCreer()
      await loadAll()
    } catch (e) {
      console.error(e)
      alert('Erreur lors de la sauvegarde.')
    } finally {
      document.getElementById('btnSauvegarder').disabled = false
    }
  })



  // ── Générer aperçu PDF ───────────────────────────────────────
  window.ouvrirPDF = async (rapportId) => {
    try {
      const details = await api(`/api/rapports/${rapportId}/details`)
      currentRapportPDF = details
      const html = genererHTMLRapport(details)
      document.getElementById('pdfPreview').innerHTML = html
      document.getElementById('modalPDF').classList.add('open')
    } catch (e) {
      console.error(e)
      alert('Erreur chargement rapport.')
    }
  }

  window.exporterPDF = async (rapportId) => {
    try {
      const details = await api(`/api/rapports/${rapportId}/details`)
      telechargerPDF(details)
    } catch (e) {
      console.error(e)
      alert('Erreur génération PDF.')
    }
  }

  // ── Générer HTML du rapport ──────────────────────────────────
  function genererHTMLRapport(d) {
    const { rapport, intervention, appel, vehicule, auteur, agent } = d
    const delai = calcDelai(intervention?.date_debut, intervention?.createdAt)

    return `
      <h2>RAPPORT D'INTERVENTION</h2>
      <h2>Urgence+ — Municipalité fictive</h2>
      <div class="pdf-meta">
        Référence : RPT-${String(rapport.id).padStart(4,'0')} &nbsp;·&nbsp;
        Intervention : INT-${String(rapport.intervention_id).padStart(4,'0')} &nbsp;·&nbsp;
        Généré le ${fmt(new Date())}
      </div>

      <div class="pdf-section">
        <h3>1. Informations sur l'incident</h3>
        ${row('Type d\'urgence', appel?.type_urgence || '—')}
        ${row('Priorité', appel?.priorite || '—')}
        ${row('Adresse', appel?.adresse || '—')}
        ${row('Appelant', appel ? `${appel.appelant_nom} — ${appel.appelant_tel}` : '—')}
        ${row('Description', appel?.description || '—')}
        ${row('Heure de l\'appel', fmt(appel?.createdAt))}
      </div>

      <div class="pdf-section">
        <h3>2. Ressources déployées</h3>
        ${row('Véhicule', vehicule ? `${vehicule.nom} (${vehicule.immatriculation})` : '—')}
        ${row('Agent responsable', agent?.nom || '—')}
        ${row('Heure de départ', fmt(intervention?.date_debut))}
        ${row('Heure de clôture', fmt(intervention?.date_fin))}
        ${row('Délai d\'affectation', fmtDelai(delai))}
        ${row('Durée totale', intervention?.date_debut && intervention?.date_fin
          ? fmtDelai(Math.round((new Date(intervention.date_fin) - new Date(intervention.date_debut)) / 1000))
          : '—')}
      </div>

      <div class="pdf-section">
        <h3>3. Rapport d'intervention</h3>
        <p style="white-space:pre-line">${rapport.contenu || '—'}</p>
      </div>

      <div class="pdf-section">
        <h3>4. Validation</h3>
        ${row('Rapport rédigé par', auteur?.nom || '—')}
        ${row('Rôle', auteur?.role || '—')}
        ${row('Date du rapport', fmt(rapport.createdAt))}
      </div>`
  }

  function row(k, v) {
    return `<div class="pdf-row">
      <span class="pdf-key">${k}</span>
      <span class="pdf-val">${v}</span>
    </div>`
  }

  // ── Télécharger PDF avec jsPDF ───────────────────────────────
  function telechargerPDF(d) {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const { rapport, intervention, appel, vehicule, auteur, agent } = d
    const delai = calcDelai(intervention?.date_debut, intervention?.createdAt)

    let y = 20
    const L = 20  // marge gauche
    const W = 170 // largeur utile

    // ── En-tête ──
    doc.setFontSize(16).setFont('helvetica','bold')
    doc.text("RAPPORT D'INTERVENTION — URGENCE+", L, y); y += 7
    doc.setFontSize(10).setFont('helvetica','normal').setTextColor(100)
    doc.text(`RPT-${String(rapport.id).padStart(4,'0')} · INT-${String(rapport.intervention_id).padStart(4,'0')} · ${fmt(new Date())}`, L, y)
    y += 8
    doc.setDrawColor(200).line(L, y, L + W, y); y += 8

    const section = (titre) => {
      doc.setFontSize(11).setFont('helvetica','bold').setTextColor(40)
      doc.text(titre, L, y); y += 6
      doc.setFont('helvetica','normal').setFontSize(10).setTextColor(60)
    }

    const ligne = (k, v) => {
      doc.setTextColor(120).text(k, L, y)
      doc.setTextColor(40).text(String(v || '—'), L + 60, y)
      y += 5.5
    }

    // ── Section 1 ──
    section('1. Informations sur l\'incident')
    ligne("Type d'urgence",    appel?.type_urgence || '—')
    ligne('Priorité',          appel?.priorite || '—')
    ligne('Adresse',           appel?.adresse || '—')
    ligne('Appelant',          appel ? `${appel.appelant_nom} — ${appel.appelant_tel}` : '—')
    ligne("Heure de l'appel",  fmt(appel?.createdAt))
    y += 4
    doc.setDrawColor(220).line(L, y, L + W, y); y += 6

    // ── Section 2 ──
    section('2. Ressources déployées')
    ligne('Véhicule',           vehicule ? `${vehicule.nom} (${vehicule.immatriculation})` : '—')
    ligne('Agent responsable',  agent?.nom || '—')
    ligne('Heure de départ',    fmt(intervention?.date_debut))
    ligne('Heure de clôture',   fmt(intervention?.date_fin))
    ligne("Délai d'affectation",fmtDelai(delai))
    y += 4
    doc.setDrawColor(220).line(L, y, L + W, y); y += 6

    // ── Section 3 ──
    section("3. Rapport d'intervention")
    doc.setFontSize(10).setTextColor(60)
    const lignes = doc.splitTextToSize(rapport.contenu || '—', W)
    doc.text(lignes, L, y); y += lignes.length * 5.5 + 4
    doc.setDrawColor(220).line(L, y, L + W, y); y += 6

    // ── Section 4 ──
    section('4. Validation')
    ligne('Rapport rédigé par', auteur?.nom || '—')
    ligne('Rôle',               auteur?.role || '—')
    ligne('Date du rapport',    fmt(rapport.createdAt))

    // ── Pied de page ──
    doc.setFontSize(8).setTextColor(150)
    doc.text('Document généré par Urgence+ — Confidentiel', L, 285)

    doc.save(`rapport-INT-${String(rapport.intervention_id).padStart(4,'0')}.pdf`)
  }

  // ── Modal helpers ────────────────────────────────────────────
  function fermerModalCreer() {
    document.getElementById('modalCreer').classList.remove('open')
    document.getElementById('selectIntervention').value = ''
    document.getElementById('inputEtat').value     = ''
    document.getElementById('inputActions').value  = ''
    document.getElementById('inputResultat').value = ''
    document.getElementById('inputNotes').value    = ''
    document.getElementById('autoData').innerHTML  =
      '<div style="color:var(--muted);font-size:.82rem;font-style:italic">Sélectionnez une intervention</div>'
  }

  document.getElementById('btnNouveauRapport').addEventListener('click', () => {
    document.getElementById('modalCreer').classList.add('open')
  })
  document.getElementById('closeModalCreer').addEventListener('click', fermerModalCreer)
  document.getElementById('cancelCreer').addEventListener('click', fermerModalCreer)
  document.getElementById('closeModalPDF').addEventListener('click', () => {
    document.getElementById('modalPDF').classList.remove('open')
  })
  document.getElementById('cancelPDF').addEventListener('click', () => {
    document.getElementById('modalPDF').classList.remove('open')
  })
  document.getElementById('btnTelecharger').addEventListener('click', () => {
    if (currentRapportPDF) telechargerPDF(currentRapportPDF)
  })

  // ── Filtre recherche ─────────────────────────────────────────
  document.getElementById('searchInput').addEventListener('input', function () {
    renderTable(this.value)
  })

  // ── Socket.io ────────────────────────────────────────────────
  try {
    const socket = io()
    socket.on('nouvelle_intervention', () => loadAll())
    socket.on('statut_intervention',   () => loadAll())
  } catch (e) { console.warn('Socket non dispo', e) }

  // ── Init ─────────────────────────────────────────────────────
  loadAll()

})()