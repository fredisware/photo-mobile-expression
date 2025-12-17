
import React, { createContext, useContext, useState, useEffect, ReactNode, PropsWithChildren, useRef } from 'react';
import { SessionContextType, SessionState, SessionStage, UserRole, Participant, Photo, SessionTemplate } from '../types';
import { PHOTO_FOLDERS, INITIAL_SESSION_CODE, SESSION_TEMPLATES as DEFAULT_TEMPLATES } from '../constants';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, update as firebaseUpdate } from 'firebase/database';

// --- CONFIGURATION FIREBASE ---
const FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Initialize Firebase only if config is present
let db: any = null;
if (FIREBASE_CONFIG.apiKey) {
    try {
        const app = initializeApp(FIREBASE_CONFIG);
        db = getDatabase(app);
        console.log("Firebase initialized successfully");
    } catch (e) {
        console.error("Firebase init failed:", e);
    }
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};

// Start with empty list
const INITIAL_PARTICIPANTS: Participant[] = [];

export const SessionProvider = ({ children }: PropsWithChildren) => {
  const [role, setRole] = useState<UserRole>(UserRole.NONE);
  
  // Template State Management (Local Storage + Defaults)
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);

  useEffect(() => {
      // Load templates on mount
      const saved = localStorage.getItem('custom_templates');
      let customTemplates: SessionTemplate[] = [];
      if (saved) {
          try {
              customTemplates = JSON.parse(saved);
          } catch (e) {
              console.error("Failed to parse templates", e);
          }
      }
      // Merge system defaults (marked as system) with custom ones
      const systemTemplates = DEFAULT_TEMPLATES.map(t => ({...t, isSystem: true}));
      setTemplates([...customTemplates, ...systemTemplates]);
  }, []);

  const saveTemplate = (template: SessionTemplate) => {
      // Remove isSystem flag if present, ensuring it becomes a custom template
      // If we are saving an archive, ensure it stays archived.
      const newTemplate = { ...template, isSystem: false };
      
      setTemplates(prev => {
          const others = prev.filter(t => t.id !== newTemplate.id && !t.isSystem); // Keep other custom
          const system = prev.filter(t => t.isSystem); // Keep system
          const newList = [newTemplate, ...others]; // Add new at top of custom
          
          // Persist custom only
          localStorage.setItem('custom_templates', JSON.stringify([newTemplate, ...others]));
          
          return [...newList, ...system];
      });
  };

  const deleteTemplate = (id: string) => {
      setTemplates(prev => {
          // Keep everything except the one we are deleting
          const newTemplates = prev.filter(t => t.id !== id);
          
          // Extract only custom templates to save to LocalStorage
          const customOnly = newTemplates.filter(t => !t.isSystem);
          localStorage.setItem('custom_templates', JSON.stringify(customOnly));
          
          return newTemplates;
      });
  };

  const toggleArchiveTemplate = (id: string) => {
      setTemplates(prev => {
          const target = prev.find(t => t.id === id);
          if (!target) return prev;

          const updated = { ...target, archived: !target.archived };
          const others = prev.filter(t => t.id !== id && !t.isSystem);
          const system = prev.filter(t => t.isSystem);
          
          const newList = [updated, ...others];
          localStorage.setItem('custom_templates', JSON.stringify(newList));
          
          return [...newList, ...system];
      });
  };

  const [session, setSession] = useState<SessionState>({
    code: INITIAL_SESSION_CODE,
    theme: '',
    taskQuestion: '',
    enableEmotionInput: false,
    stage: SessionStage.LOBBY,
    timerSeconds: 300, // 5 mins
    isTimerRunning: false,
    participants: INITIAL_PARTICIPANTS,
    photos: PHOTO_FOLDERS[0].photos, // Default start
    notes: '',
  });

  // --- SYNC ENGINE (Firebase OR BroadcastChannel) ---
  const channelRef = useRef<BroadcastChannel | null>(null);
  const isRemoteUpdate = useRef(false);
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const updateSession = (updater: (prev: SessionState) => SessionState) => {
      const newState = updater(sessionRef.current);
      setSession(newState);
      isRemoteUpdate.current = false;

      if (db) {
          const sessionRefPath = ref(db, `sessions/${newState.code}`);
          set(sessionRefPath, newState).catch(err => console.error("Firebase write error:", err));
      } 
      else if (channelRef.current) {
          channelRef.current.postMessage(newState);
      }
  };

  useEffect(() => {
    if (db) {
        const sessionCode = session.code;
        const sessionRefPath = ref(db, `sessions/${sessionCode}`);
        const unsubscribe = onValue(sessionRefPath, (snapshot) => {
            const val = snapshot.val();
            if (val && JSON.stringify(val) !== JSON.stringify(sessionRef.current)) {
                isRemoteUpdate.current = true;
                setSession(val);
            }
        });
        return () => unsubscribe();
    } 
    else {
        channelRef.current = new BroadcastChannel('photo_expression_sync');
        channelRef.current.onmessage = (event) => {
            if (event.data === 'REQUEST_SYNC') {
                if (sessionRef.current.theme) {
                    channelRef.current?.postMessage(sessionRef.current);
                }
                return;
            }
            if (event.data && typeof event.data === 'object' && 'stage' in event.data) {
                isRemoteUpdate.current = true;
                setSession(event.data);
            }
        };
        channelRef.current.postMessage('REQUEST_SYNC');
        return () => channelRef.current?.close();
    }
  }, [session.code]);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    const shouldDriveTimer = role === UserRole.ANIMATEUR;

    if (session.isTimerRunning && session.timerSeconds > 0 && shouldDriveTimer) {
      interval = setInterval(() => {
        updateSession(prev => ({ ...prev, timerSeconds: prev.timerSeconds - 1 }));
      }, 1000);
    } else if (session.isTimerRunning && session.timerSeconds === 0 && shouldDriveTimer) {
       updateSession(prev => {
           return { ...prev, isTimerRunning: false };
       });
    }
    return () => clearInterval(interval);
  }, [session.isTimerRunning, session.timerSeconds, session.stage, role]);

  // Actions
  const createSession = (theme: string, question: string, photos: Photo[], enableEmotionInput: boolean = false, originTemplateId?: string) => {
    updateSession(prev => ({ 
        ...prev, 
        theme, 
        taskQuestion: question, 
        photos: photos,
        enableEmotionInput: enableEmotionInput,
        originTemplateId: originTemplateId,
        stage: SessionStage.LOBBY 
    }));
  };

  const startSession = () => {
    updateSession(prev => ({ ...prev, stage: SessionStage.PRESENTATION }));
  };

  const startSilentPhase = (durationMinutes: number) => {
      startSelectionPhase();
  };

  const toggleTimer = () => {
     updateSession(prev => ({ ...prev, isTimerRunning: !prev.isTimerRunning }));
  };

  const startSelectionPhase = () => {
    updateSession(prev => ({ 
      ...prev, 
      stage: SessionStage.SELECTION_PHASE, 
      timerSeconds: 300, 
      isTimerRunning: true 
    }));
  };

  const selectPhoto = (photoId: string, userId: string, emotionWord?: string) => {
    updateSession(prev => {
      const photoTaken = prev.photos.find(p => p.id === photoId)?.selectedByUserId;
      if (photoTaken && photoTaken !== userId) return prev;

      const updatedPhotos = prev.photos.map(p => 
        p.selectedByUserId === userId ? { ...p, selectedByUserId: undefined } : p
      );
      
      const finalPhotos = updatedPhotos.map(p => 
        p.id === photoId ? { ...p, selectedByUserId: userId } : p
      );

      const timestamp = Date.now();
      const updatedParticipants = prev.participants.map(p => 
        p.id === userId ? { 
            ...p, 
            selectedPhotoId: photoId, 
            emotionWord: emotionWord,
            status: 'selected' as const, 
            selectionTimestamp: timestamp 
        } : p
      );

      return { ...prev, photos: finalPhotos, participants: updatedParticipants };
    });
  };

  const rotatePhoto = (photoId: string) => {
      updateSession(prev => ({
          ...prev,
          photos: prev.photos.map(p => 
              p.id === photoId 
                  ? { ...p, rotation: ((p.rotation || 0) + 90) % 360 } 
                  : p
          )
      }));
  };

  const startSpeakingTour = () => {
    updateSession(prev => {
        const participantsWithPhotos = prev.participants.filter(p => p.selectedPhotoId);
        
        // Manual mode mainly, but we set a default order just in case
        const sortedParticipants = participantsWithPhotos.sort((a, b) => 
            (a.selectionTimestamp || Infinity) - (b.selectionTimestamp || Infinity)
        );
        const speakingOrder = sortedParticipants.map(p => p.id);
        
        return {
          ...prev,
          stage: SessionStage.SPEAKING_TOUR,
          speakingOrder: speakingOrder,
          currentSpeakerId: undefined, // No one speaks initially in voluntary mode
          currentSubjectId: undefined,
          isTimerRunning: false
        };
    });
  };

  const setSpeaker = (participantId: string | undefined, markPreviousAsDone: boolean = true) => {
      updateSession(prev => {
          const updatedParticipants = prev.participants.map(p => {
              // New speaker becomes 'speaking'
              if (p.id === participantId) return { ...p, status: 'speaking' as const };
              
              // Handle previous speaker
              if (p.id === prev.currentSpeakerId) {
                  // If markPreviousAsDone is true (default), they are done.
                  // If false (e.g. going back to list to check something), revert to 'selected'.
                  return { ...p, status: markPreviousAsDone ? 'done' as const : 'selected' as const };
              }
              return p;
          });
          
          return {
              ...prev,
              currentSpeakerId: participantId,
              participants: updatedParticipants
          };
      });
  };

  const startDebateTour = () => {
    updateSession(prev => {
        const participantsWithPhotos = prev.participants.filter(p => p.selectedPhotoId);
        // We need at least 1 person to start
        if (participantsWithPhotos.length < 1) return { ...prev, stage: SessionStage.ENDED };

        const firstSubject = participantsWithPhotos[0];
        // Speaker is the next person in list, or same if only 1
        const firstSpeaker = participantsWithPhotos.length > 1 ? participantsWithPhotos[1] : participantsWithPhotos[0];

        return {
          ...prev,
          stage: SessionStage.DEBATE_TOUR,
          currentSubjectId: firstSubject.id,
          currentSpeakerId: firstSpeaker.id,
          isTimerRunning: false
        };
    });
  };

  const goToRoundTransition = () => {
      updateSession(prev => ({
          ...prev,
          stage: SessionStage.ROUND_TRANSITION,
          currentSpeakerId: undefined,
          currentSubjectId: undefined
      }));
  };

  const nextSpeaker = () => {
    updateSession(prev => {
       const participants = prev.participants.filter(p => p.selectedPhotoId);
       if (participants.length === 0) return prev;

       // If only 1 participant (testing mode), flip between debating/synthesis or just end
       if (participants.length === 1) {
           return { ...prev, stage: SessionStage.SYNTHESIS };
       }

       let subjectIdx = participants.findIndex(p => p.id === prev.currentSubjectId);
       let speakerIdx = participants.findIndex(p => p.id === prev.currentSpeakerId);

       // 1. Try to find next speaker for SAME subject
       let nextSpeakerIdx = (speakerIdx + 1) % participants.length;
       
       // Loop until we find a speaker who is NOT the subject (unless only 1 person exists, handled above)
       let attempts = 0;
       while (participants[nextSpeakerIdx].id === participants[subjectIdx].id && attempts < participants.length) {
           nextSpeakerIdx = (nextSpeakerIdx + 1) % participants.length;
           attempts++;
       }
       
       // Force Brute Force Logic:
       // Find current speaker position relative to subject.
       // Current: Subj=0, Spk=1. Next should be Spk=2.
       // If Spk=Last, Next Spk=0.
       // If Next Spk == Subj, then we are done with this Subj. Move Subj + 1.
       
       let newSpeakerIdx = (speakerIdx + 1) % participants.length;
       
       // Skip self
       if (participants[newSpeakerIdx].id === participants[subjectIdx].id) {
           // We hit the subject themselves. This usually means end of reactions for this photo.
           // Move to next subject.
           let newSubjectIdx = (subjectIdx + 1) % participants.length;
           
           // If we wrapped subjects, we are done with session
           if (newSubjectIdx === 0) {
               return { ...prev, stage: SessionStage.SYNTHESIS };
           }
           
           // New Subject, First Speaker (Subject + 1)
           let newSpeakerForNewSubject = (newSubjectIdx + 1) % participants.length;
           
           return {
               ...prev,
               currentSubjectId: participants[newSubjectIdx].id,
               currentSpeakerId: participants[newSpeakerForNewSubject].id
           };
       }

       // Otherwise, just next speaker for same subject
       return {
           ...prev,
           currentSpeakerId: participants[newSpeakerIdx].id
       };
    });
  };

  const endSession = () => {
    updateSession(prev => ({ ...prev, stage: SessionStage.SYNTHESIS }));
  };

  const resetSession = () => {
    updateSession(() => ({
      code: INITIAL_SESSION_CODE,
      theme: '',
      taskQuestion: '',
      enableEmotionInput: false,
      stage: SessionStage.LOBBY,
      timerSeconds: 300,
      isTimerRunning: false,
      participants: INITIAL_PARTICIPANTS,
      photos: PHOTO_FOLDERS[0].photos,
      notes: '',
    }));
  };

  const updateNotes = (text: string) => {
    updateSession(prev => ({ ...prev, notes: text }));
  };

  const joinSession = (code: string, name: string, userId: string) => {
      updateSession(prev => {
          if (prev.participants.some(p => p.id === userId)) return prev;
          const newUser: Participant = {
              id: userId,
              name: name,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
              status: 'waiting'
          };
          return { ...prev, participants: [...prev.participants, newUser] };
      });
      setRole(UserRole.PARTICIPANT);
  };

  const addGuestParticipant = (name: string, roleLabel?: string) => {
      const newId = `guest-${Date.now()}`;
      const newGuest: Participant = {
          id: newId,
          name: name,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
          status: 'waiting',
          isGuest: true,
          roleLabel: roleLabel
      };
      updateSession(prev => ({ ...prev, participants: [...prev.participants, newGuest] }));
  };

  const removeParticipant = (userId: string) => {
      updateSession(prev => {
          const updatedPhotos = prev.photos.map(p => 
              p.selectedByUserId === userId ? { ...p, selectedByUserId: undefined } : p
          );
          return {
              ...prev,
              photos: updatedPhotos,
              participants: prev.participants.filter(p => p.id !== userId)
          };
      });
  };

  const addTime = (seconds: number) => {
      updateSession(prev => ({
          ...prev,
          timerSeconds: prev.timerSeconds + seconds,
          isTimerRunning: true
      }));
  };

  const forceRandomSelection = () => {
      updateSession(prev => {
          const unselectedParticipants = prev.participants.filter(p => !p.selectedPhotoId);
          let availablePhotos = prev.photos.filter(p => !p.selectedByUserId);
          availablePhotos = availablePhotos.sort(() => Math.random() - 0.5);

          const newPhotos = [...prev.photos];
          const newParticipants = prev.participants.map(p => ({...p}));
          const timestamp = Date.now();

          unselectedParticipants.forEach((participant, index) => {
              if (index < availablePhotos.length) {
                  const photo = availablePhotos[index];
                  const photoIndex = newPhotos.findIndex(p => p.id === photo.id);
                  if (photoIndex !== -1) {
                      newPhotos[photoIndex] = { ...newPhotos[photoIndex], selectedByUserId: participant.id };
                  }
                  const partIndex = newParticipants.findIndex(p => p.id === participant.id);
                  if (partIndex !== -1) {
                      newParticipants[partIndex] = {
                          ...newParticipants[partIndex],
                          selectedPhotoId: photo.id,
                          status: 'selected',
                          selectionTimestamp: timestamp
                      };
                  }
              }
          });

          const validParticipants = newParticipants.filter(p => p.selectedPhotoId);
          const hasParticipants = newParticipants.length > 0;
          const nextStage = hasParticipants ? SessionStage.SPEAKING_TOUR : prev.stage;
          const sorted = validParticipants.sort((a, b) => (a.selectionTimestamp || Infinity) - (b.selectionTimestamp || Infinity));
          const speakingOrder = sorted.map(p => p.id);

          return {
              ...prev,
              photos: newPhotos,
              participants: newParticipants,
              isTimerRunning: false,
              stage: nextStage,
              speakingOrder: speakingOrder,
              currentSpeakerId: undefined, // Manual start required or auto assign logic if preferred
              currentSubjectId: undefined
          };
      });
  };

  return (
    <SessionContext.Provider value={{
      role,
      setRole,
      session,
      templates,
      saveTemplate,
      deleteTemplate,
      toggleArchiveTemplate,
      createSession,
      startSession,
      startSilentPhase,
      startSelectionPhase,
      startSpeakingTour,
      startDebateTour,
      goToRoundTransition,
      setSpeaker,
      nextSpeaker,
      endSession,
      resetSession,
      joinSession,
      addGuestParticipant,
      selectPhoto,
      rotatePhoto,
      toggleTimer,
      updateNotes,
      removeParticipant,
      addTime,
      forceRandomSelection
    }}>
      {children}
    </SessionContext.Provider>
  );
};
