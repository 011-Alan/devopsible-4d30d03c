import { useState, useEffect } from "react";

export type LevelProgress = {
  status: "locked" | "unlocked" | "in_progress" | "completed";
  earnedXp: number;
};

export type UserProgress = {
  operatorLevel: number;
  totalXp: number;
  missionsCleared: number;
  badges: string[];
  git: {
    levels: Record<number, LevelProgress>;
    earnedXp: number;
  };
  jenkins: {
    levels: Record<number, LevelProgress>;
    earnedXp: number;
  };
  docker: {
    levels: Record<number, LevelProgress>;
    earnedXp: number;
  };
  kubernetes: {
    levels: Record<number, LevelProgress>;
    earnedXp: number;
  };
};

const STORAGE_KEY = "devopsible.progress.v3";

export const INITIAL_PROGRESS: UserProgress = {
  operatorLevel: 1,
  totalXp: 80,
  missionsCleared: 1,
  badges: ["Cluster Recruit"],
  git: {
    earnedXp: 0,
    levels: {
      1: { status: "in_progress", earnedXp: 0 },
      2: { status: "locked", earnedXp: 0 },
      3: { status: "locked", earnedXp: 0 },
      4: { status: "locked", earnedXp: 0 },
      5: { status: "locked", earnedXp: 0 },
      6: { status: "locked", earnedXp: 0 },
      7: { status: "locked", earnedXp: 0 },
      8: { status: "locked", earnedXp: 0 },
    },
  },
  jenkins: {
    earnedXp: 0,
    levels: {
      1: { status: "unlocked", earnedXp: 0 },
      2: { status: "locked", earnedXp: 0 },
      3: { status: "locked", earnedXp: 0 },
      4: { status: "locked", earnedXp: 0 },
      5: { status: "locked", earnedXp: 0 },
      6: { status: "locked", earnedXp: 0 },
      7: { status: "locked", earnedXp: 0 },
      8: { status: "locked", earnedXp: 0 },
      9: { status: "locked", earnedXp: 0 },
      10: { status: "locked", earnedXp: 0 },
    },
  },
  docker: {
    earnedXp: 0,
    levels: {
      1: { status: "in_progress", earnedXp: 0 },
      2: { status: "locked", earnedXp: 0 },
      3: { status: "locked", earnedXp: 0 },
      4: { status: "locked", earnedXp: 0 },
      5: { status: "locked", earnedXp: 0 },
      6: { status: "locked", earnedXp: 0 },
      7: { status: "locked", earnedXp: 0 },
      8: { status: "locked", earnedXp: 0 },
    },
  },
  kubernetes: {
    earnedXp: 80,
    levels: {
      1: { status: "completed", earnedXp: 80 },
      2: { status: "unlocked", earnedXp: 0 },
      3: { status: "locked", earnedXp: 0 },
      4: { status: "locked", earnedXp: 0 },
      5: { status: "locked", earnedXp: 0 },
      6: { status: "locked", earnedXp: 0 },
      7: { status: "locked", earnedXp: 0 },
      8: { status: "locked", earnedXp: 0 },
      9: { status: "locked", earnedXp: 0 },
    },
  },
};

export function loadUserProgress(): UserProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.docker && parsed.kubernetes) {
        return {
          ...INITIAL_PROGRESS,
          ...parsed,
          git: parsed.git || INITIAL_PROGRESS.git,
          jenkins: parsed.jenkins || INITIAL_PROGRESS.jenkins,
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse user progress", e);
  }
  return INITIAL_PROGRESS;
}

export function saveUserProgress(progress: UserProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("devopsible:progress_updated"));
  } catch (e) {
    console.error("Failed to save progress", e);
  }
}

export function useUserProgress() {
  const [progress, setProgressState] = useState<UserProgress>(loadUserProgress);

  useEffect(() => {
    const listener = () => {
      setProgressState(loadUserProgress());
    };
    window.addEventListener("devopsible:progress_updated", listener);
    return () => window.removeEventListener("devopsible:progress_updated", listener);
  }, []);

  const awardLevelCompletion = (
    path: "git" | "jenkins" | "docker" | "kubernetes",
    levelId: number,
    xpAwarded: number,
    badgeName: string
  ) => {
    const current = loadUserProgress();
    const pathState = current[path];
    const prevEarned = pathState.levels[levelId]?.earnedXp || 0;
    const isFirstTime = pathState.levels[levelId]?.status !== "completed";

    const newXpDiff = isFirstTime ? xpAwarded : Math.max(0, xpAwarded - prevEarned);
    const newTotalXp = current.totalXp + newXpDiff;
    const newOperatorLevel = Math.max(1, Math.floor(newTotalXp / 1000) + 1);

    const nextLevelId = levelId + 1;
    const maxLevel = path === "git" ? 8 : path === "jenkins" ? 10 : path === "docker" ? 8 : 9;

    const updatedLevels = { ...pathState.levels };
    updatedLevels[levelId] = {
      status: "completed",
      earnedXp: Math.max(prevEarned, xpAwarded),
    };

    if (nextLevelId <= maxLevel && updatedLevels[nextLevelId]?.status === "locked") {
      updatedLevels[nextLevelId] = { status: "unlocked", earnedXp: 0 };
    }

    const updatedBadges = current.badges.includes(badgeName)
      ? current.badges
      : [...current.badges, badgeName];

    const missionsCleared =
      Object.values(current.git?.levels || {}).filter((l) => l.status === "completed").length +
      Object.values(current.jenkins?.levels || {}).filter((l) => l.status === "completed").length +
      Object.values(current.docker.levels).filter((l) => l.status === "completed").length +
      Object.values(current.kubernetes.levels).filter((l) => l.status === "completed").length +
      (isFirstTime ? 1 : 0);

    const nextProgress: UserProgress = {
      ...current,
      totalXp: newTotalXp,
      operatorLevel: newOperatorLevel,
      missionsCleared,
      badges: updatedBadges,
      [path]: {
        earnedXp: Object.values(updatedLevels).reduce((acc, l) => acc + l.earnedXp, 0),
        levels: updatedLevels,
      },
    };

    saveUserProgress(nextProgress);
    setProgressState(nextProgress);
  };

  const resetProgress = () => {
    saveUserProgress(INITIAL_PROGRESS);
    setProgressState(INITIAL_PROGRESS);
  };

  return { progress, awardLevelCompletion, resetProgress };
}
