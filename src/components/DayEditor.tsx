/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Check, Clock, FileText, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { DayStatus, DayLog } from "../types.ts";

interface DayEditorProps {
  dateString: string;
  existingLog?: DayLog;
  onSave: (log: DayLog) => void;
  onDelete: (dateString: string) => void;
  onClose: () => void;
}

export default function DayEditor({
  dateString,
  existingLog,
  onSave,
  onDelete,
  onClose,
}: DayEditorProps) {
  const [status, setStatus] = useState<DayStatus>(DayStatus.UNMARKED);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");

  // Populate state with existing log items
  useEffect(() => {
    if (existingLog) {
      setStatus(existingLog.status);
      setHours(existingLog.focusHours);
      setMinutes(existingLog.focusMinutes);
      setNotes(existingLog.notes || "");
    } else {
      setStatus(DayStatus.UNMARKED);
      setHours(0);
      setMinutes(0);
      setNotes("");
    }
  }, [existingLog, dateString]);

  // Format the visual date header (e.g. "Thursday, Jun 11, 2026")
  const formattedDateLabel = () => {
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    const dateObj = new Date(
      parseInt(parts[0]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2])
    );
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleIncrementHours = () => {
    setHours((prev) => Math.min(24, prev + 1));
  };

  const handleDecrementHours = () => {
    setHours((prev) => Math.max(0, prev - 1));
  };

  const handleIncrementMinutes = () => {
    setMinutes((prev) => {
      if (prev >= 45) {
        if (hours < 24) {
          setHours((h) => Math.min(24, h + 1));
          return 0;
        }
        return 45;
      }
      return prev + 15;
    });
  };

  const handleDecrementMinutes = () => {
    setMinutes((prev) => {
      if (prev <= 0) {
        if (hours > 0) {
          setHours((h) => Math.max(0, h - 1));
          return 45;
        }
        return 0;
      }
      return prev - 15;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      dateString,
      status,
      focusHours: hours,
      focusMinutes: minutes,
      notes: notes.trim(),
    });
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md overflow-hidden bg-white border border-slate-100 shadow-2xl rounded-2xl dark:bg-slate-900 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider font-display">
                  Daily Achievement Entry
                </span>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {formattedDateLabel()}
                </h4>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 transition-colors rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Status Selection */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                Day Goal Outcome
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {/* Success Toggle */}
                <button
                  type="button"
                  onClick={() => setStatus(DayStatus.SUCCESS)}
                  className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border transition-all ${
                    status === DayStatus.SUCCESS
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-500 dark:text-emerald-400 ring-2 ring-emerald-500/10"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className={`p-1.5 rounded-full mb-1.5 ${status === DayStatus.SUCCESS ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium font-display">Success</span>
                </button>

                {/* Failed Toggle */}
                <button
                  type="button"
                  onClick={() => setStatus(DayStatus.FAILED)}
                  className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border transition-all ${
                    status === DayStatus.FAILED
                      ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/20 dark:border-rose-500 dark:text-rose-400 ring-2 ring-rose-500/10"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className={`p-1.5 rounded-full mb-1.5 ${status === DayStatus.FAILED ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium font-display">Failed</span>
                </button>

                {/* Unmarked Neutral */}
                <button
                  type="button"
                  onClick={() => setStatus(DayStatus.UNMARKED)}
                  className={`flex flex-col items-center justify-center py-3.5 px-3 rounded-xl border transition-all ${
                    status === DayStatus.UNMARKED
                      ? "bg-slate-100 border-slate-400 text-slate-800 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 ring-2 ring-slate-500/10"
                      : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className={`p-1.5 rounded-full mb-1.5 ${status === DayStatus.UNMARKED ? "bg-slate-400 text-white" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                    <X className="w-3.5 h-3.5 opacity-60" />
                  </div>
                  <span className="text-xs font-medium font-display">Neutral</span>
                </button>
              </div>
            </div>

            {/* Time Focused Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
                  Focus Session Duration
                </label>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono">Time unit: HH:MM</span>
                </div>
              </div>

              <div className="flex items-center gap-4 py-4 px-5 rounded-2xl bg-slate-50/70 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                {/* Hours Block */}
                <div className="flex-1 text-center space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">
                    Hours
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={hours <= 0}
                      onClick={handleDecrementHours}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 bg-white border border-slate-200 shadow-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold font-mono text-slate-800 min-w-[32px] dark:text-slate-100">
                      {hours}
                    </span>
                    <button
                      type="button"
                      disabled={hours >= 24}
                      onClick={handleIncrementHours}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 bg-white border border-slate-200 shadow-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Separator colon */}
                <span className="text-xl font-bold text-slate-300 pb-1.5 dark:text-slate-700">:</span>

                {/* Minutes Block */}
                <div className="flex-1 text-center space-y-1">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">
                    Minutes
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={hours === 0 && minutes === 0}
                      onClick={handleDecrementMinutes}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 bg-white border border-slate-200 shadow-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold font-mono text-slate-800 min-w-[32px] dark:text-slate-100">
                      {String(minutes).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      disabled={hours >= 24}
                      onClick={handleIncrementMinutes}
                      className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-500 bg-white border border-slate-200 shadow-xs hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Note / Journal Entry */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Goal Journal Notes
                </label>
                <span className="text-[10px] text-slate-400 italic">Optional summary</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you focus on today? e.g. finished visual layout..."
                maxLength={200}
                rows={3}
                className="w-full px-4 py-3 text-sm transition-all bg-white border rounded-xl border-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden dark:bg-slate-950 dark:border-slate-800 dark:text-slate-100"
              />
            </div>

            {/* Footer buttons */}
            <div className="flex justify-between items-center gap-3 pt-2">
              {existingLog ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Are you sure you want to clear achievement logs for this day?")) {
                      onDelete(dateString);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 rounded-xl"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Log
                </button>
              ) : (
                <div />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium border rounded-xl text-slate-500 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 shadow-md transition-all rounded-xl cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
