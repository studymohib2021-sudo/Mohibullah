import React, { useState, useEffect } from 'react';
import { 
  Compass, Star, BookOpen, Flame, Award, 
  HelpCircle, Volume2, Sparkles, LayoutDashboard, Layers, CheckSquare, RefreshCw, Moon, Sun
} from 'lucide-react';
import { HskWord, UserStats } from './types';

// Import components
import Dashboard from './components/Dashboard';
import WordExplorer from './components/WordExplorer';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import CorrectionGuide from './components/CorrectionGuide';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Loaded custom analyzed words (to make index words full and persistence available)
  const [customUploadedWords, setCustomUploadedWords] = useState<HskWord[]>([]);

  // User Stats state
  const [stats, setStats] = useState<UserStats>({
    levelProgress: {
      1: { completed: 0, total: 150 },
      2: { completed: 0, total: 15 },
      3: { completed: 0, total: 3 },
      4: { completed: 0, total: 3 }
    },
    savedWords: [],
    quizHighScore: 0,
    quizStreak: 0,
    quizHistory: []
  });

  // Load state from LocalStorage on mount
  useEffect(() => {
    try {
      const storedStats = localStorage.getItem('hsk_learner_stats');
      if (storedStats) {
        const parsed = JSON.parse(storedStats);
        // Ensure HSK 1 total is upgraded to 150
        if (parsed.levelProgress) {
          parsed.levelProgress[1] = {
            ...parsed.levelProgress[1],
            total: 150
          };
        }
        setStats(parsed);
      }

      const storedCustomWords = localStorage.getItem('hsk_custom_words');
      if (storedCustomWords) {
        setCustomUploadedWords(JSON.parse(storedCustomWords));
      }

      const storedTheme = localStorage.getItem('hsk_dark_mode');
      if (storedTheme === 'true') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.error("Failed to load local storage state:", e);
    }
  }, []);

  // Save Stats whenever they change
  const saveStats = (newStats: UserStats) => {
    setStats(newStats);
    localStorage.setItem('hsk_learner_stats', JSON.stringify(newStats));
  };

  const handleToggleBookmark = (wordId: string) => {
    const isBookmarked = stats.savedWords.includes(wordId);
    let updatedBookmarks = [];
    if (isBookmarked) {
      updatedBookmarks = stats.savedWords.filter(id => id !== wordId);
    } else {
      updatedBookmarks = [...stats.savedWords, wordId];
    }

    const updated = {
      ...stats,
      savedWords: updatedBookmarks
    };
    saveStats(updated);
  };

  const handleMarkCompleted = (levelNum: number, wordId: string) => {
    // We increment user's level complete states
    const currentCompleted = stats.levelProgress[levelNum]?.completed || 0;
    const currentTotal = stats.levelProgress[levelNum]?.total || 100;
    
    const updatedProgress = {
      ...stats.levelProgress,
      [levelNum]: {
        ...stats.levelProgress[levelNum],
        completed: Math.min(currentTotal, currentCompleted + 1)
      }
    };

    const updated = {
      ...stats,
      levelProgress: updatedProgress
    };
    saveStats(updated);
  };

  const handleAddCustomWord = (word: HskWord) => {
    // Add custom word and persist in cache state
    const alreadyExists = customUploadedWords.some(w => w.character === word.character);
    if (!alreadyExists) {
      const updatedList = [word, ...customUploadedWords];
      setCustomUploadedWords(updatedList);
      localStorage.setItem('hsk_custom_words', JSON.stringify(updatedList));

      // Also dynamically expand the stats total for that level
      const currentProgress = stats.levelProgress[word.level] || { completed: 0, total: 3 };
      const updatedProgress = {
        ...stats.levelProgress,
        [word.level]: {
          ...currentProgress,
          total: currentProgress.total + 1,
          completed: currentProgress.completed + 1 // mark this newly learned word as auto-completed!
        }
      };

      saveStats({
        ...stats,
        levelProgress: updatedProgress
      });
    }
  };

  const handleUpdateQuizStats = (score: number, total: number, levelNum: number) => {
    const pointsGained = score * 10;
    const todayStr = new Date().toISOString().split('T')[0];

    // Calculate streak
    let updatedStreak = stats.quizStreak;
    if (stats.lastQuizDate !== todayStr) {
      updatedStreak += 1;
    }

    const updatedHistory = [
      {
        date: todayStr,
        score,
        total,
        level: `HSK ${levelNum}`
      },
      ...stats.quizHistory
    ];

    const updated = {
      ...stats,
      quizHighScore: Math.max(stats.quizHighScore, stats.quizHighScore + pointsGained),
      quizStreak: updatedStreak,
      lastQuizDate: todayStr,
      quizHistory: updatedHistory,
      levelProgress: {
        ...stats.levelProgress,
        [levelNum]: {
          ...stats.levelProgress[levelNum],
          completed: Math.min(
            stats.levelProgress[levelNum]?.total || 15,
            (stats.levelProgress[levelNum]?.completed || 0) + score
          )
        }
      }
    };
    saveStats(updated);
  };

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem('hsk_dark_mode', String(nextTheme));
    if (nextTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const clearProgress = () => {
    if (confirm("আপনি কি নিশ্চিত যে আপনার পুরো প্রোফাইল প্রোগ্রেস মুছে ফেলতে চান? এটি পুনরায় ফিরিয়ে আনা সম্ভব নয়।")) {
      const freshStats: UserStats = {
        levelProgress: {
          1: { completed: 0, total: 107 },
          2: { completed: 0, total: 15 },
          3: { completed: 0, total: 3 },
          4: { completed: 0, total: 3 }
        },
        savedWords: [],
        quizHighScore: 0,
        quizStreak: 0,
        quizHistory: []
      };
      saveStats(freshStats);
      setCustomUploadedWords([]);
      localStorage.removeItem('hsk_custom_words');
      alert("অগ্রগতি রিসেট করা হয়েছে।");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between transition-colors">
      
      {/* Dynamic App Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-all">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-500 rounded-xl text-zinc-950 flex shadow-sm animate-pulse">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading font-black text-sm tracking-tight text-zinc-900 dark:text-white leading-none">
                HSK Bengali Pronunciation
              </p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono tracking-widest uppercase font-bold leading-none mt-1 block">
                VOCABULARY MASTER
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            
            {/* High score Badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold">
              <Award className="h-4 w-4" />
              <span>{stats.quizHighScore} XP</span>
            </div>

            {/* Streak Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-bold">
              <Flame className="h-4 w-4" />
              <span>{stats.quizStreak} দিন</span>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
              title="থিম পরিবর্তন"
              id="btn-toggle-theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Global tab Navigation bar */}
        <div className="border-t border-zinc-100 dark:border-zinc-850 bg-white/50 dark:bg-zinc-900/50">
          <div className="max-w-6xl mx-auto px-4 flex overflow-x-auto gap-2 py-2 no-scrollbar">
            {[
              { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
              { id: 'explorer', label: 'শব্দকোষ', icon: Compass },
              { id: 'flashcards', label: 'ফ্লশকার্ড', icon: Layers },
              { id: 'quiz', label: 'সক্রিয় কুইজ', icon: CheckSquare },
              { id: 'correction', label: 'উচ্চারণ সংশোধনী', icon: Sparkles }
            ].map(tab => {
              const IconComp = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-sm'
                      : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                  id={`btn-nav-tab-${tab.id}`}
                >
                  <IconComp className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Layout Wrapper */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        
        {activeTab === 'dashboard' && (
          <Dashboard 
            stats={stats} 
            onNavigate={setActiveTab} 
            onSetLevel={setCurrentLevel} 
          />
        )}

        {activeTab === 'explorer' && (
          <WordExplorer
            currentLevel={currentLevel}
            onSetLevel={setCurrentLevel}
            stats={stats}
            onToggleBookmark={handleToggleBookmark}
            onMarkCompleted={handleMarkCompleted}
            onAddCustomWord={handleAddCustomWord}
            customUploadedWords={customUploadedWords}
          />
        )}

        {activeTab === 'flashcards' && (
          <Flashcards
            currentLevel={currentLevel}
            stats={stats}
            onToggleBookmark={handleToggleBookmark}
            customUploadedWords={customUploadedWords}
          />
        )}

        {activeTab === 'quiz' && (
          <Quiz
            currentLevel={currentLevel}
            stats={stats}
            onUpdateQuizStats={handleUpdateQuizStats}
            customUploadedWords={customUploadedWords}
          />
        )}

        {activeTab === 'correction' && (
          <CorrectionGuide />
        )}

      </main>

      {/* Footer copyright */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 text-zinc-400 py-6 text-xs text-center transition-all">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans text-xs">
          <span>HSK 1-4 Vocabulary Master is powered by Google AI Studio Gemini 3.5</span>
          <div className="flex gap-4">
            <button 
              onClick={clearProgress}
              className="text-red-500 font-bold hover:underline bg-transparent"
              id="btn-reset-data"
            >
              অগ্রগতি রিসেট করুন
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
