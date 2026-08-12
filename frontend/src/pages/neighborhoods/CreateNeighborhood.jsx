import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Info, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import api from '../../services/api';

async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { 'Accept-Language': 'fr' } }
    );
    const data = await res.json();
    if (data.length > 0) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { /* ignore */ }
  return null;
}

export default function CreateNeighborhood() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: '', adresse: '', description: '' });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  const set = (k) => (e) => {
    const val = e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === 'adresse') {
      setCoords(null);
      clearTimeout(debounceRef.current);
      if (val.trim().length > 5) {
        debounceRef.current = setTimeout(async () => {
          setLocating(true);
          const result = await geocode(val);
          setCoords(result);
          setLocating(false);
        }, 800);
      }
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.nom,
        address: form.adresse,
        description: form.description,
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      };
      const res = await api.post('/quartiers', payload);
      navigate(`/neighborhoods/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[#8b949e] hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft size={14} /> Retour
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-[#e6edf3] tracking-tight">Créer un quartier</h1>
        <p className="text-sm text-[#8b949e] mt-1">
          Fondez une nouvelle communauté de voisinage
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-emerald-500/5 border border-emerald-500/25 rounded-md">
        <Info size={14} className="text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-300/90 leading-relaxed">
          En créant ce quartier, vous en devenez l'administrateur. Il sera validé par un super-administrateur avant publication.
        </p>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
        {error && (
          <div className="mb-5 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Nom du quartier"
            type="text"
            placeholder="ex. Montmartre Nord"
            value={form.nom}
            onChange={set('nom')}
            required
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label="Adresse / Zone géographique"
              type="text"
              placeholder="ex. 18e arrondissement, Paris"
              icon={MapPin}
              value={form.adresse}
              onChange={set('adresse')}
              required
            />
            {locating && (
              <p className="text-xs text-[#8b949e] flex items-center gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-[#8b949e] ql-pulse-dot" />
                Géolocalisation en cours…
              </p>
            )}
            {coords && !locating && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={11} />
                Localisé ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
              </p>
            )}
          </div>

          <Input
            label="Description"
            textarea
            rows={4}
            placeholder="Décrivez votre quartier, ses spécificités, son ambiance..."
            value={form.description}
            onChange={set('description')}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link to="/dashboard">
              <Button variant="secondary" type="button">Annuler</Button>
            </Link>
            <Button type="submit" loading={loading}>Créer le quartier</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
