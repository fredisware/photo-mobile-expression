import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { SessionStage, UserRole } from '../../types';
import { Button, Input, Card } from '../../components/Button';
import { Clock, Lock, CheckCircle, Smile, ChevronLeft, ChevronRight, Hourglass, AlertCircle, MessageCircle, Coffee, Mic, Ear, ArrowLeft } from 'lucide-react';

const ParticipantFlow = () => {
  const { session, joinSession, selectPhoto, setRole } = useSession();
  const [code, setCode] = useState("");
  
  // LOGIG: Current user ID simulation
  const myId = 'current-user';
  
  // Check if we are already in the participants list (e.g. via auto-join from Animateur switch)
  const isAlreadyJoined = session.participants.some(p => p.id === myId);
  const [hasJoined, setHasJoined] = useState(isAlreadyJoined);
  
  const [carouselIndex, setCarouselIndex] = useState(0);

  const me = session.participants.find(p => p.id === myId);

  // KICKED STATE: If user has joined but is no longer in the list
  if (hasJoined && !me) {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6">
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
      return (
        <div className="flex flex-col h-full px-6 pt-6 pb-6">
            <button 
                onClick={() => setRole(UserRole.NONE)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm mb-4"
            >
                <ArrowLeft size={20} />
            </button>

            <h1 className="text-2xl font-bold text-[#1C1C1E] mb-2">Rejoindre</h1>
            <p className="text-[#777B80] mb-8">Entrez le code fourni par l'animateur</p>
            
            <Input 
                placeholder="Code (ex: XJ9-2B)" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                className="text-center text-2xl tracking-widest uppercase font-bold"
            />
            
            <div className="flex-1"></div>
            <Button onClick={() => {
                joinSession(code, "Moi");
                setHasJoined(true);
            }}>Valider</Button>
        </div>
      );
  }

  // WAITING STATE (Lobby)
  if (session.stage === SessionStage.LOBBY) {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-[#4A89DA] mb-6 animate-pulse">
                  <Smile size={40} />
              </div>
              <h2 className="text-xl font-bold text-[#1C1C1E]">Bienvenue !</h2>
              <p className="text-[#777B80] mt-2">En attente de l'animateur pour démarrer...</p>
              
              <div className="mt-12">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                        setHasJoined(false);
                        setRole(UserRole.NONE);
                    }}
                    className="text-red-400 text-sm"
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
          <div className="flex flex-col h-full p-6">
              <h2 className="text-xs font-bold text-[#4A89DA] uppercase mb-4">Thème du jour</h2>
              <h1 className="text-3xl font-bold text-[#1C1C1E] mb-8">{session.theme}</h1>
              
              <Card className="bg-white border border-blue-100">
                  <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase">Votre mission</h3>
                  <p className="text-lg font-medium text-[#1C1C1E]">"{session.taskQuestion}"</p>
              </Card>
          </div>
      );
  }

  // STAGE 2: SILENT PHASE
  if (session.stage === SessionStage.SILENT_PHASE) {
      const mins = Math.floor(session.timerSeconds / 60);
      const secs = session.timerSeconds % 60;
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 bg-[#1C1C1E] text-white">
              <Clock size={48} className="text-[#4A89DA] mb-6" />
              <h2 className="text-2xl font-bold mb-2">Réflexion</h2>
              <p className="text-gray-400 text-center mb-8">Visualisez l'image qui répond le mieux à la question...</p>
              <div className="text-6xl font-mono font-bold">
                  {mins}:{secs < 10 ? `0${secs}` : secs}
              </div>
          </div>
      );
  }

  // STAGE 3: SELECTION (CAROUSEL)
  if (session.stage === SessionStage.SELECTION_PHASE) {
      // SUB-STATE: WAITING FOR OTHERS (Selection Confirmed)
      if (me?.status === 'selected' && me?.selectedPhotoId) {
        const selectedPhoto = session.photos.find(p => p.id === me.selectedPhotoId);
        return (
            <div className="flex flex-col h-full items-center justify-center p-6 text-center animate-fade-in">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <CheckCircle size={32} />
                </div>
                <h2 className="text-xl font-bold text-[#1C1C1E] mb-2">Choix enregistré !</h2>
                <p className="text-[#777B80] mb-8 text-sm">Préparez-vous à partager votre ressenti.</p>

                <div className="relative w-48 h-60 rounded-2xl overflow-hidden shadow-xl rotate-3 border-4 border-white bg-gray-200 mb-8 transition-transform hover:rotate-0 duration-300">
                    <img src={selectedPhoto?.url} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex items-center gap-2 text-xs text-[#4A89DA] bg-blue-50 px-3 py-2 rounded-full font-medium animate-pulse">
                    <Hourglass size={14} />
                    En attente des autres participants...
                </div>
            </div>
        );
      }

      // SUB-STATE: BROWSING
      const currentPhoto = session.photos[carouselIndex];
      const isTaken = currentPhoto.selectedByUserId && currentPhoto.selectedByUserId !== myId;
      const mins = Math.floor(session.timerSeconds / 60);
      const secs = session.timerSeconds % 60;

      return (
          <div className="flex flex-col h-full bg-[#1C1C1E] text-white">
              <div className="px-5 pt-4 pb-2 z-10 sticky top-0 bg-[#1C1C1E]/90 backdrop-blur-sm flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-bold">Choisissez une photo</h1>
                    <p className="text-xs text-gray-400">Une seule photo possible.</p>
                  </div>
                  {session.isTimerRunning && (
                      <div className={`font-mono text-xl font-bold ${session.timerSeconds < 60 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                          {mins}:{secs < 10 ? `0${secs}` : secs}
                      </div>
                  )}
              </div>
              
              {/* Carousel View */}
              <div className="flex-1 flex flex-col items-center justify-center p-4">
                  <div className="relative w-full aspect-[4/5] max-h-[55vh] rounded-[32px] overflow-hidden shadow-2xl mb-6 bg-gray-800 border-2 border-transparent transition-all">
                      <img src={currentPhoto.url} className="w-full h-full object-cover" />
                      
                      {/* Overlays */}
                      {isTaken && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col gap-2">
                              <Lock size={48} className="text-white/50" />
                              <span className="text-sm font-bold text-white/50 uppercase tracking-widest">Déjà choisie</span>
                          </div>
                      )}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center gap-6 mb-4">
                      <button 
                        disabled={carouselIndex === 0}
                        onClick={() => setCarouselIndex(prev => prev - 1)}
                        className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 active:bg-white/20 transition-colors"
                      >
                          <ChevronLeft size={24} />
                      </button>
                      
                      <span className="font-mono text-sm text-gray-400">
                          {carouselIndex + 1} / {session.photos.length}
                      </span>

                      <button 
                        disabled={carouselIndex === session.photos.length - 1}
                        onClick={() => setCarouselIndex(prev => prev + 1)}
                        className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30 active:bg-white/20 transition-colors"
                      >
                          <ChevronRight size={24} />
                      </button>
                  </div>
              </div>
              
              {/* Footer Confirmation */}
              <div className="p-5 pb-8 bg-gradient-to-t from-black to-transparent">
                  <Button 
                    fullWidth 
                    className="shadow-xl"
                    disabled={!!isTaken}
                    onClick={() => selectPhoto(currentPhoto.id, myId)}
                  >
                      {isTaken ? "Photo indisponible" : "Choisir cette photo"}
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
          <div className="flex flex-col h-full p-6 transition-colors duration-500" style={{ backgroundColor: isMyTurn ? '#4A89DA' : '#F6F1EA' }}>
              
              <div className={`text-center mb-8 ${isMyTurn ? 'text-white' : 'text-[#1C1C1E]'}`}>
                  <h2 className="text-sm font-bold uppercase tracking-wider opacity-70 mb-2">Tour de parole</h2>
                  {isMyTurn ? (
                      <h1 className="text-3xl font-bold">À vous !</h1>
                  ) : (
                      <h1 className="text-2xl font-bold">C'est au tour de {speaker?.name}</h1>
                  )}
              </div>

              {photo && (
                  <div className="flex-1 flex flex-col items-center">
                      <div className="w-full aspect-square rounded-[32px] overflow-hidden shadow-2xl border-4 border-white mb-6 bg-gray-200">
                          <img src={photo.url} className="w-full h-full object-cover" />
                      </div>
                      
                      {isMyTurn && (
                          <div className="bg-white/20 backdrop-blur-md text-white p-4 rounded-xl text-center text-sm">
                              Expliquez pourquoi vous avez choisi cette image en lien avec : <br/>
                              <strong>"{session.taskQuestion}"</strong>
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  }

  // STAGE 4.25: ROUND TRANSITION
  if (session.stage === SessionStage.ROUND_TRANSITION) {
      return (
          <div className="flex flex-col h-full items-center justify-center p-6 text-center">
              <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                  <Coffee size={40} />
              </div>
              <h2 className="text-xl font-bold text-[#1C1C1E]">1er Tour terminé</h2>
              <p className="text-gray-500 mt-2">En attente de la décision de l'animateur pour la suite...</p>
          </div>
      );
  }

  // STAGE 4.5: DEBATE TOUR (INDIVIDUAL REACTION ROUND N*(N-1))
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
          <div className="flex flex-col h-full p-6 transition-colors duration-500" style={{ backgroundColor: bgColor }}>
              
              <div className={`text-center mb-8 ${textColor}`}>
                  <h2 className="text-sm font-bold uppercase tracking-wider opacity-70 mb-2 flex items-center justify-center gap-2">
                      <MessageCircle size={14} /> 2ème Tour - Réaction
                  </h2>
                  
                  {isMyTurn ? (
                       <h1 className="text-3xl font-bold animate-pulse">À vous de réagir !</h1>
                  ) : isMyPhoto ? (
                       <h1 className="text-2xl font-bold">On parle de votre photo</h1>
                  ) : (
                       <h1 className="text-2xl font-bold">{speaker?.name} réagit</h1>
                  )}
              </div>

              {photo && subject && (
                  <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-48 h-48 rounded-[24px] overflow-hidden shadow-2xl border-4 border-white mb-6 bg-gray-200 relative">
                          <img src={photo.url} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1 backdrop-blur-sm">
                              Photo de {subject.name}
                          </div>
                      </div>
                      
                      {isMyTurn ? (
                          <div className="bg-white/20 backdrop-blur-md text-white p-6 rounded-2xl text-center shadow-lg">
                              <div className="flex justify-center mb-2"><Mic size={24} /></div>
                              <p className="text-lg font-bold mb-2">Commentez la photo de {subject.name}.</p>
                              <p className="text-sm opacity-90">Qu'est-ce qu'elle vous évoque ?</p>
                          </div>
                      ) : isMyPhoto ? (
                           <div className="bg-white/20 backdrop-blur-md text-white p-6 rounded-2xl text-center shadow-lg">
                              <div className="flex justify-center mb-2"><Ear size={24} /></div>
                              <p className="text-lg font-bold mb-2">Écoutez {speaker?.name}.</p>
                              <p className="text-sm opacity-90">Il/Elle donne son avis sur votre choix.</p>
                          </div>
                      ) : (
                          <p className={`text-sm text-center opacity-80 ${textColor}`}>
                              {speaker?.name} commente la photo de {subject.name}.
                          </p>
                      )}
                  </div>
              )}
          </div>
      );
  }

  // STAGE 5: END
  return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-[#1C1C1E]">Séance terminée</h1>
          <p className="text-gray-500 mt-2">Merci de votre participation.</p>
      </div>
  );
};

export default ParticipantFlow;