/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Check, X, Clock } from "lucide-react";
import { DayStatus, DayLog, GoalsLogMap } from "../types.ts";
import { formatDateString } from "../utils.ts";

interface MonthGridProps {
  year: number;
  logsMap: GoalsLogMap;
  onSelectDay: (dateString: string) => void;
}

export default function MonthGrid({ year, logsMap, onSelectDay }: MonthGridProps) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Generates calendar matrix [weeks][days] for a specific month
  const getMonthMatrix = (monthIdx: number) => {
    const firstDay = new Date(year, monthIdx, 1);
    const lastDay = new Date(year, monthIdx + 1, 0);
    
    const matrix: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];
    
    // Fill previous empty cells
    const startOffset = firstDay.getDay();
    for (let i = 0; i < startOffset; i++) {
      currentWeek.push(null);
    }
    
    const totalDays = lastDay.getDate();
    for (let d = 1; d <= totalDays; d++) {
      const date = new Date(year, monthIdx, d);
      currentWeek.push(date);
      
      if (currentWeek.length === 7) {
        matrix.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Fill remaining empty cells
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      matrix.push(currentWeek);
    }
    
    return matrix;
  };

  const getCellStyles = (log?: DayLog) => {
    if (!log) {
      return "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/80 hover:text-white";
    }
    
    if (log.status === DayStatus.SUCCESS) {
      return "bg-emerald-950/40 border-emerald-500/80 text-emerald-400 hover:bg-emerald-900/50";
    }
    
    if (log.status === DayStatus.FAILED) {
      return "bg-rose-950/40 border-rose-500/80 text-rose-400 hover:bg-rose-900/50";
    }
    
    return "bg-slate-850 border-slate-700 text-slate-300 hover:bg-slate-800";
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 text-left">
        <h4 className="text-base font-bold font-display uppercase tracking-wide">Traditional 12-Month Calendar Grid</h4>
        <p className="text-xs text-slate-400 mt-1">
          Each block displays regular weekday configurations. Successful goals are highlighted with a green border/background, failures are highlighted with red.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {months.map((monthName, monthIdx) => {
          const matrix = getMonthMatrix(monthIdx);
          return (
            <div 
              key={monthName}
              className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between text-left"
            >
              <h5 className="text-sm font-bold font-display text-slate-100 border-b border-slate-800 pb-2.5 mb-3 uppercase tracking-wider">
                {monthName}
              </h5>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 font-display">
                {weekdays.map(d => (
                  <div key={d} className="py-0.5">{d}</div>
                ))}
              </div>

              <div className="space-y-1">
                {matrix.map((week, wIdx) => (
                  <div key={wIdx} className="grid grid-cols-7 gap-1">
                    {week.map((day, dIdx) => {
                      if (!day) return <div key={`empty-${dIdx}`} className="aspect-square" />;
                      
                      const ds = formatDateString(day);
                      const log = logsMap[ds];
                      const dayNum = day.getDate();
                      
                      return (
                        <button
                          key={ds}
                          onClick={() => onSelectDay(ds)}
                          className={`aspect-square rounded-xl border flex flex-col items-center justify-between p-1 text-[10px] font-bold transition-all relative overflow-hidden group cursor-pointer ${getCellStyles(log)}`}
                        >
                          <span className="self-start leading-none font-mono">{dayNum}</span>
                          
                          {/* Inner icons and small time logs */}
                          {log && (
                            <div className="absolute inset-x-0 bottom-0.5 flex flex-col items-center scale-90 group-hover:scale-100 transition-transform">
                              {log.status === DayStatus.SUCCESS ? (
                                <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                              ) : log.status === DayStatus.FAILED ? (
                                <X className="w-2.5 h-2.5 text-rose-400 stroke-[3]" />
                              ) : null}
                              
                              {(log.focusHours > 0 || log.focusMinutes > 0) && (
                                <span className="text-[7.5px] font-mono text-slate-400 truncate max-w-full">
                                  {log.focusHours}h{log.focusMinutes > 0 ? `${log.focusMinutes}` : ""}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
