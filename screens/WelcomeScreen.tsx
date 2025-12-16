import React from 'react';
import { useSession } from '../context/SessionContext';
import { UserRole } from '../types';
import { Image, Users, Sparkles, ChevronRight } from 'lucide-react';

const WelcomeScreen = () => {
  const { setRole } = useSession();

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#4A89DA]/10 to-[#F6F1EA]">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-[#4A89DA] blur-3xl opacity-20 rounded-full animate-pulse"></div>
            <div className="relative w-32 h-32 bg-transparent transform hover:scale-105 transition-transform duration-500 drop-shadow-2xl">
                {/* Inline SVG Logo to ensure it displays correctly */}
                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <rect width="512" height="512" rx="128" fill="#4A89DA"/>
                    <path d="M368 144H144C117.49 144 96 165.49 96 192V320C96 346.51 117.49 368 144 368H368C394.51 368 416 346.51 416 320V192C416 165.49 394.51 144 368 144Z" fill="white" fillOpacity="0.2"/>
                    <circle cx="256" cy="256" r="90" stroke="white" strokeWidth="32"/>
                    <circle cx="256" cy="256" r="36" fill="white"/>
                    <circle cx="370" cy="142" r="40" fill="#A4D5A8" stroke="#4A89DA" strokeWidth="8"/>
                    <path d="M160 200H190" stroke="white" strokeWidth="12" strokeLinecap="round"/>
                </svg>
            </div>
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow-lg animate-bounce">
                <Sparkles size={16} />
            </div>
        </div>
        
        <h1 className="text-3xl font-black text-[#1C1C1E] mb-3 tracking-tight">
            Photo Expression
        </h1>
        <p className="text-[#777B80] text-lg leading-relaxed max-w-[260px]">
            Facilitez vos ateliers et libérez la parole par l'image.
        </p>
      </div>

      {/* Action Card */}
      <div className="bg-white rounded-t-[32px] p-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] animate-slide-up">
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 text-center">
            Commencer en tant que
        </h2>
        
        <div className="flex flex-col gap-4">
            <button 
                onClick={() => setRole(UserRole.ANIMATEUR)}
                className="group flex items-center justify-between p-4 rounded-2xl border border-blue-100 hover:border-[#4A89DA] bg-blue-50/50 hover:bg-blue-50 transition-all active:scale-95"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#4A89DA] text-white flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <Users size={24} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-[#1C1C1E] text-lg">Animateur</span>
                        <span className="text-xs text-[#4A89DA] font-medium">Créer & Gérer</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-gray-300 group-hover:text-[#4A89DA]" />
            </button>

            <button 
                onClick={() => setRole(UserRole.PARTICIPANT)}
                className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <Image size={24} />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-[#1C1C1E] text-lg">Participant</span>
                        <span className="text-xs text-gray-500 font-medium">Rejoindre une séance</span>
                    </div>
                </div>
                <ChevronRight size={20} className="text-gray-300" />
            </button>
        </div>

        <p className="text-center text-[10px] text-gray-300 mt-8 font-medium">
            v1.0.0 • Mobile Experience
        </p>
      </div>
    </div>
  );
};

export default WelcomeScreen;