import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import Button from '../components/ui/Button';
import Logo from '../components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="text-center max-w-md ql-fade-up">
        <div className="flex justify-center mb-8">
          <Logo to="/" size="md" />
        </div>

        <p className="text-[120px] sm:text-[160px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-emerald-500/40 to-emerald-500/5 select-none">
          404
        </p>

        <h1 className="mt-2 text-2xl font-semibold text-[#e6edf3] tracking-tight">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-[#8b949e] max-w-xs mx-auto leading-relaxed">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>

        <div className="mt-8 flex items-center justify-center gap-2">
          <Link to="/">
            <Button variant="secondary" size="md">
              <ArrowLeft size={14} /> Accueil
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button size="md">
              <Home size={14} /> Tableau de bord
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
