import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import PageTransition from './PageTransition';

export default function Layout() {
  const { pathname } = useLocation();

  const isWide =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/super-admin') ||
    pathname.startsWith('/neighborhoods');
  const isMessages = pathname.startsWith('/messages');

  const mainClass = [
    'mx-auto w-full',
    'max-w-2xl',
    isWide ? 'lg:max-w-6xl' : isMessages ? 'lg:max-w-6xl' : 'lg:max-w-4xl',
    'pt-16 pb-24 px-4 sm:px-6',
    'lg:pt-8 lg:pb-10 lg:px-8',
  ].join(' ');

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e6edf3]">
      {/* RGAA 12.7 — lien d'evitement. Invisible a la souris, il apparait
          des la premiere tabulation et permet de sauter la navigation
          pour atteindre directement le contenu. Sans lui, un utilisateur
          au clavier ou au lecteur d'ecran retraverse toute la barre
          laterale a chaque changement de page. */}
      <a
        href="#contenu-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50
                   focus:rounded-md focus:bg-emerald-500 focus:px-4 focus:py-2
                   focus:text-sm focus:font-medium focus:text-white focus:shadow-lg"
      >
        Aller au contenu principal
      </a>

      <Sidebar />

      <div className="lg:pl-64">
        <TopBar />
        <main id="contenu-principal" tabIndex={-1} className={mainClass}>
          <PageTransition />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
