import { Link } from 'react-router-dom';
import {
  MapPin, ShieldCheck, MessageSquare, Heart, ArrowRight,
  CheckCircle, Users, Sparkles, Globe,
} from 'lucide-react';
import Logo from '../components/ui/Logo';

const features = [
  {
    icon: MapPin,
    title: 'Votre quartier',
    desc: 'Rejoignez les voisins autour de chez vous, validés par leur adresse.',
  },
  {
    icon: ShieldCheck,
    title: 'Identité vérifiée',
    desc: 'Chaque membre fournit un justificatif pour une communauté de confiance.',
  },
  {
    icon: MessageSquare,
    title: 'Messagerie temps réel',
    desc: 'Échangez en direct avec vos voisins grâce au protocole MQTT.',
  },
  {
    icon: Heart,
    title: 'Vie de quartier',
    desc: 'Partagez actualités, événements et entraidez-vous au quotidien.',
  },
];

const steps = [
  { n: '01', title: 'Créez votre compte', desc: 'Inscription gratuite en quelques secondes.' },
  { n: '02', title: 'Vérifiez votre adresse', desc: 'Envoyez un justificatif de domicile.' },
  { n: '03', title: 'Rejoignez un quartier', desc: 'Intégrez votre communauté locale.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e6edf3]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1117]/85 backdrop-blur-md border-b border-[#30363d]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo to="/" size="sm" />
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#8b949e]">
            <a href="#features" className="hover:text-[#e6edf3] transition-colors">Fonctionnalités</a>
            <a href="#how" className="hover:text-[#e6edf3] transition-colors">Comment ça marche</a>
            <a href="#stats" className="hover:text-[#e6edf3] transition-colors">Communauté</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-1.5 text-sm font-medium text-[#8b949e] hover:text-[#e6edf3] transition-colors"
            >
              Connexion
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white rounded-md transition-colors"
            >
              S'inscrire <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#30363d]/80">
        <div className="absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-emerald-500/[0.06] to-transparent pointer-events-none" />
        <div className="absolute -top-24 right-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-32 -left-32 w-[400px] h-[400px] bg-indigo-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-[#161b22] border border-[#30363d] text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Sparkles size={12} />
              Le réseau social de votre voisinage
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              Connectez-vous avec
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300">
                vos vrais voisins.
              </span>
            </h1>
            <p className="text-lg text-[#8b949e] leading-relaxed mb-8 max-w-2xl">
              QuartierLink est un réseau social privé et vérifié qui réunit les habitants
              d'un même quartier. Partagez, discutez, et tissez des liens locaux durables.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-md transition-colors"
              >
                Créer un compte gratuit <ArrowRight size={15} />
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-[#e6edf3] text-sm font-semibold rounded-md transition-colors"
              >
                En savoir plus
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-[#8b949e] flex-wrap">
              {['100% gratuit', 'Identité vérifiée', 'Sans publicité'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle size={14} className="text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="how" className="py-20 border-b border-[#30363d]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              Démarrer
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Comment ça marche
            </h2>
            <p className="text-base text-[#8b949e] max-w-xl">
              Rejoindre votre communauté ne prend que quelques minutes.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {steps.map(({ n, title, desc }) => (
              <div
                key={n}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 ql-hover-border"
              >
                <div className="inline-flex items-center justify-center size-9 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold mb-4">
                  {n}
                </div>
                <h3 className="font-semibold text-base mb-1.5 text-[#e6edf3]">{title}</h3>
                <p className="text-sm text-[#8b949e] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 border-b border-[#30363d]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
              Fonctionnalités
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Tout ce qu'il faut pour votre quartier
            </h2>
            <p className="text-base text-[#8b949e] max-w-xl">
              Des outils simples et efficaces pour créer de vrais liens entre voisins.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 ql-hover-border"
              >
                <div className="inline-flex p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="font-semibold text-sm mb-1.5 text-[#e6edf3]">{title}</h3>
                <p className="text-sm text-[#8b949e] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-20 border-b border-[#30363d]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-10">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { value: '10k+', label: 'Utilisateurs actifs', icon: Users },
                { value: '500+', label: 'Quartiers vérifiés', icon: MapPin },
                { value: '99.9%', label: 'Disponibilité', icon: ShieldCheck },
              ].map(({ value, label, icon: Icon }) => (
                <div key={label}>
                  <div className="inline-flex p-2 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3">
                    <Icon size={16} />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-[#e6edf3] mb-1">{value}</div>
                  <p className="text-sm text-[#8b949e]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Prêt à rejoindre votre quartier ?
          </h2>
          <p className="text-base text-[#8b949e] mb-7">
            Créez votre compte gratuit et commencez à échanger avec vos voisins en quelques secondes.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-md transition-colors text-sm"
          >
            Créer mon compte <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#30363d]/80 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo to="/" size="xs" />
          </div>
          <div className="flex items-center gap-5 text-xs text-[#8b949e]">
            <a href="#" className="hover:text-[#e6edf3] transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-[#e6edf3] transition-colors">Conditions</a>
            <a href="#" className="hover:text-[#e6edf3] transition-colors flex items-center gap-1.5">
              <Globe size={13} /> Site
            </a>
          </div>
          <p className="text-xs text-[#6e7681]">
            © {new Date().getFullYear()} QuartierLink
          </p>
        </div>
      </footer>
    </div>
  );
}
