import { HskWord } from '../types';
import { hsk1Words } from './hsk1';
import { hsk2Words } from './hsk2';
import { hsk3Words } from './hsk3';
import { hsk4Words } from './hsk4';

import { hsk2IndexWords } from './hsk2Index';
import { hsk3IndexWords } from './hsk3Index';
import { hsk4IndexWords } from './hsk4Index';

// We combine the preloaded words
export const masterVocabularyList: HskWord[] = [
  ...hsk1Words,
  ...hsk2Words,
  ...hsk3Words,
  ...hsk4Words
];

// Additional basic list of HSK 2, 3 & 4 words for quick search and exploration.
// If any of these are opened, the app will instantly generate full high-precision Bengali pronunciations & examples on-the-fly using Gemini!
export interface BasicIndexWord {
  character: string;
  pinyin: string;
  english: string;
  level: number;
  category: string;
}

export const basicHskWordsIndex: BasicIndexWord[] = [
  // HSK 1 basic placeholder index (since level 1 is fully preloaded)
  { character: "杯子", pinyin: "bēizi", english: "cup, glass", level: 1, category: "Noun" },
  { character: "出租车", pinyin: "chūzūchē", english: "taxi", level: 1, category: "Noun" },
  { character: "读", pinyin: "dú", english: "to read, study", level: 1, category: "Verb" },
  { character: "客气", pinyin: "kèqi", english: "polite", level: 1, category: "Adjective" },
  { character: "本", pinyin: "běn", english: "measure word for books", level: 1, category: "Classifier" },
  { character: "开", pinyin: "kāi", english: "to open, drive", level: 1, category: "Verb" },
  { character: "热", pinyin: "rè", english: "hot", level: 1, category: "Adjective" },

  // HSK 2, 3, 4 Dynamically Generated Indices on Disk
  ...hsk2IndexWords,
  ...hsk3IndexWords,
  ...hsk4IndexWords
];
