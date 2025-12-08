import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { Button, Input, Card } from '../../components/Button';
import { ArrowLeft, UploadCloud } from 'lucide-react';
import { SessionStage } from '../../types';

const CreateSession = () => {
  const { createSession, session } = useSession();
  const [theme, setTheme] = useState("Réussite Professionnelle");
  const [question, setQuestion] = useState("Quelle image représente le mieux votre réussite cette semaine ?");
  const [isCreating, setIsCreating] = useState(true);

  if (session.stage !== SessionStage.LOBBY && !isCreating) return null;

  // If already in lobby, we show lobby view, handled by parent. 
  // This component is just the form.

  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-6 animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
            <button className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm">
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-[#1C1C1E]">Nouvelle Séance</h1>
        </div>

        <div className="flex-1">
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

            <Card>
                <h2 className="text-sm font-bold text-[#1C1C1E] mb-4 uppercase tracking-wider">Support Visuel</h2>
                <div className="h-20 border-2 border-dashed border-gray-300 rounded-[16px] flex items-center justify-center gap-3 text-gray-400">
                    <UploadCloud size={20} />
                    <span className="text-sm font-medium">Dossier sélectionné: <span className="text-[#4A89DA]">Nature & Zen</span></span>
                </div>
            </Card>
        </div>

        <Button onClick={() => createSession(theme, question)}>
            Créer la séance
        </Button>
    </div>
  );
};

export default CreateSession;
