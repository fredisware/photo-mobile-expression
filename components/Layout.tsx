import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  // State to track if we are running natively (Android/iOS)
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return (
    // Background: Neutral on desktop, Theme background on mobile
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${isNative ? 'bg-[#F6F1EA]' : 'bg-gray-200'}`}>
      
      {/* 
         Responsive Container:
         - Mobile/Native: w-full h-full (Full Screen)
         - Desktop: Max width 400px, Fixed height, Rounded corners, Border, Shadow (Simulator Look)
      */}
      <div className={`
        flex flex-col relative bg-[#F6F1EA] transition-all duration-300
        ${isNative 
          ? 'w-full h-screen' // Native Mode: Full viewport 
          : 'w-full h-full sm:max-w-[400px] sm:h-[850px] sm:shadow-2xl sm:rounded-[40px] sm:border-8 sm:border-gray-800 sm:overflow-hidden' // Desktop Mode: Phone Frame
        }
      `}>
        
        {/* Fake Notch / Status Bar - Only visible on Desktop Simulator */}
        {!isNative && (
           <div className="hidden sm:flex h-8 bg-[#F6F1EA] items-end justify-center pb-2 z-10 shrink-0 select-none">
             <div className="w-20 h-5 bg-black rounded-b-xl"></div>
           </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto relative no-scrollbar flex flex-col">
           {children}
        </main>

        {/* Fake Home Bar - Only visible on Desktop Simulator */}
        {!isNative && (
            <div className="hidden sm:flex h-6 bg-[#F6F1EA] items-start justify-center pt-2 shrink-0">
                <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
            </div>
        )}

      </div>
    </div>
  );
};

export default Layout;