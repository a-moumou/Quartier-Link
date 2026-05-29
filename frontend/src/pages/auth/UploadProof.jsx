import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, X, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import api from '../../services/api';

export default function UploadProof() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const ACCEPTED = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_MB = 5;

  const handleFile = (f) => {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) { setError('Format accepté : JPG, PNG ou PDF.'); return; }
    if (f.size > MAX_MB * 1024 * 1024) { setError(`Fichier trop lourd (max ${MAX_MB} Mo).`); return; }
    setError('');
    setFile(f);
    if (f.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = (e) => setPreview(e.target.result);
      r.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };

  const submit = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('proof', file);
      await api.post('/user/upload-proof', fd, { headers: { 'Content-Type': undefined } });
      setSuccess(true);
    } catch {
      setError('Erreur lors de l\'envoi. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="size-24 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <CheckCircle size={44} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Justificatif envoyé !</h1>
          <p className="text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">
            Votre document a bien été reçu. Un administrateur vérifiera votre identité sous 24–48h.
          </p>
          <Button onClick={() => navigate('/dashboard')} size="lg">
            Accéder au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-indigo-600/12 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="size-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mx-auto mb-5">
            <Upload size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Vérification d'identité</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xs mx-auto">Envoyez un justificatif de domicile pour rejoindre votre quartier.</p>
        </div>

        <div className="bg-slate-900 border border-white/8 rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>
          )}

          {/* Drop zone */}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
              dragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/3',
            ].join(' ')}
          >
            <input ref={inputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => handleFile(e.target.files[0])} />
            {file ? (
              <div className="space-y-3">
                {preview ? (
                  <img src={preview} alt="preview" className="h-32 mx-auto rounded-xl object-contain" />
                ) : (
                  <div className="size-14 bg-slate-800 rounded-xl flex items-center justify-center mx-auto">
                    <FileText size={28} className="text-slate-500" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={12} /> Supprimer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="size-14 bg-white/5 rounded-xl flex items-center justify-center mx-auto">
                  <Upload size={24} className="text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">Glissez votre fichier ici</p>
                  <p className="text-xs text-slate-600 mt-1">ou cliquez pour sélectionner</p>
                </div>
                <p className="text-xs text-slate-600">JPG, PNG, PDF — max {MAX_MB} Mo</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-3 p-4 bg-indigo-500/8 border border-indigo-500/15 rounded-xl">
            <Info size={15} className="text-indigo-400 mt-0.5 shrink-0" />
            <p className="text-xs text-indigo-300 leading-relaxed">
              Facture EDF/eau, quittance de loyer ou avis d'imposition à votre adresse actuelle.
            </p>
          </div>

          <Button onClick={submit} loading={loading} disabled={!file} fullWidth size="lg" className="mt-5">
            Envoyer le justificatif
          </Button>
        </div>
      </div>
    </div>
  );
}
