import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { useQuery } from '@tanstack/react-query';

import { InfoIcon, BanIcon } from '../components/svgIcons';
import {
  Overview,
  getShortNumber,
  formatSecondsToTwoUnits,
} from '../components/partnerMapswipeStats/overview';
import { DateFilter } from '../components/partnerMapswipeStats/dateFilter';
import { GroupMembers } from '../components/partnerMapswipeStats/groupMembers';
import { ContributionsGrid } from '../components/partnerMapswipeStats/contributionsGrid';
import { ContributionsHeatmap } from '../components/partnerMapswipeStats/contributionsHeatmap';
import { TimeSpentContributing } from '../components/partnerMapswipeStats/timeSpentContributing';
import { TimeSpentContributingByDay } from '../components/partnerMapswipeStats/timeSpentContributingByDay';
import { ProjectTypeAreaStats } from '../components/partnerMapswipeStats/projectTypeAreaStats';
import { SwipesByProjectType } from '../components/partnerMapswipeStats/swipesByProjectType';
import { SwipesByOrganization } from '../components/partnerMapswipeStats/swipesByOrganization';
import messages from './messages';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';

import './partnersMapswipeStats.scss';
import 'react-placeholder/lib/reactPlaceholder.css';
import 'react-datepicker/dist/react-datepicker.css';

const PagePlaceholder = () => (
  <div className="bg-tan flex flex-column" style={{ gap: '1.25rem' }}>
    <div className="mt4">
      <ReactPlaceholder type="rect" style={{ width: 300, height: 40 }} showLoadingAnimation />
      <ReactPlaceholder
        className="mt4"
        type="rect"
        style={{ width: '100%', height: 300 }}
        showLoadingAnimation
      />
    </div>
    <div className="mt3">
      <ReactPlaceholder type="rect" style={{ width: 300, height: 40 }} showLoadingAnimation />
      <ReactPlaceholder
        className="mt4"
        type="rect"
        style={{ width: '100%', height: 550 }}
        showLoadingAnimation
      />
    </div>
  </div>
);

const InfoBanner = () => {
  return (
    <div className="pr3 pv2 pl0 relative inline-flex mv3 blue-dark mapswipe-stats-info-banner">
      <span className="inline-flex items-center ">
        <InfoIcon className="mr2" style={{ height: '20px' }} />
        <FormattedMessage {...messages.mapswipeInfo} />
      </span>
    </div>
  );
};

export const PartnersMapswipeStats = () => {
  const { id: partnerPermalink } = useParams();
  const [filters, setFilters] = useState({}); // state for date filter
  const { isLoading, isError, data, isRefetching } = useQuery({
    queryKey: [
      'partners-mapswipe-filtered-statistics',
      partnerPermalink,
      filters.fromDate,
      filters.toDate,
    ],
    queryFn: async () => {
      const { fromDate, toDate } = filters;
      const response = await fetchLocalJSONAPI(
        `partners/${partnerPermalink}/filtered-statistics/?fromDate=${fromDate}&toDate=${toDate}`,
      );
      return response;
    },
  });

  const getSwipes = () => {
    if (!data) return <span>-</span>;
    if (data.contributionsByProjectType?.length === 0) return <span>0</span>;
    return getShortNumber(
      data.contributionsByProjectType
        .map((item) => item.totalcontributions)
        .reduce((total, value) => total + value, 0),
    );
  };

  const getTimeSpentContributing = () => {
    if (!data) return '-';
    if (data.contributionTimeByDate?.length === 0) return '0';
    return formatSecondsToTwoUnits(
      data.contributionTimeByDate
        .map((item) => item.totalcontributionTime)
        .reduce((total, value) => total + value, 0),
      true,
    );
  };

  return (
    <div className="pa4 bg-tan flex flex-column" style={{ gap: '1.25rem' }}>
      <InfoBanner />
      <Overview />

      <DateFilter isLoading={isLoading} filters={filters} setFilters={setFilters} />

      <ReactPlaceholder customPlaceholder={<PagePlaceholder />} ready={!isLoading && !isRefetching}>
        {!isLoading && isError ? (
          <div className="pa3 pl0 bg-tan">
            <div className="flex items-center justify-start pa5 gap-1 pl1">
              <BanIcon className="red" width="20" height="20" />
              <p className="ma0">
                <FormattedMessage {...messages.partnersMapswipeStatsError} />
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt3">
              <ContributionsGrid
                startDate={filters?.fromDate}
                endDate={filters?.toDate}
                contributionsByDate={data?.contributionsByDate}
              />
            </div>

            <div className="mt3">
              <ContributionsHeatmap contributionsByGeo={data?.contributionsByGeo} />
            </div>

            <div className="mt3">
              <TimeSpentContributing contributionTimeByDate={data?.contributionTimeByDate} />
            </div>

            <div className="mt3">
              <TimeSpentContributingByDay contributionTimeByDate={data?.contributionTimeByDate} />
            </div>

            <div className="mt4">
              <ProjectTypeAreaStats
                projectTypeAreaStats={data?.contributionsByProjectType}
                areaSwipedByProjectType={data?.areaSwipedByProjectType}
              />
            </div>

            <div
              className="mt4 mapswipe-stats-swipes-container f1 barlow-condensed"
              style={{ gap: '1.6rem' }}
            >
              <div className="pa4 shadow-6 bg-white" style={{ flex: '0 0 32.5%' }}>
                <span className="red fw6">{getSwipes()}</span>
                <span className="silver fw2 ml3">
                  <FormattedMessage {...messages.swipes} />
                </span>
              </div>
              <div className="pa4 shadow-6 bg-white" style={{ flexBasis: '100%' }}>
                <span className="red fw6">{getTimeSpentContributing()}</span>
                <span className="silver fw2 ml3">
                  <FormattedMessage {...messages.timeSpentContributing} />
                </span>
              </div>
            </div>

            <div className="mt3 items-center justify-between mapswipe-stats-piechart-container">
              <SwipesByProjectType contributionsByProjectType={data?.contributionsByProjectType} />
              <SwipesByOrganization
                contributionsByOrganization={data?.contributionsByorganizationName}
              />
            </div>

            <div className="mt3">
              <GroupMembers />
            </div>
          </>
        )}
      </ReactPlaceholder>
    </div>
  );
};
