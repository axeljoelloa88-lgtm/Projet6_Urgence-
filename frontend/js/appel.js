// Afficher le nom de l'opérateur
const user = JSON.parse(localStorage.getItem('urgenceplus_user') || '{}')
const nomEl = document.getElementById('operateur-nom')
if (nomEl && user.nom) nomEl.textContent = user.nom

// Bouton déconnexion
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('urgenceplus_token')
  localStorage.removeItem('urgenceplus_user')
  localStorage.removeItem('urgenceplus_role')
  window.location.href = '/htlm/index.html'
})

const token = localStorage.getItem('urgenceplus_token');
const appelForm = document.getElementById('appel-form');
const typeButtons = document.querySelectorAll('#type-buttons .option-button');
const priorityButtons = document.querySelectorAll('#priority-buttons .option-button');
const geolocateButton = document.getElementById('geolocate');
const adresseInput = document.getElementById('adresse');
const messageEl = document.getElementById('appel-message');
const mapModal = document.getElementById('map-modal');
const closeMapButton = document.getElementById('close-map');
const confirmLocationButton = document.getElementById('confirm-location');
const mapCoordsDisplay = document.getElementById('map-coords');

let selectedType = 'incendie';
let selectedPriority = 'critique';
let currentLatitude = null;
let currentLongitude = null;
let mapInstance = null;
let mapMarker = null;
let defaultCenter = [45.5017, -73.5673];

if (!token) {
  window.location.href = '/htlm/index.html';
}

const setActive = (buttons, selectedValue) => {
  buttons.forEach((button) => {
    button.classList.toggle('active', button.dataset.value === selectedValue);
  });
};

const showMessage = (text, isError = false) => {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#ff8a8a' : '#a8ffb4';
};

setActive(typeButtons, selectedType);
setActive(priorityButtons, selectedPriority);

typeButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedType = button.dataset.value;
    setActive(typeButtons, selectedType);
  });
});

priorityButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedPriority = button.dataset.value;
    setActive(priorityButtons, selectedPriority);
  });
});

const initMap = () => {
  if (mapInstance) {
    mapInstance.invalidateSize();
    return;
  }

  const center = currentLatitude && currentLongitude 
    ? [currentLatitude, currentLongitude] 
    : defaultCenter;

  mapInstance = L.map('map').setView(center, 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(mapInstance);

  if (currentLatitude && currentLongitude) {
    mapMarker = L.marker([currentLatitude, currentLongitude]).addTo(mapInstance);
    mapCoordsDisplay.textContent = `Lat: ${currentLatitude.toFixed(5)}, Lon: ${currentLongitude.toFixed(5)}`;
  }

  mapInstance.on('click', (e) => {
    if (mapMarker) {
      mapInstance.removeLayer(mapMarker);
    }
    currentLatitude = e.latlng.lat;
    currentLongitude = e.latlng.lng;
    mapMarker = L.marker([currentLatitude, currentLongitude]).addTo(mapInstance);
    mapCoordsDisplay.textContent = `Lat: ${currentLatitude.toFixed(5)}, Lon: ${currentLongitude.toFixed(5)}`;
  });
};

geolocateButton.addEventListener('click', async () => {
  mapModal.classList.remove('hidden');
  setTimeout(initMap, 100);

  const adresse = adresseInput.value.trim();
  if (adresse) {
    showMessage('Recherche de l adresse...', false);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(adresse)}`);
      const result = await response.json();

      if (!response.ok) {
        showMessage(result.message || 'Adresse introuvable, utilisez la carte.', true);
        return;
      }

      currentLatitude = result.latitude;
      currentLongitude = result.longitude;
      if (mapInstance) {
        mapInstance.setView([currentLatitude, currentLongitude], 15);
        if (mapMarker) mapInstance.removeLayer(mapMarker);
        mapMarker = L.marker([currentLatitude, currentLongitude]).addTo(mapInstance);
        mapCoordsDisplay.textContent = `Lat: ${currentLatitude.toFixed(5)}, Lon: ${currentLongitude.toFixed(5)}`;
      }
      showMessage(`Adresse géocodée: ${result.display_name}`, false);
      return;
    } catch (err) {
      showMessage('Erreur de géocodage, utilisez la carte.', true);
      console.error(err);
    }
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentLatitude = position.coords.latitude;
        currentLongitude = position.coords.longitude;
        if (mapInstance) {
          mapInstance.setView([currentLatitude, currentLongitude], 15);
          if (mapMarker) mapInstance.removeLayer(mapMarker);
          mapMarker = L.marker([currentLatitude, currentLongitude]).addTo(mapInstance);
          mapCoordsDisplay.textContent = `Lat: ${currentLatitude.toFixed(5)}, Lon: ${currentLongitude.toFixed(5)}`;
        }
      },
      () => {
        showMessage('Cliquez sur la carte pour sélectionner une localisation.', true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    showMessage('Cliquez sur la carte pour sélectionner une localisation.', true);
  }
});

closeMapButton.addEventListener('click', () => {
  mapModal.classList.add('hidden');
});

confirmLocationButton.addEventListener('click', () => {
  if (currentLatitude && currentLongitude) {
    mapModal.classList.add('hidden');
    showMessage('Position confirmée', false);
  }
});

appelForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('Envoi de l\'appel...');

  const appelant_nom = document.getElementById('appelant_nom').value.trim();
  const appelant_tel = document.getElementById('appelant_tel').value.trim();
  const adresse = document.getElementById('adresse').value.trim();
  const description = document.getElementById('description').value.trim();

  if (!appelant_nom || !appelant_tel || !adresse || !description) {
    showMessage('Veuillez remplir tous les champs.', true);
    return;
  }

  try {
    const response = await fetch('/api/appels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        appelant_nom,
        appelant_tel,
        adresse,
        description,
        type_urgence: selectedType,
        priorite: selectedPriority,
        latitude: currentLatitude,
        longitude: currentLongitude
      })
    });

    const result = await response.json();
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('urgenceplus_token');
        localStorage.removeItem('urgenceplus_user');
        showMessage('Session expirée, connexion requise.', true);
        setTimeout(() => {
          window.location.href = '/htlm/index.html';
        }, 800);
        return;
      }
      showMessage(result.message || 'Erreur serveur.', true);
      return;
    }

    showMessage('Appel enregistré avec succès.', false);
    appelForm.reset();
    selectedType = 'incendie';
    selectedPriority = 'critique';
    setActive(typeButtons, selectedType);
    setActive(priorityButtons, selectedPriority);
    currentLatitude = null;
    currentLongitude = null;
  } catch (err) {
    showMessage('Erreur réseau, réessayez.', true);
  }
});
