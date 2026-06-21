import { HskWord, QuizQuestion } from '../types';
import { hsk1Words } from '../data/hsk1';
import { hsk2Words } from '../data/hsk2';
import { hsk3Words } from '../data/hsk3';
import { hsk4Words } from '../data/hsk4';

// Combine preloaded lists
export const masterVocabularyListOnServer: HskWord[] = [
  ...hsk1Words,
  ...hsk2Words,
  ...hsk3Words,
  ...hsk4Words
];

// Strip tones from pinyin for easier mapping
export function stripPinyinTones(pinyin: string): string {
  return pinyin
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const INITIALS_MAP: Record<string, string> = {
  "b": "প",
  "p": "ফ",
  "m": "ম",
  "f": "ফ",
  "d": "ত",
  "t": "থ",
  "n": "ন",
  "l": "ল",
  "g": "ক",
  "k": "খ",
  "h": "হ",
  "j": "চ",
  "q": "ছ",
  "x": "শ",
  "zh": "চ",
  "ch": "ছ",
  "sh": "শ",
  "r": "র",
  "z": "জ",
  "c": "ছ",
  "s": "স",
  "y": "ই",
  "w": "উ"
};

const FINALS_MAP: Record<string, string> = {
  "i": "ই",
  "e": "এ",
  "a": "া",
  "o": "ো",
  "u": "ু",
  "v": "ইউ",
  "ü": "ইউ",
  "ai": "াই",
  "ei": "েই",
  "ui": "ুই",
  "ao": "াও",
  "ou": "ৌ",
  "an": "ান",
  "en": "েন",
  "in": "িন",
  "un": "ুন",
  "vn": "ইউন",
  "ang": "াং",
  "eng": "েং",
  "ing": "িং",
  "ong": "োং",
  "ian": "িয়ান",
  "iao": "িয়াও",
  "iang": "িয়াং",
  "iong": "িয়োং",
  "uan": "ুয়ান",
  "uang": "ুয়াং",
  "uai": "ুয়াই",
  "uo": "ুও",
  "ie": "িয়ে",
  "yue": "ইউয়ে",
  "üe": "ইউয়ে"
};

// Map known syllables specifically
const KNOWN_SYLLABLES: Record<string, string> = {
  "wo": "ওয়া",
  "men": "মেন",
  "ni": "নি",
  "ta": "থা",
  "hao": "হাও",
  "xie": "শিয়ে",
  "bu": "পু",
  "shi": "শি",
  "ma": "মা",
  "guo": "কুও",
  "zhong": "চোং",
  "hua": "হুয়া",
  "ren": "রেন",
  "you": "ইওউ",
  "mei": "মেই",
  "he": "হঅ",
  "shuo": "শুও",
  "dian": "তিয়ান",
  "ying": "ইং",
  "nao": "নাও",
  "shui": "শুই",
  "jiao": "চিয়াও",
  "xue": "শুয়ে",
  "sheng": "শেং",
  "zuo": "জুও",
  "shang": "শাং",
  "xia": "শিয়া",
  "qu": "ছু",
  "lai": "লাই",
  "qi": "ছি",
  "ba": "পা",
  "da": "তা",
  "suan": "সুয়ান",
  "ji": "ছি",
  "le": "লা",
  "fang": "ফাং",
  "bian": "পিয়ান",
  "ka": "খা",
  "fei": "ফেই",
  "yi": "ই",
  "ai": "আই",
  "an": "আন",
  "pai": "ফাই",
  "quan": "ছুয়ান",
  "ban": "পান",
  "gong": "কোং",
  "mang": "মাং",
  "bao": "পাও",
  "bi": "পি",
  "jiu": "চিওউ",
  "ye": "ইয়ে",
  "ke": "খে",
  "qiang": "ছিয়াং",
  "can": "ছান",
  "ting": "থিং",
  "cha": "ছা",
  "duo": "তুও",
  "chang": "ছাং",
  "cheng": "ছেং",
  "shou": "শোউ",
  "zi": "জি",
  "er": "আর",
  "san": "সান",
  "si": "সি",
  "wu": "উ",
  "liu": "লিওউ",
  "lin": "লিন",
  "ling": "লিং",
  "bai": "পাই",
  "qian": "ছিয়ান",
  "wan": "ওয়ান",
  "tian": "তিয়ান",
  "kong": "খোং",
  "che": "ছে",
  "huo": "হুও",
  "zhan": "চান",
  "lu": "লু",
  "xing": "শিং",
  "shu": "শু",
  "yin": "ইন",
  "yue_": "ইউয়ে",
  "hui": "হুই",
  "du": "তু",
  "re": "রঅ",
  "sòng": "সোং",
  "song": "সোং",
  "heiba": "হেইপা",
  "ban_": "পান",
  "hai": "হাই",
  "jing": "জিং / জিংগ",
  "kao": "খাও",
  "shì": "শি",
  "shi_": "শি",
  "guan": "খুয়ান",
  "xi": "শি",
  "gua": "খুয়া",
  "hei": "হেই",
  "bai_": "পাই",
  "hong": "হোং",
  "wan_": "ওয়ান",
  "yao": "ইয়াও"
};

// Automatic fallback Romanization rule mapping
export function transliteratePinyinToBangla(pinyin: string): string {
  if (!pinyin) return "চীনা শব্দ";
  
  // Try cleaning
  const normalized = stripPinyinTones(pinyin);
  
  // Split into potential syllables based on spaces or vowels
  const parts = normalized.split(/\s+/).filter(Boolean);
  const resultParts = parts.map(part => {
    // If exact match is found
    if (KNOWN_SYLLABLES[part]) {
      return KNOWN_SYLLABLES[part];
    }
    
    // Otherwise segment the syllable into initial + final
    let initial = "";
    let final = part;
    
    // Match common initials of length 2 first, then 1
    if (part.startsWith("zh") || part.startsWith("ch") || part.startsWith("sh")) {
      initial = part.substring(0, 2);
      final = part.substring(2);
    } else if (/^[bpmfdtnlgkhjqxzcsyw]/.test(part)) {
      initial = part.substring(0, 1);
      final = part.substring(1);
    }
    
    const banglaInitial = INITIALS_MAP[initial] || "";
    const banglaFinal = FINALS_MAP[final] || final;
    
    // Connect initial and final adjusting vowel signs
    if (banglaInitial && banglaFinal.startsWith("া")) {
      return banglaInitial + "া" + banglaFinal.substring(1);
    } else if (banglaInitial && banglaFinal.startsWith("ি")) {
      return banglaInitial + "ি" + banglaFinal.substring(1);
    } else if (banglaInitial && banglaFinal.startsWith("ু")) {
      return banglaInitial + "ু" + banglaFinal.substring(1);
    } else if (banglaInitial && banglaFinal.startsWith("ে")) {
      return banglaInitial + "ে" + banglaFinal.substring(1);
    } else if (banglaInitial && banglaFinal.startsWith("ো")) {
      return banglaInitial + "ো" + banglaFinal.substring(1);
    }
    
    return (banglaInitial + banglaFinal) || part;
  });
  
  return resultParts.join("-");
}

// Full database of explanations for standard index terms
const DETAILED_OFFLINE_WORDS: Record<string, Omit<HskWord, 'id'>> = {
  "杯子": {
    character: "杯子",
    pinyin: "bēizi",
    english: "cup, glass",
    banglaPronounce: "পেইজি",
    banglaMeaning: "কাপ, গ্লাস",
    level: 1,
    category: "Noun",
    sentence: "杯子里有热水。",
    sentencePinyin: "Bēizi lǐ yǒu rèshuǐ.",
    sentenceEnglish: "There is hot water in the cup.",
    sentenceBangla: "কাপের ভেতরে গরম জল আছে।"
  },
  "出租车": {
    character: "出租车",
    pinyin: "chūzūchē",
    english: "taxi",
    banglaPronounce: "ছুজুছে",
    banglaMeaning: "ট্যাক্সি",
    level: 1,
    category: "Noun",
    sentence: "我们坐出租车去机场。",
    sentencePinyin: "Wǒmen zuò chūzūchē qù jīchǎng.",
    sentenceEnglish: "We take a taxi to go to the airport.",
    sentenceBangla: "আমরা ট্যাক্সি দিয়ে এয়ারপোর্টে যাব।"
  },
  "读": {
    character: "读",
    pinyin: "dú",
    english: "to read, study",
    banglaPronounce: "তু",
    banglaMeaning: "পড়া, অধ্যয়ন করা",
    level: 1,
    category: "Verb",
    sentence: "我很喜欢读这本书。",
    sentencePinyin: "Wǒ hěn xǐhuān dú zhè běn shū.",
    sentenceEnglish: "I really like reading this book.",
    sentenceBangla: "আমি এই বইটি পড়তে খুব পছন্দ করি।"
  },
  "客气": {
    character: "客气",
    pinyin: "kèqi",
    english: "polite",
    banglaPronounce: "খেছি",
    banglaMeaning: "ভদ্র, অমায়িক",
    level: 1,
    category: "Adjective",
    sentence: "他对人非常客气。",
    sentencePinyin: "Tā duì rén fēicháng kèqi.",
    sentenceEnglish: "He is very polite to people.",
    sentenceBangla: "সে মানুষের প্রতি অনেক ভদ্র।"
  },
  "本": {
    character: "本",
    pinyin: "běn",
    english: "measure word for books",
    banglaPronounce: "পেন",
    banglaMeaning: "টি, খানি (বইয়ের পরিমাপক)",
    level: 1,
    category: "Classifier",
    sentence: "这本词典非常有用。",
    sentencePinyin: "Zhè běn cídiǎn fēicháng yǒuyòng.",
    sentenceEnglish: "This dictionary is very useful.",
    sentenceBangla: "এই ডিকশনারিটি অত্যন্ত কাজের।"
  },
  "开": {
    character: "开",
    pinyin: "kāi",
    english: "to open, drive",
    banglaPronounce: "খাই",
    banglaMeaning: "খোলা, চালানো",
    level: 1,
    category: "Verb",
    sentence: "请把门开一下。",
    sentencePinyin: "Qǐng bǎ mén kāi yíxià.",
    sentenceEnglish: "Please open the door for a moment.",
    sentenceBangla: "দয়া করে দরজাটি একটু খুলুন।"
  },
  "热": {
    character: "热",
    pinyin: "rè",
    english: "hot",
    banglaPronounce: "রঅ",
    banglaMeaning: "গরম",
    level: 1,
    category: "Adjective",
    sentence: "今天天气很热。",
    sentencePinyin: "Jīntiān tiānqì hěn rè.",
    sentenceEnglish: "The weather is very hot today.",
    sentenceBangla: "আজকে আবহাওয়া খুব গরম।"
  },
  "唱歌": {
    character: "唱歌",
    pinyin: "chànggē",
    english: "to sing a song",
    banglaPronounce: "ছাংকে",
    banglaMeaning: "গান গাওয়া",
    level: 2,
    category: "Verb",
    sentence: "她唱歌唱得非常好听。",
    sentencePinyin: "Tā chànggē chàng de fēicháng hǎotīng.",
    sentenceEnglish: "She sings very beautifully.",
    sentenceBangla: "সে খুব মিষ্টি সুরে গান গায়।"
  },
  "生病": {
    character: "生病",
    pinyin: "shēngbìng",
    english: "to fall ill",
    banglaPronounce: "শংপিং",
    banglaMeaning: "অসুস্থ হওয়া",
    level: 2,
    category: "Verb",
    sentence: "因为生病，他今天没去上学。",
    sentencePinyin: "Yīnwèi shēngbìng, tā jīntiān méi qù shàngxué.",
    sentenceEnglish: "Because of falling ill, he didn't go to school today.",
    sentenceBangla: "অসুস্থ হওয়ার কারণে সে আজকে স্কুলে যায়নি।"
  },
  "咖啡": {
    character: "咖啡",
    pinyin: "kāfēi",
    english: "coffee",
    banglaPronounce: "খাফেই",
    banglaMeaning: "কফি",
    level: 2,
    category: "Noun",
    sentence: "你喜欢喝咖啡还是茶？",
    sentencePinyin: "Nǐ xǐhuān hē kāfēi háishì chá?",
    sentenceEnglish: "Do you like to drink coffee or tea?",
    sentenceBangla: "তুমি কি কফি নাকি চা পান করতে পছন্দ করো?"
  },
  "考试": {
    character: "考试",
    pinyin: "kǎoshì",
    english: "examination, test",
    banglaPronounce: "খাওশি",
    banglaMeaning: "পরীক্ষা",
    level: 2,
    category: "Noun / Verb",
    sentence: "明天我们要进行汉字考试。",
    sentencePinyin: "Míngtiān wǒmen yào jìnxíng hànzì kǎoshì.",
    sentenceEnglish: "We will have a Chinese character exam tomorrow.",
    sentenceBangla: "আগামীকাল আমাদের চীনা হরফ চেনার পরীক্ষা আছে।"
  },
  "机场": {
    character: "机场",
    pinyin: "jīchǎng",
    english: "airport",
    banglaPronounce: "জিছাং",
    banglaMeaning: "বিমানবন্দর",
    level: 2,
    category: "Noun",
    sentence: "我下午三点去机场接朋友。",
    sentencePinyin: "Wǒ xiàwǔ sān diǎn qù jīchǎng jiē péngyǒu.",
    sentenceEnglish: "I will go to the airport to pick up friends at 3 PM.",
    sentenceBangla: "আমি বিকেল ৩টায় এয়ারপোর্টে বন্ধুকে রিসিভ করতে যাব।"
  },
  "送": {
    character: "送",
    pinyin: "sòng",
    english: "to give as a gift, deliver",
    banglaPronounce: "সোং",
    banglaMeaning: "উপহার দেওয়া, পৌঁছে দেওয়া",
    level: 2,
    category: "Verb",
    sentence: "这件礼物是送给你的。",
    sentencePinyin: "Zhè jiàn lǐwù shì sònggěi nǐ de.",
    sentenceEnglish: "This gift is for you.",
    sentenceBangla: "এই উপহারটি তোমার জন্য।"
  },
  "时间": {
    character: "时间",
    pinyin: "shíjiān",
    english: "time",
    banglaPronounce: "শিজিয়ান",
    banglaMeaning: "সময়",
    level: 2,
    category: "Noun",
    sentence: "你今天有时间跟我一起看电影吗？",
    sentencePinyin: "Nǐ jīntiān yǒu shíjiān gēn wǒ yìqǐ kàn diànyǐng ma?",
    sentenceEnglish: "Do you have time to watch a movie with me today?",
    sentenceBangla: "আজকে কি আমার সাথে সিনেমা দেখার সময় হবে তোমার?"
  },
  "西瓜": {
    character: "西瓜",
    pinyin: "xīguā",
    english: "watermelon",
    banglaPronounce: "শিখুয়া",
    banglaMeaning: "তরমুজ",
    level: 2,
    category: "Noun",
    sentence: "夏天的西瓜又甜又水分多。",
    sentencePinyin: "Xiàtiān de xīguā yòu tián yòu shuǐfèn duō.",
    sentenceEnglish: "Watermelon in summer is both sweet and juicy.",
    sentenceBangla: "গরমকালের তরমুজ অনেক মিষ্টি ও রসালো হয়।"
  },
  "黑": {
    character: "黑",
    pinyin: "hēi",
    english: "black, dark",
    banglaPronounce: "হেই",
    banglaMeaning: "কালো, অন্ধকার",
    level: 2,
    category: "Adjective",
    sentence: "天黑了，我们回家吧。",
    sentencePinyin: "Tiān hēi le, wǒmen huíjiā ba.",
    sentenceEnglish: "The sky has darkened, let's go home.",
    sentenceBangla: "রাত হয়ে গেছে, চলো বাড়ি ফিরি।"
  },
  "白": {
    character: "白",
    pinyin: "bái",
    english: "white, clean",
    banglaPronounce: "পাই",
    banglaMeaning: "সাদা, পরিষ্কার",
    level: 2,
    category: "Adjective",
    sentence: "妹妹穿着一件白色的连衣裙。",
    sentencePinyin: "Mèimei chuānzhe yí jiàn báisè de liányīqún.",
    sentenceEnglish: "Little sister is wearing a white dress.",
    sentenceBangla: "ছোটবোন একটি সাদা রঙের জামা পরে আছে।"
  },
  "红": {
    character: "红",
    pinyin: "hóng",
    english: "red",
    banglaPronounce: "হোং",
    banglaMeaning: "লাল",
    level: 2,
    category: "Adjective",
    sentence: "苹果已经变红了。",
    sentencePinyin: "Píngguǒ yǐjīng biàn hóng le.",
    sentenceEnglish: "The apple has already turned red.",
    sentenceBangla: "আপেলটি ইতোমধ্যে লাল হয়ে গেছে।"
  },
  "玩": {
    character: "玩",
    pinyin: "wán",
    english: "to play, have fun",
    banglaPronounce: "ওয়ান",
    banglaMeaning: "খেলা করা, মজা করা",
    level: 2,
    category: "Verb",
    sentence: "周末你打算去哪里玩？",
    sentencePinyin: "Zhōumò nǐ dǎsuàn qù nǎlǐ wán?",
    sentenceEnglish: "Where do you plan to go and have fun on the weekend?",
    sentenceBangla: "ছুটির দিনে তুমি কোথায় ঘুরতে যাওয়ার পরিকল্পনা করছ?"
  },
  "药": {
    character: "药",
    pinyin: "yào",
    english: "medicine",
    banglaPronounce: "ইয়াও",
    banglaMeaning: "ওষুধ",
    level: 2,
    category: "Noun",
    sentence: "按时吃药身体才能快点好起来。",
    sentencePinyin: "Ànshí chīyào shēntǐ cái néng kuài diǎn hǎo qǐlái.",
    sentenceEnglish: "Taking medicine on time is the only way to recover quickly.",
    sentenceBangla: "নিয়মিত ওষুধ খেলেই শরীর দ্রুত সেরে উঠবে।"
  },
  "路": {
    character: "路",
    pinyin: "lù",
    english: "road, path",
    banglaPronounce: "লু",
    banglaMeaning: "রাস্তা, পথ",
    level: 2,
    category: "Noun",
    sentence: "这条路非常宽阔、整洁。",
    sentencePinyin: "Zhè tiáo lù fēicháng kuānkuò, zhěngjié.",
    sentenceEnglish: "This road is very wide and tidy.",
    sentenceBangla: "এই রাস্তাটি অত্যন্ত চওড়া ও পরিচ্ছন্ন।"
  },
  "阿姨": {
    character: "阿姨",
    pinyin: "āyí",
    english: "aunt",
    banglaPronounce: "আ-ই",
    banglaMeaning: "খালা, ফুফু, খালাম্মা",
    level: 3,
    category: "Noun",
    sentence: "这位阿姨人真好。",
    sentencePinyin: "Zhè wèi āyí rén zhēn hǎo.",
    sentenceEnglish: "This aunt is really nice.",
    sentenceBangla: "এই খালাম্মা খুবই ভালো মানুষ।"
  },
  "把": {
    character: "把",
    pinyin: "bǎ",
    english: "measure word for chairs/umbrellas; grammatical particle",
    banglaPronounce: "পা",
    banglaMeaning: "টি (চেয়ার/ছাতা এর পরিমাপক)",
    level: 3,
    category: "Noun / Particle",
    sentence: "请把那把椅子给我。",
    sentencePinyin: "Qǐng bǎ nà bǎ yǐzi gěi wǒ.",
    sentenceEnglish: "Please give me that chair.",
    sentenceBangla: "দয়া করে আমাকে ওই চেয়ারটি দাও।"
  },
  "班": {
    character: "班",
    pinyin: "bān",
    english: "class, grade, team",
    banglaPronounce: "পান",
    banglaMeaning: "শ্রেণী, গ্রেড, দল",
    level: 3,
    category: "Noun",
    sentence: "我们班有二十个人。",
    sentencePinyin: "Wǒmen bān yǒu èrshí gè rén.",
    sentenceEnglish: "There are twenty people in our class.",
    sentenceBangla: "আমাদের ক্লাসে বিশ জন মানুষ আছে।"
  },
  "办法": {
    character: "办法",
    pinyin: "bànfǎ",
    english: "method, way",
    banglaPronounce: "পানফা",
    banglaMeaning: "উপায়, পদ্ধতি",
    level: 3,
    category: "Noun",
    sentence: "这是一个好办法。",
    sentencePinyin: "Zhè shì yí gè hǎo bànfǎ.",
    sentenceEnglish: "This is a good method.",
    sentenceBangla: "এটি একটি খুব ভালো উপায়।"
  },
  "办公室": {
    character: "办公室",
    pinyin: "bàngōngshì",
    english: "office",
    banglaPronounce: "পানকোঙশি",
    banglaMeaning: "কার্যালয়, অফিস",
    level: 3,
    category: "Noun",
    sentence: "他在办公室工作。",
    sentencePinyin: "Tā zài bàngōngshì gōngzuò.",
    sentenceEnglish: "He works in the office.",
    sentenceBangla: "সে অফিসে কাজ করে।"
  },
  "半": {
    character: "半",
    pinyin: "bàn",
    english: "half",
    banglaPronounce: "পান (মৃদু)",
    banglaMeaning: "অর্ধেক, আধা",
    level: 3,
    category: "Number",
    sentence: "现在是三点半。",
    sentencePinyin: "Xiànzài ... hǎo sān diǎn bàn.",
    sentenceEnglish: "It is half past three now.",
    sentenceBangla: "এখন সাড়ে তিনটা বাজে।"
  },
  "帮忙": {
    character: "帮忙",
    pinyin: "bāngmáng",
    english: "to help, do a favor",
    banglaPronounce: "পাংমাং",
    banglaMeaning: "সাহায্য করা, উপকার করা",
    level: 3,
    category: "Verb",
    sentence: "我可以帮忙吗？",
    sentencePinyin: "Wǒ kěyǐ bāngmáng ma?",
    sentenceEnglish: "Can I help?",
    sentenceBangla: "আমি কি কোনো সাহায্য করতে পারি?"
  },
  "包": {
    character: "包",
    pinyin: "bāo",
    english: "bag, package; to wrap",
    banglaPronounce: "পাও",
    banglaMeaning: "ব্যাগ, প্যাক, প্যাকেট",
    level: 3,
    category: "Noun / Verb",
    sentence: "我的包在哪里？",
    sentencePinyin: "Wǒ de bāo zài nǎlǐ?",
    sentenceEnglish: "Where is my bag?",
    sentenceBangla: "আমার ব্যাগটি কোথায়?"
  },
  "饱": {
    character: "饱",
    pinyin: "bǎo",
    english: "full (from eating)",
    banglaPronounce: "পাও (উত্থান)",
    banglaMeaning: "পেট ভরা, ক্ষিদে মিটেছে এমন",
    level: 3,
    category: "Adjective",
    sentence: "我已经吃饱了。",
    sentencePinyin: "Wǒ yǐjīng chī bǎo le.",
    sentenceEnglish: "I am already full.",
    sentenceBangla: "আমি ইতোমধ্যে খেয়ে পেট ভরিয়েছি।"
  },
  "笔记本": {
    character: "笔记本",
    pinyin: "bǐjìběn",
    english: "notebook, laptop",
    banglaPronounce: "পিচিবেন",
    banglaMeaning: "নোটবুক, ল্যাপটপ",
    level: 3,
    category: "Noun",
    sentence: "他买了一个新笔记本。",
    sentencePinyin: "Tā mǎile yí gè xīn bǐjìběn.",
    sentenceEnglish: "He bought a new notebook.",
    sentenceBangla: "সে একটি নতুন নোটবুক কিনেছে।"
  },
  "变化": {
    character: "变化",
    pinyin: "biànhuà",
    english: "change, variation",
    banglaPronounce: "পিয়ানহুয়া",
    banglaMeaning: "পরিবর্তন",
    level: 3,
    category: "Noun / Verb",
    sentence: "这里的变化很大。",
    sentencePinyin: "Zhèlǐ de biànhuà hěn dà.",
    sentenceEnglish: "The change here is very big.",
    sentenceBangla: "এখানকার পরিবর্তন অনেক বড় বা ব্যাপক।"
  },
  "别人": {
    character: "别人",
    pinyin: "biérén",
    english: "other people",
    banglaPronounce: "পিয়ে-রেন",
    banglaMeaning: "অন্য মানুষ, অন্যরা",
    level: 3,
    category: "Noun",
    sentence: "我们要多为别人着想。",
    sentencePinyin: "Wǒmen yào duō wèi biérén zháoxiǎng.",
    sentenceEnglish: "We should think more of others.",
    sentenceBangla: "আমাদের অন্যদের ব্যাপারেও বেশি ভাবা উচিত।"
  },
  "词典": {
    character: "词典",
    pinyin: "cídiǎn",
    english: "dictionary",
    banglaPronounce: "ছি-তিয়ান",
    banglaMeaning: "অভিধান, ডিকশনারি",
    level: 3,
    category: "Noun",
    sentence: "请借我一下你的词典。",
    sentencePinyin: "Qǐng jiè wǒ yíxià nǐ de cídiǎn.",
    sentenceEnglish: "Please lend me your dictionary for a moment.",
    sentenceBangla: "দয়া করে আমাকে তোমার ডিকশনারিটি একটু ধার দাও।"
  },
  "聪明": {
    character: "聪明",
    pinyin: "cōngmíng",
    english: "clever, smart",
    banglaPronounce: "ছোংমিং",
    banglaMeaning: "চালাক, बुद्धिमान",
    level: 3,
    category: "Adjective",
    sentence: "那只小猫非常聪明。",
    sentencePinyin: "Nà zhī xiǎo māo fēicháng cōngmíng.",
    sentenceEnglish: "That little cat is very smart.",
    sentenceBangla: "ওই বিড়ালছানাটি অত্যন্ত বুদ্ধিমান।"
  },
  "地图": {
    character: "地图",
    pinyin: "dìtú",
    english: "map",
    banglaPronounce: "তি থু",
    banglaMeaning: "মানচিত্র, ম্যাপ",
    level: 3,
    category: "Noun",
    sentence: "手机可以看地图。",
    sentencePinyin: "Shǒujī kěyǐ kàn dìtú.",
    sentenceEnglish: "You can look at maps on a phone.",
    sentenceBangla: "ফোনে ম্যাপ দেখা যায়।"
  },
  "电梯": {
    character: "电梯",
    pinyin: "diàntī",
    english: "elevator",
    banglaPronounce: "তিয়ানথি",
    banglaMeaning: "লিফট, এলিভেটর",
    level: 3,
    category: "Noun",
    sentence: "我们坐电梯上楼吧。",
    sentencePinyin: "Wǒmen zuò diàntī shànglóu ba.",
    sentenceEnglish: "Let's take the elevator upstairs.",
    sentenceBangla: "চলো লিফট দিয়ে উপরে উঠি।"
  },
  "感冒": {
    character: "感冒",
    pinyin: "gǎnmào",
    english: "cold, flu",
    banglaPronounce: "খানমাо",
    banglaMeaning: "কনকনে ঠান্ডা লাগা, সর্দি-জ্বর",
    level: 3,
    category: "Noun / Verb",
    sentence: "我昨天感冒了。",
    sentencePinyin: "Wǒ zuótiān gǎnmào le.",
    sentenceEnglish: "I caught a cold yesterday.",
    sentenceBangla: "গতকালে আমার ঠান্ডা লেগেছিল।"
  },
  "根据": {
    character: "根据",
    pinyin: "gēnjù",
    english: "according to, basis",
    banglaPronounce: "কেনজু",
    banglaMeaning: "ভিত্তি করে, অনুসারে",
    level: 3,
    category: "Preposition",
    sentence: "根据天气预报，明天会下雨。",
    sentencePinyin: "Gēnjù tiānqì yùbào, míngtiān huì xiàyǔ.",
    sentenceEnglish: "According to the weather forecast, it will rain tomorrow.",
    sentenceBangla: "আবহাওয়া পূর্বাভাস অনুযায়ী, আগামীকাল বৃষ্টি হবে।"
  },
  "故事": {
    character: "故事",
    pinyin: "gùshì",
    english: "story, tale",
    banglaPronounce: "কুশি",
    banglaMeaning: "গল্প, কাহিনী",
    level: 3,
    category: "Noun",
    sentence: "奶奶经常给我讲故事。",
    sentencePinyin: "Nǎinai jīngcháng gěi wǒ jiǎng gùshì.",
    sentenceEnglish: "Grandmother often tells me stories.",
    sentenceBangla: "দাদিমা আমাকে প্রায়ই গল্প বলেন।"
  },
  "刮风": {
    character: "刮风",
    pinyin: "guāfēng",
    english: "to be windy",
    banglaPronounce: "খুয়াস-ফেং",
    banglaMeaning: "বাতাস বওয়া, ঝড় হওয়া",
    level: 3,
    category: "Verb",
    sentence: "外面开始刮风了。",
    sentencePinyin: "Wàimiàn kāishǐ guāfēng le.",
    sentenceEnglish: "It started to be windy outside.",
    sentenceBangla: "বাইরে বাতাস বওয়া শুরু হয়েছে।"
  },
  "关": {
    character: "关",
    pinyin: "guān",
    english: "to close, turn off",
    banglaPronounce: "খুয়ান",
    banglaMeaning: "বন্ধ করা, নিভানো",
    level: 3,
    category: "Verb",
    sentence: "请把灯关掉。",
    sentencePinyin: "Qǐng bǎ dēng guāndiào.",
    sentenceEnglish: "Please turn off the light.",
    sentenceBangla: "দয়া করে লাইটটি নিভিয়ে দাও।"
  },
  "关系": {
    character: "关系",
    pinyin: "guānxì",
    english: "relationship, connection",
    banglaPronounce: "খুয়ানশি",
    banglaMeaning: "সম্পর্ক, যোগাযোগ",
    level: 3,
    category: "Noun",
    sentence: "他们两个人的关系很好。",
    sentencePinyin: "Tāmen liǎng gè rén de guānxì hěn hǎo.",
    sentenceEnglish: "The relationship between the two of them is very good.",
    sentenceBangla: "তাদের দুজনের মধ্যে সম্পর্ক খুব ভালো।"
  },
  "关于": {
    character: "关于",
    pinyin: "guānyú",
    english: "about, regarding",
    banglaPronounce: "খুয়ান-ইউ",
    banglaMeaning: "বিষয়ে, সম্বন্ধে",
    level: 3,
    category: "Preposition",
    sentence: "这是一本关于中国历史的书。",
    sentencePinyin: "Zhè shì yì běn guānyú Zhōngguó lìshǐ de shū.",
    sentenceEnglish: "This is a book about Chinese history.",
    sentenceBangla: "এটি চীনের ইতিহাস বিষয়ক একটি বই।"
  },
  "国家": {
    character: "国家",
    pinyin: "guójiā",
    english: "country, nation",
    banglaPronounce: "কুওজিয়া",
    banglaMeaning: "দেশ, রাষ্ট্র",
    level: 3,
    category: "Noun",
    sentence: "世界有很多不同的国家。",
    sentencePinyin: "Shìjiè yǒu hěn duō bùtóng de guójiā.",
    sentenceEnglish: "There are many different countries in the world.",
    sentenceBangla: " can পৃথিবীতে অনেক ভিন্ন ভিন্ন দেশ রয়েছে।"
  },
  "河": {
    character: "河",
    pinyin: "hé",
    english: "river",
    banglaPronounce: "হঅ",
    banglaMeaning: "নদী",
    level: 3,
    category: "Noun",
    sentence: "河里有很多小鱼。",
    sentencePinyin: "Hé lǐ yǒu hěn duō xiǎoyú.",
    sentenceEnglish: "There are many little fish in the river.",
    sentenceBangla: "নদীতে অনেক ছোট মাছ আছে।"
  },
  "好奇": {
    character: "好奇",
    pinyin: "hàoqí",
    english: "curious",
    banglaPronounce: "হাও ছি",
    banglaMeaning: "কৌতূহলী",
    level: 3,
    category: "Adjective",
    sentence: "孩子们对所有事物都很好奇。",
    sentencePinyin: "Háizimen duì suǒyǒu omnis dōu hěn hàoqí.",
    sentenceEnglish: "Children are curious about everything.",
    sentenceBangla: "শিশুরা সবকিছুর প্রতিই খুব কৌতূহলী হয়।"
  },
  "黑板": {
    character: "黑板",
    pinyin: "hēibǎn",
    english: "blackboard",
    banglaPronounce: "হেইপান",
    banglaMeaning: "ব্ল্যাকবোর্ড, কালো বোর্ড",
    level: 3,
    category: "Noun",
    sentence: "老师在黑板上写字。",
    sentencePinyin: "Lǎoshī zài hēibǎn shàng xiězì.",
    sentenceEnglish: "The teacher writes on the blackboard.",
    sentenceBangla: "শিক্ষক ব্ল্যাকবোর্ডে লিখছেন।"
  },
  "护照": {
    character: "护照",
    pinyin: "hùzhào",
    english: "passport",
    banglaPronounce: "হুচাও",
    banglaMeaning: "পাসপোর্ট",
    level: 3,
    category: "Noun",
    sentence: "出国前千万别忘了带护照。",
    sentencePinyin: "Chūguó qián qiānwàn bié wàngle dài hùzhào.",
    sentenceEnglish: "Never forget to bring your passport before traveling abroad.",
    sentenceBangla: "বিদেশ যাওয়ার আগে পাসপোর্ট নিতে ভুল করো না।"
  },
  "花": {
    character: "花",
    pinyin: "huā",
    english: "flower; to spend (money/time)",
    banglaPronounce: "হুয়া",
    banglaMeaning: "ফুল; খরচ করা (টাকা/সময়)",
    level: 3,
    category: "Noun / Verb",
    sentence: "桌子上有一朵红色的花。",
    sentencePinyin: "Zhuōzi shàng yǒu yì duǒ hóngsè de huā.",
    sentenceEnglish: "There is a red flower on the table.",
    sentenceBangla: "টেবিলের ওপর একটি লাল রঙের ফুল আছে।"
  },
  "坏": {
    character: "坏",
    pinyin: "huài",
    english: "bad, broken",
    banglaPronounce: "হুয়াই",
    banglaMeaning: "খারাপ, নষ্ট",
    level: 3,
    category: "Adjective",
    sentence: "我的手机坏了。",
    sentencePinyin: "Wǒ de shǒujī huàile.",
    sentenceEnglish: "My phone is broken.",
    sentenceBangla: "আমার ফোনটি নষ্ট হয়ে গেছে।"
  },
  "欢迎": {
    character: "欢迎",
    pinyin: "huānyíng",
    english: "welcome",
    banglaPronounce: "হুয়ান-ইং",
    banglaMeaning: "স্বাগতম",
    level: 3,
    category: "Verb",
    sentence: "欢迎你们来到我们学校参观。",
    sentencePinyin: "Huānyíng nǐmen láidào wǒmen xuéxiào cānguān.",
    sentenceEnglish: "Welcome to our school for a visit.",
    sentenceBangla: "আমাদের বিদ্যালয়টি পরিদর্শনে আপনাদের আন্তরিক স্বাগতম।"
  },
  "环境": {
    character: "环境",
    pinyin: "huánjìng",
    english: "environment",
    banglaPronounce: "হুয়ানজিং",
    banglaMeaning: "পরিবেশ",
    level: 3,
    category: "Noun",
    sentence: "这里的自然环境保护得很好。",
    sentencePinyin: "Zhèlǐ de zìrán huánjìng bǎohù de hěn hǎo.",
    sentenceEnglish: "The natural environment here is well protected.",
    sentenceBangla: "এখানকার প্রাকৃতিক পরিবেশ খুব ভালোভাবে রক্ষা করা হয়েছে।"
  },
  "会议": {
    character: "会议",
    pinyin: "huìyì",
    english: "meeting, conference",
    banglaPronounce: "হুই-ই",
    banglaMeaning: "সভা, মিটিং, সম্মেলন",
    level: 3,
    category: "Noun",
    sentence: "下午二点有一个重要会议要开。",
    sentencePinyin: "Xiàwǔ èr diǎn yǒu yí gè zhòngyào huìyì yào kāi.",
    sentenceEnglish: "There is an important meeting at 2 PM this afternoon.",
    sentenceBangla: "আজ দুপুর ২টায় একটি গুরুত্বপূর্ণ সভা অনুষ্ঠিত হবে।"
  },
  "几乎": {
    character: "几乎",
    pinyin: "jīhū",
    english: "almost, nearly",
    banglaPronounce: "জিহু",
    banglaMeaning: "প্রায়, কাছাকাছি",
    level: 3,
    category: "Adverb",
    sentence: "我几乎忘了今天考试。",
    sentencePinyin: "Wǒ jīhū wàngle jīntiān kǎoshì.",
    sentenceEnglish: "I almost forgot today is the exam.",
    sentenceBangla: "আমি প্রায় ভুলেই গেছিলাম যে আজ পরীক্ষা।"
  },
  "机会": {
    character: "机会",
    pinyin: "jīhuì",
    english: "opportunity, chance",
    banglaPronounce: "জিহুই",
    banglaMeaning: "সুযোগ, চান্স",
    level: 3,
    category: "Noun",
    sentence: "这是一个很好的机会。",
    sentencePinyin: "Zhè shì yí gè hěn hǎo de jīhuì.",
    sentenceEnglish: "This is a very good opportunity.",
    sentenceBangla: "এটি অত্যন্ত দারুণ একটি সুযোগ।"
  },
  "绝对": {
    character: "绝对",
    pinyin: "juéduì",
    english: "absolute, definitely",
    banglaPronounce: "জুয়েদুই",
    banglaMeaning: "অবশ্যই, নিশ্চিত এবং পরম",
    level: 3,
    category: "Adverb / Adjective",
    sentence: "我绝对不同意他的做法。",
    sentencePinyin: "Wǒ juéduì bù tóngyì tā de zuòfǎ.",
    sentenceEnglish: "I absolutely disagree with his approach.",
    sentenceBangla: "আমি তার এই কাজের সাথে কোনোমতেই একমত নই।"
  },
  "爱情": {
    character: "爱情",
    pinyin: "àiqíng",
    english: "romantic love",
    banglaPronounce: "আই ছিং",
    banglaMeaning: "প্রেম, ভালোবাসা",
    level: 4,
    category: "Noun",
    sentence: "他们的爱情故事非常感人。",
    sentencePinyin: "Tāmen de àiqíng gùshì fēicháng gǎnrén.",
    sentenceEnglish: "Their love story is very touching.",
    sentenceBangla: "তাদের প্রেমের গল্পটি অত্যন্ত হৃদয়স্পর্শী।"
  },
  "安排": {
    character: "安排",
    pinyin: "ānpái",
    english: "to arrange, schedule",
    banglaPronounce: "আনফাই",
    banglaMeaning: "ব্যবস্থা করা, শিডিউল করা",
    level: 4,
    category: "Verb / Noun",
    sentence: "我会做好明天的活动安排。",
    sentencePinyin: "Wǒ huì zuò hǎo míngtiān de huódòng ānpái.",
    sentenceEnglish: "I will make the schedule of activities for tomorrow well.",
    sentenceBangla: "আমি আগামীকালের কার্যক্রমের বিন্যাস ঠিকঠাক মতো সাজিয়ে নেব।"
  },
  "安全": {
    character: "安全",
    pinyin: "ānquán",
    english: "safe, safety",
    banglaPronounce: "আনছুয়ান",
    banglaMeaning: "নিরাপদ, নিরাপত্তা",
    level: 4,
    category: "Noun / Adjective",
    sentence: "过马路时一定要注意安全。",
    sentencePinyin: "Guò mǎlù shí yídìng yào zhùyì ānquán.",
    sentenceEnglish: "Be sure to pay attention to safety when crossing the street.",
    sentenceBangla: "রাস্তা পারাপারের সময় নিরাপত্তার দিকে অবশ্যই খেয়াল রাখবে।"
  },
  "不客气": {
    character: "不客气",
    pinyin: "bú kèi qi",
    english: "you're welcome, don't mention it",
    banglaPronounce: "পু খ্য ছী",
    banglaMeaning: "ধন্যবাদ এর জবাবে অমায়িক উত্তর (কোনো ব্যাপার না / স্বাগতম)",
    level: 2,
    category: "Phrase",
    sentence: "不客气，这是我应该做的。",
    sentencePinyin: "Bú kèqi, zhè shì wǒ yīnggāi zuò de.",
    sentenceEnglish: "You're welcome, this is what I should do.",
    sentenceBangla: "স্বাগতম, এটি আমার করা উচিত কাজ ছিল।"
  },
  "打电话": {
    character: "打电话",
    pinyin: "dǎ diàn huà",
    english: "to make a phone call",
    banglaPronounce: "তা তিয়ান হুয়া",
    banglaMeaning: "ফোনে কথা বলা, ফোন করা",
    level: 2,
    category: "Verb",
    sentence: "我在给妈妈打电话呢。",
    sentencePinyin: "Wǒ zài gěi māma dǎ diànhuà ne.",
    sentenceEnglish: "I am calling my mother.",
    sentenceBangla: "আমি আমার মাকে ফোন করছি।"
  }
};

// Generates fallback record details for custom/searched characters on error
export function getDynamicFallbackWord(
  character: string, 
  pinyin?: string, 
  english?: string, 
  level: number = 3, 
  category: string = "General"
): HskWord {
  // First, check if exact character exists in master list
  const existing = masterVocabularyListOnServer.find(w => w.character === character);
  if (existing) {
    return existing;
  }
  
  // Try looking up in local extensive indexed fallback database
  if (DETAILED_OFFLINE_WORDS[character]) {
    return {
      id: `fallback-indexed-${character}-${Date.now()}`,
      ...DETAILED_OFFLINE_WORDS[character]
    };
  }
  
  // Generic rule-based offline generation
  const derivedPinyin = pinyin || "hànzì";
  const derivedEnglish = english || "Chinese character";
  const derivedBanglaPronounce = transliteratePinyinToBangla(derivedPinyin);
  const derivedBanglaMeaning = `চীনা শব্দ (${derivedEnglish})`;
  
  return {
    id: `fallback-dynamic-${character}-${Date.now()}`,
    character,
    pinyin: derivedPinyin,
    english: derivedEnglish,
    banglaPronounce: derivedBanglaPronounce,
    banglaMeaning: derivedBanglaMeaning,
    level,
    category,
    sentence: `我喜欢学"${character}"这个词。`,
    sentencePinyin: `Wǒ xǐhuān xué "${derivedPinyin}" zhè ge cí.`,
    sentenceEnglish: `I like learning the word "${character}".`,
    sentenceBangla: `আমি "${character}" শব্দটি শিখতে পছন্দ করি।`
  };
}

// Automatic server-side quiz fallback generator
export function generateLocalQuizOnServer(levelNum: number, lengthNum: number = 5): QuizQuestion[] {
  const activeWords = masterVocabularyListOnServer.filter(w => w.level === levelNum);
  
  if (activeWords.length < 4) {
    // If not enough words at this level, just take all available
    return [];
  }
  
  // Shuffle words
  const shuffled = [...activeWords].sort(() => 0.5 - Math.random());
  const selectedWords = shuffled.slice(0, Math.min(lengthNum, shuffled.length));
  
  return selectedWords.map((word, index) => {
    // Distractors
    const otherWords = activeWords.filter(w => w.id !== word.id);
    const distractors = otherWords.sort(() => 0.5 - Math.random()).slice(0, 3);
    
    // Choose question type
    const types: ('pinyin' | 'bangla_pronounce' | 'meaning' | 'character')[] = [
      'pinyin', 'bangla_pronounce', 'meaning', 'character'
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let questionText = "";
    let correctAnswer = "";
    let options: string[] = [];
    
    if (type === 'character') {
      questionText = `"${word.banglaMeaning}" এর সঠিক চীনা রূপ কোনটি?`;
      correctAnswer = word.character;
      options = [word.character, ...distractors.map(d => d.character)];
    } else if (type === 'pinyin') {
      questionText = `"${word.character}" এর সঠিক পিনইন (Pinyin) কোনটি?`;
      correctAnswer = word.pinyin;
      options = [word.pinyin, ...distractors.map(d => d.pinyin)];
    } else if (type === 'bangla_pronounce') {
      questionText = `"${word.character} (${word.pinyin})" এর সঠিক ও নির্ভুল বাংলা উচ্চারণ কোনটি?`;
      correctAnswer = word.banglaPronounce;
      options = [word.banglaPronounce, ...distractors.map(d => d.banglaPronounce)];
    } else {
      questionText = `"${word.character} (${word.pinyin})" এর বাংলা অর্থ কি?`;
      correctAnswer = word.banglaMeaning;
      options = [word.banglaMeaning, ...distractors.map(d => d.banglaMeaning)];
    }
    
    // Shuffle options
    options = options.sort(() => 0.5 - Math.random());
    options = Array.from(new Set(options)).slice(0, 4);
    
    if (options.length < 4) {
      options = [correctAnswer, "অন্যটি", "জানা নেই", "ভুল উত্তর"];
    }
    
    return {
      id: `fallback-q-${index}-${Date.now()}`,
      type,
      word,
      questionText,
      options,
      correctAnswer
    };
  });
}
