import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useSession } from '../../context/SessionContext';
import { SessionStage, UserRole } from '../../types';
import CreateSession from './CreateSession';
import { Button, Card, Input } from '../../components/Button';
import { Play, Pause, FastForward, CheckCircle, Users, Clock, Image as ImageIcon, MessageCircle, FileText, UserPlus, X, ChevronLeft, ChevronRight, Smartphone, EyeOff, Scale, MicOff, Lock, Trash2, Shuffle, Plus, Repeat, ArrowRight, LogOut, AlertTriangle, User, Share2 } from 'lucide-react';
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
const ConfirmModal = ({ isOpen, title, message, icon: Icon, confirmLabel, confirmVariant = 'danger', onConfirm, onCancel }: any) => {
    if (!isOpen) return null;
    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-fade-in">
            <div className="bg-white rounded-[24px] p-6 shadow-2xl w-full max-w-xs text-center transform transition-all scale-100 animate-slide-up">
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmVariant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                    <Icon size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">{title}</h3>
                 <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
                 <div className="flex flex-col gap-3">
                     <Button variant={confirmVariant} onClick={onConfirm} fullWidth>{confirmLabel}</Button>
                     <Button variant="ghost" onClick={onCancel} fullWidth>Annuler</Button>
                 </div>
            </div>
        </div>
    );
};

const AnimateurFlow = () => {
  const { 
    session, startSession, toggleTimer, startSelectionPhase, 
    startSpeakingTour, startDebateTour, nextSpeaker, endSession, resetSession, updateNotes, addGuestParticipant, 
    selectPhoto, removeParticipant, addTime, forceRandomSelection, setRole
  } = useSession();
  
  const [selectingForGuestId, setSelectingForGuestId] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // Animateur Self-Join State
  const [animateurName, setAnimateurName] = useState("Animateur");
  const [showAnimateurJoin, setShowAnimateurJoin] = useState(false);

  // Modal States
  const [participantToDelete, setParticipantToDelete] = useState<{id: string, name: string} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

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
                <h1 className="text-2xl font-bold text-[#1C1C1E] leading-tight">{title}</h1>
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
          <div className="flex flex-col h-full px-5 pt-6 pb-6 relative animate-fade-in">
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

              <div className="bg-white rounded-[32px] p-8 text-center shadow-sm mb-6 mt-10">
                  <p className="text-gray-400 uppercase text-xs font-bold mb-2">Code de séance</p>
                  <h1 className="text-5xl font-black text-[#1C1C1E] tracking-widest">{session.code}</h1>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-sm font-bold text-gray-400">PARTICIPANTS ({session.participants.length})</h3>
                </div>
                
                <GuestAddForm onAdd={(name) => addGuestParticipant(name)} />
                
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

                <div className="grid grid-cols-1 gap-3 pb-4">
                    {session.participants.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm group relative">
                            <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-100" />
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-[#1C1C1E]">{p.name}</span>
                                    {p.roleLabel && (
                                        <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase">
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
                            {/* Replaced button with a robust clickable div to ensure clicks work on mobile/all contexts */}
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
                        </div>
                    ))}
                </div>
              </div>

              <Button onClick={startSession}>Démarrer l'atelier</Button>
          </div>
      );
  }

  // STAGE 1: PRESENTATION
  if (session.stage === SessionStage.PRESENTATION) {
      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in">
              <Header title={session.theme} stage="Présentation" />
              
              <div className="flex-1 overflow-y-auto no-scrollbar">
                  <Card className="bg-[#4A89DA] text-white mb-6">
                      <h3 className="opacity-80 text-sm font-medium mb-2">Tâche-question</h3>
                      <p className="text-xl font-medium leading-relaxed">"{session.taskQuestion}"</p>
                  </Card>
                  
                  <h3 className="text-xs font-bold text-gray-400 uppercase px-2 mb-4">Règles de l'atelier</h3>
                  <div className="space-y-4 px-2 pb-4">
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

      // Guest Selection Carousel
      if (selectingForGuestId) {
          const guest = session.participants.find(p => p.id === selectingForGuestId);
          const currentPhoto = session.photos[carouselIndex];
          const isTaken = currentPhoto.selectedByUserId && currentPhoto.selectedByUserId !== selectingForGuestId;

          return (
              <div className="flex flex-col h-full bg-[#1C1C1E] text-white animate-fade-in">
                  {/* Modal Header */}
                  <div className="px-5 pt-6 pb-2 flex items-center justify-between">
                      <div>
                          <p className="text-xs text-gray-400 uppercase">Choisir pour</p>
                          <h2 className="text-xl font-bold">{guest?.name}</h2>
                      </div>
                      <button onClick={() => setSelectingForGuestId(null)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Carousel Content */}
                  <div className="flex-1 flex flex-col items-center justify-center p-4">
                      <div className="relative w-full aspect-[4/5] max-h-[60vh] rounded-[32px] overflow-hidden shadow-2xl mb-6 bg-gray-800">
                          <img src={currentPhoto.url} className="w-full h-full object-cover" />
                          {isTaken && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col gap-2">
                                  <Lock size={48} className="text-white/50" />
                                  <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Déjà choisie</span>
                              </div>
                          )}
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
                  </div>

                  {/* Action Footer */}
                  <div className="p-5 pb-8 bg-gradient-to-t from-black to-transparent">
                      <Button 
                        fullWidth 
                        disabled={!!isTaken}
                        onClick={() => {
                            selectPhoto(currentPhoto.id, selectingForGuestId);
                            setSelectingForGuestId(null);
                        }}
                      >
                          {isTaken ? "Non disponible" : "Sélectionner cette photo"}
                      </Button>
                  </div>
              </div>
          )
      }

      return (
          <div className="flex flex-col h-full px-5 pb-6 relative animate-fade-in">
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

              {/* Timer & Controls */}
              <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm mb-4">
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

              <div className="flex-1 overflow-y-auto no-scrollbar">
                 <Card className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-bold text-[#4A89DA]">{selectedCount}/{session.participants.length}</span>
                        <span className="text-sm text-gray-400 mb-1">participants ont choisi</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4A89DA] transition-all duration-500" style={{width: `${progress}%`}}></div>
                    </div>
                 </Card>
                 
                 <h3 className="text-sm font-bold text-gray-400 mb-4 px-2">STATUS</h3>
                 <div className="grid grid-cols-1 gap-3 pb-4">
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
                                        }}
                                        className="text-xs text-[#4A89DA] font-bold underline mt-1"
                                    >
                                        Choisir la photo
                                    </button>
                                )}
                            </div>
                            
                            {/* Robust Delete Button */}
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
      );
  }

  // STAGE 4: SPEAKING TOUR (FIRST ROUND)
  if (session.stage === SessionStage.SPEAKING_TOUR) {
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const photo = session.photos.find(p => p.id === speaker?.selectedPhotoId);

      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in">
              <div className="pt-6 mb-4 flex justify-between items-center">
                 <h1 className="text-lg font-bold text-[#1C1C1E]">Tour de parole</h1>
                 <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold">1er Tour</span>
              </div>

              {speaker && photo ? (
                  <div className="flex-1 flex flex-col gap-4 animate-slide-up">
                      {/* Active Photo */}
                      <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-square bg-gray-100">
                          <img src={photo.url} className="w-full h-full object-cover" />
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
                                    {speaker.isGuest && !speaker.roleLabel && <span className="text-xs opacity-80">Invité</span>}
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Notes Section */}
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
              ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                      Chargement...
                  </div>
              )}

              <Button onClick={nextSpeaker} className="mt-4 flex justify-between px-6">
                  <span>Suivant</span>
                  <FastForward size={20} />
              </Button>
          </div>
      );
  }

  // STAGE 4.25: ROUND TRANSITION
  if (session.stage === SessionStage.ROUND_TRANSITION) {
      return (
          <div className="flex flex-col h-full px-5 pb-6 pt-10 text-center animate-fade-in">
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
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in">
              <div className="pt-6 mb-4 flex justify-between items-center">
                 <h1 className="text-lg font-bold text-[#1C1C1E]">Tour de réaction</h1>
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

                      {/* Active Subject Photo */}
                      <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-square bg-gray-100 border-4 border-purple-100">
                          <img src={photo.url} className="w-full h-full object-cover opacity-90" />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12">
                              <div className="text-white">
                                    <span className="text-xs opacity-80 uppercase tracking-widest block mb-1">Photo de {subject.name}</span>
                                    <span className="font-bold block text-lg leading-tight">Intervention de {speaker.name}</span>
                              </div>
                          </div>
                      </div>

                      {/* Notes Section */}
                      <Card className="flex-1 flex flex-col bg-purple-50 border-purple-100">
                          <h3 className="text-xs font-bold text-purple-400 uppercase mb-2">Notes Débat</h3>
                          <textarea 
                             className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm text-[#1C1C1E]" 
                             placeholder={`Notes sur la réaction de ${speaker.name}...`}
                             value={session.notes}
                             onChange={(e) => updateNotes(e.target.value)}
                          />
                      </Card>
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
      return (
          <>
            <div className="flex flex-col h-full px-5 pb-6 relative animate-fade-in">
                <ConfirmModal 
                  isOpen={showResetConfirm}
                  title="Fermer la séance ?"
                  message="Voulez-vous vraiment quitter et réinitialiser toutes les données de la séance ?"
                  icon={AlertTriangle}
                  confirmLabel="Oui, fermer"
                  confirmVariant="danger"
                  onConfirm={() => {
                      resetSession();
                      setRole(UserRole.NONE);
                      setShowResetConfirm(false);
                  }}
                  onCancel={() => setShowResetConfirm(false)}
              />

                <Header title="Synthèse" stage="Fin de séance" />
                
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    <Card className="bg-yellow-50 border-yellow-100 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                                <FileText size={16} />
                            </div>
                            <h2 className="text-sm font-bold text-yellow-800 uppercase">Compte-rendu</h2>
                        </div>
                        <p className="text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-wrap">
                            {session.notes || "Aucune note prise durant la séance."}
                        </p>
                    </Card>

                    <div className="p-4 bg-blue-50 rounded-2xl text-center">
                        <h3 className="text-blue-800 font-bold mb-2">Conseil</h3>
                        <p className="text-blue-600 text-xs">
                            Prenez une capture d'écran de ces notes avant de fermer la séance.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
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