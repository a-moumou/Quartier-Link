import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, X, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import Logo from '../../components/ui/Logo';
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

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

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
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
        <div className="text-center max-w-md ql-fade-up">
          <div className="size-16 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-semibold text-[#e6edf3] mb-2">Justificatif envoyé</h1>
          <p className="text-sm text-[#8b949e] mb-8 max-w-sm mx-auto leading-relaxed">
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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md ql-fade-up">
        <div className="flex justify-center mb-8">
          <Logo to="/dashboard" size="md" />
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-7 shadow-xl shadow-black/30">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-[#e6edf3]">Vérification d'identité</h1>
            <p className="mt-1 text-sm text-[#8b949e]">
              Envoyez un justificatif de domicile pour rejoindre votre quartier.
            </p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-2.5 bg-red-500/10 border border-red-500/30 rounded-md text-sm text-red-400">
              {error}
            </div>
          )}

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={[
              'border-2 border-dashed rounded-lg p-7 text-center cursor-pointer transition-colors',
              dragging
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#30363d] hover:border-emerald-500/50 hover:bg-[#0f1117]',
            ].join(' ')}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            {file ? (
              <div className="space-y-3">
                {preview ? (
                  <img
                    src={preview}
                    alt="aperçu"
                    className="h-32 mx-auto rounded-md object-contain border border-[#30363d]"
                  />
                ) : (
                  <div className="size-12 bg-[#0f1117] border border-[#30363d] rounded-md flex items-center justify-center mx-auto">
                    <FileText size={22} className="text-[#8b949e]" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-[#e6edf3]">{file.name}</p>
                  <p className="text-xs text-[#8b949e] mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} Mo</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                  className="inline-flex items-center gap-1 text-xs text-[#8b949e] hover:text-red-400 transition-colors"
                >
                  <X size={12} /> Supprimer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="size-12 bg-[#0f1117] border border-[#30363d] rounded-md flex items-center justify-center mx-auto">
                  <Upload size={20} className="text-[#8b949e]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e6edf3]">Glissez votre fichier ici</p>
                  <p className="text-xs text-[#8b949e] mt-1">ou cliquez pour sélectionner</p>
                </div>
                <p className="text-xs text-[#6e7681]">JPG, PNG, PDF — max {MAX_MB} Mo</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2.5 p-3.5 bg-emerald-500/5 border border-emerald-500/25 rounded-md">
            <Info size={14} className="text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-300/90 leading-relaxed">
              Facture EDF/eau, quittance de loyer ou avis d'imposition à votre adresse actuelle.
            </p>
          </div>

          <Button
            onClick={submit}
            loading={loading}
            disabled={!file}
            fullWidth
            size="lg"
            className="mt-5"
          >
            Envoyer le justificatif
          </Button>
        </div>
      </div>
    </div>
  );
}
