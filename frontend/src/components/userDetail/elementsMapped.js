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
  MappedIcon,
  ValidatedIcon,
} from '../svgIcons';
import { StatsCardContent } from '../statsCardContent';

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
        className={`cf shadow-4 pt3 pb3 ph2 ${
          field === 'time' ? 'bg-red white' : 'bg-white blue-dark'
        }`}
      >
        <div className="w-30 w-100-m fl tc">{elements.icon}</div>
        <StatsCardContent
          value={field === 'time' ? value : Math.trunc(value)}
          label={elements.message}
          className="w-70 w-100-m pt3-m mb1 fl tc"
          invertColors={field === 'time'}
        />
      </div>
    </div>
  );
};

export const TaskStats = ({ userStats, username }) => {
  return (
    <div className="cf w-100 relative base-font blue-grey">
      <div className="w-50-ns w-100 pa2 fl">
        <div className="cf shadow-4 pv3 ph2 bg-white">
          <div className="w-25-ns w-100 h-100 pa2 pa0-m fl red tc">
            <MappedIcon className="v-mid w-50-ns w-25" />
          </div>
          <div className="w-75-ns w-100 mt3 fl tc f6 b">
            <div className="cf w-100">
              <p className="mb1 mt3 mt1-ns f3">
                <FormattedMessage
                  {...messages.userMapped}
                  values={{ user: username ? username : <FormattedMessage {...messages.you} /> }}
                />
              </p>
              <hr className="w-50" />
            </div>
            <div className="cf w-100 pt4">
              <div className="cf w-33 fl tc">
                <p className="ma0 mb2 barlow-condensed f2 b red">
                  {userStats.tasksMapped}
                </p>
                <p className="mb3 ttl">
                  <FormattedMessage {...messages.tasks} />
                </p>
              </div>
              <div className="cf w-33 fl tc">
                <p className="ma0 mb2 barlow-condensed f2 b red">
                  {userStats.tasksValidatedByOthers}
                </p>
                <p className="mb3 ttl">
                  <FormattedMessage {...messages.validated} />
                </p>
              </div>
              <div className="cf w-33 fl tc">
                <p className="ma0 mb2 barlow-condensed f2 b red">
                  {userStats.tasksInvalidatedByOthers}
                </p>
                <p className="mb3 ttl">
                  <FormattedMessage {...messages.invalidated} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-50-ns w-100 pa2 fl">
        <div className="cf shadow-4 pv3 ph2 bg-white">
          <div className="w-25-ns w-100 h-100 pa2 pa0-m fl red tc">
            <ValidatedIcon className="v-mid w-50-ns w-25" />
          </div>
          <div className="w-75-ns w-100 mt3 fl tc f6 b">
            <div className="cf w-100">
              <p className="mb1 mt3 mt1-ns f3">
                <FormattedMessage
                  {...messages.userValidated}
                  values={{ user: username ? username : <FormattedMessage {...messages.you} /> }}
                />
              </p>
              <hr className="w-50" />
            </div>
            <div className="cf w-100 pt4">
              <div className="cf w-33 fl tc">
                <p className="ma0 mb3 barlow-condensed f2 b red">
                  {userStats.tasksValidated + userStats.tasksInvalidated || 0}
                </p>
                <p className="mb3 ttl">
                  <FormattedMessage {...messages.tasks}  />
                </p>
              </div>
              <div className="cf w-33 fl tc">
                <p className="ma0 mb2 barlow-condensed f2 b red">
                  {userStats.tasksValidated}
                </p>
                <p className="mb3 ttl">
                  <FormattedMessage {...messages.finished} />
                </p>
              </div>
              <div className="cf w-33 fl tc">
                <p className="ma0 mb2 barlow-condensed f2 b red">
                  {userStats.tasksInvalidated}
                </p>
                <p className="mb3 ttl">
                  <FormattedMessage {...messages.invalidated} />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const shortEnglishHumanizer = humanizeDuration.humanizer({
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

export const ElementsMapped = ({ userStats, osmStats }) => {
  const duration = shortEnglishHumanizer(userStats.timeSpentMapping * 1000, {
    round: true,
    delimiter: ' ',
    units: ['h', 'm'],
    spacer: '',
  });

  return (
    <div>
      <div className="cf w-100 relative">
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
