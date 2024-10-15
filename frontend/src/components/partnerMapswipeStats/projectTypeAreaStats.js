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
