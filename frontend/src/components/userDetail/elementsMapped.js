import React from 'react';
import humanizeDuration from 'humanize-duration';
import { useIntl, FormattedMessage } from 'react-intl';

import messages from './messages';
import {
  ClockIcon,
  RoadIcon,
  HomeIcon,
  WavesIcon,
  MarkerIcon,
  MappedIcon,
  ValidatedIcon,
} from '../svgIcons';
import { StatsCard, DetailedStatsCard } from '../statsCard';
import { useOsmStatsMetadataQuery } from '../../api/stats';
import { dateOptions } from '../statsTimestamp';

export const TaskStats = ({ userStats, username }) => {
  const {
    tasksMapped,
    tasksValidatedByOthers,
    tasksInvalidatedByOthers,
    tasksValidated,
    tasksInvalidated,
  } = userStats;
  const taskStats = [
    {
      icon: <MappedIcon className="v-mid h-100 w-50-ns w-25" />,
      title: messages.userMapped,
      items: [
        {
          label: messages.tasks,
          value: tasksMapped,
        },
        {
          label: messages.validated,
          value: tasksValidatedByOthers,
        },
        {
          label: messages.invalidated,
          value: tasksInvalidatedByOthers,
        },
      ],
    },
    {
      icon: <ValidatedIcon className="v-mid h-100 w-30-ns w-25" />,
      title: messages.userValidated,
      items: [
        {
          label: messages.tasks,
          value: tasksValidated + tasksInvalidated || 0,
        },
        {
          label: messages.finished,
          value: tasksValidated,
        },
        {
          label: messages.invalidated,
          value: tasksInvalidated,
        },
      ],
    },
  ];

  return (
    <div className="relative base-font blue-grey task-stats-ctr">
      {taskStats.map((stat, index) => (
        <article
          key={index}
          className="shadow-6 pv3 ph2 bg-white flex flex-column flex-row-ns items-center"
        >
          <div className="w-75 w-25-ns h-100 pa2 pa0-m red tc">{stat.icon}</div>
          <div className="w-75 mt3 tc f6 b">
            <div className=" w-100">
              <p className="mb1 mt3 mt1-ns f3 fw6" style={{ letterSpacing: '1.25px' }}>
                <FormattedMessage
                  {...stat.title}
                  values={{ user: username ? username : <FormattedMessage {...messages.you} /> }}
                />
              </p>
              <hr className="w-50" />
            </div>
            <div className="w-100 pt4 flex">
              {stat.items.map((item, index) => (
                <div key={index} className=" w-33 tc">
                  <p className="ma0 mb0 barlow-condensed f2 fw5 red">{item.value}</p>
                  <p className="mb3 ttl fw6">
                    <FormattedMessage {...item.label} />
                  </p>
                </div>
              ))}
            </div>
          </div>
        </article>
      ))}
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
  const intl = useIntl();
  const duration = shortEnglishHumanizer(userStats.timeSpentMapping * 1000, {
    round: true,
    delimiter: ' ',
    units: ['h', 'm'],
    spacer: '',
  });

  const iconClass = 'h-50 w-50';
  const iconStyle = { height: '45px' };

  const { data: osmStatsMetadata } = useOsmStatsMetadataQuery();

  return (
    <div>
      <div className="w-100 relative stats-cards-container">
        <StatsCard
          invertColors={true}
          icon={<ClockIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.timeSpentMapping} />}
          value={duration}
        />
        <DetailedStatsCard
          icon={<HomeIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.buildingsMapped} />}
          subDescription="Created - Deleted"
          mapped={osmStats?.building?.value}
          created={osmStats?.building?.added}
          modified={osmStats?.building?.modified?.count_modified}
          deleted={osmStats?.building?.deleted}
        />
        <DetailedStatsCard
          icon={<RoadIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.roadMapped} />}
          subDescription="Created + Modified - Deleted"
          mapped={osmStats?.highway?.value}
          created={osmStats?.highway?.added}
          modified={osmStats?.highway?.modified?.count_modified}
          deleted={osmStats?.highway?.deleted}
          unitMore={osmStats?.highway?.modified?.unit_more}
          unitLess={osmStats?.highway?.modified?.unit_less}
        />
        <DetailedStatsCard
          icon={<MarkerIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.poiMapped} />}
          subDescription="Created - Deleted"
          mapped={osmStats?.poi?.value}
          created={osmStats?.poi?.added}
          modified={osmStats?.poi?.modified?.count_modified}
          deleted={osmStats?.poi?.deleted}
        />
        <DetailedStatsCard
          icon={<WavesIcon className={iconClass} style={iconStyle} />}
          description={<FormattedMessage {...messages.waterwaysMapped} />}
          subDescription="Created + Modified - Deleted"
          mapped={osmStats?.waterway?.value}
          created={osmStats?.waterway?.added}
          modified={osmStats?.waterway?.modified?.count_modified}
          deleted={osmStats?.waterway?.deleted}
          unitMore={osmStats?.waterway?.modified?.unit_more}
          unitLess={osmStats?.waterway?.modified?.unit_less}
        />
      </div>
      <div className="cf w-100 relative tr pt3">
        <span className="ma0 f7 fw4 blue-grey mb1 i">
          These statistics come from{' '}
          <a
            className="blue-grey fw7"
            href="https://stats.now.ohsome.org/about"
            target="_blank"
            rel="noreferrer"
          >
            ohsomeNow Stats
          </a>{' '}
          and were last updated at{' '}
          <strong>{intl.formatDate(osmStatsMetadata?.max_timestamp, dateOptions)}</strong> (
          {intl.timeZone}).
        </span>
      </div>
    </div>
  );
};
