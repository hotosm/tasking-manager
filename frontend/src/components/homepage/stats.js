import { FormattedMessage, FormattedNumber } from 'react-intl';
import shortNumber from 'short-number';

import messages from './messages';
import { useSystemStatisticsQuery } from '../../api/stats';
import StatsInfoFooter from '../statsInfoFooter';

export const StatsNumber = (props) => {
  const value = shortNumber(props.value);
  if (typeof value === 'number') {
    return <FormattedNumber value={value} />;
  }
  return (
    <span>
      <FormattedNumber value={Number(value.substr(0, value.length - 1))} />
      {value.substr(-1)}
    </span>
  );
};

export const StatsColumn = ({ label, value }: Object) => {
  return (
    <div className={`tc`}>
      <div className="fw5 red barlow-condensed stat-number">
        {value !== undefined ? <StatsNumber value={value} /> : <>&#8211;</>}
      </div>
      <div className="db blue-grey f6 fw7">
        <FormattedMessage {...label} />
      </div>
    </div>
  );
};

export const StatsSection = () => {
  const { data: tmStatsData, isSuccess: hasTmStatsLoaded } = useSystemStatisticsQuery();
  // const { data: osmStatsData, isSuccess: hasOsmStatsLoaded } = useOsmStatsQuery();

  // Mount all stats simultaneously
  const hasStatsLoaded = hasTmStatsLoaded // && hasOsmStatsLoaded;

  return (
    <div className="pt5 pb2 ph6-l ph4 ">
      <StatsInfoFooter className="mb4" />

      <div className="flex justify-around flex-wrap flex-nowrap-ns stats-container">
        <StatsColumn
          label={messages.communityStats}
          value={hasStatsLoaded ? tmStatsData?.data.totalMappers : undefined}
        />
        <StatsColumn
          label={messages.ohmTasksStats}
          value={hasStatsLoaded ? tmStatsData?.data.tasksMapped : undefined}
        />
        <StatsColumn
          label={messages.ohmProjectsStats}
          value={hasStatsLoaded ? tmStatsData?.data.totalProjects : undefined}
        />
        <StatsColumn
          label={messages.mappersStats}
          value={hasStatsLoaded ? tmStatsData.data.mappersOnline : undefined}
        />
      </div>
    </div>
  );
};
