import { enUS } from 'date-fns/locale';
import { formatISO } from 'date-fns';
/**
 * x axis configuration common between this and {@link ../projectDetail/timeline.js}
 * @param unit The base unit for the axis
 * @typedef {import('chart.js').ScaleOptionsByType} ScaleOptionsByType
 * @returns {ScaleOptionsByType} The options to use for x axis configuration
 */
function xAxisTimeSeries(unit) {
  return {
    type: 'timeseries',
    adapters: { date: { locale: enUS } },
    time: {
      unit: unit,
      tooltipFormat: enUS.formatLong.date,
    },
    ticks: {
      source: 'labels',
      callback: (value, index, ticks) => formatISO(ticks[index].value, { representation: 'date' }),
    },
  };
}

export { xAxisTimeSeries };
