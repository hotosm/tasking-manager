import { enUS } from 'date-fns/locale';
import { formatISO } from 'date-fns';
import type { ScaleOptionsByType, TimeUnit } from "chart.js";

function xAxisTimeSeries(unit: TimeUnit) {
  return {
    type: 'timeseries',
    adapters: { date: { locale: enUS } },
    time: {
      unit: unit,
      tooltipFormat: enUS.formatLong.date({}),
    },
    ticks: {
      source: 'labels',
      callback: (value, index, ticks) => formatISO(ticks[index].value, { representation: 'date' }),
    },
  } satisfies ScaleOptionsByType;
}

export { xAxisTimeSeries };
