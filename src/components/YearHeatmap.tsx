/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, Info, ArrowLeftRight, Flame, HelpCircle } from "lucide-react";
import { DayStatus, DayLog, GoalsLogMap } from "../types.ts";
import { generateYearHeatmapCells, HeatmapCell, formatDuration } from "../utils.ts";

interface YearHeatmapProps {
  year: number;
  logsMap: GoalsLogMap;
  onSelectDay: (dateString: string) => void;
}

export default function YearHeatmap({ year, logsMap, onSelectDay }: YearHeatmapProps) {
  const weeks = generateYearHeatmapCells(year);
  const [hoveredCell, setHoveredCell] = useState<{ cell: HeatmapCell; log?: DayLog } | null>(null);

  // Weekdays abbreviations (rows)
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Month labels positioning helper
  const getMonthLabels = () => {
    const labels: { name: string; colIndex: number }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, colIndex) => {
      // Check the middle day of the week to safely identify the prevailing month
      const middleDay = week[3]?.date;
      if (middleDay) {
        const currentMonth = middleDay.getMonth();
        if (currentMonth !== lastMonth) {
          const monthName = middleDay.toLocaleDateString("en-US", { month: "short" });
          labels.push({ name: monthName, colIndex });
          lastMonth = currentMonth;
        }
      }
    });

    return labels;
  };

  const monthLabels = getMonthLabels();

  // Color generator based on state log
  const getCellClassNameAndStyle = (cell: HeatmapCell, log?: DayLog) => {
    if (!cell.isCurrentYear) {
      return "bg-transparent border-dashed border-slate-900/30 cursor-default pointer-events-none opacity-10";
    }

    if (!log) {
      return "bg-slate-800 hover:bg-slate-700 border border-slate-700/40 hover:scale-125 hover:z-10";
    }

    const { status, focusHours, focusMinutes } = log;
    const focusMinutesTotal = focusHours * 60 + focusMinutes;

    if (status === DayStatus.SUCCESS) {
      if (focusMinutesTotal <= 120) {
        // Less than 2 hours focus
        return "bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 hover:scale-125 hover:z-10";
      } else if (focusMinutesTotal <= 240) {
        // Between 2 and 4 hours
        return "bg-emerald-700/80 border border-emerald-500/40 text-white hover:scale-125 hover:z-10";
      } else {
        // Exceptional focus 4+ hours
        return "bg-emerald-500 text-slate-950 hover:scale-125 hover:z-10 shadow-sm shadow-emerald-550/30";
      }
    }

    if (status === DayStatus.FAILED) {
      if (focusMinutesTotal === 0) {
        return "bg-rose-950/40 border border-rose-900/50 text-rose-500 hover:scale-125 hover:z-10";
      } else if (focusMinutesTotal <= 120) {
        return "bg-rose-700/40 border border-rose-500/40 text-rose-250 hover:scale-125 hover:z-10";
      } else {
        return "bg-rose-500 text-white hover:scale-125 hover:z-10 shadow-sm shadow-rose-500/30";
      }
    }

    // Default unmarked or neutral
    return "bg-slate-700 text-slate-200 border border-slate-600 hover:scale-125 hover:z-10";
  };

  const handleCellClick = (cell: HeatmapCell) => {
    if (cell.isCurrentYear) {
      onSelectDay(cell.dateString);
    }
  };

  const activeHoverDateFormatted = (dateStr: string) => {
    const parts = dateStr.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6 text-left">
      {/* Title with explanation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold font-display text-slate-100 flex items-center gap-2 uppercase tracking-wide">
            Complete Calendar Matrix View
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse progress across 53 weeks. Click any day box to log minutes and toggle completion.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-800 border border-slate-700/40" />
            <span className="text-slate-400 font-display font-medium">Neutral</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-950/40 border border-rose-900/50" />
            <span className="text-slate-400 font-display font-medium">Failed (No focus)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-rose-500" />
            <span className="text-slate-400 font-display font-medium">Failed (Focus session)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-950/60 border border-emerald-800/60" />
            <span className="text-slate-400 font-display font-medium">Success (Light focus)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-slate-400 font-display font-medium">Success (High focus)</span>
          </div>
        </div>
      </div>

      {/* Grid container with custom scrollbar */}
      <div className="relative">
        <div className="overflow-x-auto custom-scrollbar pb-3 pr-2 scroll-smooth">
          <div className="min-w-[850px] relative pb-1">
            {/* 1. Month label row */}
            <div className="flex h-5 pl-8 mb-1.5 text-[10px] font-bold text-slate-500 relative">
              {monthLabels.map((lbl) => (
                <div
                  key={lbl.colIndex + lbl.name}
                  style={{ left: `${lbl.colIndex * 15.5 + 32}px` }}
                  className="absolute transform -translate-x-1/2 uppercase tracking-widest font-display"
                >
                  {lbl.name}
                </div>
              ))}
            </div>

            {/* 2. Grid Body: Weekdays labels + Days heatmap columns */}
            <div className="flex">
              {/* Row weekday headers */}
              <div className="w-8 shrink-0 flex flex-col justify-between text-[9px] font-bold text-slate-500 pr-1.5 pt-0.5 h-[106px] font-display">
                <span>Sun</span>
                <span>Tue</span>
                <span>Thu</span>
                <span>Sat</span>
              </div>

              {/* 53 Columns of Weeks */}
              <div className="flex gap-[3.5px]">
                {weeks.map((week, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-[3.5px]">
                    {week.map((cell) => {
                      const log = logsMap[cell.dateString];
                      return (
                        <div
                          key={cell.dateString}
                          onClick={() => handleCellClick(cell)}
                          onMouseEnter={() => setHoveredCell({ cell, log })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-[12px] h-[12px] rounded-[3px] transition-all duration-100 cursor-pointer ${getCellClassNameAndStyle(
                            cell,
                            log
                          )}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Day Inspector Tooltip Card */}
      <div className="h-20 flex items-center justify-center border border-dashed border-slate-800 bg-slate-950/40 rounded-2xl p-4 relative">
        {hoveredCell ? (
          <motion.div 
            initial={{ opacity: 0, y: 5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-3">
              {hoveredCell.log?.status === DayStatus.SUCCESS ? (
                <div className="p-1 px-2.5 rounded-lg bg-emerald-950 border border-emerald-900/50 text-emerald-400 font-semibold uppercase tracking-wider font-display text-[10px]">
                  Success
                </div>
              ) : hoveredCell.log?.status === DayStatus.FAILED ? (
                <div className="p-1 px-2.5 rounded-lg bg-rose-955 bg-rose-950/80 border border-rose-900/55 text-rose-450 font-semibold uppercase tracking-wider font-display text-[10px]">
                  Failed
                </div>
              ) : (
                <div className="p-1 px-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-350 font-semibold uppercase tracking-wider font-display text-[10px]">
                  Neutral
                </div>
              )}

              <div>
                <span className="font-bold text-slate-100 font-display">
                  {activeHoverDateFormatted(hoveredCell.cell.dateString)}
                </span>
                <span className="text-slate-450 font-mono text-[11px] block mt-0.5">
                  Focus Session logged: {hoveredCell.log ? `${hoveredCell.log.focusHours}h ${hoveredCell.log.focusMinutes}m` : "No session recorded"}
                </span>
              </div>
            </div>

            {hoveredCell.log?.notes && (
              <div className="max-w-[400px] text-right truncate italic text-slate-300 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-xs">
                &ldquo;{hoveredCell.log.notes}&rdquo;
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <Info className="w-4 h-4 text-slate-650" />
            <span>Hover over any day box for instant duration, status outcomes, and diary logs summary.</span>
          </div>
        )}
      </div>
    </div>
  );
}
