import { FormattedMessage, FormattedNumber } from 'react-intl';
import shortNumber from 'short-number';

import messages from './messages';
import { RoadIcon, HomeIcon, UserIcon, EditIcon } from '../svgIcons';

export const StatsNumber = (props) => {
  const value = shortNumber(props.value);
  if (typeof value === 'number') {
    return (
      <span className={`ma0 mb1 barlow-condensed f2 fw5 'red'`}>
        <FormattedNumber value={value} />
      </span>
    );
  }
  return (
    <span className={`ma0 mb1 barlow-condensed f2 fw5 'red'`}>
      <FormattedNumber value={Number(value.substr(0, value.length - 1))} />
      {value.substr(-1)}
    </span>
  );
};

export const StatsColumn = ({ label, value, icon }: Object) => {
  return (
    <div className={`tc mv2`}>
      <div style={{ color: '#D73F3F', minHeight: 35 }}>{icon}</div>

      <div className="fw5 red barlow-condensed">
        {value !== undefined ? <StatsNumber value={value} /> : <>&#8211;</>}
      </div>

      <div className={`ma0 h2 f5 fw5 'blue-grey'`}>
        <FormattedMessage {...label} />
      </div>
    </div>
  );
};

export const StatsSection = ({ partner }) => {
  
  return (
    <>
      <div className="w-100 pt5 pb2 ph6-l ph4 flex justify-around flex-wrap flex-nowrap-ns stats-container ">
        <StatsColumn
          label={messages.contributors}
          value={partner ? partner.users : undefined}
          icon={<UserIcon width="25px" height="25px" />}
        />
        <StatsColumn
          label={messages.editsStats}
          value={partner ? partner.edits : undefined}
          icon={<EditIcon width="25px" />}
        />
        <StatsColumn
          label={messages.buildingsStats}
          value={partner ? partner.buildings : undefined}
          icon={<HomeIcon />}
        />
        <StatsColumn
          label={messages.roadsStats}
          value={partner ? partner.roads : undefined}
          icon={<RoadIcon />}
        />
      </div>
    </>
  );
};
