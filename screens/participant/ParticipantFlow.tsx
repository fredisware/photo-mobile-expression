
import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { SessionStage, UserRole } from '../../types';
import { Button, Input, Card } from '../../components/Button';
import { Clock, Lock, CheckCircle, Smile, ChevronLeft, ChevronRight, Hourglass, AlertCircle, MessageCircle, Coffee, Mic, Ear, ArrowLeft, Ban, Sparkles, Heart, Grid, ZoomIn, X, PenTool, RotateCw } from 'lucide-react';

const ParticipantFlow = () => {
  const { session, joinSession, selectPhoto, setRole, removeParticipant, rotatePhoto } = useSession();
  
  // Clean state: User must type the code manually
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  // Generate random ID once per component mount to ensure uniqueness in multi-tab testing
  const [myId] = useState(() => 'user-' + Math.random().toString(36).substr(2, 9));
  
  // Check if we are already in the participants list
  const isAlreadyJoined = session.participants.some(p => p.id === myId);
  const [hasJoined, setHasJoined] = useState(isAlreadyJoined);
  
  // View State for Selection Phase
  const [selectionViewMode, setSelectionViewMode] = useState<'GRID' | 'FOCUS'>('GRID');
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Local state for emotion input
  const [showEmotionInput, setShowEmotionInput] = useState(false);
  const [emotionWord, setEmotionWord] = useState("");
  const [pendingPhotoId, setPendingPhotoId] = useState<string | null>(null);

  const me = session.participants.find(p => p.id === myId);

  // KICKED STATE: If user has joined but is no longer in the list
  if (hasJoined && !me) {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 shadow-sm">
                  <AlertCircle size={40} />
              </div>
              <h2 className="text-xl font-bold text-[#1C1C1E]">Session terminée ou exclusion</h2>
              <p className="text-[#777B80] mt-2">Vous n'êtes plus dans la liste des participants.</p>
              <Button 
                variant="ghost" 
                onClick={() => setRole(UserRole.NONE)} 
                className="mt-8"
              >
                  Retour à l'accueil
              </Button>
          </div>
      );
  }

  // STEP 1: JOIN
  if (!hasJoined) {
      const handleJoin = () => {
          setError(null);

          // Normalize inputs for comparison (Trim whitespace, UpperCase)
          const inputCode = code.trim().toUpperCase();
          const sessionCode = session.code.trim().toUpperCase();

          if (inputCode !== sessionCode) {
             setError("Code de séance invalide.");
             return;
          }
          
          if (!name.trim()) {
              setError("Merci d'entrer votre prénom.");
              return;
          }

          joinSession(sessionCode, name, myId);
          setHasJoined(true);
      };

      return (
        <div className="flex flex-col h-full px-6 pt-6 pb-6 animate-fade-in items-center justify-center max-w-md mx-auto w-full">
            <div className="w-full">
                <button 
                    onClick={() => setRole(UserRole.NONE)}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm mb-4 active:scale-95 transition-transform"
                >
                    <ArrowLeft size={20} />
                </button>

                <h1 className="text-3xl font-black text-[#1C1C1E] mb-2">Rejoindre</h1>
                <p className="text-[#777B80] mb-8">Entrez le code pour commencer.</p>
                
                <div className="space-y-4">
                    <Input 
                        placeholder="CODE (ex: XJ9-2B)" 
                        value={code} 
                        onChange={e => {
                            setCode(e.target.value);
                            setError(null);
                        }} 
                        className="text-center text-2xl tracking-widest uppercase font-bold h-16"
                    />
                    
                    <Input 
                        placeholder="Votre prénom" 
                        value={name} 
                        onChange={e => {
                            setName(e.target.value);
                            setError(null);
                        }} 
                        className="text-center text-lg h-14"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-medium flex items-center justify-center gap-2 mt-4 animate-shake text-center">
                        <Ban size={16} />
                        {error}
                    </div>
                )}
                
                <div className="mt-8">
                    <Button onClick={handleJoin} disabled={!code || !name} className="shadow-lg shadow-blue-200" fullWidth>
                        Valider
                    </Button>
                </div>
            </div>
        </div>
      );
  }

  // WAITING STATE (Lobby)
  if (session.stage === SessionStage.LOBBY) {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-200 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center text-[#4A89DA] shadow-lg">
                    <Smile size={48} strokeWidth={1.5} />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-[#1C1C1E] mb-2">Bienvenue, {me?.name} !</h2>
              <p className="text-[#777B80] max-w-xs mx-auto">
                  Installez-vous confortablement. L'animateur va bientôt lancer la séance.
              </p>
              
              <div className="mt-12">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                        removeParticipant(myId);
                        setHasJoined(false);
                        setRole(UserRole.NONE);
                    }}
                    className="text-red-400 text-sm hover:bg-red-50"
                  >
                      Annuler et quitter
                  </Button>
              </div>
          </div>
      );
  }

  // STAGE 1: PRESENTATION
  if (session.stage === SessionStage.PRESENTATION) {
      return (
          <div className="flex flex-col h-full p-6 animate-slide-up justify-center max-w-2xl mx-auto w-full">
              <div className="flex-1 flex flex-col justify-center">
                <span className="text-xs font-bold text-[#4A89DA] uppercase tracking-widest mb-4 block text-center">Thème du jour</span>
                <h1 className="text-4xl font-black text-[#1C1C1E] mb-8 text-center leading-tight md:text-6xl">{session.theme}</h1>
                
                <Card className="bg-white border border-blue-100 shadow-xl shadow-blue-50 relative overflow-hidden md:p-12">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#4A89DA]"></div>
                    <h3 className="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
                        <Sparkles size={14} className="text-[#4A89DA]" /> Votre mission
                    </h3>
                    <p className="text-xl font-medium text-[#1C1C1E] italic leading-relaxed md:text-3xl">
                        "{session.taskQuestion}"
                    </p>
                </Card>
              </div>
              <p className="text-center text-xs text-gray-400 animate-pulse">
                  L'animateur va lancer la sélection...
              </p>
          </div>
      );
  }

  // STAGE 3: SELECTION
  if (session.stage === SessionStage.SELECTION_PHASE) {
      
      // EMOTION INPUT MODAL (Always triggered now)
      if (showEmotionInput && pendingPhotoId) {
          const photo = session.photos.find(p => p.id === pendingPhotoId);
          return (
             <div className="flex flex-col h-full bg-white p-6 animate-slide-up items-center justify-center">
                 <div className="max-w-md w-full">
                    <button 
                        onClick={() => setShowEmotionInput(false)}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-6"
                    >
                        <ArrowLeft size={20} className="text-gray-500" />
                    </button>

                    <div className="w-40 h-40 rounded-3xl overflow-hidden mb-8 mx-auto shadow-lg relative">
                        <img 
                            src={photo?.url} 
                            className="w-full h-full object-cover transition-transform duration-500"
                            style={{ transform: `rotate(${photo?.rotation || 0}deg)` }}
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-[#1C1C1E] mb-2 text-center">Un mot pour résumer ?</h2>
                    <p className="text-gray-400 text-center mb-8">Quelle émotion principale vous inspire ce choix ? (Facultatif)</p>

                    <Input 
                        value={emotionWord} 
                        onChange={(e) => setEmotionWord(e.target.value)} 
                        placeholder="Ex: Sérénité, Doute..." 
                        className="text-center text-xl"
                        autoFocus
                    />
                    
                    <div className="mt-8">
                        <Button 
                            onClick={() => {
                                selectPhoto(pendingPhotoId, myId, emotionWord);
                                setShowEmotionInput(false);
                            }}
                            fullWidth
                        >
                            {emotionWord.trim() ? "Confirmer le choix" : "Confirmer (sans émotion)"}
                        </Button>
                    </div>
                 </div>
             </div>
          );
      }


      // SUB-STATE: WAITING FOR OTHERS (Selection Confirmed)
      if (me?.status === 'selected' && me?.selectedPhotoId) {
        const selectedPhoto = session.photos.find(p => p.id === me.selectedPhotoId);
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">C'est noté !</h2>
                <p className="text-[#777B80] mb-8 text-sm max-w-[200px] mx-auto">
                    Gardez votre téléphone, nous allons bientôt en parler.
                </p>

                <div className="relative w-48 h-60 rounded-2xl overflow-hidden shadow-2xl rotate-3 border-4 border-white bg-gray-200 mb-8 transition-transform hover:rotate-0 duration-500 hover:scale-105 md:w-64 md:h-80">
                    <img 
                        src={selectedPhoto?.url} 
                        className="w-full h-full object-cover transition-transform duration-500"
                        style={{ transform: `rotate(${selectedPhoto?.rotation || 0}deg)` }}
                    />
                    {me.emotionWord && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/50 backdrop-blur-sm p-2 text-white text-xs font-bold text-center">
                            {me.emotionWord}
                        </div>
                    )}
                </div>
                
                <div className="flex items-center gap-2 text-xs text-[#4A89DA] bg-blue-50 px-4 py-2 rounded-full font-bold animate-pulse">
                    <Hourglass size={14} />
                    En attente des autres...
                </div>
            </div>
        );
      }

      // SUB-STATE: BROWSING (Grid or Focus)
      const mins = Math.floor(session.timerSeconds / 60);
      const secs = session.timerSeconds % 60;

      // --- GRID VIEW ---
      if (selectionViewMode === 'GRID') {
          return (
              <div className="flex flex-col h-full bg-[#1C1C1E] text-white animate-fade-in">
                  <div className="px-5 pt-4 pb-2 z-10 sticky top-0 bg-[#1C1C1E]/95 backdrop-blur-sm flex justify-between items-center border-b border-white/5">
                      <div>
                        <h1 className="text-lg font-bold">La Table</h1>
                        <p className="text-xs text-gray-400">Touchez pour agrandir</p>
                      </div>
                      {session.isTimerRunning && (
                          <div className={`font-mono text-xl font-bold ${session.timerSeconds < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                              {mins}:{secs < 10 ? `0${secs}` : secs}
                          </div>
                      )}
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                      {/* Grid becomes 4 cols on md, 5 on lg */}
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-20">
                          {session.photos.map((photo, index) => {
                              const isTaken = photo.selectedByUserId && photo.selectedByUserId !== myId;
                              return (
                                  <div 
                                    key={photo.id}
                                    onClick={() => {
                                        setCarouselIndex(index);
                                        setSelectionViewMode('FOCUS');
                                    }}
                                    className={`
                                        relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-gray-800 transition-transform active:scale-95
                                        ${isTaken ? 'opacity-50' : 'hover:ring-2 hover:ring-blue-500 hover:scale-105 duration-300'}
                                    `}
                                  >
                                      <img 
                                        src={photo.url} 
                                        loading="lazy" 
                                        className="w-full h-full object-cover transition-transform duration-500"
                                        style={{ transform: `rotate(${photo.rotation || 0}deg)` }}
                                      />
                                      {isTaken && (
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                              <Lock size={20} className="text-white" />
                                          </div>
                                      )}
                                      {!isTaken && (
                                          <div className="absolute bottom-1 right-1 bg-black/50 p-1 rounded-full">
                                              <ZoomIn size={12} className="text-white" />
                                          </div>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                  </div>
              </div>
          );
      }

      // --- FOCUS VIEW (CAROUSEL) ---
      const currentPhoto = session.photos[carouselIndex];
      const isTaken = currentPhoto.selectedByUserId && currentPhoto.selectedByUserId !== myId;

      const handleSelect = () => {
          setPendingPhotoId(currentPhoto.id);
          setShowEmotionInput(true);
      };

      return (
          <div className="flex flex-col h-full bg-[#1C1C1E] text-white animate-fade-in">
              <div className="px-5 pt-4 pb-2 z-10 sticky top-0 bg-[#1C1C1E]/95 backdrop-blur-sm flex justify-between items-center border-b border-white/5">
                  <button 
                    onClick={() => setSelectionViewMode('GRID')}
                    className="flex items-center gap-1 text-sm font-medium text-gray-300 hover:text-white bg-white/10 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Grid size={16} />
                    Retour Grille
                  </button>
                  
                  {session.isTimerRunning && (
                      <div className={`font-mono text-xl font-bold ${session.timerSeconds < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                          {mins}:{secs < 10 ? `0${secs}` : secs}
                      </div>
                  )}
              </div>
              
              {/* Carousel View */}
              <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                  <div className="relative w-full aspect-[4/5] max-h-[55vh] md:max-h-[70vh] max-w-lg rounded-[32px] overflow-hidden shadow-2xl mb-6 bg-gray-800 border-2 border-transparent transition-all">
                      <img 
                        src={currentPhoto.url} 
                        className="w-full h-full object-cover transition-transform duration-500 ease-in-out"
                        style={{ transform: `rotate(${currentPhoto.rotation || 0}deg)` }}
                      />
                      
                      {/* Overlays */}
                      {isTaken && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col gap-2 backdrop-blur-[2px]">
                              <Lock size={48} className="text-white/50" />
                              <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Déjà prise</span>
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

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-8 mb-4">
                      <button 
                        disabled={carouselIndex === 0}
                        onClick={() => setCarouselIndex(prev => prev - 1)}
                        className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 active:bg-white/20 transition-all hover:scale-105"
                      >
                          <ChevronLeft size={28} />
                      </button>
                      
                      <span className="font-mono text-sm text-gray-400">
                          {carouselIndex + 1} / {session.photos.length}
                      </span>

                      <button 
                        disabled={carouselIndex === session.photos.length - 1}
                        onClick={() => setCarouselIndex(prev => prev + 1)}
                        className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 active:bg-white/20 transition-all hover:scale-105"
                      >
                          <ChevronRight size={28} />
                      </button>
                  </div>
              </div>
              
              {/* Footer Confirmation */}
              <div className="p-5 pb-8 bg-gradient-to-t from-black to-transparent flex justify-center">
                  <Button 
                    fullWidth 
                    className="shadow-xl h-14 text-lg max-w-md"
                    disabled={!!isTaken}
                    onClick={handleSelect}
                  >
                      {isTaken ? "Indisponible" : "Je choisis cette photo"}
                  </Button>
              </div>
          </div>
      );
  }

  // STAGE 4: SPEAKING TOUR
  if (session.stage === SessionStage.SPEAKING_TOUR) {
      const isMyTurn = session.currentSpeakerId === myId;
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const photo = session.photos.find(p => p.id === speaker?.selectedPhotoId);

      return (
          <div className="flex flex-col h-full p-6 transition-colors duration-700 ease-in-out items-center" style={{ backgroundColor: isMyTurn ? '#4A89DA' : '#F6F1EA' }}>
              
              <div className={`text-center mb-6 transition-colors duration-500 ${isMyTurn ? 'text-white' : 'text-[#1C1C1E]'}`}>
                  <h2 className="text-xs font-bold uppercase tracking-widest opacity-60 mb-3">
                      Tour de parole
                  </h2>
                  {isMyTurn ? (
                      <h1 className="text-4xl font-black animate-pulse">C'est à vous !</h1>
                  ) : speaker ? (
                      <h1 className="text-2xl font-bold">Au tour de {speaker.name}</h1>
                  ) : (
                      <h1 className="text-xl font-bold text-gray-400">En attente...</h1>
                  )}
              </div>

              {photo && speaker ? (
                  <div className="flex-1 flex flex-col items-center animate-slide-up max-w-xl w-full">
                      <div className="w-full aspect-square rounded-[32px] overflow-hidden shadow-2xl border-[6px] border-white mb-6 bg-gray-200 transform transition-transform hover:scale-[1.02] duration-500 relative group">
                          <img 
                            src={photo.url} 
                            className="w-full h-full object-cover transition-transform duration-500"
                            style={{ transform: `rotate(${photo.rotation || 0}deg)` }}
                          />
                          {/* Allow user to fix rotation even during speaking if needed */}
                          {isMyTurn && (
                              <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    rotatePhoto(photo.id);
                                }}
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                  <RotateCw size={20} />
                              </button>
                          )}
                      </div>
                      
                      {isMyTurn && (
                          <div className="bg-white/20 backdrop-blur-md text-white p-6 rounded-3xl text-center shadow-lg border border-white/20 w-full">
                              <p className="text-sm opacity-90 uppercase font-bold mb-2">Votre mission</p>
                              <p className="text-lg font-medium leading-relaxed">
                                  Expliquez pourquoi vous avez choisi cette image en réponse à : <br/>
                                  <span className="italic opacity-80 mt-1 block">"{session.taskQuestion}"</span>
                              </p>
                              {me.emotionWord && <p className="mt-4 font-bold text-yellow-300">Émotion: {me.emotionWord}</p>}
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center">
                     <p className="text-gray-400 italic">Levez la main pour prendre la parole...</p>
                  </div>
              )}
          </div>
      );
  }

  // STAGE 4.25: ROUND TRANSITION
  if (session.stage === SessionStage.ROUND_TRANSITION) {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Coffee size={40} />
              </div>
              <h2 className="text-xl font-bold text-[#1C1C1E]">Pause</h2>
              <p className="text-gray-500 mt-2">Le premier tour est terminé.</p>
              <div className="mt-8 flex items-center gap-2 text-xs text-[#4A89DA] bg-blue-50 px-4 py-2 rounded-full font-medium animate-pulse">
                  <Hourglass size={14} />
                  En attente de l'animateur...
              </div>
          </div>
      );
  }

  // STAGE 4.5: DEBATE TOUR
  if (session.stage === SessionStage.DEBATE_TOUR) {
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const subject = session.participants.find(p => p.id === session.currentSubjectId);
      const photo = session.photos.find(p => p.id === subject?.selectedPhotoId);
      
      const isMyTurn = session.currentSpeakerId === myId;
      const isMyPhoto = session.currentSubjectId === myId;

      // Theme Colors
      const bgColor = isMyTurn ? '#9333ea' : (isMyPhoto ? '#3b82f6' : '#faf5ff');
      const textColor = (isMyTurn || isMyPhoto) ? 'text-white' : 'text-[#1C1C1E]';

      return (
          <div className="flex flex-col h-full p-6 transition-colors duration-700 items-center" style={{ backgroundColor: bgColor }}>
              
              <div className={`text-center mb-8 ${textColor}`}>
                  <h2 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2 flex items-center justify-center gap-2">
                      <MessageCircle size={14} /> 2ème Tour - Réactions
                  </h2>
                  
                  {isMyTurn ? (
                       <h1 className="text-3xl font-bold animate-pulse">Réagissez !</h1>
                  ) : isMyPhoto ? (
                       <h1 className="text-2xl font-bold">On parle de vous</h1>
                  ) : (
                       <h1 className="text-2xl font-bold">{speaker?.name} réagit</h1>
                  )}
              </div>

              {photo && subject && (
                  <div className="flex-1 flex flex-col items-center justify-center animate-slide-up max-w-xl w-full">
                      <div className="w-56 h-56 rounded-[32px] overflow-hidden shadow-2xl border-4 border-white mb-8 bg-gray-200 relative group md:w-80 md:h-80">
                          <img 
                            src={photo.url} 
                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110" 
                            style={{ transform: `rotate(${photo.rotation || 0}deg)` }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-2 backdrop-blur-sm uppercase font-bold tracking-widest">
                              Photo de {subject.name}
                          </div>
                      </div>
                      
                      {isMyTurn ? (
                          <div className="bg-white/20 backdrop-blur-md text-white p-6 rounded-3xl text-center shadow-lg border border-white/20 w-full">
                              <div className="flex justify-center mb-3"><Mic size={28} /></div>
                              <p className="text-lg font-bold mb-2">Votre avis compte.</p>
                              <p className="text-sm opacity-90">Que vous évoque ce choix ?</p>
                          </div>
                      ) : isMyPhoto ? (
                           <div className="bg-white/20 backdrop-blur-md text-white p-6 rounded-3xl text-center shadow-lg border border-white/20 w-full">
                              <div className="flex justify-center mb-3"><Ear size={28} /></div>
                              <p className="text-lg font-bold mb-2">Écoute active.</p>
                              <p className="text-sm opacity-90">Acceptez le ressenti des autres.</p>
                          </div>
                      ) : (
                          <p className={`text-sm text-center opacity-70 ${textColor} max-w-[200px]`}>
                              {speaker?.name} donne son ressenti sur l'image choisie par {subject.name}.
                          </p>
                      )}
                  </div>
              )}
          </div>
      );
  }

  // STAGE 5: SYNTHESIS (Passive)
  if (session.stage === SessionStage.SYNTHESIS) {
       return (
          <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in">
              <div className="w-24 h-24 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Sparkles size={48} />
              </div>
              <h1 className="text-2xl font-bold text-[#1C1C1E]">Synthèse</h1>
              <p className="text-gray-500 mt-4 leading-relaxed">
                  L'animateur est en train de conclure la séance. <br/>
                  Merci pour vos échanges riches et bienveillants.
              </p>
          </div>
      );
  }

  // STAGE 6: ENDED
  return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in bg-white">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 shadow-sm">
              <Heart size={48} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black text-[#1C1C1E] mb-2">Merci !</h1>
          <p className="text-gray-400 mb-12">La séance est terminée.</p>
          
          <Button 
            variant="ghost" 
            onClick={() => {
                setRole(UserRole.NONE);
                setHasJoined(false);
            }}
          >
              Retour à l'accueil
          </Button>
      </div>
  );
};

export default ParticipantFlow;
