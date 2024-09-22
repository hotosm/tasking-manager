import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import messages from './messages';
import { StatsCardWithFooter } from '../statsCard';
import { MappingIcon, SwipeIcon, ClockIcon } from '../svgIcons';
import { getShortNumber } from './overview';

const iconClass = 'w-100';
const iconStyle = { height: '55px' };

export const ProjectTypeAreaStats = ({
  projectTypeAreaStats = [],
  areaSwipedByProjectType = [],
}) => {
  const data = {
    find: {
      totalcontributions: 0,
      totalArea: 0,
    },
    validate: {
      totalcontributions: 0,
    },
    compare: {
      totalcontributions: 0,
      totalArea: 0,
    },
  };

  projectTypeAreaStats.forEach((stat) => {
    if (['build_area', 'buildarea'].includes(stat.projectType.toLowerCase())) {
      data.find.totalcontributions = getShortNumber(stat.totalcontributions || 0);
    } else if (['foot_print', 'footprint'].includes(stat.projectType.toLowerCase())) {
      data.validate.totalcontributions = getShortNumber(stat.totalcontributions || 0);
    } else if (['change_detection', 'changedetection'].includes(stat.projectType.toLowerCase())) {
      data.compare.totalcontributions = getShortNumber(stat.totalcontributions || 0);
    }
  });

  areaSwipedByProjectType.forEach((stat) => {
    if (['build_area', 'buildarea'].includes(stat.projectType.toLowerCase())) {
      data.find.totalArea = getShortNumber(stat.totalArea || 0);
    } else if (['change_detection', 'changedetection'].includes(stat.projectType.toLowerCase())) {
      data.compare.totalArea = getShortNumber(stat.totalArea || 0);
    }
  });

  return (
    <div
      className="flex justify-between items-center flex-wrap flex-nowrap-ns"
      style={{ gap: '1.6rem' }}
    >
      <StatsCardWithFooter
        icon={<SwipeIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.areaSwipesByProjectType} />}
        value={data.find.totalcontributions}
        delta={
          <div className="flex justify-between items-center">
            <span>{data.find.totalArea} Sq. KM.</span>
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
        value={data.validate.totalcontributions}
        delta={
          <div className="flex justify-end">
            <b className="red">
              <FormattedMessage {...messages.validate} />
            </b>
          </div>
        }
        className="w-100"
      />
      <StatsCardWithFooter
        icon={<MappingIcon className={iconClass} style={iconStyle} />}
        description={<FormattedMessage {...messages.sceneComparedByProjectType} />}
        value={data.compare.totalcontributions}
        delta={
          <div className="flex justify-between items-center">
            <span>{data.compare.totalArea} Sq. KM.</span>
            <b className="red">
              <FormattedMessage {...messages.compare} />
            </b>
          </div>
        }
        className="w-100"
      />
    </div>
  );
};

ProjectTypeAreaStats.propTypes = {
  projectTypeAreaStats: PropTypes.arrayOf(
    PropTypes.shape({
      projectType: PropTypes.string,
      projectTypeDisplay: PropTypes.string,
      totalcontributions: PropTypes.numberstring,
    }),
  ),
  areaSwipedByProjectType: PropTypes.arrayOf(
    PropTypes.shape({
      organizationName: PropTypes.string,
      totalcontributions: PropTypes.number,
    }),
  ),
};
