
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSession } from '../../context/SessionContext';
import { SessionStage, UserRole, SessionTemplate } from '../../types';
import CreateSession from './CreateSession';
import { Button, Card, Input } from '../../components/Button';
import { Play, Pause, FastForward, CheckCircle, Users, Clock, Image as ImageIcon, MessageCircle, FileText, UserPlus, X, ChevronLeft, ChevronRight, Smartphone, EyeOff, Scale, MicOff, Lock, Trash2, Shuffle, Plus, Repeat, ArrowRight, LogOut, AlertTriangle, User, Share2, Archive, Hand, Mic, StopCircle, Cloud, ArrowLeft, RotateCw } from 'lucide-react';
import { MOCK_PHOTOS } from '../../constants';

// Extracted component to prevent re-renders losing input focus
const GuestAddForm = ({ onAdd }: { onAdd: (name: string) => void }) => {
    const [name, setName] = useState("");

    return (
        <div className="bg-blue-50 rounded-2xl p-4 mb-2 border border-blue-100">
            <h4 className="text-xs font-bold text-[#4A89DA] uppercase mb-3 flex items-center gap-2">
                <UserPlus size={14} /> Ajouter sans mobile
            </h4>
            <div className="flex gap-2">
                <input 
                    className="flex-1 h-10 rounded-xl px-3 text-sm border border-blue-200 focus:outline-none focus:border-[#4A89DA]"
                    placeholder="Nom du participant..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && name.trim()) {
                            onAdd(name);
                            setName("");
                        }
                    }}
                />
                <button 
                    type="button"
                    className="bg-[#4A89DA] text-white h-10 w-10 rounded-xl flex items-center justify-center shadow-sm disabled:opacity-50"
                    disabled={!name.trim()}
                    onClick={() => {
                        onAdd(name);
                        setName("");
                    }}
                >
                    +
                </button>
            </div>
        </div>
    );
};

// Custom Modal Component
const ConfirmModal = ({ isOpen, title, message, icon: Icon, confirmLabel, confirmVariant = 'danger', onConfirm, onCancel, alternateAction }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-fade-in no-print">
            <div className="bg-white rounded-[24px] p-6 shadow-2xl w-full max-w-xs text-center transform transition-all scale-100 animate-slide-up">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmVariant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    <Icon size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">{title}</h3>
                 <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
                 <div className="flex flex-col gap-3">
                     <Button variant={confirmVariant} onClick={onConfirm} fullWidth>{confirmLabel}</Button>
                     {alternateAction && (
                         <Button variant="secondary" onClick={alternateAction.onClick} fullWidth className="bg-gray-50">{alternateAction.label}</Button>
                     )}
                     <Button variant="ghost" onClick={onCancel} fullWidth>Annuler</Button>
                 </div>
            </div>
        </div>
    );
};

const AnimateurFlow = () => {
  const { 
    session, startSession, toggleTimer, startSelectionPhase, 
    startSpeakingTour, startDebateTour, nextSpeaker, setSpeaker, endSession, goToRoundTransition, resetSession, updateNotes, addGuestParticipant, 
    selectPhoto, removeParticipant, addTime, forceRandomSelection, setRole, saveTemplate, deleteTemplate, rotatePhoto
  } = useSession();
  
  const [selectingForGuestId, setSelectingForGuestId] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [guestEmotion, setGuestEmotion] = useState("");
  
  // Animateur Self-Join State
  const [animateurName, setAnimateurName] = useState("Animateur");
  const [showAnimateurJoin, setShowAnimateurJoin] = useState(false);

  // Modal States
  const [participantToDelete, setParticipantToDelete] = useState<{id: string, name: string} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  // Archive & Close Logic
  const handleArchiveAndClose = () => {
      // 1. Delete the original template if it exists (moving it to history essentially)
      if (session.originTemplateId) {
          deleteTemplate(session.originTemplateId);
      }

      // Generate a text summary of selections
      const selectionSummary = session.participants
          .filter(p => p.selectedPhotoId)
          .map(p => {
              const photo = session.photos.find(ph => ph.id === p.selectedPhotoId);
              return `- ${p.name}: ${p.emotionWord ? `"${p.emotionWord}"` : 'Sans émotion'} (Photo #${p.selectedPhotoId})`;
          })
          .join('\n');

      const fullNotes = `${session.notes ? session.notes + '\n\n' : ''}=== RÉCAPITULATIF DES CHOIX ===\n${selectionSummary}`;

      // 2. Create snapshot as a template marked archived
      const archive: SessionTemplate = {
          id: `archive-${Date.now()}`,
          title: session.theme,
          question: session.taskQuestion,
          description: "Séance archivée",
          defaultFolderId: 'social', 
          icon: 'Archive',
          isSystem: false,
          archived: true,
          archiveNotes: fullNotes,
          archiveDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      };
      
      saveTemplate(archive);
      resetSession();
      setRole(UserRole.NONE);
      setShowResetConfirm(false);
  };

  const handleCloseWithoutArchive = () => {
      resetSession();
      setRole(UserRole.NONE);
      setShowResetConfirm(false);
  };

  // STAGE 0: Create (if default state)
  if (!session.theme) {
      return <CreateSession />;
  }

  // HEADER for all Animateur Screens
  const Header = ({ title, stage }: {title: string, stage: string}) => (
      <div className="pt-6 px-5 mb-4">
          <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-bold text-[#4A89DA] uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap">{stage}</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-md whitespace-nowrap">Code: {session.code}</span>
                </div>
                <h1 className="text-2xl font-bold text-[#1C1C1E] leading-tight md:text-3xl">{title}</h1>
              </div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#4A89DA] font-bold text-xs shrink-0 ml-2">
                  {session.participants.length}p
              </div>
          </div>
      </div>
  );

  // STAGE 0.5: LOBBY
  if (session.stage === SessionStage.LOBBY) {
      const isAnimateurParticipating = session.participants.some(p => p.roleLabel === "Animateur");

      return (
          <div className="flex flex-col h-full px-5 pt-6 pb-6 relative animate-fade-in md:px-10 md:max-w-6xl md:mx-auto w-full">
              <ConfirmModal 
                  isOpen={!!participantToDelete}
                  title="Exclure le participant ?"
                  message={`Voulez-vous vraiment retirer ${participantToDelete?.name} de la séance ?`}
                  icon={Trash2}
                  confirmLabel="Oui, exclure"
                  confirmVariant="danger"
                  onConfirm={() => {
                      if (participantToDelete) removeParticipant(participantToDelete.id);
                      setParticipantToDelete(null);
                  }}
                  onCancel={() => setParticipantToDelete(null)}
              />

              {/* Desktop Layout: Split View */}
              <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
                
                {/* Left Column: Code & Actions */}
                <div className="md:w-1/3 flex flex-col gap-6">
                    <div className="bg-white rounded-[32px] p-8 text-center shadow-sm">
                        <p className="text-gray-400 uppercase text-xs font-bold mb-2">Code de séance</p>
                        <h1 className="text-5xl font-black text-[#1C1C1E] tracking-widest">{session.code}</h1>
                    </div>
                    
                    <div className="hidden md:block">
                         <GuestAddForm onAdd={(name) => addGuestParticipant(name)} />
                    </div>

                    <div className="hidden md:block">
                        <Button onClick={startSession} fullWidth>Démarrer l'atelier</Button>
                    </div>
                </div>

                {/* Right Column: Participants List */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <h3 className="text-sm font-bold text-gray-400">PARTICIPANTS ({session.participants.length})</h3>
                    </div>

                    <div className="md:hidden mb-4">
                         <GuestAddForm onAdd={(name) => addGuestParticipant(name)} />
                    </div>

                    {/* Self Join Button */}
                    {!isAnimateurParticipating && !showAnimateurJoin && (
                        <div className="flex justify-center mb-6">
                            <button 
                                onClick={() => setShowAnimateurJoin(true)}
                                className="text-xs font-bold text-[#4A89DA] flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm"
                            >
                                <UserPlus size={12} />
                                Je participe (Animateur)
                            </button>
                        </div>
                    )}
                    
                    {showAnimateurJoin && (
                        <div className="bg-blue-50 rounded-2xl p-4 mb-6 border border-blue-100 animate-fade-in">
                            <h4 className="text-xs font-bold text-[#4A89DA] uppercase mb-3 flex items-center gap-2">
                                <User size={14} /> Votre nom
                            </h4>
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 h-10 rounded-xl px-3 text-sm border border-blue-200 focus:outline-none focus:border-[#4A89DA]"
                                    placeholder="Nom..."
                                    value={animateurName}
                                    onChange={(e) => setAnimateurName(e.target.value)}
                                />
                                <button 
                                    className="bg-[#4A89DA] text-white h-10 px-3 rounded-xl flex items-center justify-center shadow-sm text-xs font-bold"
                                    onClick={() => {
                                        addGuestParticipant(animateurName, "Animateur");
                                        setShowAnimateurJoin(false);
                                    }}
                                >
                                    Rejoindre
                                </button>
                                <button 
                                    className="bg-white text-gray-400 h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
                                    onClick={() => setShowAnimateurJoin(false)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                            {session.participants.map(p => (
                                <div key={p.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm group relative">
                                    <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[#1C1C1E] truncate">{p.name}</span>
                                            {p.roleLabel && (
                                                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase shrink-0">
                                                    {p.roleLabel}
                                                </span>
                                            )}
                                        </div>
                                        {p.isGuest ? (
                                            <div className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                                Invité
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-[10px] text-green-600 font-medium w-fit mt-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> Connecté
                                            </div>
                                        )}
                                    </div>
                                    <div 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setParticipantToDelete({ id: p.id, name: p.name });
                                        }}
                                        className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer shadow-sm active:scale-95 shrink-0"
                                    >
                                        <Trash2 size={18} className="pointer-events-none" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>

              <div className="md:hidden mt-4">
                  <Button onClick={startSession}>Démarrer l'atelier</Button>
              </div>
          </div>
      );
  }

  // STAGE 1: PRESENTATION
  if (session.stage === SessionStage.PRESENTATION) {
      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in md:px-10 md:max-w-4xl md:mx-auto">
              <Header title={session.theme} stage="Présentation" />
              
              <div className="flex-1 overflow-y-auto no-scrollbar">
                  <Card className="bg-[#4A89DA] text-white mb-6 md:p-10 md:text-center">
                      <h3 className="opacity-80 text-sm font-medium mb-2">Tâche-question</h3>
                      <p className="text-xl font-medium leading-relaxed md:text-3xl">"{session.taskQuestion}"</p>
                  </Card>
                  
                  <h3 className="text-xs font-bold text-gray-400 uppercase px-2 mb-4">Règles de l'atelier</h3>
                  <div className="space-y-4 px-2 pb-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    {/* Rules Content */}
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0"><CheckCircle size={16} /></div><p className="text-sm text-gray-600">Il n'y a pas de bonne ou de mauvaise réponse.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Scale size={16} /></div><p className="text-sm text-gray-600">Il n'y a pas de jugement.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Lock size={16} /></div><p className="text-sm text-gray-600">Ce qui se dit dans l'atelier reste dans l'atelier.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Users size={16} /></div><p className="text-sm text-gray-600">La participation n'est pas facultative.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0"><EyeOff size={16} /></div><p className="text-sm text-gray-600">Il n'y a pas d'obligation d'assiduité.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><MessageCircle size={16} /></div><p className="text-sm text-gray-600">Nous gardons une attitude respectueuse.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Smartphone size={16} /></div><p className="text-sm text-gray-600">Nous mettons nos portables en silencieux uniquement.</p></div>
                  </div>
              </div>

              <Button onClick={startSelectionPhase}>Lancer le choix des photos</Button>
          </div>
      );
  }

  // STAGE 3: SELECTION MONITORING
  if (session.stage === SessionStage.SELECTION_PHASE) {
      const selectedCount = session.participants.filter(p => p.status === 'selected').length;
      const progress = (selectedCount / session.participants.length) * 100;
      const mins = Math.floor(session.timerSeconds / 60);
      const secs = session.timerSeconds % 60;
      const allSelected = selectedCount === session.participants.length && session.participants.length > 0;

      // Guest Selection Carousel (Modal)
      if (selectingForGuestId) {
          const guest = session.participants.find(p => p.id === selectingForGuestId);
          const currentPhoto = session.photos[carouselIndex];
          const isTaken = currentPhoto.selectedByUserId && currentPhoto.selectedByUserId !== selectingForGuestId;

          return (
              <div className="flex flex-col h-full bg-[#1C1C1E] text-white animate-fade-in fixed inset-0 z-50">
                  <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
                    {/* Modal Header */}
                    <div className="px-5 pt-6 pb-2 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-400 uppercase">Choisir pour</p>
                            <h2 className="text-xl font-bold">{guest?.name}</h2>
                        </div>
                        <button onClick={() => { setSelectingForGuestId(null); setGuestEmotion(""); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Carousel Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                        <div className={`relative w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl mb-6 bg-gray-800 transition-all max-h-[50vh] max-w-sm`}>
                            <img 
                                src={currentPhoto.url} 
                                className="w-full h-full object-cover transition-transform duration-500"
                                style={{ transform: `rotate(${currentPhoto.rotation || 0}deg)` }}
                            />
                            {isTaken && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col gap-2">
                                    <Lock size={48} className="text-white/50" />
                                    <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Déjà choisie</span>
                                </div>
                            )}
                            {/* Rotate Button Overlay */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    rotatePhoto(currentPhoto.id);
                                }}
                                className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-20 backdrop-blur-sm"
                                title="Pivoter la photo"
                            >
                                <RotateCw size={24} />
                            </button>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-6 mb-4">
                            <button 
                                disabled={carouselIndex === 0}
                                onClick={() => setCarouselIndex(prev => prev - 1)}
                                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            
                            <span className="font-mono text-sm text-gray-400">
                                {carouselIndex + 1} / {session.photos.length}
                            </span>

                            <button 
                                disabled={carouselIndex === session.photos.length - 1}
                                onClick={() => setCarouselIndex(prev => prev + 1)}
                                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        {!isTaken && (
                            <div className="w-full max-w-xs mb-2">
                                <input 
                                    value={guestEmotion}
                                    onChange={(e) => setGuestEmotion(e.target.value)}
                                    placeholder="Mot-clé émotion (facultatif)..."
                                    className="w-full h-12 bg-white/10 border border-white/20 rounded-[14px] px-4 text-center text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all"
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="p-5 pb-8 bg-gradient-to-t from-black to-transparent flex justify-center">
                        <Button 
                            className="max-w-md w-full"
                            disabled={!!isTaken}
                            onClick={() => {
                                selectPhoto(currentPhoto.id, selectingForGuestId, guestEmotion);
                                setSelectingForGuestId(null);
                                setGuestEmotion("");
                            }}
                        >
                            {isTaken ? "Non disponible" : "Sélectionner cette photo"}
                        </Button>
                    </div>
                  </div>
              </div>
          )
      }

      return (
          <div className="flex flex-col h-full px-5 pb-6 relative animate-fade-in md:px-10 md:max-w-6xl md:mx-auto w-full">
              <ConfirmModal 
                  isOpen={!!participantToDelete}
                  title="Exclure le participant ?"
                  message={`Voulez-vous vraiment retirer ${participantToDelete?.name} de la séance ?`}
                  icon={Trash2}
                  confirmLabel="Oui, exclure"
                  confirmVariant="danger"
                  onConfirm={() => {
                      if (participantToDelete) removeParticipant(participantToDelete.id);
                      setParticipantToDelete(null);
                  }}
                  onCancel={() => setParticipantToDelete(null)}
              />

              <ConfirmModal 
                  isOpen={showForceConfirm}
                  title="Forcer la sélection ?"
                  message="Cela va attribuer des photos aléatoires aux retardataires et démarrer le tour de parole immédiatement."
                  icon={Shuffle}
                  confirmLabel="Oui, lancer"
                  confirmVariant="primary"
                  onConfirm={() => {
                      forceRandomSelection();
                      setShowForceConfirm(false);
                  }}
                  onCancel={() => setShowForceConfirm(false)}
              />

              <Header title="Choix des photos" stage="Sélection" />

              <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
                  <div className="md:w-1/3 flex flex-col gap-4">
                      {/* Timer & Controls */}
                      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-50 text-[#4A89DA] flex items-center justify-center font-bold">
                                <Clock size={20} />
                              </div>
                              <div>
                                  <p className="text-xs text-gray-400 font-bold uppercase">Temps restant</p>
                                  <p className={`text-xl font-mono font-bold ${session.timerSeconds < 60 ? 'text-red-500' : 'text-[#1C1C1E]'}`}>
                                      {mins}:{secs < 10 ? `0${secs}` : secs}
                                  </p>
                              </div>
                          </div>
                          <button 
                            onClick={() => addTime(60)}
                            className="flex items-center gap-1 bg-gray-100 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200"
                          >
                              <Plus size={14} /> 1 min
                          </button>
                      </div>

                      <Card>
                          <div className="flex justify-between items-end mb-2">
                              <span className="text-3xl font-bold text-[#4A89DA]">{selectedCount}/{session.participants.length}</span>
                              <span className="text-sm text-gray-400 mb-1">participants ont choisi</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#4A89DA] transition-all duration-500" style={{width: `${progress}%`}}></div>
                          </div>
                      </Card>
                      
                      {/* Action buttons on desktop go here */}
                      <div className="hidden md:flex flex-col gap-3 mt-4">
                        {allSelected ? (
                            <Button onClick={startSpeakingTour}>Lancer le tour de parole</Button>
                        ) : (
                            <Button 
                                variant="secondary" 
                                onClick={() => setShowForceConfirm(true)}
                                className="gap-2"
                            >
                                <Shuffle size={18} />
                                Forcer sélection & Démarrer
                            </Button>
                        )}
                      </div>
                  </div>

                  <div className="flex-1 flex flex-col overflow-hidden">
                     <h3 className="text-sm font-bold text-gray-400 mb-4 px-2">STATUS</h3>
                     <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                            {session.participants.map(p => (
                                <div key={p.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-transparent transition-colors group relative">
                                    <div className="relative">
                                        <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-100" />
                                        {p.status === 'selected' && <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5"><CheckCircle size={12} /></div>}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[#1C1C1E] block">{p.name}</span>
                                            {p.roleLabel && (
                                                <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase">
                                                    {p.roleLabel}
                                                </span>
                                            )}
                                        </div>
                                        {p.isGuest && p.status !== 'selected' && (
                                            <button 
                                                onClick={() => {
                                                    setCarouselIndex(0);
                                                    setSelectingForGuestId(p.id);
                                                    setGuestEmotion("");
                                                }}
                                                className="text-xs text-[#4A89DA] font-bold underline mt-1"
                                            >
                                                Choisir la photo
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setParticipantToDelete({ id: p.id, name: p.name });
                                        }}
                                        className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer shadow-sm active:scale-95"
                                    >
                                        <Trash2 size={18} className="pointer-events-none" />
                                    </div>

                                    <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${p.status === 'selected' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {p.status === 'selected' ? 'OK' : '...'}
                                    </span>
                                </div>
                            ))}
                        </div>
                     </div>
                  </div>
              </div>

              {/* Mobile Actions */}
              <div className="md:hidden mt-4">
                {allSelected ? (
                    <Button onClick={startSpeakingTour}>Lancer le tour de parole</Button>
                ) : (
                    <Button 
                        variant="secondary" 
                        onClick={() => setShowForceConfirm(true)}
                        className="gap-2"
                    >
                        <Shuffle size={18} />
                        Forcer sélection & Démarrer
                    </Button>
                )}
              </div>
          </div>
      );
  }

  // STAGE 4: SPEAKING TOUR (FIRST ROUND - VOLUNTARY)
  if (session.stage === SessionStage.SPEAKING_TOUR) {
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const photo = session.photos.find(p => p.id === speaker?.selectedPhotoId);
      
      const participantsWithPhotos = session.participants.filter(p => p.selectedPhotoId);

      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in md:px-10 md:max-w-7xl md:mx-auto w-full">
              <div className="pt-6 mb-4 flex justify-between items-center">
                 <h1 className="text-lg font-bold text-[#1C1C1E] md:text-2xl">Tour de parole</h1>
                 <div className="flex items-center gap-2">
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold">Volontaire</span>
                    <button 
                        onClick={() => {
                             if (session.currentSpeakerId) setSpeaker(undefined, true);
                             goToRoundTransition();
                        }}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                    >
                        <ChevronRight size={16} />
                    </button>
                 </div>
              </div>

              {/* Desktop Split View */}
              <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                
                {/* List of Speakers */}
                <div className={`flex-1 flex flex-col md:max-w-md ${speaker ? 'hidden md:flex' : 'flex'}`}>
                     <p className="text-sm text-gray-500 mb-4 px-2">Cliquez sur un participant pour lui donner la parole.</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto no-scrollbar pb-20 md:pb-0">
                          {participantsWithPhotos.map(p => {
                              const isDone = p.status === 'done';
                              const isActive = p.id === session.currentSpeakerId;
                              return (
                                  <div 
                                    key={p.id}
                                    onClick={() => setSpeaker(p.id)}
                                    className={`
                                        bg-white p-3 rounded-2xl flex flex-col items-center gap-2 text-center shadow-sm cursor-pointer border-2 transition-all active:scale-95
                                        ${isActive ? 'border-blue-500 ring-4 ring-blue-100' : (isDone ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-transparent hover:border-blue-200')}
                                    `}
                                  >
                                      <div className="relative">
                                        <img src={p.avatar} className={`w-12 h-12 rounded-full ${isDone ? 'grayscale' : ''}`} />
                                        {!isDone && <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-sm"><Hand size={10} /></div>}
                                      </div>
                                      
                                      <div className="w-full">
                                        <h3 className="text-sm font-bold text-[#1C1C1E] truncate">{p.name}</h3>
                                        {p.emotionWord && (
                                            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-full mt-1 inline-block truncate max-w-full">
                                                {p.emotionWord}
                                            </span>
                                        )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                </div>

                {/* Active Speaker Area */}
                <div className={`flex-1 flex flex-col gap-4 animate-slide-up ${!speaker ? 'hidden md:flex md:items-center md:justify-center md:bg-gray-50 md:rounded-3xl' : ''}`}>
                    {!speaker ? (
                        <p className="text-gray-400 font-medium">Sélectionnez un participant à gauche.</p>
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-2 md:hidden">
                                <button 
                                    onClick={() => setSpeaker(undefined, false)}
                                    className="text-sm text-gray-500 flex items-center gap-1 font-medium hover:text-gray-800"
                                >
                                    <ArrowLeft size={16} /> Retour liste
                                </button>
                                <button 
                                    onClick={() => setSpeaker(undefined, true)}
                                    className="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                                >
                                    <StopCircle size={14} /> Finir tour
                                </button>
                            </div>

                            {/* Active Photo */}
                            {photo && (
                                <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-square bg-gray-100 md:max-h-[500px] md:w-auto md:mx-auto">
                                    <img 
                                        src={photo.url} 
                                        className="w-full h-full object-cover transition-transform duration-500"
                                        style={{ transform: `rotate(${photo.rotation || 0}deg)` }}
                                    />
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
                                        <div className="flex items-center gap-3 text-white">
                                            <img src={speaker.avatar} className="w-8 h-8 rounded-full border border-white" />
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{speaker.name}</span>
                                                    {speaker.roleLabel && (
                                                        <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-md uppercase font-bold">{speaker.roleLabel}</span>
                                                    )}
                                                </div>
                                                {speaker.emotionWord && (
                                                    <span className="text-xs font-medium text-yellow-300 italic">"{speaker.emotionWord}"</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            rotatePhoto(photo.id);
                                        }}
                                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors z-20"
                                    >
                                        <RotateCw size={20} />
                                    </button>
                                </div>
                            )}

                            {/* Notes Section & Desktop Actions */}
                            <div className="flex-1 flex flex-col gap-4">
                                <div className="hidden md:flex justify-end">
                                     <button 
                                        onClick={() => setSpeaker(undefined, true)}
                                        className="bg-red-50 text-red-500 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-colors"
                                    >
                                        <StopCircle size={18} /> Terminer l'intervention de {speaker.name}
                                    </button>
                                </div>
                                <Card className="flex-1 flex flex-col">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Notes Animateur</h3>
                                    <textarea 
                                        className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-[#1C1C1E]" 
                                        placeholder="Prendre des notes sur l'intervention..."
                                        value={session.notes}
                                        onChange={(e) => updateNotes(e.target.value)}
                                    />
                                </Card>
                            </div>
                        </>
                    )}
                </div>
              </div>
          </div>
      );
  }

  // STAGE 4.25: ROUND TRANSITION
  if (session.stage === SessionStage.ROUND_TRANSITION) {
      return (
          <div className="flex flex-col h-full px-5 pb-6 pt-10 text-center animate-fade-in md:justify-center md:max-w-lg md:mx-auto">
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-md animate-bounce">
                      <CheckCircle size={40} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">1er Tour Terminé</h1>
                    <p className="text-gray-500 mt-2">Tous les participants se sont exprimés.</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 w-full max-w-sm">
                      <h3 className="text-sm font-bold text-purple-600 mb-1">Option : Débat</h3>
                      <p className="text-xs text-gray-500">
                          Relancer un tour complet où chacun peut réagir sur les photos des autres.
                      </p>
                  </div>
              </div>

              <div className="flex flex-col gap-3">
                  <Button 
                      type="button"
                      variant="primary" 
                      fullWidth 
                      className="gap-2 bg-purple-600 text-white shadow-purple-200 h-14"
                      onClick={startDebateTour}
                  >
                      <Repeat size={20} /> Lancer 2ème tour (Débat)
                  </Button>
                  <Button 
                      type="button"
                      variant="secondary" 
                      fullWidth 
                      className="gap-2"
                      onClick={endSession}
                  >
                      Terminer (Synthèse) <ArrowRight size={16} />
                  </Button>
              </div>
          </div>
      );
  }

    // STAGE 4.5: DEBATE TOUR (SECOND ROUND - INDIVIDUAL REACTIONS)
  if (session.stage === SessionStage.DEBATE_TOUR) {
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const subject = session.participants.find(p => p.id === session.currentSubjectId);
      const photo = session.photos.find(p => p.id === subject?.selectedPhotoId);

      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in md:px-10 md:max-w-4xl md:mx-auto">
              <div className="pt-6 mb-4 flex justify-between items-center">
                 <h1 className="text-lg font-bold text-[#1C1C1E] md:text-2xl">Tour de réaction</h1>
                 <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-md font-bold">2ème Tour</span>
              </div>

              {speaker && subject && photo ? (
                  <div className="flex-1 flex flex-col gap-4 animate-slide-up">
                      {/* Interaction Visualizer */}
                      <div className="flex items-center justify-center gap-4 mb-2">
                            <div className="flex flex-col items-center">
                                <img src={speaker.avatar} className="w-12 h-12 rounded-full border-2 border-purple-500 shadow-lg" />
                                <span className="text-[10px] font-bold mt-1 text-purple-600">PARLE</span>
                            </div>
                            <ArrowRight size={20} className="text-gray-300" />
                            <div className="flex flex-col items-center opacity-70 scale-90">
                                <img src={subject.avatar} className="w-12 h-12 rounded-full border-2 border-gray-300" />
                                <span className="text-[10px] font-bold mt-1 text-gray-400">ÉCOUTE</span>
                            </div>
                      </div>

                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Active Subject Photo */}
                        <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-square bg-gray-100 border-4 border-purple-100 md:w-1/2">
                            <img 
                                src={photo.url} 
                                className="w-full h-full object-cover opacity-90 transition-transform duration-500"
                                style={{ transform: `rotate(${photo.rotation || 0}deg)` }}
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                                <div className="text-white">
                                        <span className="text-xs opacity-80 uppercase tracking-widest block mb-1">Photo de {subject.name}</span>
                                        <span className="font-bold block text-lg leading-tight">Intervention de {speaker.name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <Card className="flex-1 flex flex-col bg-purple-50 border-purple-100 md:h-auto">
                            <h3 className="text-xs font-bold text-purple-400 uppercase mb-2">Notes Débat</h3>
                            <textarea 
                                className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-[#1C1C1E] min-h-[150px]" 
                                placeholder={`Notes sur la réaction de ${speaker.name}...`}
                                value={session.notes}
                                onChange={(e) => updateNotes(e.target.value)}
                            />
                        </Card>
                      </div>
                  </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                      Chargement...
                  </div>
              )}

              <Button onClick={nextSpeaker} className="mt-4 flex justify-between px-6 bg-purple-600 text-white shadow-purple-200">
                  <span>Suivant</span>
                  <FastForward size={20} />
              </Button>
          </div>
      );
  }

  // STAGE 5: SYNTHESIS / END
  if (session.stage === SessionStage.SYNTHESIS || session.stage === SessionStage.ENDED) {
      const allEmotions = session.participants
        .map(p => p.emotionWord)
        .filter(w => w && w.trim().length > 0) as string[];

      const participantsWithPhotos = session.participants.filter(p => p.selectedPhotoId);

      return (
          <>
            <div className="flex flex-col h-full px-5 pb-6 relative animate-fade-in bg-white md:px-10 md:max-w-6xl md:mx-auto">
                <ConfirmModal 
                  isOpen={showResetConfirm}
                  title="Archiver cette séance ?"
                  message="Souhaitez-vous sauvegarder cette séance et son compte-rendu dans vos archives ?"
                  icon={Archive}
                  confirmLabel="Oui, archiver et quitter"
                  confirmVariant="primary"
                  onConfirm={handleArchiveAndClose}
                  onCancel={() => setShowResetConfirm(false)}
                  alternateAction={{
                      label: "Ne pas archiver (Supprimer)",
                      onClick: handleCloseWithoutArchive
                  }}
              />

                <Header title="Synthèse" stage="Fin de séance" />
                
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {/* VISUAL RECAP GRID (Always visible for print/screen) */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <ImageIcon size={16} /> Récapitulatif Visuel
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {participantsWithPhotos.map(p => {
                                const photo = session.photos.find(ph => ph.id === p.selectedPhotoId);
                                return (
                                    <div key={p.id} className="print-card rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 break-inside-avoid">
                                        <div className="aspect-square bg-gray-200 overflow-hidden">
                                            <img 
                                                src={photo?.url} 
                                                className="w-full h-full object-cover transition-transform duration-500"
                                                style={{ transform: `rotate(${photo?.rotation || 0}deg)` }}
                                            />
                                        </div>
                                        <div className="p-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <img src={p.avatar} className="w-6 h-6 rounded-full" />
                                                <span className="font-bold text-sm text-[#1C1C1E] truncate">{p.name}</span>
                                            </div>
                                            {p.emotionWord && (
                                                <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                                                    "{p.emotionWord}"
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {allEmotions.length > 0 && (
                            <Card className="bg-blue-50 border-blue-100 mb-6 print-card h-fit">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#4A89DA] flex items-center justify-center">
                                        <Cloud size={16} />
                                    </div>
                                    <h2 className="text-sm font-bold text-blue-800 uppercase">Nuage d'émotions</h2>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {allEmotions.map((word, i) => (
                                        <span 
                                            key={i} 
                                            className="bg-white text-[#4A89DA] px-3 py-1.5 rounded-xl shadow-sm font-bold text-sm"
                                            style={{ transform: `scale(${0.9 + Math.random() * 0.3})` }}
                                        >
                                            {word}
                                        </span>
                                    ))}
                                </div>
                            </Card>
                        )}

                        <Card className="bg-yellow-50 border-yellow-100 mb-6 print-card h-fit">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <h2 className="text-sm font-bold text-yellow-800 uppercase">Compte-rendu</h2>
                            </div>
                            <p className="text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-wrap font-mono text-justify">
                                {session.notes || "Aucune note prise durant la séance."}
                            </p>
                        </Card>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-4 no-print md:max-w-md md:mx-auto">
                    <Button 
                        type="button"
                        fullWidth 
                        onClick={() => setShowResetConfirm(true)}
                        className="bg-gray-900 text-white"
                    >
                        Clôturer la séance
                    </Button>
                </div>
            </div>
          </>
      );
  }

  return null;
};

export default AnimateurFlow;
