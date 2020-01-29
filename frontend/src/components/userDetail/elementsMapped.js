import React from 'react';
import { ClockIcon, RoadIcon, HomeIcon, WavesIcon, MarkerIcon } from '../svgIcons';
import humanizeDuration from 'humanize-duration';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

const getFieldData = field => {
  const iconClass = 'h-50 w-50';
  switch (field) {
    case 'time':
      return {
        icon: <ClockIcon className={iconClass} />,
        message: <FormattedMessage {...messages.timeSpentMapping} />,
      };
    case 'buildings':
      return {
        icon: <HomeIcon className={iconClass} />,
        message: <FormattedMessage {...messages.buildingsMapped} />,
      };
    case 'road':
      return {
        icon: <RoadIcon className={iconClass} />,
        message: <FormattedMessage {...messages.roadMapped} />,
      };
    case 'poi':
      return {
        icon: <MarkerIcon className={iconClass} />,
        message: <FormattedMessage {...messages.poiMapped} />,
      };
    case 'waterways':
      return {
        icon: <WavesIcon className={iconClass} />,
        message: <FormattedMessage {...messages.waterwaysMapped} />,
      };
    default:
      return null;
  }
};

const Element = ({ field, value }) => {
  const elements = getFieldData(field);
  return (
    <div
      style={{ width: '19%' }}
      className={`shadow-4 pv3 ph2 flex items-center + ${
        field === 'time' ? 'bg-red white' : 'bg-white'
      }`}
    >
      <div className="w-40 tc">{elements.icon}</div>
      <div className="w-60">
        <p className={`ma0 mb2 barlow-condensed f3 b + ${field === 'time' ? null : 'red '}`}>
          {field === 'time' ? value : Math.trunc(value)}
        </p>
        <p className={`ma0 mb2 f7 b + ${field === 'time' ? null : 'blue-grey'}`}>
          {elements.message}
        </p>
      </div>
    </div>
  );
};

export const ElementsMapped = ({ user }) => {
  const stats = user.stats.read();
  const osmStats = user.osmStats.read();

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

  const duration = shortEnglishHumanizer(stats.timeSpentMapping * 1000, {
    round: true,
    delimiter: ' ',
    units: ['h', 'm'],
  });

  return (
    <div className="flex justify-between">
      <Element field={'time'} value={duration} />
      <Element field={'buildings'} value={osmStats.total_building_count_add} />
      <Element field={'road'} value={osmStats.total_road_km_add} />
      <Element field={'poi'} value={osmStats.total_poi_count_add} />
      <Element field={'waterways'} value={osmStats.total_waterway_count_add} />
    </div>
  );
};
