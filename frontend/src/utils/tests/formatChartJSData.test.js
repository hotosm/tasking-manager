import { formatChartData, formatTimelineData } from '../formatChartJSData';
import { CHART_COLOURS } from '../../config';
import { projectContributionsByDay } from '../../network/tests/mockData/contributions';

describe('formatChartData', () => {
  let reference = [
    { label: 'Building', field: 'total_building_count_add', backgroundColor: CHART_COLOURS.red },
    { label: 'Roads', field: 'total_road_km_add', backgroundColor: CHART_COLOURS.green },
    {
      label: 'Points of interests',
      field: 'total_poi_count_add',
      backgroundColor: CHART_COLOURS.orange,
    },
    { label: 'Waterways', field: 'total_waterway_count_add', backgroundColor: CHART_COLOURS.blue },
  ];
  const stats = {
    total_building_count_add: 40,
    total_road_km_add: 60,
    total_poi_count_add: 17,
    total_waterway_count_add: 83,
  };

  it('return the correct information', () => {
    expect(formatChartData(reference, stats)).toEqual({
      datasets: [
        {
          data: [20, 30, 9, 42],
          backgroundColor: [
            CHART_COLOURS.red,
            CHART_COLOURS.green,
            CHART_COLOURS.orange,
            CHART_COLOURS.blue,
          ],
        },
      ],
      labels: ['Building', 'Roads', 'Points of interests', 'Waterways'],
    });
  });
});

describe('formatTimelineData', () => {
  it('return the correct information about the datasets', () => {
    expect(formatTimelineData(projectContributionsByDay.stats, '#fff', '#092')).toEqual({
      datasets: [
        {
          data: [0, 6, 19],
          backgroundColor: '#092',
          borderColor: '#092',
          fill: false,
          label: 'Validated tasks',
        },
        {
          data: [6, 13, 31],
          backgroundColor: '#fff',
          borderColor: '#fff',
          fill: false,
          label: 'Mapped tasks',
        },
      ],
      labels: ['2020-05-19', '2020-06-01', '2020-06-26'],
    });
  });
});
