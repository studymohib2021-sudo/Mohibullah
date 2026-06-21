import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Award, PlayCircle, Loader2, Volume2, 
  CheckCircle2, XCircle, RefreshCw, Flame, ArrowRight, HelpCircle
} from 'lucide-react';
import { HskWord, QuizQuestion, UserStats } from '../types';
import { masterVocabularyList } from '../data/hskMasterIndex';

interface QuizProps {
  currentLevel: number;
  stats: UserStats;
  onUpdateQuizStats: (score: number, total: number, levelNum: number) => void;
  customUploadedWords: HskWord[];
}

export default function Quiz({ 
  currentLevel, 
  stats, 
  onUpdateQuizStats,
  customUploadedWords
}: QuizProps) {
  const [quizLength, setQuizLength] = useState(5);
  const [isAiMode, setIsAiMode] = useState(false);
  const [quizState, setQuizState] = useState<'config' | 'loading' | 'active' | 'finished'>('config');
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeWords = useMemo(() => {
    const combined = [...masterVocabularyList, ...customUploadedWords];
    return combined.filter(w => w.level === currentLevel);
  }, [currentLevel, customUploadedWords]);

  const speakChn = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Generate offline quiz questions locally
  const generateLocalQuiz = () => {
    if (activeWords.length < 4) {
      setErrorMessage("ভিডিও বা কাস্টম শব্দ মিলিয়ে মিনিমাম ৪টি শব্দ ক্যাশেতে লোড থাকা দরকার। অনুগ্রহ করে এক্সপ্লোরার থেকে কাস্টম শব্দ বিশ্লেষণ করুন!");
      return;
    }
    setErrorMessage(null);
    setQuizState('loading');

    setTimeout(() => {
      // Pick random words
      const shuffled = [...activeWords].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, Math.min(quizLength, shuffled.length));

      const generatedQuestions = selectedWords.map((word, index) => {
        // Find 3 incorrect distractors
        const otherWords = activeWords.filter(w => w.id !== word.id);
        const distractors = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // Randomly pick a question type
        const questionTypes: ('pinyin' | 'bangla_pronounce' | 'meaning' | 'character')[] = [
          'pinyin', 'bangla_pronounce', 'meaning', 'character'
        ];
        const type = questionTypes[Math.floor(Math.random() * questionTypes.length)];

        let questionText = "";
        let correctAnswer = "";
        let optionValues: string[] = [];

        if (type === 'character') {
          questionText = `"${word.banglaMeaning}" এর সঠিক চীনা রূপ কোনটি?`;
          correctAnswer = word.character;
          optionValues = [word.character, ...distractors.map(d => d.character)];
        } else if (type === 'pinyin') {
          questionText = `"${word.character}" এর সঠিক পিনইন (Pinyin) কোনটি?`;
          correctAnswer = word.pinyin;
          optionValues = [word.pinyin, ...distractors.map(d => d.pinyin)];
        } else if (type === 'bangla_pronounce') {
          questionText = `"${word.character} (${word.pinyin})" এর সঠিক ও নির্ভুল বাংলা উচ্চারণ কোনটি?`;
          correctAnswer = word.banglaPronounce;
          optionValues = [word.banglaPronounce, ...distractors.map(d => d.banglaPronounce)];
        } else {
          questionText = `"${word.character} (${word.pinyin})" এর বাংলা অর্থ কি?`;
          correctAnswer = word.banglaMeaning;
          optionValues = [word.banglaMeaning, ...distractors.map(d => d.banglaMeaning)];
        }

        // Shuffle options
        optionValues = optionValues.sort(() => 0.5 - Math.random());

        // Remove duplicates and ensure exactly 4 options
        optionValues = Array.from(new Set(optionValues)).slice(0, 4);
        if (optionValues.length < 4) {
          // Fallback if not enough options
          optionValues = [correctAnswer, "অন্যটি", "জানা নেই", "ভুল উত্তর"];
        }

        return {
          id: `local-q-${index}`,
          type,
          word,
          questionText,
          options: optionValues,
          correctAnswer
        };
      });

      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setScore(0);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
      setQuizState('active');
    }, 400);
  };

  // Generate quizzes via server Gemini
  const generateAiQuiz = async () => {
    setQuizState('loading');
    setErrorMessage(null);
    try {
      const response = await fetch('/api/quiz-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level: currentLevel, length: quizLength })
      });
      if (!response.ok) throw new Error("Could not construct AI Challenge questions.");
      const data = await response.json();
      
      if (data && data.length > 0) {
        setQuestions(data);
        setCurrentIndex(0);
        setScore(0);
        setSelectedAnswer(null);
        setIsAnswerChecked(false);
        setQuizState('active');
      } else {
        throw new Error("Empty quiz response.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Gemini AI কুইজ সার্ভার রেসপন্স পায়নি। কটেজ ব্রাউজার লাইব্রেরি ব্যবহার করে অফলাইন কুইজ খেলে দেখুন!");
      setQuizState('config');
    }
  };

  const handleStartQuiz = () => {
    if (isAiMode) {
      generateAiQuiz();
    } else {
      generateLocalQuiz();
    }
  };

  const handleAnswerSelect = (option: string) => {
    if (isAnswerChecked) return;
    setSelectedAnswer(option);
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) return;
    setIsAnswerChecked(true);
    
    // Play correct word audio for reinforcement
    const currentQ = questions[currentIndex];
    if (selectedAnswer === currentQ.correctAnswer) {
      setScore(prev => prev + 1);
      speakChn(currentQ.word.character);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerChecked(false);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setQuizState('finished');
      onUpdateQuizStats(score, questions.length, currentLevel);
    }
  };

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex) / questions.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-xl mx-auto text-left" id="quiz-panel">
      {/* 1. CONFIGURATION VIEW */}
      {quizState === 'config' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 rounded-xl p-6 space-y-6 shadow-sm">
          <div className="text-center space-y-2">
            <Award className="h-10 w-10 text-emerald-500 mx-auto animate-bounce" />
            <h2 className="text-xl font-heading font-black text-zinc-950 dark:text-white">র‍্যাপিড রিটেনশন কুইজ</h2>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              HSK Level {currentLevel} শব্দগুলোর সঠিক উচ্চারণ ও অর্থ মনে রাখার পরীক্ষা নিন।
            </p>
          </div>

          {errorMessage && (
            <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-lg border border-red-150 font-sans leading-relaxed">
              {errorMessage}
            </div>
          )}

          <div className="space-y-4">
            {/* Length parameter */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase font-sans">কুইজ দৈর্ঘ্য নির্ধারণ করুন</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15].map(len => (
                  <button
                    key={len}
                    onClick={() => setQuizLength(len)}
                    className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                      quizLength === len
                        ? 'bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 scale-102'
                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                    id={`btn-quiz-length-${len}`}
                  >
                    {len} প্রশ্ন
                  </button>
                ))}
              </div>
            </div>

            {/* Quiz engine choice */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase font-sans font-sans">কুইজ ইঞ্জিন নির্বাচন করুন</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsAiMode(false)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    !isAiMode 
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/25 ring-1 ring-emerald-500' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'
                  }`}
                  id="btn-quiz-mode-local"
                >
                  <p className="text-xs font-bold text-zinc-950 dark:text-white font-sans">স্ট্যান্ডার্ড মোড (অফলাইন)</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">সবচেয়ে দ্রুত এবং অফলাইনে কাজ করে। ক্যাশকৃত শব্দাবলি ব্যবহার করে কুইজ নেয়।</p>
                </button>
                
                <button
                  onClick={() => setIsAiMode(true)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isAiMode 
                      ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/25 ring-1 ring-emerald-500' 
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950'
                  }`}
                  id="btn-quiz-mode-ai"
                >
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-bold text-zinc-950 dark:text-white font-sans">AI চ্যালেঞ্জ মোড</p>
                    <Sparkles className="h-3 w-3 text-emerald-500" />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Gemini সরাসরি নতুন প্রশ্ন, অপশন ও ব্যতিক্রমী বাঙালি উচ্চারণ চ্যালেঞ্জ তৈরি করে।</p>
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-450 text-zinc-950 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
            id="btn-start-run-quiz"
          >
            <PlayCircle className="h-4 w-4" />
            কুইজ শুরু করুন
          </button>
        </div>
      )}

      {/* 2. LOADING SPIN STATE */}
      {quizState === 'loading' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center space-y-4 shadow-sm">
          <Loader2 className="h-10 w-15 animate-spin text-emerald-500 mx-auto" />
          <h3 className="font-bold text-zinc-900 dark:text-white font-sans">কুইজ লোড করা হচ্ছে...</h3>
          <p className="text-xs text-zinc-550 max-w-xs mx-auto italic">
            {isAiMode ? "Gemini পিনইন ও অডিও উচ্চারণ মিলিয়ে নিখুঁত বাংলা এমসিকিউ তৈরি করছে।" : "অফলাইন বুস্ট ডেটা থেকে র‍্যান্ডম পিনইন নিয়ে প্রশ্ন সাজানো হচ্ছে।"}
          </p>
        </div>
      )}

      {/* 3. ACTIVE QUIZ PLAY SCREEN */}
      {quizState === 'active' && currentQuestion && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6 shadow-md">
          {/* Header Progress indicator */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-zinc-550 font-sans">
              <span>প্রশ্ন: <strong className="text-zinc-900 dark:text-white font-mono">{currentIndex + 1} / {questions.length}</strong></span>
              <span>চলতি স্কোর: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{score}</strong></span>
            </div>
            <div className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Test Component Item */}
          <div className="space-y-4">
            <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-xl border border-zinc-100 dark:border-zinc-805 text-center space-y-3">
              <span className="text-4xl font-sans font-black text-zinc-950 dark:text-white bg-white dark:bg-zinc-900 px-6 py-3 rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-800">
                {currentQuestion.word.character}
              </span>
              <p className="text-xs text-zinc-500 font-mono italic">({currentQuestion.word.pinyin})</p>
              
              <h3 className="text-sm sm:text-base font-bold text-zinc-800 dark:text-zinc-200 pt-1 leading-relaxed">
                {currentQuestion.questionText}
              </h3>
            </div>

            {/* MCQ List Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correctAnswer;
                
                let btnStyle = "border-zinc-250 bg-white hover:bg-zinc-50 text-zinc-850 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200";
                
                if (isAnswerChecked) {
                  if (isCorrect) {
                     btnStyle = "border-emerald-500 bg-emerald-100 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-400";
                  } else if (isSelected) {
                     btnStyle = "border-red-500 bg-red-100 text-red-950 dark:bg-red-950/40 dark:text-red-400";
                  } else {
                     btnStyle = "border-zinc-200 bg-zinc-50 text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-600";
                  }
                } else if (isSelected) {
                  btnStyle = "border-emerald-500 ring-2 ring-emerald-500 bg-emerald-50/10 text-emerald-950 dark:text-emerald-300";
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswerChecked}
                    onClick={() => handleAnswerSelect(option)}
                    className={`w-full min-h-[46px] px-4 py-2.5 rounded-xl border text-left font-sans text-xs sm:text-sm font-semibold flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                    id={`btn-question-option-${idx}`}
                  >
                    <span>{option}</span>
                    {isAnswerChecked && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                    {isAnswerChecked && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row buttons */}
          <div className="flex justify-end pt-2 border-t border-zinc-150 dark:border-zinc-800">
            {!isAnswerChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedAnswer}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-450 disabled:bg-zinc-100 disabled:text-zinc-350 disabled:cursor-not-allowed text-zinc-900 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                id="btn-quiz-check"
              >
                উত্তর যাচাই করুন
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                id="btn-quiz-next"
              >
                {currentIndex + 1 === questions.length ? 'ফলাফল দেখুন' : 'পরবর্তী প্রশ্ন'}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. FINISHED COMPLETED VIEW */}
      {quizState === 'finished' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center space-y-6 shadow-xl">
          <div className="relative inline-block">
            <Award className="h-16 w-16 text-yellow-500 mx-auto animate-pulse" />
            <div className="absolute top-0 right-0 translate-x-2 -translate-y-2 bg-orange-500 text-white rounded-full p-1 text-xs font-bold leading-none flex items-center gap-0.5">
              <Flame className="h-3 w-3" />
              +১ দিন
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-black text-zinc-950 dark:text-white">অসাধারণ কুইজ সম্পন্ন!</h2>
            <p className="text-xs text-zinc-500 font-sans leading-relaxed">
              আপনি HSK Level {currentLevel} এর সবগুলো প্রশ্নের উত্তর দিয়েছেন। চমৎকার সক্রিয় অনুশীলনের মাধ্যমে শব্দ ধারণ ক্ষমতা বাড়ে।
            </p>
          </div>

          {/* Card points tracker */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-around items-center max-w-sm mx-auto">
            <div className="text-center">
              <p className="text-xs font-bold text-zinc-400 uppercase font-sans">মোট প্রশ্ন</p>
              <p className="text-3xl font-black text-zinc-950 dark:text-white mt-1 font-mono">{questions.length}</p>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="text-center">
              <p className="text-xs font-bold text-zinc-400 uppercase font-sans">সঠিক উত্তর</p>
              <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{score}</p>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div className="text-center">
              <p className="text-xs font-bold text-zinc-400 uppercase font-sans">সফলতা</p>
              <p className="text-3xl font-black text-blue-600 mt-1 font-mono">{Math.round((score / questions.length) * 100)}%</p>
            </div>
          </div>

          <div className="flex gap-2 pt-2 justify-center">
            <button
              onClick={() => setQuizState('config')}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-all cursor-pointer text-xs sm:text-sm shadow-sm flex items-center gap-1.5"
              id="btn-quiz-configure-again"
            >
              <RefreshCw className="h-4 w-4" />
              আবার সেটিংস করুন
            </button>
            <button
              onClick={handleStartQuiz}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-420 text-zinc-950 font-bold rounded-xl transition-all cursor-pointer text-xs sm:text-sm shadow-md flex items-center gap-1.5"
              id="btn-quiz-retry-immediately"
            >
              আবার খেলুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
