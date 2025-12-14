import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { Button, Input, Card } from '../../components/Button';
import { ArrowLeft, Check, FolderOpen } from 'lucide-react';
import { SessionStage, UserRole } from '../../types';
import { PHOTO_FOLDERS } from '../../constants';

const CreateSession = () => {
  const { createSession, session, setRole } = useSession();
  const [theme, setTheme] = useState("Réussite Professionnelle");
  const [question, setQuestion] = useState("Quelle image représente le mieux votre réussite cette semaine ?");
  // Default to the first available folder (Social) since Nature was removed
  const [selectedFolderId, setSelectedFolderId] = useState(PHOTO_FOLDERS[0].id); 
  const [isCreating, setIsCreating] = useState(true);

  if (session.stage !== SessionStage.LOBBY && !isCreating) return null;

  const handleCreate = () => {
      const selectedFolder = PHOTO_FOLDERS.find(f => f.id === selectedFolderId);
      if (selectedFolder) {
          createSession(theme, question, selectedFolder.photos);
      }
  };

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
            <button 
                onClick={() => setRole(UserRole.NONE)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm hover:bg-gray-100 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-[#1C1C1E]">Nouvelle Séance</h1>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
            <Card className="mb-6">
                <h2 className="text-sm font-bold text-[#1C1C1E] mb-4 uppercase tracking-wider">Configuration</h2>
                <Input 
                    label="Thème de la séance" 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ex: Confiance en soi"
                />
                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-[14px] text-[#777B80] font-medium ml-1">Tâche-question</label>
                    <textarea 
                        className="h-24 rounded-[14px] bg-[#FFFFFF] border border-[#E6E6E8] p-4 text-[#1C1C1E] focus:outline-none focus:border-[#4A89DA] resize-none"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                    />
                </div>
            </Card>

            <div>
                <h2 className="text-sm font-bold text-[#1C1C1E] mb-4 uppercase tracking-wider px-2">Support Visuel</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 no-scrollbar">
                    {PHOTO_FOLDERS.map(folder => {
                        const isSelected = selectedFolderId === folder.id;
                        return (
                            <div 
                                key={folder.id}
                                onClick={() => setSelectedFolderId(folder.id)}
                                className={`
                                    relative flex-shrink-0 w-40 rounded-[20px] overflow-hidden border-2 transition-all duration-300 cursor-pointer bg-white shadow-sm
                                    ${isSelected ? 'border-[#4A89DA] scale-100 ring-2 ring-[#4A89DA]/20' : 'border-transparent scale-95 opacity-80'}
                                `}
                            >
                                <div className="h-24 bg-gray-200">
                                    <img src={folder.cover} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-3">
                                    <h3 className={`font-bold text-sm mb-1 leading-tight ${isSelected ? 'text-[#4A89DA]' : 'text-gray-700'}`}>
                                        {folder.name}
                                    </h3>
                                    <p className="text-[10px] text-gray-400 line-clamp-2 leading-snug">
                                        {folder.description}
                                    </p>
                                    <p className="text-[10px] font-bold text-gray-300 mt-2">
                                        {folder.photos.length} photos
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-[#4A89DA] text-white rounded-full p-1 shadow-md">
                                        <Check size={12} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        <Button onClick={handleCreate} disabled={!theme || !question}>
            Créer la séance
        </Button>
    </div>
  );
};

export default CreateSession;