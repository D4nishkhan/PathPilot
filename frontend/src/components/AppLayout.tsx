import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#06070f]">
      <Sidebar />
      <main className="flex-1 md:ml-[260px] flex flex-col min-h-screen">
        <Topbar title={title} />
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
