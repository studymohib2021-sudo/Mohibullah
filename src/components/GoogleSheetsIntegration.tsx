import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Upload, Download, ExternalLink, Link2, LogOut, CheckCircle2, 
  RefreshCw, FileText, Sparkles, AlertCircle, Trash2, HelpCircle 
} from 'lucide-react';
import { 
  googleSignIn, logout, initAuth, getAccessToken, createHSKSpreadsheet, 
  findExistingSpreadsheet, backupStatsToSheet, exportBookmarksToSheet, 
  importCustomWordsFromSheet, setupImportTemplate 
} from '../utils/googleSheets';
import { HskWord, UserStats } from '../types';
import { User } from 'firebase/auth';

interface GoogleSheetsIntegrationProps {
  stats: UserStats;
  customUploadedWords: HskWord[];
  onAddCustomWordsBatch: (words: HskWord[]) => void;
  onClearCustomWords: () => void;
  onToggleButtonmarkAll?: (words: HskWord[]) => void;
}

export default function GoogleSheetsIntegration({
  stats,
  customUploadedWords,
  onAddCustomWordsBatch,
  onClearCustomWords
}: GoogleSheetsIntegrationProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSpreadsheetChecking, setIsSpreadsheetChecking] = useState<boolean>(false);

  // Load spreadsheetId from localStorage if present
  useEffect(() => {
    const savedSheetId = localStorage.getItem('hsk_sheets_spreadsheet_id');
    if (savedSheetId) {
      setSpreadsheetId(savedSheetId);
    }

    // Subscribe to Firebase Auth
    const unsubscribe = initAuth(
      (activeUser, activeToken) => {
        setUser(activeUser);
        setToken(activeToken);
        setIsLoading(false);
      },
      () => {
        setUser(null);
        setToken(null);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        showMsg("গুগল অ্যাকাউন্ট সফলভাবে সংযুক্ত হয়েছে!", "success");
        
        // Auto check if spreadsheet already exists on Drive
        await autoDiscoverSpreadsheet();
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      showMsg("গুগল সাইন-ইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await logout();
      setUser(null);
      setToken(null);
      showMsg("সাফল্যের সাথে গুগল অ্যাকাউন্ট ডিসকানেক্ট করা হয়েছে।", "info");
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const showMsg = (text: string, type: 'success' | 'error' | 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(prev => prev?.text === text ? null : prev);
    }, 6000);
  };

  const autoDiscoverSpreadsheet = async () => {
    setIsSpreadsheetChecking(true);
    try {
      const foundId = await findExistingSpreadsheet();
      if (foundId) {
        setSpreadsheetId(foundId);
        localStorage.setItem('hsk_sheets_spreadsheet_id', foundId);
        showMsg("ড্রাইভে পূর্ববর্তী HSK স্প্রেডশিট খুঁজে পাওয়া গিয়েছে এবং সংযুক্ত করা হয়েছে!", "success");
      }
    } catch (err) {
      console.warn("Auto spreadsheet discovery failed/skipped", err);
    } finally {
      setIsSpreadsheetChecking(false);
    }
  };

  const handleCreateSheet = async () => {
    if (!user) return;
    setIsSyncing(true);
    setStatusMessage({ text: "গুগল ড্রাইভ ও শিটে নতুন ফাইল তৈরি করা হচ্ছে...", type: "info" });
    try {
      const newId = await createHSKSpreadsheet();
      setSpreadsheetId(newId);
      localStorage.setItem('hsk_sheets_spreadsheet_id', newId);
      
      // Setup default template structure in sheets
      await setupImportTemplate(newId);
      
      showMsg("বিজ্ঞানসম্মত ও বর্ণিল HSK স্প্রেডশিট সফলভাবে তৈরি হয়েছে!", "success");
    } catch (err: any) {
      console.error(err);
      showMsg("স্প্রেডশিট তৈরি করতে ব্যর্থ। পারমিশন চেক করুন।", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBackupProgress = async () => {
    if (!spreadsheetId) return;
    setIsSyncing(true);
    setStatusMessage({ text: "অগ্রগতি গুগল শিটে ব্যাকআপ করা হচ্ছে...", type: "info" });
    try {
      await backupStatsToSheet(spreadsheetId, stats);
      showMsg("অভিনন্দন! আপনার লার্নিং স্কোর ও ড্যাশবোর্ড স্ট্যাটস ব্যাকআপ সম্পন্ন হয়েছে!", "success");
    } catch (err: any) {
      console.error(err);
      showMsg("ব্যাকআপ ব্যর্থ হয়েছে। নিশ্চিত হোন স্প্রেডশিট ফাইলটি ড্রাইভ থেকে মুছে ফেলা হয়নি তো।", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBookmarks = async () => {
    if (!spreadsheetId) return;
    if (stats.savedWords.length === 0) {
      showMsg("এক্সপোর্ট করার জন্য কোনো বুকমার্ক করা শব্দ পাওয়া যায়নি। প্রথমে শব্দকোষে শব্দ বুকমার্ক করুন।", "info");
      return;
    }
    setIsSyncing(true);
    setStatusMessage({ text: "বুকমার্ক করা সর্বমোট সংগ্রহ স্প্রেডশিটে ট্রান্সফার করা হচ্ছে...", type: "info" });
    try {
      // Find full HskWord definitions for bookmarked ids
      // Let's resolve the full word list from existing bundles
      // Since bookmarks are just strings, we'll try to find them in hskMasterIndex database if accessible
      // We can obtain them by requesting index data or lookup from locally loaded sets.
      // For now we'll import index words dynamically or use window object/fallback generator words
      const masterWords: HskWord[] = [];
      const levels = [1, 2, 3, 4];
      
      // We can gather words from fallbackGenerator or imports. We can implement a clean lookup.
      // Let's call the server API or read local cached master index
      const response = await fetch('/api/words/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: stats.savedWords })
      });
      
      let bookmarkDetails: HskWord[] = [];
      if (response.ok) {
        const payload = await response.json();
        bookmarkDetails = payload.words || [];
      } else {
        // Fallback mockup/fallback words if server API behaves strangely
        bookmarkDetails = customUploadedWords.filter(w => stats.savedWords.includes(w.id));
      }

      if (bookmarkDetails.length === 0) {
        showMsg("শব্দ সম্পর্কিত ডাটা লোড করা যায়নি।", "error");
        setIsSyncing(false);
        return;
      }

      await exportBookmarksToSheet(spreadsheetId, bookmarkDetails);
      showMsg(`সফলভাবে ${bookmarkDetails.length} টি বুকমার্ক করা চীনা শব্দ শিটে এক্সপোর্ট করা হয়েছে!`, "success");
    } catch (err: any) {
      console.error(err);
      showMsg("এক্সপোর্ট করতে ব্যর্থ হয়েছে। অনুগ্রহ করে স্প্রেডশিট লিঙ্ক চেক করুন।", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSetupTemplateOnly = async () => {
    if (!spreadsheetId) return;
    setIsSyncing(true);
    setStatusMessage({ text: "ইম্পোর্ট টেমপ্লেট কাঠামো লোড করা হচ্ছে...", type: "info" });
    try {
      await setupImportTemplate(spreadsheetId);
      showMsg("ইম্পোর্ট গাইড এবং উদাহরণ কলাম সংযুক্ত করা হয়েছে!", "success");
    } catch (err: any) {
      console.error(err);
      showMsg("টেমপ্লেট কলাম কনফিগারেশন ব্যর্থ।", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportWords = async () => {
    if (!spreadsheetId) return;
    setIsSyncing(true);
    setStatusMessage({ text: "গুগল শিট থেকে কাস্টম চীনা শব্দসমূহ ইম্পোর্ট করা হচ্ছে...", type: "info" });
    try {
      const words = await importCustomWordsFromSheet(spreadsheetId);
      if (words.length === 0) {
        showMsg("কোনো নতুন কাস্টম চীনা শব্দ পাওয়া যায়নি। 'Custom Imported Words' ট্যাবে শব্দ যোগ করে পুনরায় চেষ্টা করুন।", "info");
      } else {
        onAddCustomWordsBatch(words);
        showMsg(`অভিনন্দন! স্প্রেডশিট থেকে মোট ${words.length} টি প্রিমিয়াম শব্দ সফলভাবে সিস্টেমে ইম্পোর্ট এবং সিঙ্ক করা হয়েছে!`, "success");
      }
    } catch (err: any) {
      console.error(err);
      showMsg("ইম্পোর্ট করতে ব্যর্থ হয়েছে। নিশ্চিত করুন 'Custom Imported Words' ট্যাব স্প্রেডশিটে রয়েছে এবং ফরম্যাটটি সঠিক আছে।", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div id="sheets-integration-container" className="space-y-6 animate-fade-in">
      
      {/* Intro Hero with elegant banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-950/40 dark:to-teal-950/40 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-96 h-2 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 dark:bg-emerald-900/40 border border-white/25 rounded-full text-xs font-semibold tracking-wide">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-300" />
              গুগল শিট ক্লাউড সিঙ্ক
            </span>
            <h1 className="text-2xl sm:text-3xl font-heading font-black tracking-tight leading-tight">
              Google Sheets ভোকেবুলারি ইন্টিগ্রেশন
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-xl font-medium">
              আপনার HSK প্রস্তুতি এবং অগ্রগতিকে সরাসরি গুগল স্প্রেডশিটের সাথে সিঙ্ক করুন। বুকমার্ক এক্সপোর্ট করুন অথবা আপনার নিজস্ব চীনা শব্দসমূহ গুগল শিট থেকে সরাসরি অ্যাপে লোড করুন।
            </p>
          </div>
          
          {!user ? (
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="gsi-material-button w-full md:w-auto shadow-lg hover:shadow-xl transition-all cursor-pointer rounded-2xl transform active:scale-95"
              id="sheets-signin-btn"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-bold text-zinc-900">গুগল দিয়ে লগইন</span>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-white/10 dark:bg-black/20 p-3 rounded-2xl border border-white/20">
              {user.photoURL ? (
                <img src={user.photoURL} referrerPolicy="no-referrer" alt="" className="h-10 w-10 rounded-full border border-white/40" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-sm">
                  {user.displayName?.[0] || 'U'}
                </div>
              )}
              <div className="text-left">
                <p className="text-sm font-bold leading-tight">{user.displayName || 'ব্যবহারকারী'}</p>
                <p className="text-xs text-emerald-200 leading-none mt-1">{user.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-white/10 rounded-lg text-emerald-200 hover:text-white"
                title="লগআউট করুন"
                id="btn-sheets-logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Global Status notifications */}
      {statusMessage && (
        <div className={`p-4 rounded-xl flex items-start gap-2.5 transition-all shadow-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : statusMessage.type === 'error'
            ? 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
            : 'bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
        }`} id="google-sheets-notification">
          {statusMessage.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />}
          {statusMessage.type === 'error' && <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />}
          {statusMessage.type === 'info' && <RefreshCw className="h-5 w-5 shrink-0 text-zinc-500 mt-0.5 animate-spin" />}
          <div className="text-xs sm:text-sm font-medium leading-normal">{statusMessage.text}</div>
        </div>
      )}

      {/* Main interactive grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Step 1: Manage spreadsheet destination */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
              <Link2 className="h-5 w-5" />
            </span>
            <h3 className="font-heading font-bold text-base text-zinc-800 dark:text-zinc-200">
              স্টেপ ১: লার্নিং স্প্রেডশিট লিঙ্ক করুন
            </h3>
          </div>

          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
            আপনার ডাটা রাখার জন্য গুগল ড্রাইভে একটি ডেডিকেটেড স্প্রেডশিট যোগ করা লাগবে। আপনার ড্যাশবোর্ড অগ্রগতি ব্যাকআপ ও শব্দকোষ এক্সপোর্ট সেখানেই সংরক্ষিত হবে।
          </p>

          {!user ? (
            <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 text-center border border-dashed border-zinc-200 dark:border-zinc-800">
              <AlertCircle className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
                দয়া করে প্রথমে উপরে সংযুক্ত "গুগল দিয়ে লগইন" বাটনে ক্লিক করে একাউন্ট কানেক্ট করুন।
              </p>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {spreadsheetId ? (
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full">
                      ● সংযুক্ত রয়েছে (Connected)
                    </span>
                    <button
                      onClick={handleCreateSheet}
                      disabled={isSyncing}
                      className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs font-semibold flex items-center gap-1 bg-transparent"
                      title="নতুন আরেকটি ফাইল তৈরি করুন"
                    >
                      <RefreshCw className="h-3 w-3" /> নতুন তৈরি
                    </button>
                  </div>
                  <div className="text-xs">
                    <span className="text-zinc-400 font-mono">Spreadsheet ID:</span>
                    <p className="font-mono text-zinc-600 dark:text-zinc-300 truncate font-semibold mt-0.5 select-all">{spreadsheetId}</p>
                  </div>
                  
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all text-center"
                    id="sheets-open-spreadsheet-link"
                  >
                    গুগল শিটে ওপেন করুন
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 text-center">
                    {isSpreadsheetChecking ? (
                      <div className="flex flex-col items-center justify-center py-2 gap-2">
                        <RefreshCw className="h-6 w-6 text-emerald-500 animate-spin" />
                        <span className="text-xs text-zinc-500">আপনার ড্রাইভে পূর্ববর্তী ফাইল খোঁজা হচ্ছে...</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold mb-2">
                          আপনার গুগল ড্রাইভ অ্যাকাউন্টে এখনও কোনো ফাইল লিঙ্ক করা নেই।
                        </p>
                        <button
                          onClick={handleCreateSheet}
                          disabled={isSyncing}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
                          id="btn-sheets-create"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          নতুন HSK শিট ফাইল তৈরি করুন
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Backup & Sync stats */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg">
              <Upload className="h-5 w-5" />
            </span>
            <h3 className="font-heading font-bold text-base text-zinc-800 dark:text-zinc-200">
              স্টেপ ২: ড্যাশবোর্ড অগ্রগতি ব্যাকআপ
            </h3>
          </div>

          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
            আপনার কুইজ হাই-স্কোর, ডেইল স্ট্রাইক দিন এবং HSK ১-৪ সম্পন্ন করা শতকরা ভোকাব কোটা সরাসরি শিটে ট্রান্সফার করুন।
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-center">
                <span className="text-zinc-400 text-[10px] block uppercase font-bold text-center">HighScore XP</span>
                <p className="text-base font-black text-amber-500 mt-0.5">{stats.quizHighScore} XP</p>
              </div>
              <div className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-center">
                <span className="text-zinc-400 text-[10px] block uppercase font-bold text-center">Streak</span>
                <p className="text-base font-black text-orange-500 mt-0.5">{stats.quizStreak} দিন</p>
              </div>
            </div>
            
            <button
              onClick={handleBackupProgress}
              disabled={!spreadsheetId || isSyncing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              id="sheets-backup-progress-btn"
            >
              অগ্রগতি শিটে ব্যাকআপ করুন
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step 3: Export Saved bookmarked vocabulary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-lg">
              <Download className="h-5 w-5" />
            </span>
            <h3 className="font-heading font-bold text-base text-zinc-800 dark:text-zinc-200">
              স্টেপ ৩: বুকমার্ক করা শব্দকোষ এক্সপোর্ট
            </h3>
          </div>

          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
            আপনার প্রিয় বা কঠিন বুকমার্ক করা শব্দসমূহকে পিনয়িন, ইংরেজি ও বাংলা অনুবাদসহ স্প্রেডশিটে ট্রান্সফার করুন।
          </p>

          <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 text-center space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold px-1 text-zinc-500">
              <span>মোট বুকমার্ককৃত শব্দ:</span>
              <span className="font-mono bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 text-blue-700 px-2 py-0.5 rounded-md font-bold">
                {stats.savedWords.length} টি শব্দ
              </span>
            </div>

            <button
              onClick={handleExportBookmarks}
              disabled={!spreadsheetId || stats.savedWords.length === 0 || isSyncing}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              id="sheets-export-bookmarks-btn"
            >
              চীনা শব্দকোষ শিটে এক্সপোর্ট করুন
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step 4: Import Custom Words from sheets */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 rounded-lg">
              <FileText className="h-5 w-5" />
            </span>
            <h3 className="font-heading font-bold text-base text-zinc-800 dark:text-zinc-200">
              স্টেপ ৪: স্বরলিপি/শব্দ শিট থেকে ইম্পোর্ট
            </h3>
          </div>

          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
            আপনার স্প্রেডশিটের <span className="font-mono font-black italic text-teal-600 dark:text-teal-400">'Custom Imported Words'</span> ট্যাবে নতুন শব্দ যোগ করে সরাসরি এই অ্যাপ্লিকেশন শব্দকোষে লোড করার ম্যাজিক উপভোগ করুন।
          </p>

          <div className="bg-teal-50/20 dark:bg-teal-950/5 rounded-xl border border-teal-100/30 p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between font-semibold text-zinc-500">
              <span>ইতিমধ্যেই ইম্পোর্ট করা শব্দ:</span>
              <span className="bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 text-teal-700 px-2.5 py-0.5 rounded-full font-bold">
                {customUploadedWords.length} টি শব্দ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={handleSetupTemplateOnly}
                disabled={!spreadsheetId || isSyncing}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                id="sheets-setup-template-btn"
                title="শিটের মধ্যে ইম্পোর্ট করার জন্য কলাম গাইড যোগ করুন"
              >
                টেমপ্লেট কলাম যোগ
              </button>
              <button
                onClick={handleImportWords}
                disabled={!spreadsheetId || isSyncing}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-40"
                id="sheets-import-words-btn"
              >
                <Upload className="h-3.5 w-3.5 rotate-180" />
                শিট থেকে ইম্পোর্ট
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Helper guide accordion card */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-5 text-zinc-600 dark:text-zinc-350 text-xs leading-relaxed space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
          <HelpCircle className="h-4 w-4 text-emerald-500" />
          ইম্পোর্ট গাইডলাইন এবং কলাম বিন্যাস:
        </div>
        <p>
          শিট থেকে আপনার নিজস্ব চীনা শব্দ সিঙ্ক করতে চাইলে আপনার ফাইলটির <strong>'Custom Imported Words'</strong> ট্যাবের ১ম লাইনে এই সঠিক ক্রমানুসারে কলাম হেডার থাকতে হবে:
        </p>
        <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-850 font-mono text-[10px] overflow-x-auto space-y-1 block">
          <div>কলাম A বা ১: <code>Character</code> (উদাঃ 你好)</div>
          <div>কলাম B বা ২: <code>Pinyin</code> (উদাঃ nǐhǎo)</div>
          <div>কলাম C বা ৩: <code>English</code> (উদাঃ Hello)</div>
          <div>কলাম D বা ৪: <code>Bengali Pronunciation</code> (উদাঃ নি হাও)</div>
          <div>কলাম E বা ৫: <code>Bengali Meaning</code> (উদাঃ হ্যালো)</div>
          <div>কলাম F বা ৬: <code>Level</code> (উদাঃ 1, 2, 3 বা 4)</div>
          <div>কলাম G বা ৭: <code>Category</code> (উদাঃ Greeting)</div>
          <div>কলাম H বা ৮: <code>Context Sentence</code> (উদাঃ 你好吗？)</div>
          <div>কলাম I বা ৯: <code>Sentence Pinyin</code> (উদাঃ nǐhǎo ma?)</div>
          <div>কলাম J বা ১০: <code>Sentence Meaning</code> (উদাঃ তুমি কেমন আছ?)</div>
        </div>
        <p className="text-[10px] text-zinc-400">
          * লক্ষণীয়: ক্যারেক্টার, পিনয়িন এবং বাংলা অর্থ কলামগুলো ইম্পোর্ট হওয়ার জন্য আবশ্যকীয়। আপনার সুবিধা অনুযায়ী "টেমপ্লেট কলাম যোগ" বাটন প্রেস করে সরাসরি হেডার তৈরি করে নিতে পারেন।
        </p>
      </div>

    </div>
  );
}
