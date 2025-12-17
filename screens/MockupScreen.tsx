
import React from 'react';
import { useSession } from '../context/SessionContext';
import { UserRole } from '../types';
import { ArrowLeft, Smartphone, FileText, Layout, Play, Users, Image as ImageIcon, CheckCircle, MessageCircle } from 'lucide-react';

const MockupScreen = () => {
  const { setRole } = useSession();

  const screens = [
    { name: "Accueil", icon: Layout, desc: "Choix du rôle et logo dynamique." },
    { name: "Tableau de Bord", icon: Users, desc: "Gestion des modèles et archives (Animateur)." },
    { name: "Lobby", icon: Users, desc: "Attente des participants et code de séance." },
    { name: "Sélection", icon: ImageIcon, desc: "Grille de photos et mode focus pour le choix." },
    { name: "Tour de Parole", icon: Play, desc: "Affichage synchronisé de la photo de l'intervenant." },
    { name: "Synthèse", icon: CheckCircle, desc: "Récapitulatif visuel et nuage d'émotions." },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F6F1EA] overflow-y-auto no-scrollbar">
      {/* Navbar for Mockup */}
      <div className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm no-print">
        <button 
          onClick={() => setRole(UserRole.NONE)}
          className="flex items-center gap-2 text-gray-500 font-medium hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} /> Retour
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.print()}
            className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm"
          >
            <FileText size={18} /> Télécharger PDF / Imprimer
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 w-full">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-text mb-4">Maquette Design</h1>
          <p className="text-secondary text-lg md:text-xl max-w-2xl mx-auto">
            Une expérience fluide et intuitive pour faciliter la parole par l'image, optimisée pour tous les supports mobiles.
          </p>
        </div>

        {/* Design Specs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[32px] shadow-sm">
            <h3 className="text-primary font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Smartphone size={16} /> Mobile First
            </h3>
            <p className="text-text font-medium leading-relaxed">
              Interface tactile pensée pour une manipulation aisée en atelier, sans friction technique.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm">
            <h3 className="text-warning font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Layout size={16} /> Minimalisme
            </h3>
            <p className="text-text font-medium leading-relaxed">
              Une esthétique épurée qui laisse toute la place à l'image et à l'expression émotionnelle.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm">
            <h3 className="text-success font-black mb-4 flex items-center gap-2 uppercase tracking-widest text-xs">
              <Users size={16} /> Synchronisation
            </h3>
            <p className="text-text font-medium leading-relaxed">
              Les participants et l'animateur partagent le même état de séance en temps réel.
            </p>
          </div>
        </div>

        {/* Screens Presentation */}
        <div className="space-y-32">
          {screens.map((screen, idx) => (
            <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}>
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-6 mx-auto md:mx-0">
                  <screen.icon size={28} />
                </div>
                <h2 className="text-3xl font-black text-text">{screen.name}</h2>
                <p className="text-secondary text-lg leading-relaxed">{screen.desc}</p>
              </div>
              
              <div className="flex-1 w-full max-w-[320px] aspect-[9/19.5] bg-gray-900 rounded-[3rem] p-3 shadow-2xl relative border-[8px] border-gray-800">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-10"></div>
                <div className="w-full h-full bg-[#F6F1EA] rounded-[2.2rem] overflow-hidden relative flex flex-col items-center justify-center p-6 text-center">
                  {/* Visual representation of the screen content */}
                  <div className="w-16 h-16 rounded-2xl bg-primary mb-4 animate-pulse opacity-20"></div>
                  <div className="w-3/4 h-4 bg-gray-200 rounded-full mb-2"></div>
                  <div className="w-1/2 h-4 bg-gray-200 rounded-full mb-8"></div>
                  <div className="w-full h-12 bg-primary/10 rounded-xl mb-3"></div>
                  <div className="w-full h-12 bg-gray-100 rounded-xl"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-40 text-center border-t border-gray-200 pt-20 pb-10">
          <p className="text-secondary font-bold uppercase tracking-widest text-xs mb-4">Fin de la présentation</p>
          <p className="text-text font-medium italic opacity-50">© 2025 Photo Expression - Maquette Mobile</p>
        </div>
      </div>
    </div>
  );
};

export default MockupScreen;
