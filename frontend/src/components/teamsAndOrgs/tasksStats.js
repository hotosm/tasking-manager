import React, { Suspense, useState } from 'react';
import ReactPlaceholder from 'react-placeholder';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
import { useTagAPI } from '../../hooks/UseTagAPI';
import { useValidateDateRange } from '../../hooks/UseValidateDateRange';
import { formatFilterCountriesData } from '../../utils/countries';
import {
  ProjectFilterSelect,
  DateFilterPicker,
  DateRangeFilterSelect,
} from '../projects/filterSelectFields';
import { TasksStatsSummary } from './tasksStatsSummary';

const TasksStatsChart = React.lazy(() =>
  import('./tasksStatsChart' /* webpackChunkName: "taskStatsChart" */),
);

export const TasksStats = ({ query, setQuery, stats, error, loading, retryFn }) => {
  const [campaignAPIState] = useTagAPI([], 'campaigns');
  const [countriesAPIState] = useTagAPI([], 'countries', formatFilterCountriesData);
  const {
    startDate: startDateInQuery,
    endDate: endDateInQuery,
    campaign: campaignInQuery,
    location: countryInQuery,
  } = query;
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);

  const dateValidation = useValidateDateRange(query);

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
          setIsCustomDateRange={setIsCustomDateRange}
        />
        <DateFilterPicker
          fieldsetName="endDate"
          fieldsetStyle={`${fieldsetStyle} fl`}
          titleStyle={titleStyle}
          selectedValue={endDateInQuery}
          setQueryForChild={setQuery}
          allQueryParamsForChild={query}
          setIsCustomDateRange={setIsCustomDateRange}
        />
        <div className="w-60-l w-100 fl">
          <DateRangeFilterSelect
            fieldsetName="dateRange"
            fieldsetStyle={`${fieldsetStyle} w-20-ns w-100`}
            titleStyle={titleStyle}
            selectedValue={startDateInQuery}
            setQueryForChild={setQuery}
            allQueryParamsForChild={query}
            isCustomDateRange={isCustomDateRange}
            setIsCustomDateRange={setIsCustomDateRange}
            startDateInQuery={startDateInQuery}
            endDateInQuery={endDateInQuery}
          />
          <ProjectFilterSelect
            fieldsetName="campaign"
            fieldsetStyle={`${fieldsetStyle} w-30-ns w-100`}
            titleStyle={titleStyle}
            selectedTag={campaignInQuery}
            options={campaignAPIState}
            setQueryForChild={setQuery}
            allQueryParamsForChild={query}
          />
          <ProjectFilterSelect
            fieldsetName="location"
            fieldsetStyle={`${fieldsetStyle} w-30-ns w-100`}
            titleStyle={titleStyle}
            selectedTag={countryInQuery}
            options={countriesAPIState}
            setQueryForChild={setQuery}
            allQueryParamsForChild={query}
            payloadKey="value"
          />
        </div>
      </div>
      <ReactPlaceholder
        showLoadingAnimation={true}
        rows={26}
        ready={!loading}
        className="pv3 ph2 ph4-ns"
      >
        {!loading && error ? (
          <div className="bg-tan pa4">
            <FormattedMessage {...messages.errorLoadingStats} />
            <div className="pv3">
              {dateValidation && dateValidation.detail ? (
                <FormattedMessage {...messages[dateValidation.detail]} />
              ) : (
                <button className="pa1 pointer" onClick={() => retryFn()}>
                  <FormattedMessage {...messages.retry} />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="pt3 pb3 ph2 cf mr2 w-100 w-two-thirds-l">
              <Suspense fallback={<div>loading...</div>}>
                <TasksStatsChart stats={stats} />
              </Suspense>
            </div>
            <div className="cf w-100">
              <TasksStatsSummary stats={stats} />
            </div>
          </>
        )}
      </ReactPlaceholder>
    </>
  );
};
