import React, { useState, useEffect } from 'react';
import { useZeno } from '../context/ZenoContext';
import { api } from '../services/api';
import { KnowledgeItem, DocumentItem, QAItem } from '../types';
import {
  BookOpen,
  PlusCircle,
  UploadCloud,
  HelpCircle,
  Search,
  CheckCircle2,
  Trash2,
  FileText,
  Sparkles,
  Clock,
} from 'lucide-react';

export const TeachPage: React.FC = () => {
  const { showToast } = useZeno();
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'doc' | 'qa'>('info');

  // Knowledge list and search
  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>([]);
  const [documentsList, setDocumentsList] = useState<DocumentItem[]>([]);
  const [qaList, setQaList] = useState<QAItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states: Add Information
  const [infoTitle, setInfoTitle] = useState('');
  const [infoCategory, setInfoCategory] = useState('Projects');
  const [infoContent, setInfoContent] = useState('');
  const [infoTags, setInfoTags] = useState('zeno, esp32, hardware');
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  // Form states: Upload Document
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states: Create Q&A
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [qaCategory, setQaCategory] = useState('General');
  const [isSubmittingQA, setIsSubmittingQA] = useState(false);

  const loadAllKnowledge = async () => {
    try {
      const [k, d, q] = await Promise.all([
        api.getKnowledge(),
        api.getDocuments(),
        api.getQA(),
      ]);
      setKnowledgeList(k);
      setDocumentsList(d);
      setQaList(q);
    } catch (e) {
      console.warn('Failed to load knowledge:', e);
    }
  };

  useEffect(() => {
    loadAllKnowledge();
  }, []);

  // Submit Add Information
  const handleAddInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoTitle.trim() || !infoContent.trim()) {
      showToast('Please fill out Title and Information fields.', 'warning');
      return;
    }

    setIsSubmittingInfo(true);
    try {
      const tagsArray = infoTags.split(',').map(t => t.trim()).filter(Boolean);
      await api.addKnowledge({
        title: infoTitle.trim(),
        category: infoCategory.trim(),
        information: infoContent.trim(),
        tags: tagsArray,
      });
      showToast('✓ Information taught to ZENO successfully!', 'success');
      setInfoTitle('');
      setInfoContent('');
      loadAllKnowledge();
    } catch (e) {
      showToast('Failed to save information', 'error');
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  // Submit Document Upload
  const handleUploadDoc = async () => {
    if (!selectedFile) {
      showToast('Please select a document file first.', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(30);
    try {
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 25 : prev));
      }, 200);

      await api.uploadDocument(selectedFile);
      clearInterval(progressTimer);
      setUploadProgress(100);
      setUploadSuccess(true);
      showToast('✓ Document processed! ZENO can now use this knowledge.', 'success');
      setSelectedFile(null);
      loadAllKnowledge();
    } catch (e) {
      showToast('Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Create Q&A
  const handleAddQA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim()) {
      showToast('Please fill out both Question and Answer.', 'warning');
      return;
    }

    setIsSubmittingQA(true);
    try {
      await api.addQA({
        question: qaQuestion.trim(),
        answer: qaAnswer.trim(),
        category: qaCategory.trim(),
      });
      showToast('✓ Q&A pair added to ZENO successfully!', 'success');
      setQaQuestion('');
      setQaAnswer('');
      loadAllKnowledge();
    } catch (e) {
      showToast('Failed to save Q&A', 'error');
    } finally {
      setIsSubmittingQA(false);
    }
  };

  const handleDeleteKnowledge = async (id: string) => {
    if (confirm('Are you sure you want to remove this knowledge from ZENO?')) {
      await api.deleteKnowledge(id);
      showToast('Knowledge removed', 'info');
      loadAllKnowledge();
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (confirm('Are you sure you want to remove this document?')) {
      await api.deleteDocument(id);
      showToast('Document removed', 'info');
      loadAllKnowledge();
    }
  };

  const handleDeleteQA = async (id: string) => {
    if (confirm('Are you sure you want to remove this Q&A?')) {
      await api.deleteQA(id);
      showToast('Q&A pair removed', 'info');
      loadAllKnowledge();
    }
  };

  // Filtered knowledge search results
  const filteredKnowledge = knowledgeList.filter(k => {
    const q = searchQuery.toLowerCase();
    return (
      k.title.toLowerCase().includes(q) ||
      k.category.toLowerCase().includes(q) ||
      k.information.toLowerCase().includes(q) ||
      k.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* Title & Introduction */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-white tracking-tight flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          TEACH ZENO
        </h2>
        <p className="text-slate-400 text-sm max-w-xl mx-auto">
          Add custom knowledge, articles, or direct questions and answers. ZENO will use this information whenever you ask questions!
        </p>
      </div>

      {/* 3 Large Action Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => {
            setActiveSubTab('info');
            setUploadSuccess(false);
          }}
          className={`p-6 rounded-2xl border text-left transition-all ${
            activeSubTab === 'info'
              ? 'bg-[#182133] border-cyan-500/60 shadow-xl shadow-cyan-500/10'
              : 'bg-[#131722] border-[#22293b] hover:border-slate-600 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Add Information</h3>
          </div>
          <p className="text-xs text-slate-400">
            Write custom topics, notes, descriptions, or project facts for ZENO.
          </p>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('doc');
            setUploadSuccess(false);
          }}
          className={`p-6 rounded-2xl border text-left transition-all ${
            activeSubTab === 'doc'
              ? 'bg-[#182133] border-cyan-500/60 shadow-xl shadow-cyan-500/10'
              : 'bg-[#131722] border-[#22293b] hover:border-slate-600 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Upload Document</h3>
          </div>
          <p className="text-xs text-slate-400">
            Upload PDF, TXT, CSV, DOCX, or Markdown files for automatic indexing.
          </p>
        </button>

        <button
          onClick={() => {
            setActiveSubTab('qa');
            setUploadSuccess(false);
          }}
          className={`p-6 rounded-2xl border text-left transition-all ${
            activeSubTab === 'qa'
              ? 'bg-[#182133] border-cyan-500/60 shadow-xl shadow-cyan-500/10'
              : 'bg-[#131722] border-[#22293b] hover:border-slate-600 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Create Q&A</h3>
          </div>
          <p className="text-xs text-slate-400">
            Define exact questions and answers that ZENO will answer word-for-word.
          </p>
        </button>
      </div>

      {/* TAB CONTENT 1: ADD INFORMATION */}
      {activeSubTab === 'info' && (
        <div className="zeno-card p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-cyan-400" />
            Add Information
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Enter information that ZENO should retain in its brain.
          </p>

          <form onSubmit={handleAddInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={infoTitle}
                  onChange={e => setInfoTitle(e.target.value)}
                  placeholder="e.g. ZENO Project Overview"
                  className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  value={infoCategory}
                  onChange={e => setInfoCategory(e.target.value)}
                  placeholder="e.g. Projects, Hardware, Personal"
                  className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Information
              </label>
              <textarea
                required
                rows={4}
                value={infoContent}
                onChange={e => setInfoContent(e.target.value)}
                placeholder="e.g. ZENO is an ESP32-based AI voice assistant developed as an engineering project featuring an LCD display, dual speakers, and web control dashboard."
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={infoTags}
                onChange={e => setInfoTags(e.target.value)}
                placeholder="e.g. zeno, esp32, assistant"
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingInfo}
                className="zeno-btn-primary px-6 py-3 font-bold text-xs tracking-wider uppercase rounded-xl"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmittingInfo ? 'Teaching ZENO...' : 'Teach ZENO'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT 2: UPLOAD DOCUMENT */}
      {activeSubTab === 'doc' && (
        <div className="zeno-card p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-purple-400" />
            Upload Document
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Upload documents (PDF, TXT, CSV, DOCX, Markdown) for ZENO to ingest into its knowledge base.
          </p>

          <div className="border-2 border-dashed border-[#2b354a] rounded-2xl p-8 text-center hover:border-purple-500/50 transition-colors bg-[#0e111a]">
            <input
              type="file"
              id="file-upload"
              accept=".txt,.md,.csv,.json,.doc,.docx,.pdf"
              className="hidden"
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                  setUploadSuccess(false);
                }
              }}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-12 h-12 text-purple-400 mb-3 animate-pulse" />
              <span className="text-sm font-bold text-white">
                {selectedFile ? selectedFile.name : 'Choose a file or drag & drop here'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports PDF, TXT, DOCX, CSV, Markdown (Max 10MB)
              </span>
            </label>

            {selectedFile && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  onClick={handleUploadDoc}
                  disabled={isUploading}
                  className="zeno-btn-primary bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-2.5 text-xs font-bold"
                >
                  {isUploading ? 'Processing Document...' : 'Upload & Teach ZENO'}
                </button>
              </div>
            )}
          </div>

          {/* Upload Progress & Success States */}
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Ingesting knowledge chunks...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#0c0e12] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Document uploaded and processed successfully!
              </div>
              <p className="text-slate-300 pl-6">
                ✓ Information processed • ZENO can now use this knowledge in voice conversations.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: CREATE Q&A */}
      {activeSubTab === 'qa' && (
        <div className="zeno-card p-6 sm:p-8">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            Create Q&A Pair
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Teach ZENO an exact answer to a specific question.
          </p>

          <form onSubmit={handleAddQA} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Question
              </label>
              <input
                type="text"
                required
                value={qaQuestion}
                onChange={e => setQaQuestion(e.target.value)}
                placeholder='e.g. "What is ZENO?"'
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Answer
              </label>
              <textarea
                required
                rows={3}
                value={qaAnswer}
                onChange={e => setQaAnswer(e.target.value)}
                placeholder='e.g. "ZENO is my ESP32-based personal AI voice assistant."'
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={qaCategory}
                onChange={e => setQaCategory(e.target.value)}
                placeholder="e.g. General, Project, FAQ"
                className="w-full bg-[#0c0e12] border border-[#242c3f] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingQA}
                className="zeno-btn-primary bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3 font-bold text-xs tracking-wider uppercase rounded-xl"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmittingQA ? 'Adding...' : 'Add to ZENO'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECTION 10: KNOWLEDGE SEARCH & MANAGEMENT */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              Search what ZENO knows
            </h3>
            <p className="text-xs text-slate-400">
              Browse and manage taught knowledge, uploaded documents, and Q&A pairs
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search what ZENO knows..."
              className="w-full bg-[#121622] border border-[#252e42] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Knowledge Cards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredKnowledge.map(k => (
            <div key={k.id} className="zeno-card p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="text-sm font-bold text-white leading-tight">{k.title}</h4>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                    {k.category}
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {k.information}
                </p>
              </div>

              <div>
                {k.tags && k.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {k.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] text-slate-400 bg-[#0e111a] px-2 py-0.5 rounded border border-[#232938]">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[#232938] text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteKnowledge(k.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Q&A items */}
          {qaList.map(qa => (
            <div key={qa.id} className="zeno-card p-5 border-emerald-500/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Q&A PAIR ({qa.category})
                  </span>
                  <button
                    onClick={() => handleDeleteQA(qa.id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Q: "{qa.question}"</h4>
                <p className="text-xs text-slate-300">A: "{qa.answer}"</p>
              </div>
              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-[#232938]">
                Added {new Date(qa.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}

          {/* Documents items */}
          {documentsList.map(doc => (
            <div key={doc.id} className="zeno-card p-5 border-purple-500/20 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    DOCUMENT
                  </span>
                  <button
                    onClick={() => handleDeleteDoc(doc.id)}
                    className="p-1 text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-white truncate">{doc.originalName}</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Indexed into {doc.chunkCount} knowledge paragraphs
                </p>
              </div>
              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-[#232938]">
                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
