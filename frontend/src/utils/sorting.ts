import { differenceInDays, differenceInHours, differenceInMilliseconds } from "date-fns";

export function compareTaskId(a: {
  properties: {
    taskId: number;
  }
}, b: {
  properties: {
    taskId: number;
  }
}) {
  if (a.properties.taskId > b.properties.taskId) return 1;
  if (b.properties.taskId > a.properties.taskId) return -1;
  return 0;
}

export function compareLastUpdate(a: {
  properties: {
    actionDate: string | number | Date;
  }
}, b: {
  properties: {
    actionDate: string | number | Date;
  }
}) {
  return differenceInMilliseconds(new Date(b.properties.actionDate), new Date(a.properties.actionDate))
}

export function compareHistoryLastUpdate(a: {
  actionDate: string | number | Date;
}, b: {
  actionDate: string | number | Date;
}) {
  return differenceInMilliseconds(new Date(b.actionDate), new Date(a.actionDate));
}

export function compareByPropertyDescending(a: any[], b: any[], property: any) {
  if (a[property] > b[property]) return -1;
  if (b[property] > a[property]) return 1;
  return 0;
}
