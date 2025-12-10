import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
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

      </div>
    </div>
  );
};

export default Layout;