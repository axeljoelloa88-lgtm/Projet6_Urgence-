const roleButtons = document.querySelectorAll('.role-buttons button');
const form = document.getElementById('login-form');
const messageEl = document.getElementById('login-message');
let selectedRole = 'operateur';

roleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    roleButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    selectedRole = button.dataset.role || 'operateur';
  });
});

const showMessage = (text, isError = false) => {
  messageEl.textContent = text;
  messageEl.style.color = isError ? '#ff8a8a' : '#a8ffb4';
};

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('mot-de-passe').value.trim();

  if (!email || !password) {
    showMessage('Veuillez remplir tous les champs.', true);
    return;
  }

  showMessage('Connexion en cours...');

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, mot_de_passe: password })
    });

    const result = await response.json();
    if (!response.ok) {
      showMessage(result.message || 'Identifiants incorrects', true);
      return;
    }

    const actualRole = result.utilisateur?.role;
    if (actualRole && actualRole !== selectedRole) {
      showMessage('Identifiants incorrects', true);
      return;
    }

    localStorage.setItem('urgenceplus_token', result.token);
    localStorage.setItem('urgenceplus_user', JSON.stringify(result.utilisateur));
    localStorage.setItem('urgenceplus_role', actualRole || selectedRole);

    if (actualRole === 'superviseur') {
      showMessage('Superviseur connecté : le dashboard n’est pas encore disponible pour le moment.', true);
      return;
    }

    showMessage('Connexion réussie, redirection...', false);
    setTimeout(() => {
      window.location.href = '/htlm/appel.html';
    }, 600);
  } catch (err) {
    showMessage('Erreur réseau, réessayez.', true);
  }
});
