import React from 'react';
import { useSession } from '../context/SessionContext';
import { UserRole } from '../types';
import { RotateCw } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { role, setRole } = useSession();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      {/* Mobile Frame Simulation */}
      <div className="w-full max-w-[400px] h-[850px] bg-[#F6F1EA] shadow-2xl overflow-hidden relative flex flex-col sm:rounded-[30px] border-4 border-gray-800">
        
        {/* Dynamic Notch / Status Bar Area */}
        <div className="h-10 bg-[#F6F1EA] flex items-end justify-center pb-2 z-10 shrink-0">
          <div className="w-16 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Content Area - Scrollable */}
        <main className="flex-1 overflow-y-auto relative no-scrollbar flex flex-col">
           {children}
        </main>

        {/* Footer / Safe Area */}
        <div className="h-6 bg-[#F6F1EA] shrink-0"></div>

        {/* --- DEMO CONTROLS (Floating Overlay) --- */}
        <div className="absolute bottom-4 right-4 bg-gray-900/90 text-white p-2 rounded-full shadow-lg z-50 flex items-center gap-2 pr-4 pl-3 scale-75 origin-bottom-right">
           <button 
             onClick={() => setRole(role === UserRole.ANIMATEUR ? UserRole.PARTICIPANT : UserRole.ANIMATEUR)}
             className="flex items-center gap-2 text-xs font-bold"
           >
             <RotateCw size={14} />
             {role === UserRole.ANIMATEUR ? 'Vue Animateur' : role === UserRole.PARTICIPANT ? 'Vue Participant' : 'Menu'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default Layout;
