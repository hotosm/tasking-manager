import { useCallback } from 'react';

const useGetContributors = (history: {
  taskHistory: { usernames: string[]; actionBy: string }[];
}) => {
  const getContributors = useCallback(() => {
    if (history && history.taskHistory && history.taskHistory.length) {
      return history.taskHistory.reduce<string[]>((usernames, item) => {
        if (!usernames.includes(item.actionBy)) {
          usernames.push(item.actionBy);
        }
        return usernames;
      }, []);
    } else {
      return [];
    }
  }, [history]);
  return getContributors;
};

export default useGetContributors;
