import { FormattedMessage, FormattedNumber } from 'react-intl';
import shortNumber from 'short-number';

import messages from './messages';
import { StatsCard } from '../statsCard';
import { MappingIcon, EditIcon, RoadIcon, HomeIcon } from '../svgIcons';

const iconClass = 'h-50 w-50';
const iconStyle = { height: '45px' };

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
    <div className="flex justify-between items-center" style={{ gap: '1.6rem' }}>
      <StatsCard
        icon={<MappingIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.contributors} />}
        value={partner ? partner.users : '-'}
        className={'w-25-l w-50-m w-100 mv1'}
      />
      <StatsCard
        icon={<EditIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.editsStats} />}
        value={partner ? partner.edits : '-'}
        className={'w-25-l w-50-m w-100 mv1'}
      />
      <StatsCard
        icon={<HomeIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.buildingsStats} />}
        value={partner ? partner.buildings : '-'}
        className={'w-25-l w-50-m w-100 mv1'}
      />
      <StatsCard
        icon={<RoadIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.roadsStats} />}
        value={partner ? partner.roads : '-'}
        className={'w-25-l w-50-m w-100 mv1'}
      />
    </div>
  );
};
