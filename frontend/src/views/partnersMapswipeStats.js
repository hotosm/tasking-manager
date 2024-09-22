import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { useQuery } from '@tanstack/react-query';

import { InfoIcon } from '../components/svgIcons';
import { Overview } from '../components/partnerMapswipeStats/overview';
import { GroupMembers } from '../components/partnerMapswipeStats/groupMembers';
import { ContributionsGrid } from '../components/partnerMapswipeStats/contributionsGrid';
import { ContributionsHeatmap } from '../components/partnerMapswipeStats/contributionsHeatmap';
import { TimeSpentContributing } from '../components/partnerMapswipeStats/timeSpentContributing';
import { TimeSpentContributingByDay } from '../components/partnerMapswipeStats/timeSpentContributingByDay';
import { ProjectTypeAreaStats } from '../components/partnerMapswipeStats/projectTypeAreaStats';
import { SwipesByProjectType } from '../components/partnerMapswipeStats/swipesByProjectType';
import { SwipesByOrganisation } from '../components/partnerMapswipeStats/swipesByOrganisation';
import { StatsCardWithFooter } from '../components/statsCard';
import { getShortNumber, formatSecondsToTwoUnits } from '../components/partnerMapswipeStats/overview';
import messages from './messages';
import { BanIcon } from '../components/svgIcons';
import { fetchLocalJSONAPI } from '../network/genericJSONRequest';
import './partnersMapswipeStats.css';

const PagePlaceholder = () => (
  <div className="bg-tan flex flex-column" style={{ gap: '1.25rem' }}>
    {/* <ReactPlaceholder type="rect" style={{ width: 300, height: 40 }} showLoadingAnimation /> */}
    {/* <div
      className="flex justify-between items-center flex-wrap flex-nowrap-ns mt3"
      style={{ gap: '1.6rem' }}
    >
      <ReactPlaceholder type="rect" style={{ width: '100%', height: 170 }} showLoadingAnimation />
      <ReactPlaceholder type="rect" style={{ width: '100%', height: 170 }} showLoadingAnimation />
      <ReactPlaceholder type="rect" style={{ width: '100%', height: 170 }} showLoadingAnimation />
    </div> */}
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
    <div className="pr3 pv2 pl0 relative inline-flex mv3 mapswipe-stats-info-banner">
      <span className="inline-flex items-center ">
        <InfoIcon className="mr2" style={{ height: '20px' }} />
        <FormattedMessage {...messages.mapswipeInfo} />
      </span>
    </div>
  );
};

export const PartnersMapswipeStats = () => {
  const { id: partnerPermalink } = useParams();
  const { isLoading, isError, data, isRefetching } = useQuery({
    queryKey: ['partners-mapswipe-filtered-statistics', partnerPermalink],
    queryFn: async () => {
      const today = new Date();
      const currentYear = today.getFullYear();

      const formatDate = (date) => {
        const offset = date.getTimezoneOffset();
        const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
        return adjustedDate.toISOString().split('T')[0];
      };

      const fromDate = formatDate(new Date(currentYear, 0, 1));
      const endDate = formatDate(today);

      const response = await fetchLocalJSONAPI(
        `partners/${partnerPermalink}/filtered-statistics/?fromDate=${fromDate}&toDate=${endDate}`,
      );
      return response;
    },
  });

  return (
    <div className="pa4 bg-tan flex flex-column" style={{ gap: '1.25rem' }}>
      <InfoBanner />
      <Overview />

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
              <ContributionsGrid contributionsByDate={data?.contributionsByDate} />
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

            <div className="mt4 flex items-center justify-between">
              <StatsCardWithFooter
                description={<FormattedMessage {...messages.swipes} />}
                value={getShortNumber(data?.contributionsByProjectType.map(c => c.totalcontributions).reduce((acc, t) => acc + t) ?? 0)}
                style={{ width: '48.5%' }}
              />
              <StatsCardWithFooter
                description={<FormattedMessage {...messages.timeSpentContributing} />}
                value={formatSecondsToTwoUnits(data?.contributionTimeByDate.map(c => c.totalcontributionTime).reduce((acc, t) => acc + t) ?? 0)}
                className="w-100"
                style={{ width: '48.5%' }}
              />
            </div>

            <div className="mt3 flex items-center justify-between">
              <SwipesByProjectType areaSwipedByProjectType={data?.areaSwipedByProjectType} />
              <SwipesByOrganisation contributionsByOrganization={data?.contributionsByorganizationName} />
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
