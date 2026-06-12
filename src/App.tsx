/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Calendar, BarChart3, Clock, Sparkles, Plus, RefreshCw, Trash2, 
  HelpCircle, ChevronLeft, ChevronRight, CheckCircle2, Award, Heart,
  Settings
} from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, deleteField, serverTimestamp } from "firebase/firestore";
import { DayStatus, DayLog, GoalsLogMap, YearStats } from "./types.ts";
import { 
  formatDateString, calculateYearStats, generateSampleData 
} from "./utils.ts";
import { 
  auth, db, loginWithGoogle, logoutUser, handleFirestoreError, OperationType 
} from "./firebase.ts";

import YearHeatmap from "./components/YearHeatmap.tsx";
import MonthGrid from "./components/MonthGrid.tsx";
import StatsDashboard from "./components/StatsDashboard.tsx";
import DayEditor from "./components/DayEditor.tsx";
import SettingsModal from "./components/SettingsModal.tsx";

export default function App() {
  const currentCalendarYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(2026); // Default 2026 as per user current mock time
  const [logsMap, setLogsMap] = useState<GoalsLogMap>({});
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"heatmap" | "calendar" | "analytics">("heatmap");
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("focus-core-theme") as "light" | "dark") || "dark";
  });
  const [user, setUser] = useState<User | null>(null);

  // Subscribe to Authentication state change
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribeAuth();
  }, []);

  // Sync with Firestore dynamically
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "users", user.uid);
    const unsubscribeSnapshot = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.logs) {
            setLogsMap(data.logs);
          }
          if (data.theme && (data.theme === "light" || data.theme === "dark")) {
            setTheme(data.theme);
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    return () => unsubscribeSnapshot();
  }, [user]);

  // Handle Authentication triggers
  const handleLogin = async () => {
    try {
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        const docRef = doc(db, "users", loggedUser.uid);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          // Sync existing local logs to cloud on initial join
          await setDoc(docRef, {
            uid: loggedUser.uid,
            theme,
            logs: logsMap,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    } catch (e) {
      console.error("Authentication login failed:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      // On sign-out, restore current year logs from local storage
      const storageKey = `goal-tracker-logs-${year}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setLogsMap(JSON.parse(stored));
      } else {
        const sample = generateSampleData(year);
        setLogsMap(sample);
      }
    } catch (e) {
      console.error("Authentication log out failed:", e);
    }
  };

  // Keep theme class in sync on the root element
  useEffect(() => {
    localStorage.setItem("focus-core-theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("light-theme");
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  // Synchronize theme modification 
  const handleThemeChange = async (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          theme: newTheme,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  // Load yearly data from local storage on mounted / year change (only when logged out)
  useEffect(() => {
    if (user) return;

    const storageKey = `goal-tracker-logs-${year}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setLogsMap(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse logs from local storage", e);
        setLogsMap({});
      }
    } else {
      const sample = generateSampleData(year);
      localStorage.setItem(storageKey, JSON.stringify(sample));
      setLogsMap(sample);
    }
  }, [year, user]);

  // Save map state in local storage / cloud
  const saveLogsMap = async (newMap: GoalsLogMap) => {
    setLogsMap(newMap);
    if (!user) {
      const storageKey = `goal-tracker-logs-${year}`;
      localStorage.setItem(storageKey, JSON.stringify(newMap));
    }
  };

  const handleSaveDayLog = async (log: DayLog) => {
    const updated = { ...logsMap, [log.dateString]: log };
    await saveLogsMap(updated);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          [`logs.${log.dateString}`]: log,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    setActiveDate(null);
  };

  const handleDeleteDayLog = async (dateString: string) => {
    const updated = { ...logsMap };
    delete updated[dateString];
    await saveLogsMap(updated);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          [`logs.${dateString}`]: deleteField(),
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    setActiveDate(null);
  };

  const handleClearAllData = async () => {
    await saveLogsMap({});
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          logs: {},
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
    setShowClearConfirm(false);
  };

  const handleLoadSampleData = async () => {
    const sample = generateSampleData(year);
    await saveLogsMap(sample);
    if (user) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          logs: sample,
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
      }
    }
  };

  const computedStats = calculateYearStats(logsMap, year);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-12">
      {/* 1. Universal Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/60 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            
            {/* Elegant App Title */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center justify-center w-11 h-11 bg-slate-900 border border-slate-800 rounded-xl shadow-lg text-emerald-400">
                <Calendar className="w-5.5 h-5.5" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <h1 className="font-display font-bold text-xl tracking-tight text-white uppercase">
                    FOCUS_CORE <span className="text-emerald-500 text-xs font-mono ml-1 font-normal">v2.0</span>
                  </h1>
                </div>
                <p className="text-xs text-slate-400 font-display">
                  Systematic Achievement & Focus Visualization
                </p>
              </div>
            </div>

            {/* Live Stats Bento Widgets + Actions row */}
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center gap-4">
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-display font-bold">Current Streak</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{computedStats.currentStreak} DAYS</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-display font-bold">Total Hours</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">
                    {Math.round((computedStats.totalFocusMinutes / 60) * 10) / 10}h
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Year Traversal */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                  <button 
                    onClick={() => setYear(prev => prev - 1)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Previous Year"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold font-mono px-1.5 text-slate-100">
                    {year}
                  </span>
                  <button 
                    onClick={() => setYear(prev => prev + 1)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Next Year"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Advanced Preferences Settings Toggle */}
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-850 cursor-pointer transition-all"
                  title="Open system preferences"
                >
                  <Settings className="w-5 h-5 focus-hover" />
                </button>

                {/* Add today log instant trigger */}
                <button
                  onClick={() => setActiveDate(formatDateString(new Date()))}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-sm rounded-xl cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Log Today
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Main Content Board */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Nav Tabs Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-0.5">
          <div className="flex gap-1.5">
            <button
              onClick={() => setActiveTab("heatmap")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
                activeTab === "heatmap"
                  ? "border-emerald-500 text-white font-bold bg-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-900/40"
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-500" />
              Year Grid View
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
                activeTab === "calendar"
                  ? "border-emerald-500 text-white font-bold bg-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-900/40"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-505" />
              12-Month Calendar
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
                activeTab === "analytics"
                  ? "border-emerald-500 text-white font-bold bg-slate-950"
                  : "border-transparent text-slate-500 hover:text-slate-350 hover:bg-slate-900/40"
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-505" />
              Overview & Analytics
            </button>
          </div>

        </div>

        {/* Tab Layout Render block */}
        <div className="space-y-6">
          {activeTab === "heatmap" && (
            <YearHeatmap 
              year={year} 
              logsMap={logsMap} 
              onSelectDay={setActiveDate} 
            />
          )}

          {activeTab === "calendar" && (
            <MonthGrid 
              year={year} 
              logsMap={logsMap} 
              onSelectDay={setActiveDate} 
            />
          )}

          {activeTab === "analytics" && (
            <StatsDashboard 
              stats={computedStats} 
              logsMap={logsMap} 
              year={year}
            />
          )}
        </div>

        {/* 3. Bottom Aesthetic Card / Instructions */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl max-w-lg mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-center text-emerald-400">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold font-display uppercase tracking-widest text-slate-300">
              SYSTEMATIC ATOMIC FOCUS
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Based on the philosophy of visual habit loops. Keeping your matrix pristine triggers dynamic psychological rewards. Make daily tracking an atomic routine.
            </p>
          </div>
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <span>Core sync status nominal</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/80" />
          </div>
        </div>
      </main>

      {/* Floating Modal Layer for editing logs */}
      {activeDate && (
        <DayEditor
          dateString={activeDate}
          existingLog={logsMap[activeDate]}
          onSave={handleSaveDayLog}
          onDelete={handleDeleteDayLog}
          onClose={() => setActiveDate(null)}
        />
      )}

      {/* Floating Modal Layer for settings */}
      {showSettings && (
        <SettingsModal
          theme={theme}
          onThemeChange={handleThemeChange}
          onLoadSampleData={handleLoadSampleData}
          onClearAllData={handleClearAllData}
          showClearConfirm={showClearConfirm}
          onSetShowClearConfirm={setShowClearConfirm}
          onClose={() => setShowSettings(false)}
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          logsMap={logsMap}
          year={year}
        />
      )}
    </div>
  );
}
