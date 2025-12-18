
import React from 'react';
import { useSession } from '../context/SessionContext';
import { UserRole } from '../types';
// Added RefreshCcw to imports
import { ArrowLeft, Smartphone, FileText, Layout, Play, Users, Image as ImageIcon, CheckCircle, MessageCircle, Layers, Palette, Eye, RefreshCcw } from 'lucide-react';
import { PHOTO_FOLDERS } from '../constants';

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
    <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar print:bg-white">
      {/* Navbar for Mockup */}
      <div className="bg-[#F6F1EA] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm no-print">
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
          <div className="w-20 h-20 bg-primary rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-primary/20">
             <Layers size={40} className="text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-text mb-4">Dossier de Conception</h1>
          <p className="text-secondary text-lg md:text-xl max-w-2xl mx-auto">
            Facilitation digitale d'ateliers de photo-expression. <br/>
            Expérience temps-réel, design minimaliste et supports visuels inclus.
          </p>
        </div>

        {/* Design Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <div className="bg-subtle p-8 rounded-[40px] border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-6">
                <Smartphone size={24} />
            </div>
            <h3 className="text-text font-black text-xl mb-2">Mobile First</h3>
            <p className="text-secondary text-sm leading-relaxed">
              Interface tactile pensée pour une manipulation aisée en atelier, sans friction technique pour les participants.
            </p>
          </div>
          <div className="bg-subtle p-8 rounded-[40px] border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-warning shadow-sm mb-6">
                <Palette size={24} />
            </div>
            <h3 className="text-text font-black text-xl mb-2">Psychologie</h3>
            <p className="text-secondary text-sm leading-relaxed">
              Usage de couleurs douces (Bleu pastel, Beige sable) pour créer un climat de confiance et de bienveillance.
            </p>
          </div>
          <div className="bg-subtle p-8 rounded-[40px] border border-gray-100">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-success shadow-sm mb-6">
                <RefreshCcw size={24} />
            </div>
            <h3 className="text-text font-black text-xl mb-2">Synchronisation</h3>
            <p className="text-secondary text-sm leading-relaxed">
              Moteur de synchronisation en temps réel assurant que tous les écrans affichent la même image au même moment.
            </p>
          </div>
        </div>

        {/* Visual Assets Section */}
        <div className="mb-32">
            <div className="flex items-center gap-3 mb-10">
                <div className="h-px bg-gray-200 flex-1"></div>
                <h2 className="text-sm font-black text-primary uppercase tracking-[0.2em] whitespace-nowrap">Supports Visuels Inclus</h2>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PHOTO_FOLDERS.map(folder => (
                    <div key={folder.id} className="group cursor-default break-inside-avoid mb-4">
                        <div className="aspect-[4/3] rounded-[32px] overflow-hidden shadow-lg mb-4 bg-gray-100 relative">
                            <img src={folder.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6">
                                <p className="text-white font-black text-xl leading-tight">{folder.name}</p>
                                <p className="text-white/70 text-xs mt-1 uppercase tracking-widest">{folder.photos.length} Images</p>
                            </div>
                        </div>
                        <p className="text-secondary text-sm px-2 leading-relaxed">{folder.description}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Screenshots Showcase */}
        <div className="space-y-32">
          {screens.map((screen, idx) => (
            <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-16 items-center break-inside-avoid pt-12`}>
              <div className="flex-1 space-y-6 text-center md:text-left">
                <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-2">
                   Écran {idx + 1}
                </div>
                <h2 className="text-4xl font-black text-text leading-none">{screen.name}</h2>
                <p className="text-secondary text-lg leading-relaxed max-w-md">{screen.desc}</p>
                <div className="flex items-center gap-4 justify-center md:justify-start pt-4">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                        <Eye size={20} />
                    </div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Aperçu interactif</p>
                </div>
              </div>
              
              <div className="flex-1 w-full max-w-[340px] aspect-[9/19.5] bg-gray-900 rounded-[3.5rem] p-4 shadow-2xl relative border-[12px] border-gray-800 scale-95 md:scale-100">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-800 rounded-b-[1.5rem] z-10 flex items-center justify-center">
                    <div className="w-12 h-1 bg-gray-700 rounded-full"></div>
                </div>
                <div className="w-full h-full bg-[#F6F1EA] rounded-[2.5rem] overflow-hidden relative flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-[2rem] bg-primary/20 flex items-center justify-center mb-6">
                      <screen.icon size={40} className="text-primary opacity-40" />
                  </div>
                  <div className="w-full h-5 bg-gray-200 rounded-full mb-3 opacity-50"></div>
                  <div className="w-2/3 h-5 bg-gray-200 rounded-full mb-10 opacity-30"></div>
                  <div className="w-full h-14 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/20 flex items-center justify-center">
                      <div className="w-1/3 h-2 bg-white/30 rounded-full"></div>
                  </div>
                  <div className="w-full h-14 bg-white rounded-2xl border border-gray-200 flex items-center justify-center">
                      <div className="w-1/4 h-2 bg-gray-100 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-40 text-center border-t border-gray-100 pt-20 pb-20">
          <div className="w-12 h-1 bg-primary mx-auto mb-10"></div>
          <p className="text-secondary font-black uppercase tracking-[0.3em] text-xs mb-4">Fin de la Maquette</p>
          <p className="text-text font-bold text-sm">Projet : Facilitateur de Parole Mobile</p>
          <p className="text-gray-300 text-xs mt-2 italic">© 2025 • Conception Exclusive</p>
        </div>
      </div>
    </div>
  );
};

export default MockupScreen;
