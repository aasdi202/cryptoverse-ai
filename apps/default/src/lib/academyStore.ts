import { create } from 'zustand';

interface AcademyState {
  totalXP: number;
  completedLessons: Set<string>;
  awardXP: (lessonId: string, xp: number) => void;
}

export const useAcademyStore = create<AcademyState>((set, get) => ({
  // Start at 1 250 XP so the first two modules are accessible by default
  totalXP: 1250,
  completedLessons: new Set<string>(['l1', 'l4']),

  awardXP: (lessonId: string, xp: number) => {
    const { completedLessons, totalXP } = get();
    // Idempotent — only award XP once per lesson
    if (completedLessons.has(lessonId)) return;
    set({
      totalXP: totalXP + xp,
      completedLessons: new Set([...completedLessons, lessonId]),
    });
  },
}));
