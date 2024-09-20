import { FormattedMessage, FormattedNumber } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactPlaceholder from 'react-placeholder';
import shortNumber from 'short-number';
import { intervalToDuration } from 'date-fns';

import messages from './messages';
import { StatsCardWithFooter } from '../statsCard';
import { MappingIcon, SwipeIcon, ClockIcon } from '../svgIcons';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

const iconClass = 'w-100';
const iconStyle = { height: '55px' };

const OverviewPlaceholder = () => (
  <div
    className="flex justify-between items-center flex-wrap flex-nowrap-ns"
    style={{ gap: '1.6rem' }}
  >
    <ReactPlaceholder type="rect" style={{ width: '100%', height: 155 }} showLoadingAnimation />
    <ReactPlaceholder type="rect" style={{ width: '100%', height: 155 }} showLoadingAnimation />
    <ReactPlaceholder type="rect" style={{ width: '100%', height: 155 }} showLoadingAnimation />
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
        className="flex justify-between items-center flex-wrap flex-nowrap-ns"
        style={{ gap: '1.6rem' }}
      >
        <StatsCardWithFooter
          icon={<SwipeIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.totalSwipes} />}
          value={data?.totalcontributions ? getShortNumber(data.totalcontributions) : '-'}
          delta={
            data?.totalRecentcontributions ? (
              <span>
                <b>{getShortNumber(data.totalRecentcontributions)}</b>{' '}
                <FormattedMessage {...messages.recentTotalSwipesText} />
              </span>
            ) : (
              '--'
            )
          }
          className="w-100"
        />
        <StatsCardWithFooter
          icon={<ClockIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.totalTimeSpent} />}
          value={
            data?.totalcontributionTime ? formatSecondsToTwoUnits(data.totalcontributionTime) : '-'
          }
          delta={
            data?.totalRecentcontributionTime ? (
              <span>
                <b>{formatSecondsToTwoUnits(data.totalRecentcontributionTime)}</b>{' '}
                <FormattedMessage {...messages.recentTotalTimeSpentText} />
              </span>
            ) : (
              '--'
            )
          }
          className="w-100"
        />
        <StatsCardWithFooter
          icon={<MappingIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.totalContributors} />}
          value={data?.totalContributors ? getShortNumber(data.totalContributors) : '-'}
          delta={
            data?.totalRecentContributors ? (
              <span>
                <b>{getShortNumber(data.totalRecentContributors)}</b>{' '}
                <FormattedMessage {...messages.recentTotalContributorsText} />
              </span>
            ) : (
              '--'
            )
          }
          className="w-100"
        />
      </div>
    </ReactPlaceholder>
  );
};
