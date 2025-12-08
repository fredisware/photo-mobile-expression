import React from 'react';
import { useSession } from '../../context/SessionContext';
import { SessionStage } from '../../types';
import CreateSession from './CreateSession';
import { Button, Card } from '../../components/Button';
import { Play, Pause, FastForward, CheckCircle, Users, Clock, Image as ImageIcon, MessageCircle, FileText } from 'lucide-react';
import { MOCK_PHOTOS } from '../../constants';

const AnimateurFlow = () => {
  const { session, startSession, startSilentPhase, toggleTimer, startSelectionPhase, startSpeakingTour, nextSpeaker, endSession, updateNotes } = useSession();

  // STAGE 0: Create (if default state)
  // Actually SessionContext initializes with LOBBY, but let's assume if theme is empty we show create
  if (!session.theme) {
      return <CreateSession />;
  }

  // HEADER for all Animateur Screens
  const Header = ({ title, stage }: {title: string, stage: string}) => (
      <div className="pt-6 px-5 mb-4">
          <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#4A89DA] uppercase tracking-wide bg-blue-50 px-2 py-1 rounded-md">{stage}</span>
                <h1 className="text-2xl font-bold text-[#1C1C1E] mt-2 leading-tight">{title}</h1>
              </div>
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#4A89DA] font-bold text-xs">
                  {session.participants.length}p
              </div>
          </div>
      </div>
  );

  // STAGE 0.5: LOBBY
  if (session.stage === SessionStage.LOBBY) {
      return (
          <div className="flex flex-col h-full px-5 pt-6 pb-6">
              <div className="bg-white rounded-[32px] p-8 text-center shadow-sm mb-6 mt-10">
                  <p className="text-gray-400 uppercase text-xs font-bold mb-2">Code de séance</p>
                  <h1 className="text-5xl font-black text-[#1C1C1E] tracking-widest">{session.code}</h1>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-bold text-gray-400 mb-4 px-2">PARTICIPANTS ({session.participants.length})</h3>
                <div className="grid grid-cols-1 gap-3">
                    {session.participants.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm">
                            <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-100" />
                            <span className="font-medium text-[#1C1C1E]">{p.name}</span>
                            <div className="ml-auto flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div> Connecté
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
          <div className="flex flex-col h-full px-5 pb-6">
              <Header title={session.theme} stage="Présentation" />
              
              <div className="flex-1 flex flex-col justify-center">
                  <Card className="bg-[#4A89DA] text-white">
                      <h3 className="opacity-80 text-sm font-medium mb-2">Tâche-question</h3>
                      <p className="text-xl font-medium leading-relaxed">"{session.taskQuestion}"</p>
                  </Card>
                  
                  <div className="mt-8 space-y-4 px-2">
                    <div className="flex items-center gap-4 text-gray-500">
                        <MessageCircle /> <span>Respect de la parole</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500">
                        <ImageIcon /> <span>Lien émotion / photo</span>
                    </div>
                  </div>
              </div>

              <Button onClick={() => startSilentPhase(5)}>Lancer la phase silencieuse</Button>
          </div>
      );
  }

  // STAGE 2: SILENT PHASE (Timer)
  if (session.stage === SessionStage.SILENT_PHASE) {
      const mins = Math.floor(session.timerSeconds / 60);
      const secs = session.timerSeconds % 60;
      
      return (
          <div className="flex flex-col h-full px-5 pb-6">
              <Header title="Réflexion individuelle" stage="Phase Silencieuse" />
              
              <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="relative w-64 h-64 flex items-center justify-center">
                     <div className="absolute inset-0 rounded-full border-8 border-gray-200"></div>
                     <div className="absolute inset-0 rounded-full border-8 border-[#4A89DA] border-t-transparent animate-spin-slow" style={{animationDuration: '10s'}}></div>
                     <div className="text-5xl font-mono font-bold text-[#1C1C1E]">
                         {mins}:{secs < 10 ? `0${secs}` : secs}
                     </div>
                  </div>
                  
                  <div className="mt-8 flex gap-4">
                      <button onClick={toggleTimer} className="w-14 h-14 rounded-full bg-white shadow-md flex items-center justify-center text-[#4A89DA]">
                          {session.isTimerRunning ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
                      </button>
                  </div>
              </div>

              <Button variant="secondary" onClick={startSelectionPhase}>Passer au choix des photos</Button>
          </div>
      );
  }

  // STAGE 3: SELECTION MONITORING
  if (session.stage === SessionStage.SELECTION_PHASE) {
      const selectedCount = session.participants.filter(p => p.status === 'selected').length;
      const progress = (selectedCount / session.participants.length) * 100;

      return (
          <div className="flex flex-col h-full px-5 pb-6">
              <Header title="Choix des photos" stage="Sélection" />

              <div className="flex-1">
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
                 <div className="grid grid-cols-1 gap-3">
                    {session.participants.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm border border-transparent transition-colors">
                            <div className="relative">
                                <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-100" />
                                {p.status === 'selected' && <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5"><CheckCircle size={12} /></div>}
                            </div>
                            <span className="font-medium text-[#1C1C1E]">{p.name}</span>
                            <span className={`ml-auto text-xs font-medium px-2 py-1 rounded-full ${p.status === 'selected' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                {p.status === 'selected' ? 'A choisi' : 'Réfléchit...'}
                            </span>
                        </div>
                    ))}
                 </div>
              </div>

              <Button onClick={startSpeakingTour} disabled={selectedCount === 0}>Lancer le tour de parole</Button>
          </div>
      );
  }

  // STAGE 4: SPEAKING TOUR
  if (session.stage === SessionStage.SPEAKING_TOUR) {
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const photo = session.photos.find(p => p.id === speaker?.selectedPhotoId);

      return (
          <div className="flex flex-col h-full px-5 pb-6">
              <div className="pt-6 mb-4 flex justify-between items-center">
                 <h1 className="text-lg font-bold text-[#1C1C1E]">Tour de parole</h1>
                 <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold">En cours</span>
              </div>

              {speaker && photo ? (
                  <div className="flex-1 flex flex-col gap-4">
                      {/* Active Photo */}
                      <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-square bg-gray-100">
                          <img src={photo.url} className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
                              <div className="flex items-center gap-3 text-white">
                                  <img src={speaker.avatar} className="w-8 h-8 rounded-full border border-white" />
                                  <span className="font-bold">{speaker.name}</span>
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

  // STAGE 5: SYNTHESIS / END
  if (session.stage === SessionStage.SYNTHESIS || session.stage === SessionStage.ENDED) {
      return (
          <div className="flex flex-col h-full px-5 pb-6">
              <Header title="Synthèse" stage="Fin de séance" />
              
              <div className="flex-1 overflow-y-auto">
                 <h2 className="text-sm font-bold text-gray-400 mb-2">NOTES PRISES</h2>
                 <div className="bg-yellow-50 p-4 rounded-2xl text-[#1C1C1E] mb-6 text-sm border border-yellow-100 shadow-sm leading-relaxed whitespace-pre-wrap">
                     {session.notes || "Aucune note prise."}
                 </div>

                 <h2 className="text-sm font-bold text-gray-400 mb-2">PHOTOS CHOISIES</h2>
                 <div className="grid grid-cols-2 gap-2">
                     {session.participants.filter(p => p.selectedPhotoId).map(p => {
                         const pic = session.photos.find(ph => ph.id === p.selectedPhotoId);
                         return (
                             <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden">
                                 <img src={pic?.url} className="w-full h-full object-cover" />
                                 <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                                     {p.name}
                                 </div>
                             </div>
                         )
                     })}
                 </div>
              </div>

              <div className="flex gap-2 mt-4">
                  <Button variant="secondary" fullWidth className="gap-2">
                      <FileText size={16} /> Exporter PDF
                  </Button>
                  <Button fullWidth onClick={endSession} variant="ghost" className="text-red-400">
                      Fermer
                  </Button>
              </div>
          </div>
      );
  }

  return null;
};

export default AnimateurFlow;
