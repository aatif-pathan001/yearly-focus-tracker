/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum DayStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  UNMARKED = "UNMARKED"
}

export interface DayLog {
  dateString: string; // Format: "YYYY-MM-DD"
  status: DayStatus;
  focusHours: number; // duration in hours (0-24)
  focusMinutes: number; // duration in minutes (0-59)
  notes?: string; // Optional quick note about the day's goals
}

export type GoalsLogMap = Record<string, DayLog>;

export interface YearStats {
  totalFocusMinutes: number;
  avgFocusMinutesPerPassedDay: number;
  successCount: number;
  failCount: number;
  passedDaysCount: number;
  currentStreak: number;
  longestStreak: number;
  successRate: number; // Percentage
  failRate: number; // Percentage
  unmarkedRate: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badgeName: string;
  category: "streak" | "consistency" | "volume" | "weekend";
  unlocked: boolean;
  progress: number; // 0 to 100
  currentValue: number;
  targetValue: number;
  unit: string;
  rewardVibe: string; // e.g. 'emerald', 'indigo', 'amber', 'rose', 'cyan'
}

