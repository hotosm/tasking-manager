import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { StatsCardWithFooter } from '../statsCard';
import { MappingIcon, SwipeIcon, ClockIcon } from '../svgIcons';

const iconClass = 'w-100';
const iconStyle = { height: '55px' };

export const ProjectTypeAreaStats = () => {
  return (
    <div
      className="flex justify-between items-center flex-wrap flex-nowrap-ns"
      style={{ gap: '1.6rem' }}
    >
      <StatsCardWithFooter
        icon={<SwipeIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.areaSwipesByProjectType} />}
        value={'213K'}
        delta={
          <div className="flex justify-between items-center">
            <span>25K Sq. KM.</span>
            <b className="red">
              <FormattedMessage {...messages.find} />
            </b>
          </div>
        }
        className="w-100"
      />
      <StatsCardWithFooter
        icon={<ClockIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.featuresCheckedByProjectType} />}
        value={'114K'}
        delta={
          <div className="flex justify-end">
            <b className="red"><FormattedMessage {...messages.validate} /></b>
          </div>
        }
        className="w-100"
      />
      <StatsCardWithFooter
        icon={<MappingIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.sceneComparedByProjectType} />}
        value={'11K'}
        delta={
          <div className="flex justify-between items-center">
            <span>230 Sq. KM.</span>
            <b className="red"><FormattedMessage {...messages.compare} /></b>
          </div>
        }
        className="w-100"
      />
    </div>
  );
};
