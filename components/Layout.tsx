
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    // Background global
    <div className="min-h-screen w-full bg-[#F4F4F7] flex flex-col items-center">
      
      {/* 
         Conteneur Responsive :
         - Mobile : 100% width/height
         - Desktop : Centré, largeur max raisonnable (pour ne pas étirer le texte à l'infini),
                     mais assez large pour un dashboard (max-w-6xl).
         - Ombre et fond blanc/beige sur desktop pour délimiter l'app.
      */}
      <div className="w-full h-screen md:h-auto md:min-h-screen bg-[#F6F1EA] md:shadow-xl md:my-0 md:mx-auto max-w-[1400px] flex flex-col relative overflow-hidden">
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto relative no-scrollbar flex flex-col">
           {children}
        </main>

      </div>
    </div>
  );
};

export default Layout;
