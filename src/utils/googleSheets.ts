import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { HskWord, UserStats } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Sheets and Drive scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we have a user but no cached token, they might have refreshed.
        // We can prompt sign-in again to get fresh credentials, or wait for them to click "Login".
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// --- Google Sheets API Actions ---

// Helper: Make authenticated Google API requests
async function googleFetch<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('User is not authenticated or access token is missing.');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMetadata;
    try {
      errMetadata = JSON.parse(errText);
    } catch {
      errMetadata = errText;
    }
    console.error('Google API Error:', errMetadata);
    throw new Error(`Google API request failed: ${response.statusText} (${response.status})`);
  }

  return response.json() as Promise<T>;
}

/**
 * Creates a new Spreadsheet on Google Drive named after HSK Companion.
 */
export async function createHSKSpreadsheet(title: string = "HSK 1-4 Vocabulary Companion Progress"): Promise<string> {
  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: "Dashboard Stats",
          gridProperties: { rowCount: 100, columnCount: 15 }
        }
      },
      {
        properties: {
          title: "Bookmarked Words",
          gridProperties: { rowCount: 1000, columnCount: 10 }
        }
      },
      {
        properties: {
          title: "Custom Imported Words",
          gridProperties: { rowCount: 1000, columnCount: 10 }
        }
      }
    ]
  };

  const data = await googleFetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return data.spreadsheetId;
}

/**
 * Finds if an existing spreadsheet with given title exists on Drive.
 */
export async function findExistingSpreadsheet(title: string = "HSK 1-4 Vocabulary Companion Progress"): Promise<string | null> {
  // Query Google Drive list endpoint for the spreadsheets
  const q = encodeURIComponent(`name = '${title}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`;
  
  const response = await googleFetch(url);
  if (response.files && response.files.length > 0) {
    return response.files[0].id;
  }
  return null;
}

/**
 * Backs up Dashboard stats to the "Dashboard Stats" tab
 */
export async function backupStatsToSheet(spreadsheetId: string, stats: UserStats): Promise<void> {
  const values = [
    ["মেট্রিক (Metric)", "মান (Value)", "আপডেট ডেইট (Last Updated)"],
    ["High Score XP", stats.quizHighScore, new Date().toLocaleString()],
    ["Quiz Streak (দিন)", stats.quizStreak, new Date().toLocaleString()],
    ["HSK 1 Completed", `${stats.levelProgress[1]?.completed || 0} / ${stats.levelProgress[1]?.total || 150}`, new Date().toLocaleString()],
    ["HSK 2 Completed", `${stats.levelProgress[2]?.completed || 0} / ${stats.levelProgress[2]?.total || 15}`, new Date().toLocaleString()],
    ["HSK 3 Completed", `${stats.levelProgress[3]?.completed || 0} / ${stats.levelProgress[3]?.total || 3}`, new Date().toLocaleString()],
    ["HSK 4 Completed", `${stats.levelProgress[4]?.completed || 0} / ${stats.levelProgress[4]?.total || 3}`, new Date().toLocaleString()],
    ["Saved/Bookmarked Words Count", stats.savedWords.length, new Date().toLocaleString()],
  ];

  const range = "'Dashboard Stats'!A1:C10";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  await googleFetch(url, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });
}

/**
 * Exports bookmarked words list to "Bookmarked Words" sheets tab.
 */
export async function exportBookmarksToSheet(spreadsheetId: string, bookmarkedWords: HskWord[]): Promise<void> {
  const header = [
    "ক্যারাক্টার (Character)", 
    "পিনয়িন (Pinyin)", 
    "ইংরেজি (English)", 
    "উচ্চারণ (Bengali Pronunciation)", 
    "অর্থ (Bengali Meaning)", 
    "লেভেল (Level)", 
    "ক্যাটাগরি (Category)", 
    "উদাহরণ বাক্য (Context Sentence)", 
    "বাক্যের উচ্চারণ (Sentence Pronunciation)", 
    "বাক্যের অর্থ (Sentence Meaning)"
  ];

  const rows = bookmarkedWords.map(word => [
    word.character,
    word.pinyin,
    word.english,
    word.banglaPronounce,
    word.banglaMeaning,
    `HSK ${word.level}`,
    word.category || 'N/A',
    word.sentence || '',
    word.sentencePinyin || '',
    word.sentenceBangla || ''
  ]);

  const values = [header, ...rows];
  // Clear standard area first to overwrite neatly
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Bookmarked Words'!A1:J2000:clear`;
  try {
    await googleFetch(clearUrl, { method: 'POST' });
  } catch (err) {
    console.warn("Failed to clear sheet, overwriting directly", err);
  }

  const range = "'Bookmarked Words'!A1:J" + (values.length + 1);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  await googleFetch(url, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });
}

/**
 * Fetch Custom words from "Custom Imported Words" sheets tab
 */
export async function importCustomWordsFromSheet(spreadsheetId: string): Promise<HskWord[]> {
  const range = "'Custom Imported Words'!A2:J500"; // Exclude header row
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await googleFetch(url);
  if (!response.values || response.values.length === 0) {
    return [];
  }

  const importedWords: HskWord[] = [];
  response.values.forEach((row: any[], index: number) => {
    if (!row[0] || !row[1] || !row[4]) return; // Required: Character, Pinyin, Bengali Meaning

    importedWords.push({
      id: `imported-${Date.now()}-${index}`,
      character: row[0],
      pinyin: row[1],
      english: row[2] || '',
      banglaPronounce: row[3] || row[1], // fallback of pinyin
      banglaMeaning: row[4],
      level: parseInt(row[5]?.replace(/[^\d]/g, '') || '1', 10),
      category: row[6] || 'Imported',
      sentence: row[7] || '',
      sentencePinyin: row[8] || '',
      sentenceEnglish: '',
      sentenceBangla: row[9] || ''
    });
  });

  return importedWords;
}

/**
 * Setup templates template on "Custom Imported Words" to guide the user on how to add their own.
 */
export async function setupImportTemplate(spreadsheetId: string): Promise<void> {
  const header = [
    "ক্যারাক্টার (Character) *", 
    "পিনয়িন (Pinyin) *", 
    "ইংরেজি (English)", 
    "উচ্চারণ (Bengali Pronunciation) *", 
    "অর্থ (Bengali Meaning) *", 
    "লেভেল (Level: 1-4) *", 
    "ক্যাটাগরি (Category)", 
    "উদাহরণ বাক্য (Context Sentence)", 
    "বাক্যের উচ্চারণ (Sentence Pronunciation)", 
    "বাক্যের অর্থ (Sentence Meaning)"
  ];

  const examples = [
    ["你好", "nǐhǎo", "Hello", "নি হাও", "হ্যালো / ওহে", "1", "Greeting", "你好！很高兴认识你。", "nǐhǎo! hěn gāoxìng rènshi nǐ.", "হ্যালো! তোমার সাথে দেখা হয়ে অনেক ভালো লাগলো।"],
    ["谢谢", "xièxie", "Thank you", "শিয়েশিয়ে", "ধন্যবাদ", "1", "Politeness", "谢谢你的帮助。", "xièxie nǐ de bāngzhù.", "তোমার সাহায্যের জন্য ধন্যবাদ।"]
  ];

  const values = [header, ...examples];

  const range = "'Custom Imported Words'!A1:J3";
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  await googleFetch(url, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });
}
