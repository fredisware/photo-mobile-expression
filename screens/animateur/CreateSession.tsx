
import React, { useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { Button, Input, Card } from '../../components/Button';
import { ArrowLeft, Check, FolderOpen, Edit3, Plus, Trash2, Save, Play, Bookmark, Settings, Archive, RefreshCcw, FileText, Eye, X as CloseIcon, RotateCw } from 'lucide-react';
import { SessionStage, UserRole, SessionTemplate, PhotoFolder } from '../../types';
import { PHOTO_FOLDERS } from '../../constants';

// Inline Logo Component
const AppLogo = ({ className = "w-12 h-12" }: { className?: string }) => (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="512" height="512" rx="128" fill="#4A89DA"/>
        <path d="M368 144H144C117.49 144 96 165.49 96 192V320C96 346.51 117.49 368 144 368H368C394.51 368 416 346.51 416 320V192C416 165.49 394.51 144 368 144Z" fill="white" fillOpacity="0.2"/>
        <circle cx="256" cy="256" r="90" stroke="white" strokeWidth="32"/>
        <circle cx="256" cy="256" r="36" fill="white"/>
        <circle cx="370" cy="142" r="40" fill="#A4D5A8" stroke="#4A89DA" strokeWidth="8"/>
        <path d="M160 200H190" stroke="white" strokeWidth="12" strokeLinecap="round"/>
    </svg>
);

// Delete Confirmation Modal
const ConfirmDeleteModal = ({ isOpen, onConfirm, onCancel }: { isOpen: boolean, onConfirm: () => void, onCancel: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6 animate-fade-in no-print">
            <div className="bg-white rounded-[24px] p-6 shadow-2xl w-full max-w-xs text-center transform transition-all scale-100 animate-slide-up">
                 <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50 text-red-500">
                    <Trash2 size={24} />
                 </div>
                 <h3 className="text-lg font-bold text-[#1C1C1E] mb-2">Supprimer définitivement ?</h3>
                 <p className="text-sm text-gray-500 mb-6 leading-relaxed">Cette action est irréversible.</p>
                 <div className="flex flex-col gap-3">
                     <Button variant="danger" onClick={onConfirm} fullWidth>Oui, supprimer</Button>
                     <Button variant="ghost" onClick={onCancel} fullWidth>Annuler</Button>
                 </div>
            </div>
        </div>
    );
};

// Folder Photos Preview Modal
const FolderPreviewModal = ({ folder, isOpen, onClose }: { folder: PhotoFolder | null, isOpen: boolean, onClose: () => void }) => {
    if (!isOpen || !folder) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex flex-col animate-fade-in no-print">
            <div className="p-5 flex items-center justify-between border-b border-white/10 bg-black/20">
                <div className="flex flex-col">
                    <h3 className="text-white font-bold text-lg leading-tight">{folder.name}</h3>
                    <p className="text-gray-400 text-xs">{folder.photos.length} photos disponibles</p>
                </div>
                <button 
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    <CloseIcon size={24} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {folder.photos.map(photo => (
                        <div key={photo.id} className="aspect-square rounded-xl overflow-hidden bg-gray-900 border border-white/5 relative group">
                            <img src={photo.url} className="w-full h-full object-cover" alt="" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="p-6 bg-gradient-to-t from-black to-transparent flex justify-center">
                <Button onClick={onClose} className="px-8 shadow-xl">Fermer l'aperçu</Button>
            </div>
        </div>
    );
};

const CreateSession = () => {
  const { createSession, session, setRole, templates, saveTemplate, deleteTemplate, toggleArchiveTemplate } = useSession();
  
  const [view, setView] = useState<'DASHBOARD' | 'EDITOR'>('DASHBOARD');
  const [activeTab, setActiveTab] = useState<'TEMPLATES' | 'ARCHIVES'>('TEMPLATES');
  const [mode, setMode] = useState<'DESIGN' | 'LAUNCH'>('DESIGN');
  
  const [editorId, setEditorId] = useState<string | null>(null);
  const [theme, setTheme] = useState("");
  const [question, setQuestion] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState(PHOTO_FOLDERS[0].id);

  const [previewFolder, setPreviewFolder] = useState<PhotoFolder | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  if (session.stage !== SessionStage.LOBBY) return null;

  const openDesigner = (template?: SessionTemplate) => {
      setMode('DESIGN');
      if (template) {
          setEditorId(template.id);
          setTheme(template.title === 'Séance Libre' ? '' : template.title);
          setQuestion(template.question);
          setSelectedFolderId(template.defaultFolderId);
      } else {
          setEditorId(null);
          setTheme("");
          setQuestion("");
          setSelectedFolderId(PHOTO_FOLDERS[0].id);
      }
      setView('EDITOR');
  };

  const openLauncher = (template: SessionTemplate) => {
      setMode('LAUNCH');
      setEditorId(template.id);
      setTheme(template.title === 'Séance Libre' ? '' : template.title);
      setQuestion(template.question);
      setSelectedFolderId(template.defaultFolderId);
      setView('EDITOR');
  };

  const handleSaveTemplate = () => {
      if (!theme || !question) return;
      const newTemplate: SessionTemplate = {
          id: editorId || `custom-${Date.now()}`,
          title: theme,
          question: question,
          description: "Séance personnalisée",
          defaultFolderId: selectedFolderId,
          icon: "Bookmark",
          isSystem: false,
          enableEmotionInput: true
      };
      saveTemplate(newTemplate);
      setView('DASHBOARD');
  };

  const handleLaunchSession = () => {
      if (!theme || !question) return;
      const selectedFolder = PHOTO_FOLDERS.find(f => f.id === selectedFolderId);
      if (selectedFolder) {
          createSession(theme, question, selectedFolder.photos, true, editorId || undefined);
      }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setTemplateToDelete(id);
  };

  const confirmDelete = () => {
      if (templateToDelete) {
          deleteTemplate(templateToDelete);
          setTemplateToDelete(null);
      }
  };

  const handleUnarchive = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      toggleArchiveTemplate(id);
  };

  const handlePreviewFolder = (e: React.MouseEvent, folder: PhotoFolder) => {
      e.stopPropagation();
      setPreviewFolder(folder);
  };

  if (view === 'DASHBOARD') {
      const activeTemplates = templates.filter(t => !t.isSystem && !t.archived); 
      const archivedTemplates = templates.filter(t => t.archived);
      const displayList = activeTab === 'TEMPLATES' ? activeTemplates : archivedTemplates;

      return (
        <div className="flex flex-col h-full px-5 pt-6 pb-6 animate-fade-in bg-[#F6F1EA] relative md:px-10 md:max-w-6xl md:mx-auto w-full">
            <ConfirmDeleteModal 
                isOpen={!!templateToDelete} 
                onConfirm={confirmDelete} 
                onCancel={() => setTemplateToDelete(null)} 
            />

            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setRole(UserRole.NONE)}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm hover:bg-gray-100 transition-colors active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl font-black text-[#1C1C1E]">Tableau de Bord</h1>
                </div>
                <div className="w-12 h-12 shadow-sm rounded-xl overflow-hidden bg-white">
                     <AppLogo className="w-full h-full" />
                </div>
            </div>

            <div className="flex bg-white p-1 rounded-[16px] mb-6 shadow-sm md:w-1/2">
                <button 
                    onClick={() => setActiveTab('TEMPLATES')}
                    className={`flex-1 py-3 text-sm font-bold rounded-[12px] transition-all ${activeTab === 'TEMPLATES' ? 'bg-[#4A89DA] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    Modèles
                </button>
                <button 
                    onClick={() => setActiveTab('ARCHIVES')}
                    className={`flex-1 py-3 text-sm font-bold rounded-[12px] transition-all flex items-center justify-center gap-2 ${activeTab === 'ARCHIVES' ? 'bg-[#4A89DA] text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
                >
                    <Archive size={16} /> Archives
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                {activeTab === 'TEMPLATES' && (
                     <button 
                        onClick={() => openDesigner()}
                        className="w-full bg-white border-2 border-dashed border-blue-200 text-[#4A89DA] rounded-[24px] p-6 mb-6 flex items-center justify-center gap-3 hover:bg-blue-50 transition-colors active:scale-[0.98] md:h-32"
                    >
                        <Plus size={24} />
                        <span className="font-bold text-lg">Nouvelle Conception</span>
                    </button>
                )}

                <div className="mb-8">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">
                        {activeTab === 'TEMPLATES' ? `Mes Séances (${displayList.length})` : `Historique (${displayList.length})`}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {displayList.map(template => (
                            <div 
                                key={template.id}
                                className={`bg-white rounded-[24px] p-2 pl-5 shadow-sm border border-transparent flex items-center justify-between transition-all group ${activeTab === 'TEMPLATES' ? 'hover:border-blue-100' : 'hover:border-gray-200'}`}
                            >
                                <div className="flex-1 min-w-0 py-3 cursor-pointer" onClick={() => activeTab === 'TEMPLATES' && openLauncher(template)}>
                                    <div className="flex items-center gap-3 mb-1">
                                        {template.archived ? (
                                             <div className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                <Archive size={10} /> {template.archiveDate || 'Archivé'}
                                             </div>
                                        ) : (
                                            <Bookmark size={16} className="text-purple-500 shrink-0" />
                                        )}
                                        <h3 className={`font-bold truncate text-lg ${template.archived ? 'text-gray-600' : 'text-[#1C1C1E]'}`}>{template.title}</h3>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate pr-4">{template.question}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        type="button"
                                        onClick={() => openLauncher(template)}
                                        className="w-12 h-12 rounded-[18px] bg-[#4A89DA] text-white flex items-center justify-center shadow-md shadow-blue-200 ml-1 active:scale-90 transition-transform"
                                    >
                                        <Play size={24} fill="currentColor" className="ml-1" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      );
  }

  const isDesignMode = mode === 'DESIGN';
  return (
    <div className="flex flex-col h-full px-5 pt-6 pb-6 animate-slide-up bg-[#F6F1EA] md:px-10 md:max-w-4xl md:mx-auto w-full">
        <FolderPreviewModal 
            folder={previewFolder} 
            isOpen={!!previewFolder} 
            onClose={() => setPreviewFolder(null)} 
        />

        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setView('DASHBOARD')}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-500 shadow-sm hover:bg-gray-100 transition-colors active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-[#1C1C1E] leading-none">
                        {isDesignMode ? (editorId ? 'Modifier' : 'Nouveau') : 'Préparation'}
                    </h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wide">
                        {isDesignMode ? 'Mode Conception' : 'Mode Lancement'}
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
            <Card className="mb-6">
                <Input 
                    label="Titre / Thème" 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="Ex: Confiance en soi"
                />
                <div className="flex flex-col gap-2 mb-4">
                    <label className="text-[14px] text-[#777B80] font-medium ml-1">Tâche-question</label>
                    <textarea 
                        className="h-28 rounded-[14px] bg-[#FFFFFF] border border-[#E6E6E8] p-4 text-[#1C1C1E] focus:outline-none focus:border-[#4A89DA] resize-none leading-relaxed text-sm"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="La question qui sera posée..."
                    />
                </div>
            </Card>

            <div>
                <h2 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider mb-4 px-2">Support Visuel</h2>
                <div className="flex gap-4 overflow-x-auto pb-4 px-2 -mx-2 no-scrollbar">
                    {PHOTO_FOLDERS.map(folder => {
                        const isSelected = selectedFolderId === folder.id;
                        return (
                            <div 
                                key={folder.id}
                                onClick={() => setSelectedFolderId(folder.id)}
                                className={`
                                    relative flex-shrink-0 w-48 rounded-[24px] overflow-hidden border-2 transition-all duration-300 cursor-pointer bg-white shadow-sm
                                    ${isSelected ? 'border-[#4A89DA] ring-4 ring-[#4A89DA]/10' : 'border-transparent opacity-90'}
                                `}
                            >
                                <div className="h-28 bg-gray-200 relative group/img">
                                    <img src={folder.cover} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={(e) => handlePreviewFolder(e, folder)}
                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white transition-opacity gap-2"
                                    >
                                        <Eye size={20} />
                                        <span className="text-xs font-bold uppercase">Prévisualiser</span>
                                    </button>
                                </div>
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-[#4A89DA]' : 'text-gray-700'}`}>
                                            {folder.name}
                                        </h3>
                                        <button 
                                            onClick={(e) => handlePreviewFolder(e, folder)}
                                            className="w-8 h-8 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-blue-100 hover:text-blue-500 transition-colors"
                                        >
                                            <Eye size={14} />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 line-clamp-2">
                                        {folder.description}
                                    </p>
                                </div>
                                {isSelected && (
                                    <div className="absolute top-3 left-3 bg-[#4A89DA] text-white rounded-full p-1.5 shadow-md">
                                        <Check size={12} />
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>

        <div className="mt-4">
            {isDesignMode ? (
                <Button onClick={handleSaveTemplate} disabled={!theme || !question} fullWidth>Enregistrer la conception</Button>
            ) : (
                <Button onClick={handleLaunchSession} disabled={!theme || !question} className="bg-green-500 hover:bg-green-600 text-white border-none" fullWidth>Lancer l'atelier</Button>
            )}
        </div>
    </div>
  );
};

export default CreateSession;
