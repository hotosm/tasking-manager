// this code is an adaptation of https://www.npmjs.com/package/@formatjs/intl-utils

var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };

const MS_PER_SECOND = 1e3;
const SECS_PER_MIN = 60;
const SECS_PER_HOUR = SECS_PER_MIN * 60;
const SECS_PER_DAY = SECS_PER_HOUR * 24;
const SECS_PER_WEEK = SECS_PER_DAY * 7;
const DEFAULT_THRESHOLDS = {
  second: 45,
  minute: 45,
  hour: 23,
  day: 7,
};

export function selectUnit(from, to, thresholds) {
  if (to === void 0) {
    to = Date.now();
  }
  if (thresholds === void 0) {
    thresholds = {};
  }
  const resolvedThresholds = __assign(__assign({}, DEFAULT_THRESHOLDS), thresholds || {});
  const secs = (+from - +to) / MS_PER_SECOND;
  if (Math.abs(secs) < resolvedThresholds.second) {
    return {
      value: Math.round(secs),
      unit: 'second',
    };
  }
  const mins = secs / SECS_PER_MIN;
  if (Math.abs(mins) < resolvedThresholds.minute) {
    return {
      value: Math.round(mins),
      unit: 'minute',
    };
  }
  const hours = secs / SECS_PER_HOUR;
  if (Math.abs(hours) < resolvedThresholds.hour) {
    return {
      value: Math.round(hours),
      unit: 'hour',
    };
  }
  const days = secs / SECS_PER_DAY;
  if (Math.abs(days) < resolvedThresholds.day) {
    return {
      value: Math.round(days),
      unit: 'day',
    };
  }
  const weeks = secs / SECS_PER_WEEK;
  const years = weeks / 52;
  if (Math.abs(years) >= 1) {
    return {
      value: Math.round(years),
      unit: 'year',
    };
  }
  const months = days / 30;
  if (Math.round(Math.abs(weeks)) > 4) {
    return {
      value: Math.round(months),
      unit: 'month',
    };
  }
  return {
    value: Math.round(weeks),
    unit: 'week',
  };
}
