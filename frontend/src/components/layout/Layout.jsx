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
      <Sidebar />

      <div className="lg:pl-64">
        <TopBar />
        <main className={mainClass}>
          <PageTransition />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
