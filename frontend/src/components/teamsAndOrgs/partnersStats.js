import { FormattedMessage, FormattedNumber } from 'react-intl';
import shortNumber from 'short-number';

import messages from './messages';
import { useOsmHashtagStatsQuery } from '../../api/stats';

export const StatsNumber = (props) => {
  const value = shortNumber(props.value);
  if (typeof value === 'number') {
    return <FormattedNumber value={value} />;
  }
  return (
    <span className={`ma0 mb1 barlow-condensed f2 fw5 'red'`}>
      <FormattedNumber value={Number(value.substr(0, value.length - 1))} />
      {value.substr(-1)}
    </span>
  );
};

export const StatsColumn = ({ label, value }: Object) => {
  return (
    <div className={`tc`}>
      <div className="fw5 red barlow-condensed ">
        {value !== undefined ? <StatsNumber value={value} /> : <>&#8211;</>}
      </div>

      <div className={`ma0 h2 f7 fw5 'blue-grey'`}>
        <FormattedMessage {...label} />
      </div>
    </div>
  );
};

export const StatsSection = ({ partner }) => {
  const { data: osmStatsData, isSuccess: hasTmStatsLoaded } = useOsmHashtagStatsQuery([partner.id]);
  // Mount all stats simultaneously
  const hasStatsLoaded = true;
  return (
    <>
      <div className="pt5 pb2 ph6-l ph4 flex justify-around flex-wrap flex-nowrap-ns stats-container ">
        <StatsColumn
          label={messages.users}
          value={hasStatsLoaded ? partner.statistics?.users : undefined}
        />
        {/*         <StatsColumn
          label={messages.changesets}
          value={hasStatsLoaded ? partner.statistics?.changesets : undefined}
        /> */}
        <StatsColumn
          label={messages.edits}
          value={hasStatsLoaded ? partner.statistics?.edits : undefined}
        />
        {/*         <StatsColumn
          label={messages.communityStats}
          value={hasStatsLoaded ?  partner.statistics?.latest : undefined}
        /> */}
        <StatsColumn
          label={messages.buildings}
          value={hasStatsLoaded ? partner.statistics?.buildings : undefined}
        />
        <StatsColumn
          label={messages.roads}
          value={hasStatsLoaded ? partner.statistics?.roads : undefined}
        />
      </div>
    </>
  );
};
