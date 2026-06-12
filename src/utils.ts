/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayStatus, DayLog, GoalsLogMap, YearStats, Achievement } from "./types.ts";

/**
 * Checks if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Formats a Date object to "YYYY-MM-DD" in the local timezone.
 */
export function formatDateString(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats minutes into "Xh Ym" or just "Ym" or "0m"
 */
export function formatDuration(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Returns all dates in a year from Jan 1st to Dec 31st as date strings.
 */
export function getAllDatesInYear(year: number): string[] {
  const dates: string[] = [];
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const tempDate = new Date(startDate);

  while (tempDate <= endDate) {
    dates.push(formatDateString(tempDate));
    // Move to next day
    tempDate.setDate(tempDate.getDate() + 1);
  }
  return dates;
}

/**
 * Organizes days into grids for the 53-week view:
 * A matrix representing rows of weekdays (0 = Sunday ... 6 = Saturday) and columns of calendar weeks.
 */
export interface HeatmapCell {
  dateString: string;
  date: Date;
  isCurrentYear: boolean;
}

export function generateYearHeatmapCells(year: number): HeatmapCell[][] {
  const columns: HeatmapCell[][] = [];
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);

  // We want to align the grid starting on Sunday (or Monday). Let's go Sunday-based as is standard.
  // We'll fill cells for the weeks of the year.
  // First column starts with Sunday of the week containing Jan 1st.
  const firstGridDay = new Date(jan1);
  firstGridDay.setDate(firstGridDay.getDate() - firstGridDay.getDay()); // subtract day index to get Sunday

  const lastGridDay = new Date(dec31);
  lastGridDay.setDate(lastGridDay.getDate() + (6 - lastGridDay.getDay())); // add days to get Saturday

  const tempDate = new Date(firstGridDay);
  let currentWeek: HeatmapCell[] = [];

  while (tempDate <= lastGridDay) {
    const isCurrentYear = tempDate.getFullYear() === year;
    currentWeek.push({
      dateString: formatDateString(tempDate),
      date: new Date(tempDate),
      isCurrentYear,
    });

    if (currentWeek.length === 7) {
      columns.push(currentWeek);
      currentWeek = [];
    }

    tempDate.setDate(tempDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    columns.push(currentWeek);
  }

  return columns;
}

/**
 * Generates highly realistic, beautiful dummy data for previewing.
 * Includes clusters of successes, occasional failures, and varying focus times.
 */
export function generateSampleData(year: number): GoalsLogMap {
  const map: GoalsLogMap = {};
  const today = new Date();
  const todayStr = formatDateString(today);
  const dates = getAllDatesInYear(year);

  // Find index of today
  const todayIdx = dates.indexOf(todayStr);
  const limitIdx = todayIdx !== -1 ? todayIdx : dates.length - 1;

  // We will pre-populate from Jan 1st of "year" up to "today" with ~85% density
  const sampleNotes = [
    "Practiced algorithms for 2 hours",
    "Completed React routing tutorial",
    "Reviewed database schemas and optimized index queries",
    "Focussed session on vector graphics and CSS layouts",
    "Read 3 chapters of System Design blueprint",
    "Fixed core bugs and committed to git branch",
    "Refactored state manager and split files for modularity",
    "Attended coding seminar and practiced design patterns",
    "Pair programming on real-time websockets",
    "Spent hours writing unit tests and debugging handlers",
  ];

  const skipNotes = [
    "Felt extremely exhausted after work",
    "Family gathering, took a break",
    "Traveled for holiday",
    "Sick leave today",
    "Social outing and caught up on chores",
  ];

  for (let i = 0; i <= limitIdx; i++) {
    const ds = dates[i];
    // Probability of logging: 92%
    if (Math.random() > 0.08) {
      // 70% success, 25% fail, 5% unmarked
      const rand = Math.random();
      let status = DayStatus.SUCCESS;
      let focusHours = 0;
      let focusMinutes = 0;
      let notes = "";

      if (rand < 0.70) {
        status = DayStatus.SUCCESS;
        // Success days generally have higher focus: 2 to 6 hours
        focusHours = Math.floor(Math.random() * 5) + 2;
        focusMinutes = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        notes = sampleNotes[Math.floor(Math.random() * sampleNotes.length)];
      } else if (rand < 0.95) {
        status = DayStatus.FAILED;
        // Failed days either have 0 focus or small amount: 0 to 1 hour
        focusHours = Math.floor(Math.random() * 2);
        focusMinutes = Math.floor(Math.random() * 4) * 15;
        notes = skipNotes[Math.floor(Math.random() * skipNotes.length)];
      } else {
        status = DayStatus.UNMARKED;
      }

      map[ds] = {
        dateString: ds,
        status,
        focusHours,
        focusMinutes,
        notes,
      };
    }
  }

  return map;
}

/**
 * Calculates comprehensive analytics for the recorded days map in a given year.
 */
export function calculateYearStats(map: GoalsLogMap, year: number): YearStats {
  const dates = getAllDatesInYear(year);
  const today = new Date();
  const todayStr = formatDateString(today);

  let totalFocusMinutes = 0;
  let successCount = 0;
  let failCount = 0;
  let passedDaysCount = 0;

  // Track streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Let's sweep chronological dates up to today to compute stats and streaks
  const todayIdx = dates.indexOf(todayStr);
  const lastActiveIdx = todayIdx !== -1 ? todayIdx : dates.length - 1;

  for (let i = 0; i < dates.length; i++) {
    const ds = dates[i];
    const log = map[ds];
    const isPassed = i <= lastActiveIdx;

    if (isPassed) {
      passedDaysCount++;
    }

    if (log) {
      const minutes = log.focusHours * 60 + log.focusMinutes;
      totalFocusMinutes += minutes;

      if (log.status === DayStatus.SUCCESS) {
        successCount++;
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      } else if (log.status === DayStatus.FAILED) {
        failCount++;
        tempStreak = 0; // Break streak
      } else {
        // UNMARKED doesn't break streak, or does it? Customarily we break on failure but let's break streak on any day with status UNMARKED too if it's in the past
        tempStreak = 0;
      }
    } else {
      // No log means neutral, break the active streak if it's chronologically in the past
      if (isPassed) {
        tempStreak = 0;
      }
    }
  }

  // Calculate current streak by going backwards starting from today
  let currentStreakDateIdx = lastActiveIdx;
  let calculatedCurrentStreak = 0;
  while (currentStreakDateIdx >= 0) {
    const ds = dates[currentStreakDateIdx];
    const log = map[ds];
    if (log && log.status === DayStatus.SUCCESS) {
      calculatedCurrentStreak++;
    } else if (log && log.status === DayStatus.UNMARKED) {
      // if today has no status yet, users shouldn't break the streak immediately
      if (currentStreakDateIdx === lastActiveIdx) {
        // just skip today, don't break yet
      } else {
        break; // break streak backward
      }
    } else {
      // FAILED or missing log breaks the backward streak
      break;
    }
    currentStreakDateIdx--;
  }

  currentStreak = calculatedCurrentStreak;

  // Ensure overall streaks make logical sense
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  const loggedPassedDaysCount = Object.keys(map).filter(key => {
    const idx = dates.indexOf(key);
    return idx !== -1 && idx <= lastActiveIdx;
  }).length;

  const avgFocusMinutesPerPassedDay = loggedPassedDaysCount > 0 
    ? Math.round(totalFocusMinutes / loggedPassedDaysCount) 
    : 0;

  const totalLogged = successCount + failCount;
  const successRate = totalLogged > 0 ? Math.round((successCount / totalLogged) * 100) : 0;
  const failRate = totalLogged > 0 ? Math.round((failCount / totalLogged) * 100) : 0;
  const unmarkedRate = totalLogged > 0 ? Math.max(0, 100 - successRate - failRate) : 100;

  return {
    totalFocusMinutes,
    avgFocusMinutesPerPassedDay,
    successCount,
    failCount,
    passedDaysCount,
    currentStreak,
    longestStreak,
    successRate,
    failRate,
    unmarkedRate,
  };
}

/**
 * Extracts average focus duration per weekday name ("Monday", "Tuesday", etc.)
 */
export function calculateWeekdayFocusStats(map: Record<string, DayLog>): { dayName: string; avgHours: number }[] {
  const counts: Record<string, { totalMinutes: number; count: number }> = {
    "Sunday": { totalMinutes: 0, count: 0 },
    "Monday": { totalMinutes: 0, count: 0 },
    "Tuesday": { totalMinutes: 0, count: 0 },
    "Wednesday": { totalMinutes: 0, count: 0 },
    "Thursday": { totalMinutes: 0, count: 0 },
    "Friday": { totalMinutes: 0, count: 0 },
    "Saturday": { totalMinutes: 0, count: 0 },
  };

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  Object.values(map).forEach((log) => {
    const parts = log.dateString.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const dayName = weekdays[d.getDay()];
    const mins = log.focusHours * 60 + log.focusMinutes;
    if (counts[dayName] && mins > 0) {
      counts[dayName].totalMinutes += mins;
      counts[dayName].count += 1;
    }
  });

  return weekdays.map((name) => {
    const group = counts[name];
    const avgMins = group.count > 0 ? group.totalMinutes / group.count : 0;
    const avgHours = Math.round((avgMins / 60) * 10) / 10; // decimal rounded to tenth
    return {
      dayName: name.substring(0, 3) + ".", // "Mon.", "Tue."
      avgHours,
    };
  });
}

/**
 * Computes dynamic achievement progress and unlock states based on focus logs.
 */
export function calculateAchievements(map: GoalsLogMap, stats: YearStats, year: number): Achievement[] {
  // 1. Perfect Week
  const weekStreakUnlocked = stats.longestStreak >= 7;
  const weekStreakProgress = Math.min(100, Math.round((stats.longestStreak / 7) * 105)); // Slight cosmetic push/visual cap or math
  const cappedWeekProgress = Math.min(100, Math.round((stats.longestStreak / 7) * 100));

  // 2. 30-Day Elite
  const thirtyStreakUnlocked = stats.longestStreak >= 30;
  const thirtyStreakProgress = Math.min(100, Math.round((stats.longestStreak / 30) * 100));

  // 3. Monthly Maestro (80% success rate in any calendar month with min 8 logged days)
  const monthLogsCount: Record<string, { total: number; success: number }> = {};
  for (let m = 1; m <= 12; m++) {
    const key = String(m).padStart(2, '0');
    monthLogsCount[key] = { total: 0, success: 0 };
  }
  
  Object.values(map).forEach(log => {
    const parts = log.dateString.split("-");
    const logYear = parseInt(parts[0]);
    const logMonth = parts[1];
    
    if (logYear === year) {
      if (log.status === DayStatus.SUCCESS || log.status === DayStatus.FAILED) {
        if (monthLogsCount[logMonth]) {
          monthLogsCount[logMonth].total += 1;
          if (log.status === DayStatus.SUCCESS) {
            monthLogsCount[logMonth].success += 1;
          }
        }
      }
    }
  });

  let maxMonthSuccessRate = 0;
  let hasQualifyingMonth = false;

  for (let m = 1; m <= 12; m++) {
    const key = String(m).padStart(2, '0');
    const data = monthLogsCount[key];
    if (data.total > 0) {
      const rate = Math.round((data.success / data.total) * 100);
      if (data.total >= 8) {
        if (rate > maxMonthSuccessRate) {
          maxMonthSuccessRate = rate;
        }
        if (rate >= 80) {
          hasQualifyingMonth = true;
        }
      } else {
        // Approximate virtual progress rate when logs are fewer than 8
        const weightedRate = Math.round(rate * (data.total / 8));
        if (weightedRate > maxMonthSuccessRate) {
          maxMonthSuccessRate = weightedRate;
        }
      }
    }
  }

  const monthlyUnlocked = hasQualifyingMonth;
  const monthlyProgress = monthlyUnlocked ? 100 : Math.min(99, Math.round((maxMonthSuccessRate / 80) * 100));

  // 4. Weekend Warrior (10 successful Saturday/Sunday runs)
  let weekendSuccesses = 0;
  Object.values(map).forEach(log => {
    const parts = log.dateString.split("-");
    const logYear = parseInt(parts[0]);
    if (logYear === year && log.status === DayStatus.SUCCESS) {
      const d = new Date(logYear, parseInt(parts[1]) - 1, parseInt(parts[2]));
      const day = d.getDay();
      if (day === 0 || day === 6) {
        weekendSuccesses++;
      }
    }
  });

  const weekendUnlocked = weekendSuccesses >= 10;
  const weekendProgress = Math.min(100, Math.round((weekendSuccesses / 10) * 100));

  // 5. Deep Focus Master (50 hours / 3000 mins)
  const focusMasterUnlocked = stats.totalFocusMinutes >= 3000;
  const focusMasterProgress = Math.min(100, Math.round((stats.totalFocusMinutes / 3000) * 100));

  // 6. Habit Heavyweight (100 successful focus sessions)
  const habitHeavyweightUnlocked = stats.successCount >= 100;
  const habitHeavyweightProgress = Math.min(100, Math.round((stats.successCount / 100) * 100));

  return [
    {
      id: "perfect_week",
      title: "Perfect Week",
      description: "Complete 7 consecutive successful goal days.",
      badgeName: "7D STREAK",
      category: "streak",
      unlocked: weekStreakUnlocked,
      progress: cappedWeekProgress,
      currentValue: stats.longestStreak,
      targetValue: 7,
      unit: "days",
      rewardVibe: "indigo"
    },
    {
      id: "thirty_day_elite",
      title: "Discipline Elite",
      description: "Complete 30 consecutive successful goal days.",
      badgeName: "30D STREAK",
      category: "streak",
      unlocked: thirtyStreakUnlocked,
      progress: thirtyStreakProgress,
      currentValue: stats.longestStreak,
      targetValue: 30,
      unit: "days",
      rewardVibe: "amber"
    },
    {
      id: "monthly_maestro",
      title: "Monthly Maestro",
      description: "Maintain >=80% success in any calendar month (min. 8 logs).",
      badgeName: "80% SUCCESS",
      category: "consistency",
      unlocked: monthlyUnlocked,
      progress: monthlyProgress,
      currentValue: monthlyUnlocked ? 100 : Math.min(100, maxMonthSuccessRate),
      targetValue: 80,
      unit: "% success",
      rewardVibe: "emerald"
    },
    {
      id: "weekend_warrior",
      title: "Weekend Warrior",
      description: "Achieve success on 10 weekend days (Sat or Sun).",
      badgeName: "WEEKEND HERO",
      category: "weekend",
      unlocked: weekendUnlocked,
      progress: weekendProgress,
      currentValue: weekendSuccesses,
      targetValue: 10,
      unit: "weekends",
      rewardVibe: "rose"
    },
    {
      id: "deep_focus_master",
      title: "Deep Focus Master",
      description: "Accumulate 50 hours of total focused session time.",
      badgeName: "50H FOCUS",
      category: "volume",
      unlocked: focusMasterUnlocked,
      progress: focusMasterProgress,
      currentValue: Math.round(stats.totalFocusMinutes / 60),
      targetValue: 50,
      unit: "hrs",
      rewardVibe: "cyan"
    },
    {
      id: "habit_heavyweight",
      title: "Habit Heavyweight",
      description: "Amass a total of 100 successful focus days.",
      badgeName: "CENTURY CLUB",
      category: "consistency",
      unlocked: habitHeavyweightUnlocked,
      progress: habitHeavyweightProgress,
      currentValue: stats.successCount,
      targetValue: 100,
      unit: "days",
      rewardVibe: "purple"
    }
  ];
}

