import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { SessionStage } from '../../types';
import { Button, Input, Card } from '../../components/Button';
import { Clock, Lock, CheckCircle, Smile } from 'lucide-react';

const ParticipantFlow = () => {
  const { session, joinSession, selectPhoto } = useSession();
  const [code, setCode] = useState("");
  const [hasJoined, setHasJoined] = useState(false);

  // LOGIG: Current user ID simulation
  const myId = 'current-user';
  const me = session.participants.find(p => p.id === myId);

  // STEP 1: JOIN
  if (!hasJoined) {
      return (
        <div className="flex flex-col h-full px-6 pt-12 pb-6">
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

  // STAGE 3: SELECTION
  if (session.stage === SessionStage.SELECTION_PHASE) {
      return (
          <div className="flex flex-col h-full">
              <div className="px-5 pt-4 pb-2 bg-[#F6F1EA] z-10 sticky top-0">
                  <h1 className="text-lg font-bold">Choisissez une photo</h1>
                  <p className="text-xs text-gray-500">Une seule photo possible.</p>
              </div>
              
              <div className="p-4 grid grid-cols-2 gap-3 overflow-y-auto pb-20">
                  {session.photos.map(photo => {
                      const isSelectedByMe = me?.selectedPhotoId === photo.id;
                      const isTaken = photo.selectedByUserId && !isSelectedByMe;

                      return (
                          <div 
                            key={photo.id} 
                            onClick={() => !isTaken && selectPhoto(photo.id)}
                            className={`
                                relative aspect-square rounded-xl overflow-hidden transition-all duration-300
                                ${isSelectedByMe ? 'ring-4 ring-[#4A89DA] scale-95' : ''}
                                ${isTaken ? 'opacity-40 grayscale' : 'active:scale-95'}
                            `}
                          >
                              <img src={photo.url} className="w-full h-full object-cover" />
                              
                              {/* Overlays */}
                              {isSelectedByMe && (
                                  <div className="absolute inset-0 bg-[#4A89DA]/20 flex items-center justify-center">
                                      <div className="bg-[#4A89DA] text-white rounded-full p-2">
                                        <CheckCircle size={24} />
                                      </div>
                                  </div>
                              )}
                              {isTaken && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                      <Lock className="text-gray-700" />
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
              
              {/* Footer Confirmation */}
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#F6F1EA] via-[#F6F1EA] to-transparent">
                  <Button fullWidth disabled={!me?.selectedPhotoId} className="shadow-xl">
                      {me?.selectedPhotoId ? "Photo validée" : "Sélectionnez une photo"}
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

  // STAGE 5: END
  return (
      <div className="flex flex-col h-full items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold text-[#1C1C1E]">Séance terminée</h1>
          <p className="text-gray-500 mt-2">Merci de votre participation.</p>
      </div>
  );
};

export default ParticipantFlow;
