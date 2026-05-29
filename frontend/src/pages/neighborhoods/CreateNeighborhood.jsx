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
    <div className="space-y-6 max-w-2xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-400 transition-colors">
        <ArrowLeft size={16} /> Retour
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Créer un quartier</h1>
        <p className="text-sm text-slate-500 mt-1">Fondez une nouvelle communauté de voisinage</p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
        <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" />
        <p className="text-sm text-indigo-300 leading-relaxed">
          En créant ce quartier, vous en devenez l'administrateur. Il sera validé par un super-administrateur avant publication.
        </p>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-white/8 p-6">
        {error && (
          <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
        )}
        <form onSubmit={submit} className="space-y-5">
          <Input label="Nom du quartier" type="text" placeholder="ex. Montmartre Nord" value={form.nom} onChange={set('nom')} required />

          <div className="flex flex-col gap-1.5">
            <Input label="Adresse / Zone géographique" type="text" placeholder="ex. 18e arrondissement, Paris" icon={MapPin} value={form.adresse} onChange={set('adresse')} required />
            {locating && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-slate-500 animate-pulse" />
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

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Description</label>
            <textarea
              placeholder="Décrivez votre quartier, ses spécificités, son ambiance..."
              value={form.description} onChange={set('description')} rows={4}
              className="w-full rounded-xl text-sm text-white bg-slate-800 border border-white/8 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent hover:border-white/15 transition-all px-4 py-2.5 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link to="/"><Button variant="secondary" type="button">Annuler</Button></Link>
            <Button type="submit" loading={loading}>Créer le quartier</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
