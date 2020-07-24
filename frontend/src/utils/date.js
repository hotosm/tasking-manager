export function getPastMonths(months) {
  let today = new Date();
  return today.setMonth(today.getMonth() - months);
}
