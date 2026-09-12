import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attache le JWT à chaque requête automatiquement
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

// Un 401 recouvre deux situations très différentes :
//   - sur /auth/* : les identifiants fournis sont mauvais. C'est une réponse
//     normale, que le formulaire doit afficher lui-même.
//   - ailleurs : le jeton a expiré ou n'est plus valide. Là, on nettoie la
//     session et on renvoie vers la page de connexion.
// Rediriger dans les deux cas rechargeait la page avant que le message
// d'erreur ait pu s'afficher.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const tentativeAuth = url.startsWith('/auth/');
    const sessionOuverte = Boolean(localStorage.getItem('token'));

    if (error.response?.status === 401 && !tentativeAuth && sessionOuverte) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
