import React from 'react';
import humanizeDuration from 'humanize-duration';
import ReactTooltip from 'react-tooltip';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import {
  ClockIcon,
  RoadIcon,
  HomeIcon,
  WavesIcon,
  MarkerIcon,
  QuestionCircleIcon,
} from '../svgIcons';

const getFieldData = (field) => {
  const iconClass = 'h-50 w-50';
  const iconStyle = { height: '45px' };
  switch (field) {
    case 'time':
      return {
        icon: <ClockIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...messages.timeSpentMapping} />,
      };
    case 'buildings':
      return {
        icon: <HomeIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...messages.buildingsMapped} />,
      };
    case 'road':
      return {
        icon: <RoadIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...messages.roadMapped} />,
      };
    case 'poi':
      return {
        icon: <MarkerIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...messages.poiMapped} />,
      };
    case 'waterways':
      return {
        icon: <WavesIcon className={iconClass} style={iconStyle} />,
        message: <FormattedMessage {...messages.waterwaysMapped} />,
      };
    default:
      return null;
  }
};

const Element = ({ field, value }) => {
  const elements = getFieldData(field);
  return (
    <div className={`w-20-ns w-100 ph2-ns fl`}>
      <div
        className={`cf shadow-4 pt3 pb2 pb3-m ph2 ${
          field === 'time' ? 'bg-red white' : 'bg-white blue-dark'
        }`}
      >
        <div className="w-30 w-100-m fl tc">{elements.icon}</div>
        <div className="w-70 w-100-m fl tc">
          <p className={`ma0 mb2 barlow-condensed f3 b ${field === 'time' ? null : 'red '}`}>
            {field === 'time' ? value : Math.trunc(value)}
          </p>
          <p className={`ma0 h2 f7 b ${field === 'time' ? null : 'blue-grey'}`}>
            {elements.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export const ElementsMapped = ({ userStats, osmStats }) => {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: 'shortEn',
    languages: {
      shortEn: {
        y: () => 'y',
        mo: () => 'mo',
        w: () => 'w',
        d: () => 'd',
        h: () => 'h',
        m: () => 'm',
        s: () => 's',
        ms: () => 'ms',
      },
    },
  });

  const duration = shortEnglishHumanizer(userStats.timeSpentMapping * 1000, {
    round: true,
    delimiter: ' ',
    units: ['h', 'm'],
  });

  return (
    <div>
      <div className="cf w-100 relative pr2">
        <Element field={'time'} value={duration} />
        <Element field={'buildings'} value={osmStats.total_building_count_add || 0} />
        <Element field={'road'} value={osmStats.total_road_km_add || 0} />
        <Element field={'poi'} value={osmStats.total_poi_count_add || 0} />
        <Element field={'waterways'} value={osmStats.total_waterway_count_add || 0} />
      </div>
      <div className="cf w-100 relative tr pt3 pr3">
        <FormattedMessage {...messages.delayPopup}>
          {(msg) => (
            <QuestionCircleIcon
              className="pointer dib v-mid pl2 pb1 blue-light"
              height="1.25rem"
              data-tip={msg}
            />
          )}
        </FormattedMessage>
        <ReactTooltip />
      </div>
    </div>
  );
};
