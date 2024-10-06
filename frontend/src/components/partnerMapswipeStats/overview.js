import { FormattedMessage, FormattedNumber } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactPlaceholder from 'react-placeholder';
import shortNumber from 'short-number';
import { intervalToDuration } from 'date-fns';

import messages from './messages';
import { PeopleIcon, SwipeIcon, ClockIcon } from '../svgIcons';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

const iconClass = 'w-100 red';
const iconStyle = { height: '70px' };

const OverviewPlaceholder = () => (
  <div
    className="flex justify-between items-center flex-wrap flex-nowrap-ns"
    style={{ gap: '1.6rem' }}
  >
    <ReactPlaceholder type="rect" style={{ width: '100%', height: 180 }} showLoadingAnimation />
    <ReactPlaceholder type="rect" style={{ width: '100%', height: 180 }} showLoadingAnimation />
    <ReactPlaceholder type="rect" style={{ width: '100%', height: 180 }} showLoadingAnimation />
  </div>
);

export const formatSecondsToTwoUnits = (seconds) => {
  const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
  const units = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];

  // Filter units that have a value greater than 0
  const nonZeroUnits = units.filter((unit) => duration[unit] > 0).slice(0, 2);

  return nonZeroUnits
    .map((unit) => `${duration[unit]} ${duration[unit] === 1 ? unit.slice(0, -1) : unit}`)
    .join(' ');
};

export const getShortNumber = (value) => {
  const shortNumberValue = shortNumber(value);

  return typeof shortNumberValue === 'number' ? (
    <FormattedNumber value={shortNumberValue} />
  ) : (
    <span>
      <FormattedNumber value={Number(shortNumberValue.substr(0, shortNumberValue.length - 1))} />
      {shortNumberValue.substr(-1)}
    </span>
  );
};

export const Overview = () => {
  const { id: partnerPermalink } = useParams();

  const { isLoading, data, isRefetching } = useQuery({
    queryKey: ['partners-mapswipe-general-statistics', partnerPermalink],
    queryFn: async () => {
      const response = await fetchLocalJSONAPI(
        `partners/${partnerPermalink}/general-statistics/?limit=0`,
      );
      return response;
    },
  });

  return (
    <ReactPlaceholder
      customPlaceholder={<OverviewPlaceholder />}
      ready={!isLoading && !isRefetching}
    >
      <div
        className="flex justify-between items-stretch flex-wrap flex-nowrap-ns"
        style={{ gap: '1.6rem' }}
      >
        <div
          className="pa4 flex items-center bg-white shadow-6 w-100 bb b--red bw2"
          style={{ gap: '1.75rem' }}
        >
          <div>
            <SwipeIcon className={iconClass} style={iconStyle} />
          </div>
          <div className="flex flex-column" style={{ gap: '0.5rem' }}>
            <h3 className="ma0 f1 fw6 red barlow-condensed">
              {data?.totalcontributions ? getShortNumber(data.totalcontributions) : '-'}
            </h3>
            <span className="ma0 h2 f3 fw7 silver barlow-condensed mb1">
              <FormattedMessage {...messages.totalSwipes} />
            </span>

            {data?.totalRecentcontributions ? (
              <span className="blue-grey f6 fw4">
                <b>{getShortNumber(data.totalRecentcontributions)}</b>{' '}
                <FormattedMessage {...messages.recentTotalSwipesText} />
              </span>
            ) : (
              '-'
            )}
          </div>
        </div>

        <div
          className="pa4 flex items-center bg-white shadow-6 w-100 bb b--red bw2"
          style={{ gap: '1.75rem' }}
        >
          <div>
            <ClockIcon className={iconClass} style={iconStyle} />
          </div>
          <div className="flex flex-column" style={{ gap: '0.5rem' }}>
            <h3 className="ma0 f1 fw6 red barlow-condensed">
              {data?.totalcontributionTime
                ? formatSecondsToTwoUnits(data.totalcontributionTime)
                : '-'}
            </h3>
            <span className="ma0 h2 f3 fw7 silver barlow-condensed mb1">
              <FormattedMessage {...messages.totalTimeSpent} />
            </span>

            {data?.totalRecentcontributionTime ? (
              <span className="blue-grey f6 fw4">
                <b>{formatSecondsToTwoUnits(data.totalRecentcontributionTime)}</b>{' '}
                <FormattedMessage {...messages.recentTotalTimeSpentText} />
              </span>
            ) : (
              '--'
            )}
          </div>
        </div>

        <div
          className="pa4 flex items-center bg-white shadow-6 w-100 bb b--red bw2"
          style={{ gap: '1.75rem' }}
        >
          <div>
            <PeopleIcon className={iconClass} style={iconStyle} />
          </div>
          <div className="flex flex-column" style={{ gap: '0.5rem' }}>
            <h3 className="ma0 f1 fw6 red barlow-condensed">
              {data?.totalContributors ? getShortNumber(data.totalContributors) : '-'}
            </h3>
            <span className="ma0 h2 f3 fw7 silver barlow-condensed mb1">
              <FormattedMessage {...messages.totalContributors} />
            </span>

            {data?.totalRecentContributors ? (
              <span className="blue-grey f6 fw4">
                <b>{getShortNumber(data.totalRecentContributors)}</b>{' '}
                <FormattedMessage {...messages.recentTotalContributorsText} />
              </span>
            ) : (
              '-'
            )}
          </div>
        </div>
      </div>
    </ReactPlaceholder>
  );
};
