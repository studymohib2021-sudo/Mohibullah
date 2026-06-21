import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, RefreshCw, Volume2, 
  HelpCircle, Sparkles, Star, Check, AlertCircle, Play
} from 'lucide-react';
import { HskWord, UserStats } from '../types';
import { masterVocabularyList } from '../data/hskMasterIndex';

interface FlashcardsProps {
  currentLevel: number;
  stats: UserStats;
  onToggleBookmark: (wordId: string) => void;
  customUploadedWords: HskWord[];
}

export default function Flashcards({ 
  currentLevel, 
  stats, 
  onToggleBookmark,
  customUploadedWords 
}: FlashcardsProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const activeWords = useMemo(() => {
    const combined = [...masterVocabularyList, ...customUploadedWords];
    return combined.filter(w => w.level === currentLevel);
  }, [currentLevel, customUploadedWords]);

  const currentWord = useMemo<HskWord | null>(() => {
    if (activeWords.length === 0) return null;
    return activeWords[cardIndex] || activeWords[0];
  }, [activeWords, cardIndex]);

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex(prev => (prev + 1) % activeWords.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCardIndex(prev => (prev - 1 + activeWords.length) % activeWords.length);
    }, 150);
  };

  const speakChn = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const isBookmarked = currentWord ? stats.savedWords.includes(currentWord.id) : false;

  return (
    <div className="space-y-6 text-center max-w-xl mx-auto" id="flashcards-panel">
      {/* Intro info */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-heading font-black text-zinc-900 dark:text-white">নিখুঁত ফ্লশকার্ড প্র্যাকটিস {currentLevel}</h2>
        <p className="text-xs text-zinc-500 font-sans">কার্ড উল্টে সঠিক উচ্চারণ এবং বাক্য মুখস্থ করুন।</p>
      </div>

      {activeWords.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-12 rounded-2xl">
          <HelpCircle className="h-10 w-10 text-zinc-400 mx-auto" />
          <h3 className="mt-4 font-bold text-zinc-800 dark:text-zinc-200">কোন শব্দ পাওয়া যায়নি</h3>
          <p className="text-xs text-zinc-550 mt-1">শব্দকোষে এই লেভেলের আরও চীনা শব্দ যুক্ত করুন!</p>
        </div>
      ) : (
        currentWord && (
          <div className="space-y-6">
            {/* Flipping Container Card */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              className={`relative w-full min-h-[340px] perspective-1000 cursor-pointer group`}
              id="flashcard-container"
            >
              {/* Card Inner elements */}
              <div 
                className={`relative w-full h-full min-h-[340px] duration-500 preserve-3d transition-all ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT OF THE CARD */}
                <div className="absolute inset-0 w-full h-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-md flex flex-col justify-between items-center backface-hidden">
                  <div className="flex w-full justify-between items-center text-zinc-400 text-xs font-mono">
                    <span>HSK LEVEL {currentLevel}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(currentWord.id);
                      }}
                      className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full"
                      id={`btn-flashcard-star-${currentWord.id}`}
                    >
                      <Star className={`h-4 w-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : 'text-zinc-400'}`} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <span className="text-6xl sm:text-7xl font-sans font-black text-zinc-950 dark:text-white bg-zinc-50 dark:bg-zinc-950 px-8 py-6 rounded-2xl select-none">
                      {currentWord.character}
                    </span>
                    <p className="text-sm text-zinc-450 uppercase tracking-widest animate-pulse mt-4 font-sans font-medium text-emerald-600">
                      ট্যাপ করে উত্তর দেখুন
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => speakChn(currentWord.character, e)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                      id={`btn-flash-speak-${currentWord.id}`}
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      উচ্চারণ শুনুন
                    </button>
                  </div>
                </div>

                {/* BACK OF THE CARD */}
                <div className="absolute inset-0 w-full h-full bg-zinc-950 border-2 border-zinc-800 text-white p-6 rounded-3xl shadow-xl flex flex-col justify-between items-center rotate-y-180 backface-hidden overflow-y-auto">
                  
                  {/* Top bar info */}
                  <div className="flex w-full justify-between items-center text-zinc-500 text-xs font-mono">
                    <span className="flex items-center gap-1.5">
                      সঠিক উত্তর এবং উদাহরণ
                      {currentWord.isFallback && (
                        <span className="text-amber-400 font-sans font-semibold text-[10px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40 animate-pulse">
                          অফলাইন ব্যাকআপ
                        </span>
                      )}
                    </span>
                    <span className="text-emerald-400 font-bold">HSK {currentLevel}</span>
                  </div>

                  {/* Body information */}
                  <div className="space-y-3 text-center my-auto py-2 w-full">
                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-black text-white">{currentWord.character}</span>
                      <span className="text-xs text-zinc-400 font-mono mt-1">{currentWord.pinyin}</span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">
                        ইংরেজি অর্থ: <span className="text-zinc-200 font-bold">{currentWord.english}</span>
                      </p>
                      
                      {/* Accurate corrected Bangla phonetic guidance */}
                      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl space-y-1 max-w-sm mx-auto">
                        <p className="text-xs text-zinc-400 leading-none">বাস্তব বাংলা অডিও সদৃশ সঠিক উচ্চারণ:</p>
                        <p className="text-sm text-emerald-400 font-black font-sans underline select-all">{currentWord.banglaPronounce}</p>
                      </div>

                      <p className="text-sm text-zinc-400">
                        বাংলা অর্থ: <span className="text-emerald-300 font-black font-sans text-base">{currentWord.banglaMeaning}</span>
                      </p>
                    </div>

                    <div className="pt-2">
                      <div className="bg-zinc-900 p-2 text-left rounded-lg text-xs space-y-1 max-w-md mx-auto">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-550 font-bold uppercase font-sans">বাক্য উদাহরণ:</span>
                          <button
                            onClick={(e) => speakChn(currentWord.sentence, e)}
                            className="text-emerald-400 text-xs font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            id={`btn-flash-sentence-sound-${currentWord.id}`}
                          >
                            <Play className="h-3 w-3 fill-emerald-400" />
                            প্লে
                          </button>
                        </div>
                        <p className="text-white font-medium">{currentWord.sentence}</p>
                        <p className="text-zinc-450 italic font-mono">{currentWord.sentencePinyin}</p>
                        <p className="text-zinc-300"><strong className="text-zinc-500 font-sans">বাংলা:</strong> {currentWord.sentenceBangla}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions back */}
                  <div className="text-zinc-500 text-xs italic font-sans">
                    ট্যাপ করে আবারো সামনে ফিরে যান
                  </div>

                </div>
              </div>
            </div>

            {/* Stepper Navigation Actions */}
            <div className="flex justify-between items-center gap-6 pt-2">
              <button 
                onClick={prevCard} 
                className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                id="btn-flash-prev"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              <div className="text-sm text-zinc-500 font-mono font-bold">
                {cardIndex + 1} / {activeWords.length} শব্দ
              </div>

              <button 
                onClick={nextCard} 
                className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                id="btn-flash-next"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Recall satisfaction actions */}
            <div className="flex gap-2 pt-2 justify-center">
              <button
                onClick={nextCard}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg border border-red-100 dark:border-red-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                id="btn-recall-hard"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                মনে নেই
              </button>
              <button
                onClick={nextCard}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-900/40 transition-colors flex items-center gap-1 cursor-pointer"
                id="btn-recall-good"
              >
                <Check className="h-3.5 w-3.5" />
                পারি / মনে আছে
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
