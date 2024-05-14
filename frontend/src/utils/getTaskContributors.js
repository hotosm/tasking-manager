export const getTaskContributors = (taskHistory, usernameToExclude) =>
  taskHistory.reduce((acc, history) => {
    if (!acc.includes(history.actionBy) && history.actionBy !== usernameToExclude) {
      acc.push(history.actionBy);
    }
    return acc.sort();
  }, []);
