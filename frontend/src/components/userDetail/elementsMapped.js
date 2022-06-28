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
import { StatsCard } from '../statsCard';

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
                <p className="ma0 mb2 barlow-condensed f2 b red">{userStats.tasksMapped}</p>
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
                  <FormattedMessage {...messages.tasks} />
                </p>
              </div>
              <div className="cf w-33 fl tc">
                <p className="ma0 mb2 barlow-condensed f2 b red">{userStats.tasksValidated}</p>
                <p className="mb3 ttl">
                  <FormattedMessage {...messages.finished} />
                </p>
              </div>
              <div className="cf w-33 fl tc">
                <p className="ma0 mb2 barlow-condensed f2 b red">{userStats.tasksInvalidated}</p>
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

  const iconClass = 'h-50 w-50';
  const iconStyle = { height: '45px' };

  return (
    <div>
      <div className="cf w-100 relative">
        <StatsCard
          invertColors={true}
          icon={<ClockIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.timeSpentMapping} />}
          value={duration}
          className={'w-20-l w-50-m w-100 mv1'}
        />
        <StatsCard
          icon={<HomeIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.buildingsMapped} />}
          value={osmStats.total_building_count_add || 0}
          className={'w-20-l w-50-m w-100 mv1'}
        />
        <StatsCard
          icon={<RoadIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.roadMapped} />}
          value={osmStats.total_road_km_add || 0}
          className={'w-20-l w-50-m w-100 mv1'}
        />
        <StatsCard
          icon={<MarkerIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.poiMapped} />}
          value={osmStats.total_poi_count_add || 0}
          className={'w-20-l w-50-m w-100 mv1'}
        />
        <StatsCard
          icon={<WavesIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.waterwaysMapped} />}
          value={osmStats.total_waterway_km_add || 0}
          className={'w-20-l w-50-m w-100 mv1'}
        />
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
