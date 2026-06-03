import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useUIStore } from '../store';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex min-h-screen bg-[#06070f]">
      <Sidebar />
      {/* margin-left mirrors the sidebar width on desktop and transitions in sync */}
      <main
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'md:ml-[260px]' : 'md:ml-0'
        }`}
      >
        <Topbar title={title} />
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
