
import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { SessionStage, UserRole, SessionTemplate } from '../../types';
import CreateSession from './CreateSession';
import { Button, Card, Input } from '../../components/Button';
// Added Archive to the import list from lucide-react
import { Play, FastForward, CheckCircle, Users, Clock, Image as ImageIcon, FileText, UserPlus, X, ChevronLeft, ChevronRight, Scale, Lock, Trash2, Shuffle, Plus, Repeat, ArrowRight, StopCircle, ArrowLeft, RotateCw, Maximize, Minimize, Archive } from 'lucide-react';

const GuestAddForm = ({ onAdd }: { onAdd: (name: string) => void }) => {
    const [name, setName] = useState("");
    return (
        <div className="bg-blue-50 rounded-2xl p-4 mb-2 border border-blue-100">
            <h4 className="text-xs font-bold text-[#4A89DA] uppercase mb-3 flex items-center gap-2">
                <UserPlus size={14} /> Ajouter sans mobile
            </h4>
            <div className="flex gap-2">
                <input className="flex-1 h-10 rounded-xl px-3 text-sm border border-blue-200 focus:outline-none focus:border-[#4A89DA]" placeholder="Nom du participant..." value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onAdd(name); setName(""); } }} />
                <button type="button" className="bg-[#4A89DA] text-white h-10 w-10 rounded-xl flex items-center justify-center shadow-sm disabled:opacity-50" disabled={!name.trim()} onClick={() => { onAdd(name); setName(""); }}>+</button>
            </div>
        </div>
    );
};

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
                     {alternateAction && <Button variant="secondary" onClick={alternateAction.onClick} fullWidth className="bg-gray-50">{alternateAction.label}</Button>}
                     <Button variant="ghost" onClick={onCancel} fullWidth>Annuler</Button>
                 </div>
            </div>
        </div>
    );
};

const AnimateurFlow = () => {
  const { session, startSession, startSelectionPhase, startSpeakingTour, startDebateTour, setSpeaker, nextSpeaker, endSession, goToRoundTransition, resetSession, updateNotes, addGuestParticipant, selectPhoto, removeParticipant, addTime, forceRandomSelection, setRole, saveTemplate, deleteTemplate, rotatePhoto } = useSession();
  
  const [selectingForGuestId, setSelectingForGuestId] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [guestEmotion, setGuestEmotion] = useState("");
  const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState<{id: string, name: string} | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showForceConfirm, setShowForceConfirm] = useState(false);

  const handleArchiveAndClose = () => {
      if (session.originTemplateId) deleteTemplate(session.originTemplateId);
      const selectionSummary = session.participants.filter(p => p.selectedPhotoId).map(p => { const photo = session.photos.find(ph => ph.id === p.selectedPhotoId); return `- ${p.name}: ${p.emotionWord ? `"${p.emotionWord}"` : 'Sans émotion'} (Photo #${p.selectedPhotoId})`; }).join('\n');
      const fullNotes = `${session.notes ? session.notes + '\n\n' : ''}=== RÉCAPITULATIF DES CHOIX ===\n${selectionSummary}`;
      const archive: SessionTemplate = { id: `archive-${Date.now()}`, title: session.theme, question: session.taskQuestion, description: "Séance archivée", defaultFolderId: 'yapaka', icon: 'Archive', isSystem: false, archived: true, archiveNotes: fullNotes, archiveDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) };
      saveTemplate(archive); resetSession(); setRole(UserRole.NONE); setShowResetConfirm(false);
  };

  if (!session.theme) return <CreateSession />;

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
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#4A89DA] font-bold text-xs shrink-0 ml-2">{session.participants.length}p</div>
          </div>
      </div>
  );

  if (session.stage === SessionStage.LOBBY) {
      const hasParticipants = session.participants.length > 0;
      return (
          <div className="flex flex-col h-full px-5 pt-6 pb-6 relative animate-fade-in md:px-10 md:max-w-6xl md:mx-auto w-full">
              <ConfirmModal isOpen={!!participantToDelete} title="Exclure ?" message={`Retirer ${participantToDelete?.name} ?`} icon={Trash2} confirmLabel="Exclure" onConfirm={() => { if (participantToDelete) removeParticipant(participantToDelete.id); setParticipantToDelete(null); }} onCancel={() => setParticipantToDelete(null)} />
              <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
                <div className="md:w-1/3 flex flex-col gap-6">
                    <div className="bg-white rounded-[32px] p-8 text-center shadow-sm">
                        <p className="text-gray-400 uppercase text-xs font-bold mb-2">Code de séance</p>
                        <h1 className="text-5xl font-black text-[#1C1C1E] tracking-widest">{session.code}</h1>
                    </div>
                    <div className="hidden md:block"><GuestAddForm onAdd={(name) => addGuestParticipant(name)} /></div>
                    <div className="hidden md:block"><Button onClick={startSession} fullWidth disabled={!hasParticipants}>Démarrer l'atelier</Button></div>
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center mb-4 px-2"><h3 className="text-sm font-bold text-gray-400">PARTICIPANTS</h3></div>
                    <div className="md:hidden mb-4"><GuestAddForm onAdd={(name) => addGuestParticipant(name)} /></div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                            {session.participants.map(p => (
                                <div key={p.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm group relative">
                                    <img src={p.avatar} className="w-10 h-10 rounded-full bg-gray-100" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-[#1C1C1E] truncate">{p.name}</span>
                                            {p.roleLabel && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded-md uppercase shrink-0">{p.roleLabel}</span>}
                                        </div>
                                    </div>
                                    <div onClick={() => setParticipantToDelete({ id: p.id, name: p.name })} className="w-10 h-10 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors cursor-pointer shadow-sm active:scale-95 shrink-0"><Trash2 size={18} /></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
              </div>
              <div className="md:hidden mt-4"><Button onClick={startSession} fullWidth disabled={!hasParticipants}>Démarrer l'atelier</Button></div>
          </div>
      );
  }

  if (session.stage === SessionStage.PRESENTATION) {
      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in md:px-10 md:max-w-4xl md:mx-auto">
              <Header title={session.theme} stage="Présentation" />
              <div className="flex-1 overflow-y-auto no-scrollbar">
                  <Card className="bg-[#4A89DA] text-white mb-6 md:p-10 md:text-center">
                      <h3 className="opacity-80 text-sm font-medium mb-2">Tâche-question</h3>
                      <p className="text-xl font-medium leading-relaxed md:text-3xl">"{session.taskQuestion}"</p>
                  </Card>
                  <div className="space-y-4 px-2 pb-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0"><CheckCircle size={16} /></div><p className="text-sm text-gray-600">Il n'y a pas de bonne ou de mauvaise réponse.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Scale size={16} /></div><p className="text-sm text-gray-600">Il n'y a pas de jugement.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Lock size={16} /></div><p className="text-sm text-gray-600">Ce qui se dit dans l'atelier reste dans l'atelier.</p></div>
                    <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><Users size={16} /></div><p className="text-sm text-gray-600">La participation n'est pas facultative.</p></div>
                  </div>
              </div>
              <Button onClick={startSelectionPhase} fullWidth>Lancer le choix des photos</Button>
          </div>
      );
  }

  if (session.stage === SessionStage.SELECTION_PHASE) {
      const selectedCount = session.participants.filter(p => p.status === 'selected').length;
      const progress = (selectedCount / session.participants.length) * 100;
      const allSelected = selectedCount === session.participants.length && session.participants.length > 0;

      if (selectingForGuestId) {
          const guest = session.participants.find(p => p.id === selectingForGuestId);
          const currentPhoto = session.photos[carouselIndex];
          const isTaken = currentPhoto.selectedByUserId && currentPhoto.selectedByUserId !== selectingForGuestId;
          return (
              <div className="flex flex-col h-full bg-[#1C1C1E] text-white animate-fade-in fixed inset-0 z-50">
                  <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
                    <div className="px-5 pt-6 pb-2 flex items-center justify-between">
                        <div><p className="text-xs text-gray-400 uppercase">Choisir pour</p><h2 className="text-xl font-bold">{guest?.name}</h2></div>
                        <button onClick={() => { setSelectingForGuestId(null); setGuestEmotion(""); }} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"><X size={20} /></button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-4">
                        <div className="relative w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl mb-6 bg-gray-800 transition-all max-h-[50vh] max-w-sm" onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}>
                            <img src={currentPhoto.url} className={`w-full h-full transition-all duration-500 ${isPhotoZoomed ? 'object-contain' : 'object-cover'}`} style={{ transform: `rotate(${currentPhoto.rotation || 0}deg)` }} />
                            {isTaken && <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col gap-2"><Lock size={48} className="text-white/50" /><span className="text-sm font-bold text-white/50 uppercase tracking-widest">Déjà prise</span></div>}
                        </div>
                        <div className="flex items-center gap-6 mb-4">
                            <button disabled={carouselIndex === 0} onClick={() => setCarouselIndex(prev => prev - 1)} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"><ChevronLeft size={24} /></button>
                            <span className="font-mono text-sm text-gray-400">{carouselIndex + 1} / {session.photos.length}</span>
                            <button disabled={carouselIndex === session.photos.length - 1} onClick={() => setCarouselIndex(prev => prev + 1)} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center disabled:opacity-30"><ChevronRight size={24} /></button>
                        </div>
                        {!isTaken && <div className="w-full max-w-xs mb-2"><input value={guestEmotion} onChange={(e) => setGuestEmotion(e.target.value)} placeholder="Émotion (facultatif)..." className="w-full h-12 bg-white/10 border border-white/20 rounded-[14px] px-4 text-center text-white focus:outline-none" /></div>}
                    </div>
                    <div className="p-5 pb-8 flex justify-center"><Button className="max-w-md w-full" disabled={!!isTaken} onClick={() => { selectPhoto(currentPhoto.id, selectingForGuestId, guestEmotion); setSelectingForGuestId(null); setGuestEmotion(""); }}>Sélectionner</Button></div>
                  </div>
              </div>
          )
      }

      return (
          <div className="flex flex-col h-full px-5 pb-6 relative animate-fade-in md:px-10 md:max-w-6xl md:mx-auto w-full">
              <ConfirmModal isOpen={showForceConfirm} title="Lancer le tour ?" message="Attribuer des photos aléatoires aux retardataires ?" icon={Shuffle} confirmLabel="Lancer" onConfirm={() => { forceRandomSelection(); setShowForceConfirm(false); }} onCancel={() => setShowForceConfirm(false)} />
              <Header title="Choix des photos" stage="Sélection" />
              <div className="flex flex-col md:flex-row gap-8 flex-1 overflow-hidden">
                  <div className="md:w-1/3 flex flex-col gap-4">
                      <Card><div className="flex justify-between items-end mb-2"><span className="text-3xl font-bold text-[#4A89DA]">{selectedCount}/{session.participants.length}</span><span className="text-sm text-gray-400 mb-1">ont choisi</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#4A89DA] transition-all duration-500" style={{width: `${progress}%`}}></div></div></Card>
                      <div className="hidden md:flex flex-col gap-3 mt-4">{allSelected ? <Button onClick={startSpeakingTour} fullWidth>Lancer le tour de parole</Button> : <Button variant="secondary" onClick={() => setShowForceConfirm(true)} className="gap-2" fullWidth><Shuffle size={18} /> Forcer & Lancer</Button>}</div>
                  </div>
                  <div className="flex-1 flex flex-col overflow-hidden">
                     <div className="flex-1 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                            {session.participants.map(p => (
                                <div key={p.id} className="bg-white p-3 rounded-2xl flex items-center gap-3 shadow-sm group">
                                    <div className="relative"><img src={p.avatar} className="w-10 h-10 rounded-full" />{p.status === 'selected' && <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5"><CheckCircle size={12} /></div>}</div>
                                    <div className="flex-1"><span className="font-medium text-[#1C1C1E]">{p.name}</span>{p.isGuest && p.status !== 'selected' && <button onClick={() => { setCarouselIndex(0); setSelectingForGuestId(p.id); }} className="text-xs text-[#4A89DA] block font-bold underline mt-1">Choisir</button>}</div>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === 'selected' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>{p.status === 'selected' ? 'OK' : '...'}</span>
                                </div>
                            ))}
                        </div>
                     </div>
                  </div>
              </div>
              <div className="md:hidden mt-4">{allSelected ? <Button onClick={startSpeakingTour} fullWidth>Lancer le tour de parole</Button> : <Button variant="secondary" onClick={() => setShowForceConfirm(true)} fullWidth>Forcer & Lancer</Button>}</div>
          </div>
      );
  }

  if (session.stage === SessionStage.SPEAKING_TOUR) {
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const photo = session.photos.find(p => p.id === speaker?.selectedPhotoId);
      const participantsWithPhotos = session.participants.filter(p => p.selectedPhotoId);
      const allParticipantsDone = participantsWithPhotos.length > 0 && participantsWithPhotos.every(p => p.status === 'done');

      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in md:px-10 md:max-w-7xl md:mx-auto w-full">
              <div className="pt-6 mb-4 flex justify-between items-center"><h1 className="text-lg font-bold text-[#1C1C1E]">Tour de parole</h1></div>
              <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                <div className={`flex-1 flex flex-col md:max-w-md ${speaker ? 'hidden md:flex' : 'flex'}`}>
                      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto no-scrollbar pb-20 md:pb-0">
                          {participantsWithPhotos.map(p => {
                              const isDone = p.status === 'done';
                              const isActive = p.id === session.currentSpeakerId;
                              return (
                                  <div key={p.id} onClick={() => setSpeaker(p.id)} className={`bg-white p-3 rounded-2xl flex flex-col items-center gap-2 text-center shadow-sm cursor-pointer border-2 transition-all ${isActive ? 'border-blue-500 ring-4 ring-blue-100' : (isDone ? 'border-gray-100 opacity-60 bg-gray-50' : 'border-transparent hover:border-blue-200')}`}>
                                      <img src={p.avatar} className={`w-12 h-12 rounded-full ${isDone ? 'grayscale' : ''}`} />
                                      <div className="w-full"><h3 className="text-sm font-bold text-[#1C1C1E] truncate">{p.name}</h3></div>
                                  </div>
                              );
                          })}
                      </div>
                      {allParticipantsDone && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-2xl animate-fade-in">
                              <p className="text-xs text-green-700 font-bold uppercase mb-3">Tous les participants se sont exprimés</p>
                              <Button onClick={goToRoundTransition} fullWidth className="bg-green-600 text-white">Accéder au second tour</Button>
                          </div>
                      )}
                </div>
                <div className={`flex-1 flex flex-col gap-4 animate-slide-up ${!speaker ? 'hidden md:flex md:items-center md:justify-center' : ''}`}>
                    {speaker ? (
                        <>
                            <div className="flex items-center justify-between mb-2 md:hidden">
                                <button onClick={() => setSpeaker(undefined, false)} className="text-sm text-gray-500 flex items-center gap-1 font-medium"><ArrowLeft size={16} /> Retour</button>
                                <button onClick={() => setSpeaker(undefined, true)} className="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1">Terminer</button>
                            </div>
                            {photo && (
                                <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-square bg-gray-100 md:max-h-[500px]" onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}>
                                    <img src={photo.url} className={`w-full h-full transition-all duration-500 ${isPhotoZoomed ? 'object-contain' : 'object-cover'}`} style={{ transform: `rotate(${photo.rotation || 0}deg)` }} />
                                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12"><div className="flex items-center gap-3 text-white"><span className="font-bold text-lg">{speaker.name}</span>{speaker.emotionWord && <span className="text-xs font-medium text-yellow-300 italic">"{speaker.emotionWord}"</span>}</div></div>
                                </div>
                            )}
                            <Card className="flex-1 flex flex-col"><textarea className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm" placeholder="Notes de l'animateur..." value={session.notes} onChange={(e) => updateNotes(e.target.value)} /></Card>
                            <div className="hidden md:block"><Button onClick={() => setSpeaker(undefined, true)} fullWidth variant="danger" className="h-14">Terminer l'intervention</Button></div>
                        </>
                    ) : <p className="text-gray-400 font-medium">Sélectionnez un participant</p>}
                </div>
              </div>
          </div>
      );
  }

  if (session.stage === SessionStage.ROUND_TRANSITION) {
      return (
          <div className="flex flex-col h-full px-5 pb-6 pt-10 text-center animate-fade-in md:justify-center md:max-w-lg md:mx-auto">
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-md animate-bounce"><CheckCircle size={40} /></div>
                  <h1 className="text-2xl font-bold text-[#1C1C1E]">Premier tour terminé</h1>
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 w-full"><h3 className="text-sm font-bold text-purple-600">Option : Réactions libres</h3><p className="text-xs text-gray-500 mt-1">Lancer un tour où chacun réagit sur les images des autres.</p></div>
              </div>
              <div className="flex flex-col gap-3"><Button variant="primary" fullWidth className="bg-purple-600 text-white h-14" onClick={startDebateTour}><Repeat size={20} className="mr-2" /> Lancer 2ème tour (Débat)</Button><Button variant="secondary" fullWidth onClick={endSession}>Terminer la séance <ArrowRight size={16} className="ml-2" /></Button></div>
          </div>
      );
  }

  if (session.stage === SessionStage.DEBATE_TOUR) {
      const speaker = session.participants.find(p => p.id === session.currentSpeakerId);
      const subject = session.participants.find(p => p.id === session.currentSubjectId);
      const photo = session.photos.find(p => p.id === subject?.selectedPhotoId);
      return (
          <div className="flex flex-col h-full px-5 pb-6 animate-fade-in md:px-10 md:max-w-4xl md:mx-auto">
              <div className="pt-6 mb-4 flex justify-between items-center"><h1 className="text-lg font-bold text-[#1C1C1E]">Tour de réaction</h1></div>
              {speaker && subject && photo ? (
                  <div className="flex-1 flex flex-col gap-4">
                      <div className="flex items-center justify-center gap-4 mb-2"><img src={speaker.avatar} className="w-12 h-12 rounded-full border-2 border-purple-500" /><ArrowRight size={20} className="text-gray-300" /><img src={subject.avatar} className="w-12 h-12 rounded-full border-2 border-gray-300 opacity-70" /></div>
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="relative rounded-[24px] overflow-hidden shadow-md aspect-square bg-gray-100 md:w-1/2" onClick={() => setIsPhotoZoomed(!isPhotoZoomed)}>
                            <img src={photo.url} className={`w-full h-full transition-all duration-500 ${isPhotoZoomed ? 'object-contain' : 'object-cover'}`} style={{ transform: `rotate(${photo.rotation || 0}deg)` }} />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 p-4"><span className="text-white font-bold block">Photo de {subject.name}</span><span className="text-white/80 text-xs">Réaction de {speaker.name}</span></div>
                        </div>
                        <Card className="flex-1 flex flex-col bg-purple-50 border-purple-100"><textarea className="flex-1 w-full bg-transparent resize-none focus:outline-none text-sm" placeholder="Notes débat..." value={session.notes} onChange={(e) => updateNotes(e.target.value)} /></Card>
                      </div>
                  </div>
              ) : <div className="flex-1 flex items-center justify-center text-gray-400">Chargement...</div>}
              <Button onClick={() => session.stage === SessionStage.SYNTHESIS ? endSession() : nextSpeaker()} className="mt-4 bg-purple-600 text-white h-14" fullWidth>Suivant <FastForward size={20} className="ml-2" /></Button>
          </div>
      );
  }

  if (session.stage === SessionStage.SYNTHESIS) {
      const participantsWithPhotos = session.participants.filter(p => p.selectedPhotoId);
      return (
          <div className="flex flex-col h-full px-5 pb-6 relative animate-fade-in bg-white md:px-10 md:max-w-6xl md:mx-auto">
              <ConfirmModal isOpen={showResetConfirm} title="Archiver ?" message="Sauvegarder le compte-rendu ?" icon={Archive} confirmLabel="Archiver et Quitter" onConfirm={handleArchiveAndClose} onCancel={() => setShowResetConfirm(false)} alternateAction={{ label: "Supprimer", onClick: () => { resetSession(); setRole(UserRole.NONE); } }} />
              <Header title="Synthèse" stage="Fin" />
              <div className="flex-1 overflow-y-auto no-scrollbar">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                      {participantsWithPhotos.map(p => {
                          const photo = session.photos.find(ph => ph.id === p.selectedPhotoId);
                          return (
                              <div key={p.id} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                                  <div className="aspect-square overflow-hidden"><img src={photo?.url} className="w-full h-full object-cover" style={{ transform: `rotate(${photo?.rotation || 0}deg)` }} /></div>
                                  <div className="p-2"><span className="font-bold text-xs truncate block">{p.name}</span>{p.emotionWord && <span className="text-[10px] text-blue-600">"{p.emotionWord}"</span>}</div>
                              </div>
                          );
                      })}
                  </div>
                  <Card className="bg-yellow-50 border-yellow-100"><div className="flex items-center gap-2 mb-2"><FileText size={16} className="text-yellow-600" /><h2 className="text-sm font-bold text-yellow-800 uppercase">Compte-rendu</h2></div><p className="text-sm leading-relaxed whitespace-pre-wrap font-mono">{session.notes || "Aucune note."}</p></Card>
              </div>
              <div className="mt-4"><Button onClick={() => setShowResetConfirm(true)} className="bg-gray-900 text-white h-14" fullWidth>Clôturer la séance</Button></div>
          </div>
      );
  }
  return null;
};

export default AnimateurFlow;
