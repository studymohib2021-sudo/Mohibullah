import React from 'react';
import { BookOpen, Award, Flame, Star, Compass, Play, RefreshCw, Sparkles } from 'lucide-react';
import { UserStats } from '../types';

interface DashboardProps {
  stats: UserStats;
  onNavigate: (tab: string) => void;
  onSetLevel: (level: number) => void;
}

export default function Dashboard({ stats, onNavigate, onSetLevel }: DashboardProps) {
  const levels = [
    { num: 1, title: "HSK 1", desc: "১৫০টি বুনিয়াদি শব্দাবলি", color: "bg-blue-500", text: "text-blue-500" },
    { num: 2, title: "HSK 2", desc: "১৫০টি দৈনন্দিন ব্যবহারের শব্দাবলি", color: "bg-emerald-500", text: "text-emerald-500" },
    { num: 3, title: "HSK 3", desc: "৩০০টি প্রাথমিক স্তরের শব্দাবলি", color: "bg-amber-500", text: "text-amber-500" },
    { num: 4, title: "HSK 4", desc: "৬০০টি ইন্টারমিডিয়েট লেভেলের শব্দাবলি", color: "bg-purple-500", text: "text-purple-500" }
  ];

  const totalWords = 150 + 150 + 300 + 600;
  const completedWords = 
    Object.values(stats.levelProgress).reduce((acc, curr) => acc + (curr?.completed || 0), 0);

  const overallProgressPercentage = Math.round((completedWords / totalWords) * 100) || 0;

  return (
    <div className="space-y-6" id="dashboard-panel">
      {/* Dynamic Greeting Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            নির্ভুল বাংলা উচ্চারণ ও অডিও গাইড
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-sans tracking-tight">
            HSK 1-4 Vocabulary Master
          </h1>
          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-sans">
            চীনা ভাষা শিক্ষার সর্বাধিক গুরুত্বপূর্ণ HSK ১ থেকে ৪ শব্দাবলির সঠিক বাংলা উচ্চারণ গাইড। সাধারণ শিটের প্রচলিত ভুল উচ্চারণগুলো সংশোধন করে সঠিক বাংলা উচ্চারণ, ব্যাকরণ ব্যাখ্যা, উদাহরণ বাক্য এবং চমৎকার অডিও সহ শিখুন।
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              onClick={() => onNavigate('explorer')}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-bold rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              id="btn-start-exploring"
            >
              <Compass className="h-4 w-4" />
              শেখা শুরু করুন
            </button>
            <button
              onClick={() => onNavigate('quiz')}
              className="px-5 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              id="btn-quick-quiz"
            >
              <Flame className="h-4 w-4 text-orange-400" />
              কুইজ চ্যালেঞ্জ নিন
            </button>
          </div>
        </div>
      </div>

      {/* Progress Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progress Tracker Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">সর্বমোট অগ্রগতি</span>
            <BookOpen className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-950 dark:text-white">{completedWords}</span>
            <span className="text-zinc-400 text-sm">/ {totalWords} শব্দ</span>
          </div>
          <div className="relative w-full h-2.5 bg-zinc-150 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${overallProgressPercentage}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500 block font-sans">{overallProgressPercentage}% শব্দ সম্পন্ন হয়েছে</span>
        </div>

        {/* Daily Streak Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">ডেইলি স্ট্রিক</span>
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-950 dark:text-white">{stats.quizStreak}</span>
            <span className="text-zinc-400 text-sm">দিন</span>
          </div>
          <span className="text-xs text-zinc-500 block leading-tight font-sans">
            {stats.quizStreak > 0 ? "দারুণ! আপনার স্ট্রিক বজায় রাখুন।" : "আজকে কুইজ খেলে স্ট্রিক শুরু করুন!"}
          </span>
        </div>

        {/* High Score Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">কুইজ সর্বোচ্চ স্কোর</span>
            <Award className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-950 dark:text-white">{stats.quizHighScore}</span>
            <span className="text-zinc-400 text-sm">পয়েন্ট</span>
          </div>
          <span className="text-xs text-zinc-500 block font-sans">আপনার জ্ঞানের সর্বোচ্চ স্তর ছুঁয়ে দেখুন</span>
        </div>

        {/* Saved/Bookmarks Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-sans">বুকমার্ককৃত শব্দ</span>
            <Star className="h-5 w-5-filled text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-950 dark:text-white">{stats.savedWords.length}</span>
            <span className="text-zinc-400 text-sm">শব্দাবলি</span>
          </div>
          <button 
            onClick={() => onNavigate('explorer')} 
            className="text-xs text-blue-500 font-bold hover:underline block text-left font-sans"
            id="btn-goto-bookmarks"
          >
            সংরক্ষিত শব্দাবলি দেখুন →
          </button>
        </div>
      </div>

      {/* Helpful Guide on HSK 2/3/4 Word Coverage */}
      <div className="bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-zinc-50 dark:from-zinc-900 dark:via-zinc-900/60 dark:to-zinc-950 border border-emerald-100 dark:border-zinc-800 rounded-2xl p-6 text-left shadow-sm space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white font-sans flex items-center gap-2">
              কোথায় পাবেন বাকি শব্দগুলো? <span className="text-zinc-400 font-normal text-sm">(Where are the rest of the words?)</span>
            </h3>
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-mono">
              HSK 1 (150 words) • HSK 2 (150 words) • HSK 3 (300 words) • HSK 4 (600 words)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-350">
          <div className="bg-white/60 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/50 space-y-2">
            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-900 text-[10px] font-bold">১</span>
              বেসিক প্যাকেজ (Offline Core)
            </div>
            <p className="text-xs leading-relaxed">
              HSK সিলেবাসের সর্বাধিক গুরুত্বপূর্ণ ও অতি-ব্যবহৃত শব্দগুলো সরাসরি অফলাইন ডেটাসেটে যুক্ত করা আছে। এগুলো আপনি ইন্সট্যান্টলি স্টাডি ও কুইজ করতে পারবেন।
            </p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/50 space-y-2">
            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-900 text-[10px] font-bold">২</span>
              ইন্টারেক্টিভ ইনডেক্স (AI Guidance)
            </div>
            <p className="text-xs leading-relaxed">
              <strong>“Word Explorer”</strong> ট্যাবে HSK ২, ৩ ও ৪-এর শত শত অফিশিয়াল ইনডেক্স শব্দ রয়েছে। যার পাশে থাকা <span className="text-emerald-600 font-bold">✨ AI গাইড</span> চাপলে, Gemini সাথে সাথে সেগুলোর বাংলা উচ্চারণ ও উদাহরণ তৈরি করে ক্যাশে যুক্ত করে।
            </p>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/50 space-y-2">
            <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-zinc-900 text-[10px] font-bold">৩</span>
              কাস্টম সার্চ (Infinite AI Lookup)
            </div>
            <p className="text-xs leading-relaxed">
              তালিকায় নেই এমন যেকোনো চীনা শব্দ আপনি Word Explorer-এর নিচের দিকে সার্চ বক্সে লিখতে পারেন। Google Gemini 3.5 Flash রিয়েল-টাইমে বিশ্লেষণ করে তা আপনার ডায়েরিতে যুক্ত করে দেবে!
            </p>
          </div>
        </div>
      </div>

      {/* Level Chooser Cards Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-heading font-black text-zinc-900 dark:text-white flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-zinc-700 dark:text-zinc-400" />
          লেভেল অনুযায়ী শিখুন
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {levels.map((lvl) => {
            const completed = stats.levelProgress[lvl.num]?.completed || 0;
            const baseTotal = lvl.num === 1 ? 107 : lvl.num === 2 ? 15 : lvl.num === 3 ? 3 : 3; // base content limits
            const total = Math.max(baseTotal, stats.levelProgress[lvl.num]?.total || baseTotal);
            const percent = Math.min(100, Math.round((completed / total) * 100)) || 0;

            return (
              <div
                key={lvl.num}
                onClick={() => {
                  onSetLevel(lvl.num);
                  onNavigate('explorer');
                }}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl hover:border-zinc-400 dark:hover:border-zinc-700 transition-all cursor-pointer group hover:shadow-md text-left"
                id={`card-level-${lvl.num}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black uppercase tracking-wider ${lvl.text} bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full`}>
                    {lvl.title}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:scale-150 transition-transform" />
                </div>
                <p className="text-lg font-bold text-zinc-950 dark:text-white mt-3 font-sans leading-snug">
                  {lvl.title} শব্দসংগ্রহ
                </p>
                <p className="text-xs text-zinc-500 mt-1 font-sans">
                  {lvl.desc}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                  <span>অগ্রগতি: {percent}%</span>
                  <span className="font-bold font-mono">{completed}/{total}টি শব্দ</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Phonics Guide Highlight */}
      <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-lg">
          <h3 className="text-lg font-heading font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-emerald-500" />
            সাধারণ ভুল বনাম নির্ভুল উচ্চারণ গাইড
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed font-sans">
            যেমন চীনা শব্দ <strong>谢谢 (xièxie)</strong> যার বাংলা উচ্চারণ কোনো কোনো শিটে ভুল করে "মেক মেক" লিখে রাখা হয়েছে! এর সঠিক ও নির্ভুল উচ্চারণ হলো <strong>"শিয়েশিয়ে"</strong>। সকল ভুল উচ্চারণের বিশদ বৈজ্ঞানিক তুলনামূলক ছকটি দেখে আপনার পিনইন উচ্চারণ নিখুঁত করুন।
          </p>
        </div>
        <button
          onClick={() => onNavigate('correction')}
          className="px-5 py-3 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-900 text-white font-bold rounded-xl whitespace-nowrap transition-all shadow-sm shrink-0 cursor-pointer"
          id="btn-goto-corrections"
        >
          উচ্চারণ সংশোধনী ছক →
        </button>
      </div>
    </div>
  );
}
