export function compareTaskId(a, b) {
  if (a.taskId > b.taskId) return 1;
  if (b.taskId > a.taskId) return -1;
  return 0;
}

export function compareLastUpdate(a, b) {
  return new Date(b.actionDate) - new Date(a.actionDate);
}
