import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-[120px] font-black leading-none bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-transparent select-none">404</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Page introuvable</h1>
        <p className="mt-2 text-slate-400 text-sm max-w-xs mx-auto">La page que vous cherchez n'existe pas ou a été déplacée.</p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/"><Button variant="dark">Accueil</Button></Link>
          <Link to="/dashboard"><Button>Tableau de bord</Button></Link>
        </div>
      </div>
    </div>
  );
}
