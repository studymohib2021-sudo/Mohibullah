import React, { useState } from 'react';
import { Play, CheckCircle2, AlertTriangle, Volume2, BookOpen, Layers, Sparkles } from 'lucide-react';

interface CorrectionItem {
  character: string;
  pinyin: string;
  english: string;
  wrongBangla: string;
  correctBangla: string;
  reason: string;
}

const corrections: CorrectionItem[] = [
  {
    character: "我",
    pinyin: "wǒ",
    english: "I, me",
    wrongBangla: "ওক া (Oko)",
    correctBangla: "ওয়া / উও (Wa/Uo)",
    reason: "Pinyin 'wǒ' has a glide starting with 'u'. It should sound like standard Bengali 'ওয়া' or 'উও', not the harsh 'ওকো'."
  },
  {
    character: "我们",
    pinyin: "wǒmen",
    english: "we, us",
    wrongBangla: "ওক াকিন (Okokin)",
    correctBangla: "উওমেন (Uomen)",
    reason: "Pinyin 'wǒmen' is approximated as 'উওমেন'. The incorrect sheet written as 'ওকাকিন' is completely garbled."
  },
  {
    character: "你",
    pinyin: "nǐ",
    english: "you",
    wrongBangla: "মন (Mon)",
    correctBangla: "নি (Ni)",
    reason: "The letter 'nǐ' has a simple nasal 'n' and vowel 'i'. Standard Bengali 'নি' is correct. The sheet mistakenly spells it as 'মন'."
  },
  {
    character: "你们",
    pinyin: "nǐmen",
    english: "you (plural)",
    wrongBangla: "মনকিন (Monkin)",
    correctBangla: "নিমেন (Nimen)",
    reason: "The sheet continues the 'mon' error. 'nǐmen' sounds exactly like Bengali 'নিমেন'."
  },
  {
    character: "这",
    pinyin: "zhè",
    english: "this",
    wrongBangla: "ঝ্যা (Jhya)",
    correctBangla: "চে / চেঃ (Che)",
    reason: "Pinyin 'zh' is a retroflex, voiceless affricate. It sounds like an unaspirated Bengali 'চ' or very soft 'জ', never a heavy 'ঝ্যা'."
  },
  {
    character: "零",
    pinyin: "líng",
    english: "zero",
    wrongBangla: "মি়াং (Miong)",
    correctBangla: "লিং (Ling)",
    reason: "Pinyin 'líng' clearly starts with 'l'. The sheet's spelling starts with a 'm' sound due to transcription errors."
  },
  {
    character: "谢谢",
    pinyin: "xièxie",
    english: "thank you",
    wrongBangla: "মেক মেক (Mek mek)",
    correctBangla: "শিয়েশিয়ে (Shieshie)",
    reason: "Pinyin 'x' is an alveolo-palatal sibilant closer to Bengali 'শ' or 'স'. Combined with 'ie', it is 'শিয়েশিয়ে'. The sheet's 'মেকমেক' is a major error."
  },
  {
    character: "汉语",
    pinyin: "hànyǔ",
    english: "Chinese language",
    wrongBangla: "োনইউ (Han-iu)",
    correctBangla: "হানিউই / হানউ্য (Han-yü)",
    reason: "Pinyin 'yǔ' is the high front rounded vowel ü. It fits closer to Bengali 'উই' or 'উ্য' (lips rounded while saying 'ই')."
  },
  {
    character: "睡觉",
    pinyin: "shuìjiào",
    english: "to sleep",
    wrongBangla: "শু ইক্তি াও (Shu iktiao)",
    correctBangla: "শুইচিয়াо (Shuichiao)",
    reason: "Pinyin 'jiào' has an unaspirated 'j' which sounds like 'চ'. The sheet adds an extra 'ক্ত' or 'ক' which is incorrect."
  },
  {
    character: "电脑",
    pinyin: "diànnǎo",
    english: "computer",
    wrongBangla: "مদ анনাও (Medannao)",
    correctBangla: "তিয়াননাও (Tiannao)",
    reason: "Pinyin 'd' is a voiceless unaspirated 't', sounding like Bengali 'ত'/'ত্'. It must be pronounced as 'তিয়াননাও', not with a hard 'দ' or 'মেদান্নাও'."
  },
  {
    character: "电影",
    pinyin: "diànyǐng",
    english: "movie",
    wrongBangla: "مদ amন ়াং (Medamon)",
    correctBangla: "তিয়ানইং (Tianying)",
    reason: "Pinyin 'diànyǐng' consists of 'dian' ('তিয়ান') and 'ying' ('ইং'). The sheet printed a garbled sequence."
  },
  {
    character: "漂亮",
    pinyin: "piàoliang",
    english: "beautiful",
    wrongBangla: "ম া ওমি া ়াং (Moaomiong)",
    correctBangla: "ফিয়াওলিয়াং (Piaoliang)",
    reason: "Pinyin 'p' is an aspirated 'p' which sounds like Bengali 'ফ'. Hence 'ফিয়াওলিয়াং'. The sheet has broken characters."
  }
];

interface PinyinRule {
  pinyin: string;
  bangla: string;
  exampleChn: string;
  examplePinyin: string;
  exampleBng: string;
  description: string;
}

const initialsRules: PinyinRule[] = [
  { pinyin: "b", bangla: "ব / প (কোমল)", exampleChn: "爸爸", examplePinyin: "bàba", exampleBng: "পাপ্পা / বাবা", description: "বাংলা 'ব' ও 'প' এর মাঝামাঝি এক ধরণের অনুচ্ছাসিত কোমল ধ্বনি।" },
  { pinyin: "p", bangla: "ফ (তীব্র বাতাসসহ)", exampleChn: "苹果", examplePinyin: "píngguǒ", exampleBng: "ফিংকুও", description: "বাংলা 'ফ' এর মত মুখ থেকে তীব্র বাতাস (Aspiration) ছাড়তে হবে।" },
  { pinyin: "m", bangla: "ম", exampleChn: "妈妈", examplePinyin: "māma", exampleBng: "মামা", description: "বাংলা 'ম' শব্দের সাথে হুবহু সমান।" },
  { pinyin: "f", bangla: "ফ / f", exampleChn: "飞机", examplePinyin: "fēijī", exampleBng: "ফেইচি", description: "ঠোঁট এবং দাঁত লাগিয়ে ইংরেজি 'f' অথবা বাংলার কোমল 'ফ' এর মত উচ্চারণ।" },
  { pinyin: "d", bangla: "ত (কোমল)", exampleChn: "电脑", examplePinyin: "diànnǎo", exampleBng: "তিয়াননাও", description: "বাংলা কোমল দন্ত্য 'ত' এর মত উচ্চারণ। কখনই কড়া 'দ' বা 'ড' হবে না।" },
  { pinyin: "t", bangla: "থ (বাতাসসহ)", exampleChn: "听", examplePinyin: "tīng", exampleBng: "থিং", description: "জিহ্বার ডগা দিয়ে প্রচুর বাতাস ছিটিয়ে বাংলার 'থ' এর মত উচ্চারণ করতে হবে।" },
  { pinyin: "n", bangla: "ন", exampleChn: "你", examplePinyin: "nǐ", exampleBng: "নি", description: "বাংলা 'ন' ধ্বনির অনুরূপ।" },
  { pinyin: "l", bangla: "ল", exampleChn: "老师", examplePinyin: "lǎoshī", exampleBng: "লাওশি", description: "বাংলা 'ল' ধ্বনির সাথে হুবহু এক।" },
  { pinyin: "g", bangla: "ক (কোমল)", exampleChn: "高兴", examplePinyin: "gāoxìng", exampleBng: "কাওশিং", description: "বাংলা 'ক' ও 'গ' এর মাঝামাঝি কোমল ধ্বনি। বাতাস থাকবে না।" },
  { pinyin: "k", bangla: "খ (বাতাসসহ)", exampleChn: "开", examplePinyin: "kāi", exampleBng: "খাই", description: "বাংলা 'খ' এর মত উচ্চারণ, মুখ থেকে বাতাস বের করতে হবে।" },
  { pinyin: "h", bangla: "হ / খ (কোমল)", exampleChn: "汉语", examplePinyin: "hànyǔ", exampleBng: "হানউ্য", description: "বাংলার 'হ' এর মত গভীর শ্বাস সহযোগে কোমল উচ্চারণ।" },
  { pinyin: "j", bangla: "চ (কোমল)", exampleChn: "九", examplePinyin: "jiǔ", exampleBng: "চিউ", description: "জিহ্বা সমান্তরাল রেখে বাংলার অনুচ্ছাসিত কোমল 'চ' এর মত।" },
  { pinyin: "q", bangla: "ছ (তীব্র বাতাসসহ)", exampleChn: "钱", examplePinyin: "qián", exampleBng: "ছিয়ান", description: "জিহ্বা চ্যাপ্টা করে মুখের বাতাস ফুঁ দিয়ে বাংলার 'ছ' এর মত শিস তৈরি করে উচ্চারণ।" },
  { pinyin: "x", bangla: "শ / স", exampleChn: "谢谢", examplePinyin: "xièxie", exampleBng: "শিয়েশিয়ে", description: "মৃদু শিসযুক্ত 'শ' বা 'স' এর মত কোমল উচ্চারণ।" },
  { pinyin: "zh", bangla: "চ (জিহ্বা উল্টিয়ে)", exampleChn: "中国", examplePinyin: "zhōngguó", exampleBng: "চোংকুও", description: "জিহ্বার ডগা উপরে তালুতে উল্টিয়ে (Retroflex) কোমল 'চ' এর মত।" },
  { pinyin: "ch", bangla: "ছ (জিহ্বা উল্টিয়ে)", exampleChn: "出租车", examplePinyin: "chūzūchē", exampleBng: "ছুচুছে", description: "জিহ্বার ডগা উপরে উল্টিয়ে বাতাস ছিটিয়ে বাংলার 'ছ' এর মত তীব্র উচ্চারণ।" },
  { pinyin: "sh", bangla: "শ (জিহ্বা উল্টিয়ে)", exampleChn: "书", examplePinyin: "shū", exampleBng: "শু", description: "জিহ্বা উল্টিয়ে তালুর কাছে নিয়ে কড়া শিসযুক্ত 'শ' এর মত উচ্চারণ।" },
  { pinyin: "r", bangla: "র / ঝ", exampleChn: "人", examplePinyin: "rén", exampleBng: "রেন / ঝেন", description: "জিহ্বা উল্টিয়ে কম্পনহীন 'র' বা ইংরেজি 'r' এর মত স্পন্দনশীল ধ্বনি।" },
  { pinyin: "z", bangla: "ৎস / চ (দন্ত্য)", exampleChn: "再见", examplePinyin: "zàijiàn", exampleBng: "চাইচিয়ান / সাইচিয়ান", description: "দাঁতে দাঁত চেপে বাংলার 'ৎস' বা কোমল 'চ' এর মত।" },
  { pinyin: "c", bangla: "ৎস (বাতাসসহ)", exampleChn: "菜", examplePinyin: "cài", exampleBng: "ছাই / ছায়", description: "দাঁতে দাঁত চেপে তীব্র বাতাস ছড়ানো 'ছ' বা 'ৎস' ধ্বনি।" },
  { pinyin: "s", bangla: "স / শিসধ্বনি", exampleChn: "岁", examplePinyin: "suì", exampleBng: "সুই", description: "সাধারণ দন্ত্য 'স' বা শিসযুক্ত ইংরেজি 's' ধ্বনি।" }
];

const finalsRules: PinyinRule[] = [
  { pinyin: "a", bangla: "আ", exampleChn: "大", examplePinyin: "dà", exampleBng: "তা", description: "বাংলায় দীর্ঘ 'আ' ধ্বনি।" },
  { pinyin: "o", bangla: "ও", exampleChn: "我", examplePinyin: "wǒ", exampleBng: "উও / ওয়া", description: "ঠোঁট গোল করে বাংলা 'ও' বা 'অ' এর মাঝামাঝি ধ্বনি।" },
  { pinyin: "e", bangla: "অহ্ / এ্য", exampleChn: "和", examplePinyin: "hé", exampleBng: "হ্ব্য / হ্য", description: "গলা চেপে হালকা 'অহ্' বা 'আ-এ' এর মত চাপা উচ্চারণ করা হয়।" },
  { pinyin: "i", bangla: "ই", exampleChn: "一", examplePinyin: "yī", exampleBng: "ই", description: "বাংলার সাধারণ রসুই 'ই' স্বরধ্বনি।" },
  { pinyin: "u", bangla: "উ", exampleChn: "五", examplePinyin: "wǔ", exampleBng: "উ", description: "বাংলার সাধারণ রসউ 'উ' স্বরধ্বনি।" },
  { pinyin: "ü", bangla: "উয়্যি (ঠোঁট গোল করে ই)", exampleChn: "女", examplePinyin: "nǚ", exampleBng: "নিউ্য", description: "ঠোঁট গোল করে 'উ' এর মত রেখে ভেতর থেকে 'ই' উচ্চারণ করতে হবে।" },
  { pinyin: "ai", bangla: "আই / আয়", exampleChn: "买", examplePinyin: "mǎi", exampleBng: "মাই", description: "বাংলার 'আই' বা দ্বিস্বরধ্বনি।" },
  { pinyin: "ei", bangla: "এই", exampleChn: "飞机", examplePinyin: "fēijī", exampleBng: "ফেইচি", description: "বাংলার দ্বিস্বরধ্বনি 'এই' এর মত উচ্চারণ।" },
  { pinyin: "ui", bangla: "উই", exampleChn: "岁", examplePinyin: "suì", exampleBng: "সুই", description: "বাংলার চমৎকার দ্বিস্বরধ্বনি 'উই' বা 'উেয়ী'।" },
  { pinyin: "ao", bangla: "আও", exampleChn: "猫", examplePinyin: "māo", exampleBng: "মাও", description: "বাংলার দ্বিস্বরধ্বনি 'আও' এর মত।" },
  { pinyin: "ou", bangla: "ওউ", exampleChn: "狗", examplePinyin: "gǒu", exampleBng: "খৌ / কোউ", description: "বাংলার 'ওউ' বা 'ঔ' এর অনুরূপ উচ্চারণ।" },
  { pinyin: "an", bangla: "আন / অ্যান", exampleChn: "看", examplePinyin: "kàn", exampleBng: "খান", description: "বাংলার 'আন' বা চাপা 'অ্যান' এর মত।" },
  { pinyin: "en", bangla: "এন / অন", exampleChn: "很", examplePinyin: "hěn", exampleBng: "হেন", description: "হালকা চাপা অনুনাসিক 'এন' বা 'অন' এর মত।" },
  { pinyin: "ang", bangla: "আং", exampleChn: "大象", examplePinyin: "dàxiàng", exampleBng: "তাশিয়াং", description: "বাংলার চন্দ্রবিন্দু বা 'আং' অনুনাসিক ধ্বনি।" },
  { pinyin: "eng", bangla: "অং / এং", exampleChn: "冷", examplePinyin: "lěng", exampleBng: "লেং", description: "বাংলার অনুনাসিক 'অং' অথবা 'এং' ধ্বনি।" },
  { pinyin: "ing", bangla: "ইং", exampleChn: "明星", examplePinyin: "míngxīng", exampleBng: "মিংশিং", description: "বাংলার পরিষ্কার অনুস্বারযুক্ত 'ইং' ধ্বনি।" },
  { pinyin: "ong", bangla: "উং / ওং", exampleChn: "红", examplePinyin: "hóng", exampleBng: "হোং / হুং", description: "বাংলায় অনুনাসিক 'ওং' বা 'উং' ধ্বনি।" }
];

export default function CorrectionGuide() {
  const [activeSubTab, setActiveSubTab] = useState<'corrections' | 'pinyin' | 'tones'>('corrections');

  const playNativeChinese = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support Speech Synthesis.");
    }
  };

  return (
    <div className="space-y-6" id="correction-guide-panel">
      {/* Alert Header */}
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-5 flex items-start gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-heading font-semibold text-amber-900 dark:text-amber-400 text-lg">
            কেন কিছু প্রচলিত বাংলা উচ্চারণ বইয়ে ভুল থাকে?
          </h3>
          <p className="text-amber-800 dark:text-amber-300/90 text-sm mt-1 leading-relaxed">
            চীনা পিনইন (Pinyin) এর কিছু স্বর ও ব্যঞ্জনধ্বনি সাধারণ বাংলা বর্ণমালার সাথে হুবহু মেলে না। যেমন পিনইনের <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">b</code> বাংলায় 'প' এর মত এবং <code className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 rounded">d</code> বাংলায় 'ত' এর মত উচ্চারিত হয়। এই অ্যাপে আমরা প্রচলিত ভুলগুলো সংশোধন করে ১০০% অডিও-সদৃশ নির্ভুল বাংলা গাইড প্রদান করেছি।
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveSubTab('corrections')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'corrections'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
          id="btn-subtab-corrections"
        >
          <Layers className="h-4 w-4" />
          শীটের ভুল সংশোধন তালিকা
        </button>
        <button
          onClick={() => setActiveSubTab('pinyin')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'pinyin'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
          id="btn-subtab-pinyin"
        >
          <BookOpen className="h-4 w-4" />
          পিনইন স্বর ও ব্যঞ্জনবর্ণ সহায়িকা
        </button>
        <button
          onClick={() => setActiveSubTab('tones')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'tones'
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
          }`}
          id="btn-subtab-tones"
        >
          <Sparkles className="h-4 w-4" />
          চীনা ৪টি টোন ও সুর নির্দেশিকা
        </button>
      </div>

      {/* Sub-Tab 1: Mistakes Corrections Table */}
      {activeSubTab === 'corrections' && (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm" id="tab-content-corrections">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-950">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  চীনা শব্দ ও পিনইন
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  অর্থ (English)
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-red-500 uppercase tracking-wider">
                  ভুল উচ্চারণ (শীটে যা ছিল)
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-emerald-600 uppercase tracking-wider col-span-2">
                  সভ্য বাংলা উচ্চারণ গাইড (আমাদের অ্যাপ)
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  শুনুন
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {corrections.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold text-gray-900 dark:text-white font-sans">{item.character}</span>
                      <span className="text-sm text-gray-500 dark:text-zinc-400 font-mono">({item.pinyin})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-zinc-350">
                    {item.english}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                      {item.wrongBangla}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-55 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {item.correctBangla}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-zinc-450 mt-1.5 max-w-md leading-relaxed">
                      {item.reason}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button
                      onClick={() => playNativeChinese(item.character)}
                      className="p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full transition-all inline-flex items-center justify-center cursor-pointer shadow-sm bg-zinc-50 dark:bg-zinc-800"
                      title="শুনুন"
                      id={`btn-correct-play-${index}`}
                    >
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sub-Tab 2: Pinyin Pronunciation Guide (Initials & Finals) */}
      {activeSubTab === 'pinyin' && (
        <div className="space-y-8" id="tab-content-pinyin">
          {/* Initials section */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500 text-zinc-900 font-bold">
                1
              </span>
              <h4 className="font-heading font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
                চীনা পিনইন প্রারম্ভিক ব্যঞ্জনধ্বনি (Initials) সহায়িকা
              </h4>
            </div>
            <p className="text-sm text-zinc-650 dark:text-zinc-400 mb-5 leading-relaxed">
              চীনা পিনইনের শব্দের শুরুতে যে ব্যঞ্জনধ্বনিগুলো বসে, সেগুলোর নির্ভুল বাংলা উচ্চারণ ও শব্দ উচ্চারণের কৌশল নিচে তালিকাভুক্ত করা হয়েছে:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {initialsRules.map((rule, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-start gap-3 justify-between hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {rule.pinyin}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        উচ্চরণ: {rule.bangla}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                      {rule.description}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-xs font-mono text-zinc-650 dark:text-zinc-400">
                      <span>উদাহরণ: </span>
                      <strong className="text-zinc-900 dark:text-zinc-100 select-all font-sans">{rule.exampleChn}</strong>
                      <span>({rule.examplePinyin})</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-sans">→ {rule.exampleBng}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => playNativeChinese(rule.exampleChn)}
                    className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                    title="শুনুন"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Finals section */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500 text-zinc-900 font-bold">
                2
              </span>
              <h4 className="font-heading font-semibold text-zinc-900 dark:text-zinc-100 text-lg">
                চীনা পিনইন পরবর্তী স্বরধ্বনি (Finals) সহায়িকা
              </h4>
            </div>
            <p className="text-sm text-zinc-650 dark:text-zinc-400 mb-5 leading-relaxed">
              শব্দের শেষের স্বরধ্বনিসমূহ (Vowels & Compounds) বাংলা বর্ণমালায় উচ্চারণের নিখুঁত ছক:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finalsRules.map((rule, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 flex items-start gap-3 justify-between hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {rule.pinyin}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        উচ্চরণ: {rule.bangla}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">
                      {rule.description}
                    </p>
                    <div className="pt-1 flex items-center gap-1.5 text-xs font-mono text-zinc-650 dark:text-zinc-400">
                      <span>উদাহরণ: </span>
                      <strong className="text-zinc-900 dark:text-zinc-100 select-all font-sans">{rule.exampleChn}</strong>
                      <span>({rule.examplePinyin})</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-sans">→ {rule.exampleBng}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => playNativeChinese(rule.exampleChn)}
                    className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                    title="শুনুন"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Tones Guide */}
      {activeSubTab === 'tones' && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-6" id="tab-content-tones">
          <div>
            <h4 className="font-heading font-semibold text-zinc-900 dark:text-zinc-100 text-lg mb-2">
              চীনা ভাষার ৪টি প্রধান সুর বা টোন (Tones) গাইড
            </h4>
            <p className="text-sm text-zinc-600 dark:text-zinc-450 leading-relaxed">
              চীনা ভাষায় একই বর্ণের পিনইন সুর পরিবর্তনের সাথে সাথে সম্পূর্ণ ভিন্ন অর্থ প্রকাশ করে। পিনইনের উপর কিছু বিশেষ প্রতীক দিয়ে এই ৪টি টোন বা সুরকে চিহ্নিত করা হয়। নিচে বাংলা উচ্চারণ কৌশলের চমৎকার বর্ণনা দেওয়া হলো:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden space-y-4">
              <div className="absolute right-4 top-2 text-6xl font-bold text-zinc-200 dark:text-zinc-800 opacity-30 select-none">
                ā
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500 text-zinc-900 rounded-full">
                  1st Tone
                </span>
                <h5 className="font-sans font-bold text-lg text-zinc-800 dark:text-zinc-100 mt-2">
                  সমতল বা একঝোঁকা সুর (High Flat)
                </h5>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                উঁচু গলায় এক টানা সমতলে গাইতে থাকার মত করে সুর বজায় রাখতে হবে। কণ্ঠস্বর নিচে নামবে না।
              </p>
              <div className="text-xs bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span>উদাহরণ: <strong className="text-sm font-sans text-zinc-800 dark:text-zinc-100">妈 (mā)</strong></span>
                  <button onClick={() => playNativeChinese("妈")} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md cursor-pointer"><Play className="h-3.5 w-3.5 fill-current" /></button>
                </div>
                <div className="text-zinc-500 mt-1 font-sans text-[10px]">বাংলা অর্থ: মা</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden space-y-4">
              <div className="absolute right-4 top-2 text-6xl font-bold text-zinc-200 dark:text-zinc-800 opacity-30 select-none">
                á
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500 text-zinc-900 rounded-full">
                  2nd Tone
                </span>
                <h5 className="font-sans font-bold text-lg text-zinc-800 dark:text-zinc-100 mt-2">
                  আরোহী বা চড়া সুর (Rising)
                </h5>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                সুর নিচ থেকে উপরের দিকে দ্রুত উঠবে। বাংলায় কাউকে অবাক হয়ে হঠাৎ জিজ্ঞেস করার মত "কী?!" বা "হ্যাঁ?!"।
              </p>
              <div className="text-xs bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span>I-M: <strong className="text-sm font-sans text-zinc-800 dark:text-zinc-100">麻 (má)</strong></span>
                  <button onClick={() => playNativeChinese("麻")} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md cursor-pointer"><Play className="h-3.5 w-3.5 fill-current" /></button>
                </div>
                <div className="text-zinc-500 mt-1 font-sans text-[10px]">বাংলা অর্থ: পাট / তিসি</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden space-y-4">
              <div className="absolute right-4 top-2 text-6xl font-bold text-zinc-200 dark:text-zinc-800 opacity-30 select-none">
                ǎ
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500 text-zinc-900 rounded-full">
                  3rd Tone
                </span>
                <h5 className="font-sans font-bold text-lg text-zinc-800 dark:text-zinc-100 mt-2">
                  বক্র বা দোলা সুর (Falling-Rising)
                </h5>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                সুর প্রথমে অনেক নিচে নেমে যাবে, এরপর হঠাৎ করে আবার উঁচুতে উঠবে। অনেকটা চিন্তা অবস্থায় মুখ খোলার মত "আ-চ্ছা..."।
              </p>
              <div className="text-xs bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span>I-M: <strong className="text-sm font-sans text-zinc-800 dark:text-zinc-100">马 (mǎ)</strong></span>
                  <button onClick={() => playNativeChinese("马")} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md cursor-pointer"><Play className="h-3.5 w-3.5 fill-current" /></button>
                </div>
                <div className="text-zinc-500 mt-1 font-sans text-[10px]">বাংলা অর্থ: ঘোড়া</div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950/20 relative overflow-hidden space-y-4">
              <div className="absolute right-4 top-2 text-6xl font-bold text-zinc-200 dark:text-zinc-800 opacity-30 select-none">
                à
              </div>
              <div>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500 text-zinc-900 rounded-full">
                  4th Tone
                </span>
                <h5 className="font-sans font-bold text-lg text-zinc-800 dark:text-zinc-100 mt-2">
                  অবরোহী বা ধাক্কা সুর (Falling)
                </h5>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                সুর উঁচু থেকে প্রচণ্ড ধাক্কা খেয়ে দ্রুত নিচে আছড়ে পড়বে। অনেকটা দৃঢ়ভাবে বা ধমক দিয়ে কোনো আদেশ করার মত "না!"।
              </p>
              <div className="text-xs bg-zinc-100 dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
                <div className="flex justify-between items-center">
                  <span>I-M: <strong className="text-sm font-sans text-zinc-800 dark:text-zinc-100">骂 (mà)</strong></span>
                  <button onClick={() => playNativeChinese("骂")} className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md cursor-pointer"><Play className="h-3.5 w-3.5 fill-current" /></button>
                </div>
                <div className="text-zinc-500 mt-1 font-sans text-[10px]">বাংলা অর্থ: বকা ভর্ৎসনা করা</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
