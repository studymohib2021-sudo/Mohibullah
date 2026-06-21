import React, { useState, useMemo } from 'react';
import { 
  Search, Star, Volume2, HelpCircle, Sparkles, BookOpen, 
  ChevronDown, ChevronUp, CheckCircle, AlertCircle, Loader2, Play
} from 'lucide-react';
import { HskWord, UserStats } from '../types';
import { masterVocabularyList, basicHskWordsIndex, BasicIndexWord } from '../data/hskMasterIndex';

interface WordExplorerProps {
  currentLevel: number;
  onSetLevel: (level: number) => void;
  stats: UserStats;
  onToggleBookmark: (wordId: string) => void;
  onMarkCompleted: (level: number, wordId: string) => void;
  onAddCustomWord: (word: HskWord) => void;
  customUploadedWords: HskWord[];
}

export default function WordExplorer({ 
  currentLevel, 
  onSetLevel, 
  stats, 
  onToggleBookmark, 
  onMarkCompleted,
  onAddCustomWord,
  customUploadedWords
}: WordExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedWordIds, setExpandedWordIds] = useState<string[]>([]);
  const [loadingWordChar, setLoadingWordChar] = useState<string | null>(null);
  
  // Custom manual lookup query state
  const [customWordText, setCustomWordText] = useState('');
  const [customLookupLoading, setCustomLookupLoading] = useState(false);
  const [customLookupError, setCustomLookupError] = useState<string | null>(null);

  // Combine pre-compiled vocabulary list with custom generated ones
  const activeMasterList = useMemo(() => {
    return [...masterVocabularyList, ...customUploadedWords];
  }, [customUploadedWords]);

  // Handle generic index words that aren't fully preloaded yet
  const basicIndexFiltered = useMemo(() => {
    return basicHskWordsIndex.filter(w => {
      // Don't show index words if they have already been loaded into master list
      const alreadyLoaded = activeMasterList.some(m => m.character === w.character);
      return !alreadyLoaded;
    });
  }, [activeMasterList]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    activeMasterList.forEach(w => {
      if (w.category) cats.add(w.category);
    });
    return ['All', ...Array.from(cats)];
  }, [activeMasterList]);

  // Filter words belonging to current level
  const displayedWords = useMemo(() => {
    return activeMasterList.filter(word => {
      if (word.level !== currentLevel) return false;
      if (selectedCategory !== 'All' && word.category !== selectedCategory) return false;
      
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;
      
      return (
        word.character.includes(query) ||
        word.pinyin.toLowerCase().includes(query) ||
        word.english.toLowerCase().includes(query) ||
        word.banglaMeaning.includes(query) ||
        word.banglaPronounce.includes(query)
      );
    });
  }, [activeMasterList, currentLevel, selectedCategory, searchQuery]);

  // Filter index words belonging to current level
  const displayedIndexWords = useMemo(() => {
    if (searchQuery.trim() === '') {
      return basicIndexFiltered.filter(w => w.level === currentLevel);
    }
    const query = searchQuery.toLowerCase().trim();
    return basicIndexFiltered.filter(w => {
      if (w.level !== currentLevel) return false;
      return (
        w.character.includes(query) ||
        w.pinyin.toLowerCase().includes(query) ||
        w.english.toLowerCase().includes(query)
      );
    });
  }, [basicIndexFiltered, currentLevel, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedWordIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Speaks using native synthesis
  const speakChn = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const speakEng = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Asynchronous call to server of Gemini explanation
  const fetchWordDetailsAndAdd = async (indexWord: BasicIndexWord) => {
    setLoadingWordChar(indexWord.character);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: indexWord.character,
          pinyin: indexWord.pinyin,
          english: indexWord.english,
          level: indexWord.level,
          category: indexWord.category
        })
      });
      if (!response.ok) throw new Error("Could not construct pronunciation.");
      const data: HskWord = await response.json();
      
      // Assign custom unique ID
      data.id = `dyn-${Date.now()}-${data.character}`;
      onAddCustomWord(data);
      
      // Auto expand newly added word
      setExpandedWordIds(prev => [...prev, data.id]);
    } catch (err) {
      console.error(err);
      alert("Failed to load Gemini live guidance. Please try again.");
    } finally {
      setLoadingWordChar(null);
    }
  };

  // Handle custom lookup logic
  const handleCustomLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWordText.trim()) return;

    setCustomLookupLoading(true);
    setCustomLookupError(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: customWordText.trim(),
          pinyin: "", // let Gemini derive this on-the-fly
          english: "", // let Gemini derive this on-the-fly
          level: currentLevel,
          category: "User Lookup"
        })
      });

      if (!response.ok) {
        throw new Error("Could not retrieve AI analysis.");
      }

      const generatedWord: HskWord = await response.json();
      generatedWord.id = `dyn-custom-${Date.now()}-${generatedWord.character}`;
      
      // Add custom word to our local session words
      onAddCustomWord(generatedWord);
      
      // Clear input and focus
      setCustomWordText('');
      setExpandedWordIds(prev => [...prev, generatedWord.id]);
    } catch (err: any) {
      setCustomLookupError(err.message || "Something went wrong.");
    } finally {
      setCustomLookupLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="word-explorer-panel">
      {/* Search Header Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
            <input
              type="text"
              placeholder="চীনা অক্ষর, পিনইন, বাংলা বা ইংরেজি অর্থ দিয়ে অনুসন্ধান করুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans text-sm"
              id="search-input"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans text-sm cursor-pointer"
            id="category-select"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'সব ক্যাটাগরি' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Level Controls */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
          {[1, 2, 3, 4].map(lvl => (
            <button
              key={lvl}
              onClick={() => {
                onSetLevel(lvl);
                setSelectedCategory('All');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                currentLevel === lvl
                  ? 'bg-emerald-500 text-zinc-900 shadow-md scale-102'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-300'
              }`}
              id={`tab-hsk-level-${lvl}`}
            >
              HSK {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="space-y-4">
        {displayedWords.length === 0 && displayedIndexWords.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
            <HelpCircle className="h-10 w-10 text-zinc-400 mx-auto" />
            <h3 className="mt-4 font-bold text-zinc-900 dark:text-zinc-300">কোন শব্দ পাওয়া যায়নি</h3>
            <p className="text-sm text-zinc-550 mt-1 max-w-md mx-auto">
              অনুগ্রহ করে অন্য শব্দ খুঁজে দেখুন অথবা নিচের স্মার্ট AI ইনপুটে যেকোনো কাস্টম শব্দ লিখে ব্যাখ্যা পেতে পারেন!
            </p>
          </div>
        )}

        {/* Pre-packaged or Fully Loaded words */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedWords.map(word => {
            const isExpanded = expandedWordIds.includes(word.id);
            const isBookmarked = stats.savedWords.includes(word.id);

            return (
              <div
                key={word.id}
                onClick={() => toggleExpand(word.id)}
                className={`bg-white dark:bg-zinc-900 border transition-all rounded-xl p-5 hover:shadow-md cursor-pointer text-left ${
                  isExpanded ? 'ring-2 ring-emerald-500 border-transparent shadow shadow-emerald-50' : 'border-zinc-200 dark:border-zinc-805'
                }`}
                id={`word-card-${word.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-zinc-950 dark:text-white font-sans">
                        {word.character}
                      </span>
                      <span className="text-sm text-zinc-500 dark:text-zinc-400 font-mono font-medium">
                        {word.pinyin}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-zinc-400 font-sans">
                        ইংলিশ: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{word.english}</span>
                      </p>
                      
                      {/* Accurate corrected Bangla output */}
                      <p className="text-xs text-zinc-400 font-sans">
                        বাংলা অর্থ: <span className="text-zinc-900 dark:text-zinc-200 font-bold">{word.banglaMeaning}</span>
                      </p>
                      
                      <div className="pt-1 flex flex-wrap gap-2 items-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
                          উচ্চারণ: <span className="font-bold underline tracking-wide">{word.banglaPronounce}</span>
                        </span>
                        {word.isFallback && (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 font-sans cursor-help"
                            title="Gemini কোটা সীমার কারণে অফলাইন নিয়মের ভিত্তিতে এই উচ্চারণটি স্বয়ংক্রিয়ভাবে তৈরি হয়েছে"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            অফলাইন ব্যাকআপ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Action group */}
                  <div className="flex gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => speakChn(word.character)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer text-zinc-600 dark:text-zinc-300"
                      title="উচ্চারণ শুনুন"
                      id={`btn-speech-chn-${word.id}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onToggleBookmark(word.id)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="বুকমার্ক করুন"
                      id={`btn-bookmark-${word.id}`}
                    >
                      <Star className={`h-4 w-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                    </button>
                  </div>
                </div>

                {/* Additional expand container details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400 uppercase font-sans">উদাহরণ বাক্য</span>
                        <button
                          onClick={() => speakChn(word.sentence)}
                          className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                          id={`btn-play-sentence-${word.id}`}
                        >
                          <Play className="h-3 w-3 fill-emerald-600 dark:fill-emerald-400" />
                          বাক্যের অডিও
                        </button>
                      </div>
                      <p className="text-zinc-950 dark:text-white font-sans font-medium text-base">
                        {word.sentence}
                      </p>
                      <p className="text-zinc-400 font-mono text-xs italic">
                        {word.sentencePinyin}
                      </p>
                      <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                      <p className="text-zinc-700 dark:text-zinc-300 text-xs">
                        <strong className="text-zinc-400 font-sans">বাংলা:</strong> {word.sentenceBangla}
                      </p>
                      <p className="text-zinc-750 dark:text-zinc-400 text-xs text-zinc-500">
                        <strong className="text-zinc-400 font-sans">English:</strong> {word.sentenceEnglish}
                      </p>
                    </div>

                    {/* Gemini Phonics tips fallback descriptor */}
                    {word.id.startsWith('dyn') && (
                      <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/10 p-3 rounded-lg flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase font-sans">AI Phonic Tips & Mouth Posture</p>
                          <p className="text-xs text-emerald-700 dark:text-zinc-350 mt-0.5 leading-relaxed">
                            {/* Handled dynamic tips generated by Gemini */}
                            {(word as any).phoneticBreakdown || "এই চীনা উচ্চারণটি নির্ভুল করার জন্য বাংলার সঠিক বর্ণানুক্রম লক্ষ্য করুন। টোন এবং মুখগহ্বরের সঠিক আকৃতি ফুটিয়ে তুলতে উপরের বাক্যের অডিওটি কয়েকবার শুনুন।"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Index words missing full details of Level 3 & 4 */}
        {displayedIndexWords.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider font-sans">
              বাকি শব্দাবলি (AI পিনইন ও বাংলা বিশ্লেষণ এভেইলেবল)
            </h3>
            <p className="text-xs text-zinc-550 italic leading-snug">
              নিচের শব্দগুলোর সঠিক বাংলা গাইড ও কাস্টম অডিও বাক্য পেতে <strong>“✨ AI গাইড ও বাক্য”</strong> বাটনে চাপ দিন। Gemini সাথে সাথে আপনার জন্য নির্ভুল ও নিখুঁত উচ্চারণ ও প্র্যাক্টিস উপাদান তৈরি করে দেবে!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {displayedIndexWords.map(indexWord => (
                <div
                  key={indexWord.character}
                  className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all text-left"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-zinc-900 dark:text-white font-sans">{indexWord.character}</span>
                      <span className="text-xs text-zinc-400 font-mono">({indexWord.pinyin})</span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1">
                      অর্থ: {indexWord.english}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => fetchWordDetailsAndAdd(indexWord)}
                    disabled={loadingWordChar === indexWord.character}
                    className="mt-3 w-full py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-850 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                    id={`btn-ai-index-btn-${indexWord.character}`}
                  >
                    {loadingWordChar === indexWord.character ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        AI তৈরি করছে...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-emerald-600 animate-pulse" />
                        AI গাইড ও বাক্য
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Lookup form - "No word missing" feature */}
      <div className="bg-gradient-to-r from-zinc-50 to-emerald-50/40 dark:from-zinc-900 dark:to-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 text-left">
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-black text-zinc-900 dark:text-white text-base">
              যেকোনো কাস্টম শব্দের AI উচ্চারণ ও বাংলা গাইড
            </h3>
            <p className="text-zinc-500 text-xs mt-0.5 font-sans">
              যে শব্দগুলো এই তালিকায় নেই, সেই যেকোনো চীনা শব্দ বাংলায় সঠিকভাবে শেখার জন্য নিচে লিখে চার্জ দিন।
            </p>
          </div>
        </div>

        <form onSubmit={handleCustomLookupSubmit} className="flex gap-2">
          <input
            type="text"
            required
            value={customWordText}
            onChange={(e) => setCustomWordText(e.target.value)}
            placeholder="যেমন:  苹果,  谢谢,  你好  বা যেকোনো চীনা শব্দ লিখুন..."
            className="flex-1 px-4 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-sans"
            id="custom-lookup-input"
          />
          <button
            type="submit"
            disabled={customLookupLoading}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
            id="btn-custom-lookup-submit"
          >
            {customLookupLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                AI বিশ্লেষণ...
              </>
            ) : (
              <>
                বিশ্লেষণ করুন
              </>
            )}
          </button>
        </form>

        {customLookupError && (
          <p className="text-xs text-red-500 font-sans mt-1">
            ভুল হয়েছে: {customLookupError}
          </p>
        )}
      </div>
    </div>
  );
}
