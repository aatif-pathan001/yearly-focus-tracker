/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Pause, RotateCcw, Clock, Save, ChevronDown, ChevronUp, 
  X, Check, AlertTriangle, Calendar, Maximize2, Minimize2 
} from "lucide-react";
import { DayStatus, DayLog, GoalsLogMap } from "../types.ts";
import { formatDateString } from "../utils.ts";

interface FlipDigitProps {
  digit: number;
  size?: "sm" | "lg";
}

export function FlipDigit({ digit, size = "sm" }: FlipDigitProps) {
  const [prevDigit, setPrevDigit] = useState(digit);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (digit !== prevDigit) {
      setIsFlipping(true);
      const timer = setTimeout(() => {
        setPrevDigit(digit);
        setIsFlipping(false);
      }, 500); // 250ms top flip + 250ms bottom flip
      return () => clearTimeout(timer);
    }
  }, [digit, prevDigit]);

  const sizeClasses = size === "lg"
    ? "w-14 h-20 sm:w-20 sm:h-28 md:w-24 md:h-36 border-2 border-slate-900 rounded-xl"
    : "w-8 h-12 border border-slate-900/50 rounded-lg";

  const textClasses = size === "lg"
    ? "text-3xl sm:text-6xl md:text-7xl font-bold"
    : "text-xl sm:text-2xl font-bold";

  return (
    <div className={`flip-digit-perspective relative flex flex-col overflow-hidden select-none bg-slate-950 shadow-md ${sizeClasses}`}>
      {/* Upper Half (Static background showing new digit) */}
      <div className="absolute top-0 left-0 w-full h-1/2 overflow-hidden bg-slate-900 border-b border-slate-950 flex items-end justify-center rounded-t-lg">
        <span className={`font-mono text-emerald-400 translate-y-1/2 leading-none ${textClasses}`}>
          {digit}
        </span>
      </div>

      {/* Lower Half (Static background showing old digit) */}
      <div className="absolute bottom-0 left-0 w-full h-1/2 overflow-hidden bg-slate-950 flex items-start justify-center rounded-b-lg">
        <span className={`font-mono text-emerald-400 -translate-y-1/2 leading-none ${textClasses}`}>
          {prevDigit}
        </span>
      </div>

      {/* Flipping Top (Old value folding down) */}
      {isFlipping && (
        <div 
          className="absolute top-0 left-0 w-full h-1/2 overflow-hidden bg-slate-900 border-b border-slate-950 flex items-end justify-center rounded-t-lg origin-bottom animate-flip-top z-10"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className={`font-mono text-emerald-400 translate-y-1/2 leading-none ${textClasses}`}>
            {prevDigit}
          </span>
        </div>
      )}

      {/* Flipping Bottom (New value unfolding down) */}
      {isFlipping && (
        <div 
          className="absolute bottom-0 left-0 w-full h-1/2 overflow-hidden bg-slate-950 flex items-start justify-center rounded-b-lg origin-top animate-flip-bottom z-10"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className={`font-mono text-emerald-400 -translate-y-1/2 leading-none ${textClasses}`}>
            {digit}
          </span>
        </div>
      )}

      {/* Split Divider line */}
      <div className="absolute top-1/2 left-0 w-full h-[1px] bg-slate-950/70 z-20" />
    </div>
  );
}

interface StopwatchProps {
  logsMap: GoalsLogMap;
  onSaveLog: (log: DayLog) => void;
}

export default function Stopwatch({ logsMap, onSaveLog }: StopwatchProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Logging Form State
  const [isLoggingMode, setIsLoggingMode] = useState<boolean>(false);
  const [logDate, setLogDate] = useState<string>("");
  const [logStatus, setLogStatus] = useState<DayStatus>(DayStatus.SUCCESS);
  const [logNotes, setLogNotes] = useState<string>("");
  const [appendMode, setAppendMode] = useState<boolean>(true); // Add to existing or Overwrite
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and load from localStorage
  useEffect(() => {
    const savedTime = localStorage.getItem("focus_stopwatch_time");
    const savedRunning = localStorage.getItem("focus_stopwatch_running") === "true";
    const savedLastTime = localStorage.getItem("focus_stopwatch_last_timestamp");

    let initialTime = savedTime ? parseInt(savedTime, 10) : 0;

    if (savedRunning && savedLastTime) {
      const elapsed = Math.floor((Date.now() - parseInt(savedLastTime, 10)) / 1000);
      initialTime += Math.max(0, elapsed);
      setIsRunning(true);
    }

    setTime(initialTime);
    setLogDate(formatDateString(new Date()));
  }, []);

  // Save states to localStorage and manage intervals
  useEffect(() => {
    localStorage.setItem("focus_stopwatch_time", time.toString());
    localStorage.setItem("focus_stopwatch_running", isRunning.toString());
    localStorage.setItem("focus_stopwatch_last_timestamp", Date.now().toString());

    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, time]);

  // Synchronize log inputs when date changes
  useEffect(() => {
    if (logDate) {
      const existing = logsMap[logDate];
      if (existing) {
        setLogStatus(existing.status);
        setLogNotes(existing.notes || "");
      } else {
        setLogStatus(DayStatus.SUCCESS);
        setLogNotes("");
      }
    }
  }, [logDate, logsMap, isLoggingMode]);

  // Synchronize with native fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFull = !!document.fullscreenElement;
      if (!isNativeFull && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isFullscreen]);

  // Sync Escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch((err) => console.error("Error exiting fullscreen:", err));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const toggleStopwatch = () => setIsRunning((prev) => !prev);
  
  const resetStopwatch = () => {
    if (confirm("Reset the stopwatch to 00:00:00?")) {
      setIsRunning(false);
      setTime(0);
      localStorage.setItem("focus_stopwatch_time", "0");
      localStorage.setItem("focus_stopwatch_running", "false");
    }
  };

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Failed to request native fullscreen:", err);
        });
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error("Failed to exit native fullscreen:", err);
        });
      }
    }
  };

  // Time calculations
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  const h1 = Math.floor(hours / 10);
  const h2 = hours % 10;
  const m1 = Math.floor(minutes / 10);
  const m2 = minutes % 10;
  const s1 = Math.floor(seconds / 10);
  const s2 = seconds % 10;

  // Active existing log for visual prompts
  const activeExistingLog = logsMap[logDate];
  const stopwatchMinutesRounded = Math.round(time / 60);

  // Calculations for Preview
  let previewHours = 0;
  let previewMinutes = 0;
  if (activeExistingLog) {
    const existingMins = activeExistingLog.focusHours * 60 + activeExistingLog.focusMinutes;
    const finalMins = appendMode 
      ? existingMins + stopwatchMinutesRounded 
      : stopwatchMinutesRounded;
    previewHours = Math.min(24, Math.floor(finalMins / 60));
    previewMinutes = previewHours === 24 ? 0 : finalMins % 60;
  } else {
    previewHours = Math.min(24, Math.floor(stopwatchMinutesRounded / 60));
    previewMinutes = previewHours === 24 ? 0 : stopwatchMinutesRounded % 60;
  }

  const handleOpenLogForm = () => {
    if (stopwatchMinutesRounded === 0) {
      alert("Stopwatch duration must be at least 30 seconds to log focus time.");
      return;
    }
    setLogDate(formatDateString(new Date()));
    setIsLoggingMode(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDate) return;

    onSaveLog({
      dateString: logDate,
      status: logStatus,
      focusHours: previewHours,
      focusMinutes: previewMinutes,
      notes: logNotes.trim(),
    });

    // Reset Stopwatch on successful log
    setIsRunning(false);
    setTime(0);
    localStorage.setItem("focus_stopwatch_time", "0");
    localStorage.setItem("focus_stopwatch_running", "false");

    setIsLoggingMode(false);
    setIsFullscreen(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch((err) => console.error(err));
    }
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      <AnimatePresence>
        {/* Floating Success Notification */}
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="absolute bottom-20 right-0 bg-emerald-650 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold whitespace-nowrap border border-emerald-500"
          >
            <Check className="w-4 h-4" />
            Time logged successfully!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Overlay mode */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 select-none bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)]"
          >
            {/* Top Close / Toggle Button */}
            <button
              onClick={handleToggleFullscreen}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Exit Focus Mode"
            >
              <Minimize2 className="w-6 h-6" />
            </button>

            {/* Header Vibe */}
            <div className="flex flex-col items-center gap-2 mb-8 md:mb-12">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                Focus Mode Active
              </span>
              <h2 className="text-sm font-semibold font-display uppercase tracking-widest text-slate-500">
                Put aside distractions &bull; Keep going
              </h2>
            </div>

            {/* Massive Flip Clock Display */}
            <div className="flex items-center gap-2.5 sm:gap-4 md:gap-6 py-8 px-8 sm:py-12 sm:px-14 bg-slate-900/30 border border-slate-900/60 rounded-3xl backdrop-blur-xs mb-10 shadow-2xl">
              <div className="flex gap-1">
                <FlipDigit digit={h1} size="lg" />
                <FlipDigit digit={h2} size="lg" />
              </div>
              <span className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-700 animate-pulse pb-2 sm:pb-4">:</span>
              <div className="flex gap-1">
                <FlipDigit digit={m1} size="lg" />
                <FlipDigit digit={m2} size="lg" />
              </div>
              <span className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-700 animate-pulse pb-2 sm:pb-4">:</span>
              <div className="flex gap-1">
                <FlipDigit digit={s1} size="lg" />
                <FlipDigit digit={s2} size="lg" />
              </div>
            </div>

            {/* Centered Focus Controls */}
            <div className="flex items-center gap-4 w-full max-w-sm">
              {/* Play/Pause */}
              <button
                onClick={toggleStopwatch}
                className={`flex-1 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg cursor-pointer ${
                  isRunning
                    ? "bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white shadow-amber-500/10"
                    : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-500/10"
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause Session
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Resume Session
                  </>
                )}
              </button>

              {/* Reset */}
              <button
                onClick={resetStopwatch}
                disabled={time === 0}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
                title="Reset Timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Save/Log focus */}
              <button
                onClick={handleOpenLogForm}
                disabled={stopwatchMinutesRounded === 0}
                className="p-4 rounded-2xl bg-emerald-655 hover:bg-emerald-555 bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
                title="Log Focus Hours"
              >
                <Save className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Helper label */}
            <span className="text-[11px] text-slate-600 font-display mt-8">
              Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850 font-mono text-[9px]">Esc</kbd> or click the exit button above to return
            </span>

            {/* Logging Form Overlay inside Fullscreen */}
            <AnimatePresence>
              {isLoggingMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
                >
                  <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold font-display uppercase tracking-widest text-slate-300">
                        Log Focus Session
                      </h4>
                      <button
                        type="button"
                        onClick={() => setIsLoggingMode(false)}
                        className="text-slate-500 hover:text-slate-350 cursor-pointer"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveLog} className="space-y-4 text-left">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          1. Target Date
                        </span>
                        <input
                          type="date"
                          required
                          value={logDate}
                          onChange={(e) => setLogDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs transition-all bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        />
                      </div>

                      {activeExistingLog ? (
                        <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl space-y-2 text-xs">
                          <div className="text-[10px] text-slate-400 leading-tight">
                            An entry already exists for this day (Current:{" "}
                            <span className="text-indigo-400 font-semibold font-mono">
                              {activeExistingLog.focusHours}h {activeExistingLog.focusMinutes}m
                            </span>
                            ).
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setAppendMode(true)}
                              className={`py-1 px-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                                appendMode
                                  ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                                  : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              Add to Log (+{stopwatchMinutesRounded}m)
                            </button>
                            <button
                              type="button"
                              onClick={() => setAppendMode(false)}
                              className={`py-1 px-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                                !appendMode
                                  ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                                  : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              Overwrite Log ({stopwatchMinutesRounded}m)
                            </button>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between px-3 py-2 bg-indigo-950/20 border border-indigo-900/50 rounded-xl text-xs">
                        <span className="text-slate-400 font-medium">Logged Preview:</span>
                        <span className="text-emerald-400 font-bold font-mono">
                          {previewHours}h {previewMinutes}m
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          2. Daily Outcome Status
                        </span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLogStatus(DayStatus.SUCCESS)}
                            className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                              logStatus === DayStatus.SUCCESS
                                ? "bg-emerald-950/30 border-emerald-500 text-emerald-400 font-bold"
                                : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                            }`}
                          >
                            Success
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogStatus(DayStatus.FAILED)}
                            className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                              logStatus === DayStatus.FAILED
                                ? "bg-rose-950/30 border-rose-500 text-rose-400 font-bold"
                                : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                            }`}
                          >
                            Failed
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogStatus(DayStatus.UNMARKED)}
                            className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                              logStatus === DayStatus.UNMARKED
                                ? "bg-slate-800 border-slate-650 text-slate-200 font-bold"
                                : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                            }`}
                          >
                            Neutral
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          3. Quick Journal Note
                        </span>
                        <textarea
                          value={logNotes}
                          onChange={(e) => setLogNotes(e.target.value)}
                          placeholder="Finished focused study..."
                          maxLength={100}
                          rows={2}
                          className="w-full px-3 py-1.5 text-xs transition-all bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsLoggingMode(false)}
                          className="flex-1 py-2 text-xs font-semibold border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-xl transition-colors cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                        >
                          Confirm Log
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Collapsed/Expanded Container */}
      <div className="relative">
        <AnimatePresence>
          {isOpen && !isFullscreen ? (
            /* Expanded Flip Clock Panel */
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.92 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-80 overflow-hidden bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-2xl rounded-2xl p-5 text-slate-100 flex flex-col gap-4 text-left"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-display uppercase tracking-widest text-slate-300">
                      Focus Session Timer
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isRunning ? "Ticking active" : "Paused"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleFullscreen}
                    className="p-1 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    title="Fullscreen Focus Mode"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setIsLoggingMode(false);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {!isLoggingMode ? (
                /* Stopwatch UI State */
                <div className="space-y-4">
                  {/* Flip Clock Display */}
                  <div className="flex justify-center items-center gap-1.5 py-4 bg-slate-950/40 rounded-xl border border-slate-850/80">
                    <div className="flex gap-0.5">
                      <FlipDigit digit={h1} />
                      <FlipDigit digit={h2} />
                    </div>
                    <span className="text-xl font-bold text-slate-600 animate-pulse pb-1">:</span>
                    <div className="flex gap-0.5">
                      <FlipDigit digit={m1} />
                      <FlipDigit digit={m2} />
                    </div>
                    <span className="text-xl font-bold text-slate-600 animate-pulse pb-1">:</span>
                    <div className="flex gap-0.5">
                      <FlipDigit digit={s1} />
                      <FlipDigit digit={s2} />
                    </div>
                  </div>

                  {/* Actions / Controls Row */}
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button
                      onClick={toggleStopwatch}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md cursor-pointer ${
                        isRunning
                          ? "bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white shadow-amber-500/10"
                          : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-indigo-500/10"
                      }`}
                    >
                      {isRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          Start Focus
                        </>
                      )}
                    </button>

                    {/* Reset */}
                    <button
                      onClick={resetStopwatch}
                      disabled={time === 0}
                      className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>

                    {/* Log Progress */}
                    <button
                      onClick={handleOpenLogForm}
                      disabled={stopwatchMinutesRounded === 0}
                      className="flex items-center justify-center p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-500/10 cursor-pointer"
                      title="Log Focus Hours to Calendar"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>

                  {stopwatchMinutesRounded === 0 && time > 0 && (
                    <div className="text-[10px] text-amber-500 text-center flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                      Must run for 30s+ to log focus
                    </div>
                  )}
                </div>
              ) : (
                /* Inline Date Logger Form State */
                <form onSubmit={handleSaveLog} className="space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      1. Target Calendar Date
                    </span>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="date"
                        required
                        value={logDate}
                        onChange={(e) => setLogDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs transition-all bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Mode Toggle (if existing log is present) */}
                  {activeExistingLog ? (
                    <div className="bg-slate-950/40 border border-slate-800 p-2.5 rounded-xl space-y-2 text-xs">
                      <div className="text-[10px] text-slate-400 leading-tight">
                        An entry already exists for this day (Current:{" "}
                        <span className="text-indigo-400 font-semibold font-mono">
                          {activeExistingLog.focusHours}h {activeExistingLog.focusMinutes}m
                        </span>
                        ).
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setAppendMode(true)}
                          className={`py-1 px-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                            appendMode
                              ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                              : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Add to Log (+{stopwatchMinutesRounded}m)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAppendMode(false)}
                          className={`py-1 px-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                            !appendMode
                              ? "bg-indigo-950/40 border-indigo-500 text-indigo-400"
                              : "bg-transparent border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          Overwrite Log ({stopwatchMinutesRounded}m)
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Preview of Time to Save */}
                  <div className="flex items-center justify-between px-3 py-2 bg-indigo-950/20 border border-indigo-900/50 rounded-xl text-xs">
                    <span className="text-slate-400 font-medium">Logged Preview:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {previewHours}h {previewMinutes}m
                    </span>
                  </div>

                  {/* Goal Outcome Selector */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      2. Daily Outcome Status
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setLogStatus(DayStatus.SUCCESS)}
                        className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                          logStatus === DayStatus.SUCCESS
                            ? "bg-emerald-950/30 border-emerald-500 text-emerald-400 font-bold"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        Success
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogStatus(DayStatus.FAILED)}
                        className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                          logStatus === DayStatus.FAILED
                            ? "bg-rose-950/30 border-rose-500 text-rose-400 font-bold"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        Failed
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogStatus(DayStatus.UNMARKED)}
                        className={`py-1.5 rounded-lg border text-[10px] font-medium transition-all cursor-pointer ${
                          logStatus === DayStatus.UNMARKED
                            ? "bg-slate-800 border-slate-650 text-slate-200 font-bold"
                            : "bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-850"
                        }`}
                      >
                        Neutral
                      </button>
                    </div>
                  </div>

                  {/* Journal Note */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      3. Quick Journal Note
                    </span>
                    <textarea
                      value={logNotes}
                      onChange={(e) => setLogNotes(e.target.value)}
                      placeholder="Finished focused study..."
                      maxLength={100}
                      rows={2}
                      className="w-full px-3 py-1.5 text-xs transition-all bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLoggingMode(false)}
                      className="flex-1 py-2 text-xs font-semibold border border-slate-800 hover:bg-slate-850 text-slate-400 rounded-xl transition-colors cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                    >
                      Confirm Log
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          ) : !isFullscreen ? (
            /* Collapsed Timer Bubble Badge */
            <motion.button
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={() => setIsOpen(true)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl transition-all border outline-hidden cursor-pointer ${
                isRunning
                  ? "bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-emerald-500/10 animate-pulse-glow"
                  : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <div className="relative">
                <Clock className={`w-4.5 h-4.5 ${isRunning ? "animate-spin-slow text-emerald-400" : ""}`} />
                {isRunning && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                )}
              </div>
              
              <span className="font-mono text-xs font-bold tracking-wider">
                {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Embedded Mini Animation Rule for slow spin and glow */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.2), 0 10px 15px -3px rgba(0,0,0,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.1), 0 10px 15px -3px rgba(0,0,0,0.5); }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
