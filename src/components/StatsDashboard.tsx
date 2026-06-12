/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Flame, CheckCircle, XCircle, TrendingUp, HelpCircle, AlertCircle, 
  Award, BarChart3, Clock, Sparkles, Zap, CalendarDays,
  Trophy, Crown, Star, Target, ShieldCheck
} from "lucide-react";
import { YearStats, GoalsLogMap, Achievement } from "../types.ts";
import { formatDuration, calculateWeekdayFocusStats, calculateAchievements } from "../utils.ts";

interface StatsDashboardProps {
  stats: YearStats;
  logsMap: GoalsLogMap;
  year?: number;
}

export default function StatsDashboard({ stats, logsMap, year }: StatsDashboardProps) {
  const weekdayStats = calculateWeekdayFocusStats(logsMap);
  const activeYear = year || 2026;
  const achievements = calculateAchievements(logsMap, stats, activeYear);
  const [filter, setFilter] = useState<"all" | "unlocked" | "inprogress">("all");

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const inProgressCount = achievements.filter((a) => !a.unlocked).length;

  const filteredAchievements = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "inprogress") return !a.unlocked;
    return true; // "all"
  });

  const getBadgeDetails = (vibe: string) => {
    switch (vibe) {
      case "indigo":
        return {
          icon: Star,
          textColor: "text-indigo-400 bg-indigo-950/40 border-indigo-900/50",
          glowBg: "rgba(129, 140, 248, 0.08)",
          progressColor: "bg-indigo-500",
        };
      case "amber":
        return {
          icon: Crown,
          textColor: "text-amber-400 bg-amber-950/40 border-amber-900/50",
          glowBg: "rgba(251, 191, 36, 0.08)",
          progressColor: "bg-amber-500",
        };
      case "emerald":
        return {
          icon: Trophy,
          textColor: "text-emerald-400 bg-emerald-950/40 border-emerald-900/50",
          glowBg: "rgba(52, 211, 153, 0.08)",
          progressColor: "bg-emerald-500",
        };
      case "rose":
        return {
          icon: Flame,
          textColor: "text-rose-400 bg-rose-950/40 border-rose-900/50",
          glowBg: "rgba(251, 113, 133, 0.08)",
          progressColor: "bg-rose-500",
        };
      case "cyan":
        return {
          icon: Target,
          textColor: "text-cyan-400 bg-cyan-950/40 border-cyan-900/50",
          glowBg: "rgba(34, 211, 238, 0.08)",
          progressColor: "bg-cyan-500",
        };
      case "purple":
        return {
          icon: ShieldCheck,
          textColor: "text-purple-400 bg-purple-950/40 border-purple-900/50",
          glowBg: "rgba(192, 132, 252, 0.08)",
          progressColor: "bg-purple-500",
        };
      default:
        return {
          icon: Award,
          textColor: "text-slate-400 bg-slate-950/40 border-slate-900/50",
          glowBg: "rgba(255, 255, 255, 0.05)",
          progressColor: "bg-indigo-500",
        };
    }
  };

  // Derive dynamic insights based on computed stats
  const getDynamicInsights = () => {
    const { successRate, currentStreak, totalFocusMinutes, avgFocusMinutesPerPassedDay } = stats;
    
    if (totalFocusMinutes === 0) {
      return {
        title: "Ready to Start Your Journey?",
        desc: "Begin planning your daily goals and log focus sessions! Your visual year timeline and comprehensive analysis will auto-update as soon as you record your first entries.",
        vibe: "start",
        icon: Sparkles,
        bgColor: "bg-slate-900/60 border border-slate-800 text-slate-300",
        iconBg: "bg-slate-950 text-emerald-400 border border-slate-850"
      };
    }

    if (successRate >= 75) {
      return {
        title: "Phenomenal Consistency!",
        desc: `You have successfully hit your goals on ${successRate}% of logged days! With a current streak of ${currentStreak} days and averaging ${formatDuration(avgFocusMinutesPerPassedDay)} of focus, your momentum is extremely robust.`,
        vibe: "excellent",
        icon: Award,
        bgColor: "bg-emerald-950/20 border border-emerald-900/45 text-emerald-305",
        iconBg: "bg-slate-950 text-emerald-400 border border-emerald-900/50"
      };
    }

    if (successRate >= 45) {
      return {
        title: "Steady, Progressive Growth",
        desc: `You are maintaining a decent ${successRate}% success rate. To maximize focus duration, try stacking atomic rewards immediately after completing your defined goals. Keep pushing!`,
        vibe: "good",
        icon: Zap,
        bgColor: "bg-indigo-950/25 border border-indigo-900/40 text-indigo-305",
        iconBg: "bg-slate-950 text-indigo-400 border border-indigo-900/40"
      };
    }

    return {
      title: "Focus Reset Opportunity",
      desc: `Your current goal success rate is at ${successRate}%. Don't sweat temporary drop-offs—consistency is a skill built over time. Try reducing your daily focus target to just 15-30 minutes to rebuild steady habits safely.`,
      vibe: "room-for-improvement",
      icon: AlertCircle,
      bgColor: "bg-rose-950/20 border border-rose-900/40 text-rose-300",
      iconBg: "bg-slate-950 text-rose-450 border border-rose-900/40"
    };
  };

  const insight = getDynamicInsights();
  const maxHours = Math.max(...weekdayStats.map(w => w.avgHours), 1);

  return (
    <div className="space-y-6">
      {/* 1. Header Hero section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 relative overflow-hidden">
        {/* Subtle cosmic background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-emerald-405 font-medium text-xs uppercase tracking-wider font-display">
            <TrendingUp className="w-3.5 h-3.5" />
            Performance Insights
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight text-slate-100 uppercase">
            Goal Accumulation Overview
          </h2>
          <p className="text-xs text-slate-400 max-w-lg">
            Detailed metrics compiling logged focuses, daily completion trends, and routine habits tracking across the current year.
          </p>
        </div>

        {/* Current status summary badge */}
        <div className="flex items-center gap-4 bg-slate-950/85 backdrop-blur-xs p-4 rounded-xl border border-slate-800 z-10">
          <div className="text-left">
            <span className="text-[10px] block text-slate-500 uppercase font-semibold font-display tracking-wider">
              Year Completion Progress
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg font-bold font-mono text-emerald-400">
                {Math.round((stats.passedDaysCount / 365) * 100)}%
              </span>
              <span className="text-xs text-slate-500 font-medium font-mono">
                ({stats.passedDaysCount}/365 days)
              </span>
            </div>
            <div className="w-40 h-1.5 bg-slate-850 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.round((stats.passedDaysCount / 365) * 100))}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Total Focus Time */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-widest font-display">
              Total Focused
            </span>
            <div className="p-2 bg-slate-950 text-blue-400 rounded-xl border border-blue-900/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {formatDuration(stats.totalFocusMinutes)}
            </h3>
            <p className="text-xs text-slate-500">
              Across all logged entries
            </p>
          </div>
        </motion.div>

        {/* Card: Average Focus Time */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-widest font-display">
              Avg. focus / Logged Day
            </span>
            <div className="p-2 bg-slate-950 text-indigo-400 rounded-xl border border-indigo-900/30">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
              {formatDuration(stats.avgFocusMinutesPerPassedDay)}
            </h3>
            <p className="text-xs text-slate-500">
              Excluding raw unmarked days
            </p>
          </div>
        </motion.div>

        {/* Card: Current Streak */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-widest font-display">
              Current Streak
            </span>
            <div className="p-2 bg-slate-950 text-emerald-400 rounded-xl border border-emerald-900/35 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
                {stats.currentStreak}
              </h3>
              <span className="text-xs text-slate-500 font-mono">days</span>
            </div>
            <p className="text-xs text-slate-500">
              Consecutive successes
            </p>
          </div>
        </motion.div>

        {/* Card: Longest Streak */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-widest font-display">
              Longest Streak
            </span>
            <div className="p-2 bg-slate-950 text-amber-400 rounded-xl border border-amber-900/30">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <h3 className="text-2xl font-bold font-mono tracking-tight text-slate-100">
                {stats.longestStreak}
              </h3>
              <span className="text-xs text-slate-500 font-mono">days</span>
            </div>
            <p className="text-xs text-slate-500">
              Yearly personal best
            </p>
          </div>
        </motion.div>
      </div>

      {/* 3. Comprehensive Achievement Rates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric Column: Goal Success/Fail Breakdown */}
        <div className="md:col-span-1 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
          <h4 className="text-sm font-semibold text-white font-display uppercase tracking-wider">
            Outcome Status Breakdown
          </h4>

          {/* Large Ring Chart representation via visual CSS or clean inline metrics */}
          <div className="flex flex-col items-center justify-center py-4 bg-slate-950 rounded-xl border border-slate-800/80">
            {/* Visual stacked indicator row */}
            <div className="flex items-center justify-center gap-1.5 w-full max-w-[200px] h-4 bg-slate-900 rounded-full overflow-hidden mb-6">
              {stats.successCount > 0 && (
                <div 
                  style={{ width: `${stats.successRate}%` }} 
                  className="h-full bg-emerald-500" 
                  title={`Success: ${stats.successRate}%`}
                />
              )}
              {stats.failCount > 0 && (
                <div 
                  style={{ width: `${stats.failRate}%` }} 
                  className="h-full bg-rose-500" 
                  title={`Failed: ${stats.failRate}%`}
                />
              )}
              {stats.unmarkedRate > 0 && (
                <div 
                  style={{ width: `${stats.unmarkedRate}%` }} 
                  className="h-full bg-slate-700" 
                  title={`Neutral: ${stats.unmarkedRate}%`}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 w-full px-4 text-center">
              <div>
                <span className="block text-[10px] text-slate-500 uppercase font-semibold font-display">Success</span>
                <span className="text-lg font-bold font-mono text-emerald-450">
                  {stats.successRate}%
                </span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                  ({stats.successCount} {stats.successCount === 1 ? "day" : "days"})
                </span>
              </div>
              <div className="border-x border-slate-800">
                <span className="block text-[10px] text-slate-550 uppercase font-semibold font-display">Failed</span>
                <span className="text-lg font-bold font-mono text-rose-455">
                  {stats.failRate}%
                </span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                  ({stats.failCount} {stats.failCount === 1 ? "day" : "days"})
                </span>
              </div>
              <div>
                <span className="block text-[10px] text-slate-550 uppercase font-semibold font-display">Neutral</span>
                <span className="text-lg font-bold font-mono text-slate-500">
                  {stats.unmarkedRate}%
                </span>
                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                  ({stats.passedDaysCount - stats.successCount - stats.failCount} days)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="p-3 bg-slate-950 border border-emerald-950 rounded-xl flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-medium flex items-center gap-1.5 font-sans">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Successful Goal Actions
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {stats.successCount}
              </span>
            </div>
            
            <div className="p-3 bg-slate-950 border border-rose-950 rounded-xl flex items-center justify-between text-xs">
              <span className="text-rose-400 font-medium flex items-center gap-1.5 font-sans">
                <XCircle className="w-3.5 h-3.5 text-rose-500" /> Failed Goal Targets
              </span>
              <span className="font-mono font-bold text-rose-400">
                {stats.failCount}
              </span>
            </div>
          </div>
        </div>

        {/* Metric Column: Focus Distribution by Weekday (Custom SVG Bar Chart) */}
        <div className="md:col-span-2 p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h4 className="text-sm font-semibold text-slate-100 font-display uppercase tracking-wider">
                Weekly Focus Intensity Patterns
              </h4>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 font-medium font-display">
                Average hours per week day
              </span>
            </div>

            {/* Styled Custom Horizontal Bars represent focus statistics */}
            <div className="space-y-4">
              {weekdayStats.map((item, index) => {
                const percent = maxHours > 0 ? (item.avgHours / maxHours) * 100 : 0;
                return (
                  <div key={item.dayName} className="flex items-center gap-4 text-xs font-sans">
                    <span className="w-10 font-bold text-slate-400 font-display text-left">
                      {item.dayName}
                    </span>
                    <div className="flex-1 h-3.5 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className="h-full bg-indigo-500 rounded-lg"
                      />
                    </div>
                    <span className="w-16 font-mono text-slate-300 font-bold text-right">
                      {item.avgHours} hrs
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-850 mt-4 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-display">
              <CalendarDays className="w-3.5 h-3.5 text-slate-600" />
              Ideal for finding highly disciplined routine days
            </span>
          </div>
        </div>
      </div>

      {/* 4. Focus Achievements and badges section */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl space-y-6">
        
        {/* Header containing Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-semibold text-slate-100 font-display uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400 fill-amber-400/20" /> Focus Milestones & Badges
            </h4>
            <p className="text-xs text-slate-400 max-w-xl">
              Unlock unique indicators of your discipline. Your achievements are dynamically calculated from academic, career, and personal goals tracking in {activeYear}.
            </p>
          </div>
          
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start sm:self-center">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-slate-900 text-white border border-slate-800/80"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({achievements.length})
            </button>
            <button
              onClick={() => setFilter("unlocked")}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                filter === "unlocked"
                  ? "bg-emerald-950/80 text-emerald-450 border border-emerald-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Unlocked ({unlockedCount})
            </button>
            <button
              onClick={() => setFilter("inprogress")}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold rounded-lg transition-all cursor-pointer ${
                filter === "inprogress"
                  ? "bg-indigo-950/80 text-indigo-400 border border-indigo-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              In Progress ({inProgressCount})
            </button>
          </div>
        </div>

        {/* The Grid of Achievement Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((ach) => {
            const details = getBadgeDetails(ach.rewardVibe);
            const IconComponent = details.icon;
            
            return (
              <motion.div
                key={ach.id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                  ach.unlocked 
                    ? `bg-slate-900 border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)]`
                    : "bg-slate-900/40 border-slate-850 opacity-55 hover:opacity-85"
                }`}
                style={{
                  boxShadow: ach.unlocked ? `inset 0 1px 0 0 rgba(255,255,255,0.03), 0 0 20px -3px ${details.glowBg}` : undefined
                }}
              >
                {/* Background watermarked vector icon */}
                {ach.unlocked && (
                  <div className="absolute -bottom-8 -right-8 opacity-[0.03] text-white pointer-events-none">
                    <IconComponent className="w-32 h-32" />
                  </div>
                )}

                <div className="space-y-4">
                  {/* Top line with Icon and Status badge */}
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-xl border ${details.textColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    {ach.unlocked ? (
                      <span className="text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-[9px] font-display font-bold uppercase tracking-widest px-2.5 py-1 bg-slate-950 text-slate-500 border border-slate-800/80 rounded-full">
                        Locked
                      </span>
                    )}
                  </div>

                  {/* Title and description */}
                  <div className="space-y-1 text-left">
                    <div className="flex items-baseline gap-2">
                      <h5 className="font-bold font-display text-sm text-white">
                        {ach.title}
                      </h5>
                      <span className="text-[9px] font-bold text-slate-500 font-mono tracking-wider">
                        [{ach.badgeName}]
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed min-h-[36px]">
                      {ach.description}
                    </p>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="pt-4 border-t border-slate-850 mt-4 space-y-1.5 text-left">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500 uppercase tracking-widest">
                      Discipline Progress
                    </span>
                    <span className={`font-bold ${ach.unlocked ? "text-emerald-400" : "text-slate-450"}`}>
                      {ach.currentValue} / {ach.targetValue} {ach.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden relative border border-slate-900">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${ach.progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${details.progressColor}`}
                    />
                  </div>
                </div>
                
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 5. dynamic advice prompt container */}
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 border rounded-2xl flex flex-col sm:flex-row gap-4 items-start ${insight.bgColor}`}
      >
        <div className={`p-2.5 rounded-xl ${insight.iconBg} shrink-0`}>
          <insight.icon className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-left">
          <h5 className="font-semibold text-xs uppercase tracking-wider font-display">
            {insight.title}
          </h5>
          <p className="text-xs leading-relaxed opacity-90">
            {insight.desc}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
