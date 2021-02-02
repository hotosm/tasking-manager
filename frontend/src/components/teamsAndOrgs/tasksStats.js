import React from 'react';
import { Bar } from 'react-chartjs-2';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { CHART_COLOURS } from '../../config';
import { useTagAPI } from '../../hooks/UseTagAPI';
import { formatFilterCountriesData } from '../../utils/countries';
import { formatTasksStatsData, formatTimelineTooltip } from '../../utils/formatChartJSData';
import { ProjectFilterSelect, DateFilterPicker } from '../projects/filterSelectFields';
import { TasksStatsSummary } from './tasksStatsSummary';

const TasksStats = ({ query, setQuery, stats, error, retryFn }) => {
  const [campaignAPIState] = useTagAPI([], 'campaigns');
  const [countriesAPIState] = useTagAPI([], 'countries', formatFilterCountriesData);
  const {
    startDate: startDateInQuery,
    endDate: endDateInQuery,
    campaign: campaignInQuery,
    location: countryInQuery,
  } = query;

  const fieldsetStyle = 'bn dib pv0-ns pv2 ph2-ns ph1 mh0 mb1';
  const titleStyle = 'dib ttu fw5 blue-grey mb1';

  return (
    <>
      <div className="w-100 cf flex flex-wrap">
        <DateFilterPicker
          fieldsetName="startDate"
          fieldsetStyle={`${fieldsetStyle} fl`}
          titleStyle={titleStyle}
          selectedValue={startDateInQuery}
          setQueryForChild={setQuery}
          allQueryParamsForChild={query}
        />
        <DateFilterPicker
          fieldsetName="endDate"
          fieldsetStyle={`${fieldsetStyle} fl`}
          titleStyle={titleStyle}
          selectedValue={endDateInQuery}
          setQueryForChild={setQuery}
          allQueryParamsForChild={query}
        />
        <div className="w-40-l w-100 fl">
          <ProjectFilterSelect
            fieldsetName="campaign"
            fieldsetStyle={`${fieldsetStyle} w-50-ns w-100`}
            titleStyle={titleStyle}
            selectedTag={campaignInQuery}
            options={campaignAPIState}
            setQueryForChild={setQuery}
            allQueryParamsForChild={query}
          />
          <ProjectFilterSelect
            fieldsetName="location"
            fieldsetStyle={`${fieldsetStyle} w-50-ns w-100`}
            titleStyle={titleStyle}
            selectedTag={countryInQuery}
            options={countriesAPIState}
            setQueryForChild={setQuery}
            allQueryParamsForChild={query}
          />
        </div>
      </div>
      {error ? (
        <div className="bg-tan pa4">
          <FormattedMessage {...messages.errorLoadingStats} />
          <div className="pv3">
            <button className="pa1" onClick={() => retryFn()}>
              <FormattedMessage {...messages.retry} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="pt3 pb3 ph2 cf w-100 w-two-thirds-l">
            <TasksStatsChart stats={stats} />
          </div>
          <div className="cf w-100">
            <TasksStatsSummary stats={stats} />
          </div>
        </>
      )}
    </>
  );
};

const TasksStatsChart = ({ stats }) => {
  const options = {
    legend: { position: 'top', align: 'end', labels: { boxWidth: 12 } },
    tooltips: {
      callbacks: { label: (tooltip, data) => formatTimelineTooltip(tooltip, data, false) },
    },
    scales: {
      yAxes: [
        {
          stacked: true,
          ticks: {
            beginAtZero: true,
          },
        },
      ],
      xAxes: [
        {
          stacked: true,
        },
      ],
    },
  };
  return (
    <Bar
      data={formatTasksStatsData(stats, CHART_COLOURS.orange, CHART_COLOURS.red)}
      options={options}
    />
  );
};

export default TasksStats;
