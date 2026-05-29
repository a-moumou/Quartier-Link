import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, MessageSquare, Heart, ArrowRight, CheckCircle, Sparkles } from 'lucide-react';

const features = [
  { icon: MapPin,        color: 'bg-indigo-500/15 text-indigo-400',  title: 'Basé sur votre localisation',  desc: 'Rejoignez uniquement les quartiers autour de chez vous, validés par votre adresse.' },
  { icon: ShieldCheck,   color: 'bg-violet-500/15 text-violet-400',  title: 'Identité vérifiée',             desc: 'Chaque voisin fournit un justificatif de domicile pour une communauté de confiance.' },
  { icon: MessageSquare, color: 'bg-pink-500/15 text-pink-400',      title: 'Messages en temps réel',        desc: 'Échangez en privé avec vos voisins via une messagerie instantanée sécurisée.' },
  { icon: Heart,         color: 'bg-amber-500/15 text-amber-400',    title: 'Vie de quartier',               desc: 'Partagez des actualités, des événements et entraidez-vous au quotidien.' },
];

const steps = [
  { n: '01', title: 'Créez votre compte',     desc: 'Inscrivez-vous gratuitement en quelques secondes.' },
  { n: '02', title: 'Vérifiez votre adresse', desc: 'Envoyez un justificatif de domicile pour confirmer votre domicile.' },
  { n: '03', title: 'Rejoignez un quartier',  desc: 'Intégrez une communauté de voisins dans votre secteur.' },
  { n: '04', title: 'Échangez librement',     desc: 'Publiez, discutez et construisez des liens durables.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950">

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="size-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold text-white text-lg tracking-tight">QuartierLink</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#how"      className="hover:text-white transition-colors">Comment ça marche</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Connexion
            </Link>
            <Link to="/register" className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl transition-all shadow-sm shadow-indigo-500/30">
              S'inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[120px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <Sparkles size={12} />
            Nouvelle génération de lien de voisinage
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Connectez-vous<br />avec{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              vos voisins
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            QuartierLink crée du lien dans votre quartier. Partagez l'actualité,
            entraidez-vous et construisez une communauté locale forte et bienveillante.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-base">
              Rejoindre gratuitement <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/8 hover:bg-white/12 text-slate-300 font-medium rounded-xl transition-colors border border-white/10 text-base">
              Se connecter
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-slate-500 flex-wrap">
            {['100% gratuit', 'Sécurisé et privé', 'Sans publicité'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-indigo-500" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">Tout pour votre quartier</h2>
            <p className="text-lg text-slate-400 max-w-xl mx-auto">Des outils puissants pour créer de vrais liens entre voisins.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl border border-white/8 hover:border-indigo-500/30 hover:bg-white/3 transition-all duration-200 bg-slate-900">
                <div className={`inline-flex p-3 rounded-xl mb-4 ${color}`}><Icon size={22} /></div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">En 4 étapes simples</h2>
            <p className="text-lg text-slate-400">Rejoindre votre communauté ne prend que quelques minutes.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map(({ n, title, desc }) => (
              <div key={n}>
                <div className="text-5xl font-black bg-gradient-to-br from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-3 leading-none select-none">{n}</div>
                <h3 className="font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[{ value: '10k+', label: 'Utilisateurs actifs' }, { value: '500+', label: 'Quartiers créés' }, { value: '4.9 ★', label: 'Note moyenne' }].map(({ value, label }) => (
              <div key={label}>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-1">{value}</div>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl px-8 py-16 text-center overflow-hidden shadow-2xl shadow-indigo-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent)]" />
            <h2 className="relative text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">Prêt à rejoindre votre quartier ?</h2>
            <p className="relative text-indigo-100 text-lg mb-8 max-w-xl mx-auto">Créez votre compte gratuitement et commencez à échanger avec vos voisins dès aujourd'hui.</p>
            <Link to="/register" className="relative inline-flex items-center gap-2 px-8 py-3.5 bg-white hover:bg-slate-100 text-indigo-600 font-semibold rounded-xl transition-colors shadow-sm text-base">
              Créer mon compte <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="size-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">Q</span>
            </div>
            <span className="font-bold text-white">QuartierLink</span>
          </div>
          <p className="text-sm text-slate-600">© 2025 QuartierLink — Projet Bachelor</p>
          <div className="flex items-center gap-5 text-sm text-slate-600">
            <a href="#" className="hover:text-slate-300 transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-slate-300 transition-colors">CGU</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
