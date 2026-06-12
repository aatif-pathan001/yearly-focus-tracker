/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Sun, Moon, Palette, Database, Trash2, 
  RefreshCw, Check, Sparkles, AlertOctagon,
  Cloud, Download, LogIn, LogOut, FileJson, 
  FileSpreadsheet, Smartphone, Laptop
} from "lucide-react";
import { User } from "firebase/auth";
import { GoalsLogMap } from "../types.ts";

interface SettingsModalProps {
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
  onClearAllData: () => void;
  showClearConfirm: boolean;
  onSetShowClearConfirm: (show: boolean) => void;
  onClose: () => void;
  
  // New props for Firebase Sync
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  logsMap: GoalsLogMap;
  year: number;
}

export default function SettingsModal({
  theme,
  onThemeChange,
  onClearAllData,
  showClearConfirm,
  onSetShowClearConfirm,
  onClose,
  user,
  onLogin,
  onLogout,
  logsMap,
  year
}: SettingsModalProps) {

  // JSON backup trigger
  const handleExportJson = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
        schemaVersion: "2.0",
        app: "FocusCore",
        year,
        exportedAt: new Date().toISOString(),
        theme,
        logs: logsMap
      }, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `focus_core_backup_${year}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export JSON failed", e);
    }
  };

  // CSV spreadsheet backup trigger
  const handleExportCsv = () => {
    try {
      const headers = ["Date", "Status", "Focus Hours", "Focus Minutes", "Notes"];
      const rows = Object.entries(logsMap).map(([date, log]) => [
        date,
        log.status,
        log.focusHours,
        log.focusMinutes,
        `"${(log.notes || "").replace(/"/g, '""')}"`
      ]);
      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodedUri);
      downloadAnchor.setAttribute("download", `focus_core_report_${year}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export CSV failed", e);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white border border-slate-100 shadow-2xl rounded-2xl dark:bg-slate-900 dark:border-slate-800 scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Palette className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-display">
                  System Settings
                </span>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Preferences & Sync
                </h4>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 transition-colors rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close settings"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            
            {/* 1. Multi-Device Cloud Sync Control */}
            <div className="space-y-3.5 text-left bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-indigo-500" />
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider dark:text-slate-400 font-display">
                    Cross-Device Sync
                  </label>
                </div>
                <div className="flex gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" title="Mobile support active" />
                  <Laptop className="w-3.5 h-3.5 text-slate-400" title="Desktop synchronized" />
                </div>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                Connect your account to securely persist logs in the cloud and synchronize state instantly between desktop and mobile.
              </p>

              <div className="pt-1.5">
                {user ? (
                  // User logged in profile
                  <div className="p-4 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || "User avatar"} 
                          referrerPolicy="no-referrer" 
                          className="w-10 h-10 rounded-full border border-indigo-500/50" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold font-display text-sm">
                          {(user.displayName?.[0] || user.email?.[0] || "?").toUpperCase()}
                        </div>
                      )}
                      <div className="text-left overflow-hidden">
                        <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {user.displayName || "Cloud User"}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-900/60 text-[10px]">
                      <span className="text-emerald-500 font-display font-semibold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Storage Connected
                      </span>
                      <button
                        onClick={onLogout}
                        className="font-semibold text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <LogOut className="w-3 h-3" />
                        Log Out
                      </button>
                    </div>
                  </div>
                ) : (
                  // Google Login button
                  <button
                    type="button"
                    onClick={onLogin}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold font-display rounded-xl cursor-pointer transition-all shadow-md shadow-indigo-500/15"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>

            {/* 2. System Theme Preferences */}
            <div className="space-y-3.5 text-left">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-500" />
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider dark:text-slate-400 font-display">
                  Visual Interface Layout
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-3.5 pt-1">
                {/* Dark Mode option */}
                <button
                  type="button"
                  onClick={() => onThemeChange("dark")}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    theme === "dark"
                      ? "bg-indigo-50/60 border-indigo-500 text-slate-900 dark:bg-slate-950/80 dark:border-indigo-400 dark:text-slate-100 ring-2 ring-indigo-500/10"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400"}`}>
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold font-display">Obsidian Night</h5>
                      <span className="text-[10px] opacity-80 block">Dark theme</span>
                    </div>
                  </div>
                  {theme === "dark" && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>

                {/* Light Mode option */}
                <button
                  type="button"
                  onClick={() => onThemeChange("light")}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left cursor-pointer ${
                    theme === "light"
                      ? "bg-indigo-50/60 border-indigo-500 text-slate-900 dark:bg-slate-950/80 dark:border-indigo-400 dark:text-slate-100 ring-2 ring-indigo-500/10"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${theme === "light" ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 dark:bg-slate-850"}`}>
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold font-display">Alabaster Day</h5>
                      <span className="text-[10px] opacity-80 block">Light theme</span>
                    </div>
                  </div>
                  {theme === "light" && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Export & Backup Data Controls */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-500" />
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider dark:text-slate-400 font-display">
                  Export Data Backups
                </label>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed -mt-1.5">
                Download your entire structured logs system instantly to import elsewhere or examine in spreadsheet tools.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {/* Export JSON */}
                <button
                  onClick={handleExportJson}
                  className="flex items-center justify-center gap-2 px-3.5 py-3 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-850 cursor-pointer transition-all"
                  title="Export database configuration to standard JSON"
                >
                  <FileJson className="w-4 h-4 text-amber-500" />
                  JSON Format
                </button>

                {/* Export CSV */}
                <button
                  onClick={handleExportCsv}
                  className="flex items-center justify-center gap-2 px-3.5 py-3 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-850 cursor-pointer transition-all"
                  title="Export readable report for spreadsheet tools (CSV)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  CSV Format
                </button>
              </div>
            </div>

            {/* 4. Local Wipe / Reset Controls */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-rose-500" />
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider dark:text-slate-400 font-display">
                  Database & Memory Reset
                </label>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed -mt-2">
                Manage your recorded timeline data. You can completely empty your calendar tracking matrix.
              </p>

              <div className="flex flex-col gap-3">
                {/* Wipe Logs Toggle */}
                {showClearConfirm ? (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-3">
                    <div className="flex items-start gap-2.5 text-rose-600 dark:text-rose-400">
                      <AlertOctagon className="w-4 h-4 mt-0.5 shrink-0" />
                      <div className="text-xs text-left">
                        <p className="font-bold">Are you absolutely sure?</p>
                        <p className="opacity-95">This permanently wipes all local focus logs for active timeline.</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          onClearAllData();
                          onClose();
                        }}
                        className="px-3.5 py-1.5 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer transition-all flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Confirm Wipe
                      </button>
                      <button
                        onClick={() => onSetShowClearConfirm(false)}
                        className="px-3.5 py-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => onSetShowClearConfirm(true)}
                    className="flex items-center justify-between w-full px-4 py-3 text-xs font-semibold rounded-xl border border-rose-100 hover:bg-rose-50/50 text-rose-600 dark:border-rose-950/25 dark:bg-rose-950/5 dark:text-rose-450 dark:hover:bg-rose-955/20 cursor-pointer transition-all"
                  >
                    <span className="flex items-center gap-2.5">
                      <Trash2 className="w-4 h-4" />
                      Wipe All Active Logs
                    </span>
                    <span className="text-[10px] text-rose-400 font-mono">[Destructive]</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Info footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 block font-display">
                FocusCore system nominal &bull; cloud replication active
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
