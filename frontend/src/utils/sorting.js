export function compareTaskId(a, b) {
  if (a.properties.taskId > b.properties.taskId) return 1;
  if (b.properties.taskId > a.properties.taskId) return -1;
  return 0;
}

export function compareLastUpdate(a, b) {
  return new Date(b.properties.actionDate) - new Date(a.properties.actionDate);
}

export function compareHistoryLastUpdate(a, b) {
  return new Date(b.actionDate) - new Date(a.actionDate);
}

export function compareByPropertyDescending(a, b, property) {
  if (a[property] > b[property]) return -1;
  if (b[property] > a[property]) return 1;
  return 0;
}
