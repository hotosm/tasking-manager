import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import messages from './messages';
import { ChecksGridIcon, ColumnsGapIcon, FullscreenIcon } from '../svgIcons';
import { getShortNumber } from './overview';

const iconClass = 'w-100 red';
const iconStyle = { height: '55px' };

export const ProjectTypeAreaStats = ({
  projectTypeAreaStats = [],
  areaSwipedByProjectType = [],
}) => {
  const rawData = {
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
    const type = stat.projectType.toLowerCase();
    if (['build_area', 'buildarea', 'find'].includes(type)) {
      rawData.find.totalcontributions += Number(stat.totalcontributions || 0);
    } else if (['foot_print', 'footprint', 'validate'].includes(type)) {
      rawData.validate.totalcontributions += Number(stat.totalcontributions || 0);
    } else if (['change_detection', 'changedetection', 'compare'].includes(type)) {
      rawData.compare.totalcontributions += Number(stat.totalcontributions || 0);
    }
  });

  areaSwipedByProjectType.forEach((stat) => {
    const type = stat.projectType.toLowerCase();
    if (['build_area', 'buildarea', 'find'].includes(type)) {
      rawData.find.totalArea += Number(stat.totalArea || 0);
    } else if (['change_detection', 'changedetection', 'compare'].includes(type)) {
      rawData.compare.totalArea += Number(stat.totalArea || 0);
    }
  });

  const data = {
    find: {
      totalcontributions: getShortNumber(rawData.find.totalcontributions),
      totalArea: getShortNumber(rawData.find.totalArea),
    },
    validate: {
      totalcontributions: getShortNumber(rawData.validate.totalcontributions),
    },
    compare: {
      totalcontributions: getShortNumber(rawData.compare.totalcontributions),
      totalArea: getShortNumber(rawData.compare.totalArea),
    },
  };

  return (
    <div
      className="flex justify-between items-center flex-wrap flex-nowrap-l"
      style={{ gap: '1.6rem' }}
    >
      <div className="pa4 flex items-center bg-white shadow-6 w-100" style={{ gap: '1.75rem' }}>
        <div>
          <ColumnsGapIcon className={iconClass} style={iconStyle} />
        </div>
        <div className="flex flex-column" style={{ gap: '0.3rem' }}>
          <span className="blue-grey f6 fw6">
            <FormattedMessage {...messages.find} />
          </span>
          <h3 className="ma0 f1 fw6 red barlow-condensed">{data.find.totalcontributions}</h3>
          <span className="ma0 h2 f3 fw7 silver barlow-condensed mb1">
            <FormattedMessage {...messages.areaSwipesByProjectType} />
          </span>

          <span className="blue-grey f6 fw4">
            {data.find.totalArea} km<sup>2</sup>
          </span>
        </div>
      </div>

      <div
        className="pa4 flex items-center bg-white shadow-6 w-100 self-stretch"
        style={{ gap: '1.75rem' }}
      >
        <div>
          <ChecksGridIcon className={iconClass} style={iconStyle} />
        </div>
        <div className="flex flex-column" style={{ gap: '0.3rem' }}>
          <span className="blue-grey f6 fw6">
            <FormattedMessage {...messages.validate} />
          </span>
          <h3 className="ma0 f1 fw6 red barlow-condensed">{data.validate.totalcontributions}</h3>
          <span className="ma0 h2 f3 fw7 silver barlow-condensed mb1">
            <FormattedMessage {...messages.featuresCheckedByProjectType} />
          </span>
        </div>
      </div>

      <div className="pa4 flex items-center bg-white shadow-6 w-100" style={{ gap: '1.75rem' }}>
        <div>
          <FullscreenIcon className={iconClass} style={iconStyle} />
        </div>
        <div className="flex flex-column" style={{ gap: '0.3rem' }}>
          <span className="blue-grey f6 fw6">
            <FormattedMessage {...messages.compare} />
          </span>
          <h3 className="ma0 f1 fw6 red barlow-condensed">{data.compare.totalcontributions}</h3>
          <span className="ma0 h2 f3 fw7 silver barlow-condensed mb1">
            <FormattedMessage {...messages.sceneComparedByProjectType} />
          </span>

          <span className="blue-grey f6 fw4">
            {data.compare.totalArea} km<sup>2</sup>
          </span>
        </div>
      </div>
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
