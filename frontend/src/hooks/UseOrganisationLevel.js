import { useEffect, useState } from 'react';

export const levels = [
  { level: 5, tier: 'veryHigh', minActions: 50000, fee: 35000 },
  { level: 4, tier: 'high', minActions: 25000, fee: 20000 },
  { level: 3, tier: 'medium', minActions: 10000, fee: 7500 },
  { level: 2, tier: 'low', minActions: 1000, fee: 2500 },
  { level: 1, tier: 'free', minActions: 0, fee: 0 },
];

export function useOrganisationLevel(completedActions) {
  const currentLevel = useGetLevel(completedActions);
  const [nextLevelThreshold, setNextLevelThreshold] = useState(1000);
  useEffect(() => {
    setNextLevelThreshold(
      currentLevel && currentLevel.level < 5
        ? levels.filter((item) => item.level === currentLevel.level + 1)[0].minActions
        : null,
    );
  }, [currentLevel]);
  return [currentLevel, nextLevelThreshold];
}

export function useGetLevel(actions) {
  const [currentLevel, setCurrentLevel] = useState(levels[levels.length - 1]);
  useEffect(() => {
    if (actions) {
      setCurrentLevel(levels.filter((level) => actions >= level.minActions)[0]);
    } else {
      setCurrentLevel(levels[levels.length - 1]);
    }
  }, [actions]);
  return currentLevel;
}

export function usePredictLevel(actions, type) {
  const newLevel = useGetLevel(actions);
  const [predictedLevel, setPredictedLevel] = useState(newLevel);

  useEffect(() => {
    if (type === 'DISCOUNTED') {
      const cost =
        newLevel.level > 1 ? levels.filter((item) => item.level === newLevel.level - 1)[0].fee : 0;
      setPredictedLevel({ ...newLevel, fee: cost });
    } else {
      setPredictedLevel(newLevel);
    }
  }, [type, newLevel]);
  return predictedLevel;
}
