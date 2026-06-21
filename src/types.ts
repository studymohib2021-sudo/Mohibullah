export interface HskWord {
  id: string;
  character: string;
  pinyin: string;
  english: string;
  banglaPronounce: string;
  banglaMeaning: string;
  level: number;
  category: string;
  sentence: string;
  sentencePinyin: string;
  sentenceEnglish: string;
  sentenceBangla: string;
  isFallback?: boolean;
  phoneticBreakdown?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'pinyin' | 'bangla_pronounce' | 'meaning' | 'character';
  word: HskWord;
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface UserStats {
  levelProgress: Record<number, { completed: number; total: number }>;
  savedWords: string[];
  quizHighScore: number;
  quizStreak: number;
  lastQuizDate?: string;
  quizHistory: {
    date: string;
    score: number;
    total: number;
    level: string;
  }[];
}
