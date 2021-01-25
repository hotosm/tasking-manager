import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { ProgressBar } from '../progressBar';

export function OrganisationUsageLevel({ completedActions, orgName }) {
  const levels = [
    { level: 5, minActions: 50000 },
    { level: 4, minActions: 25000 },
    { level: 3, minActions: 10000 },
    { level: 2, minActions: 1000 },
    { level: 1, minActions: 0 },
  ];
  const currentLevel = completedActions
    ? levels.filter((level) => completedActions >= level.minActions)[0].level
    : 1;
  const nextLevelThreshold =
    currentLevel < 5
      ? levels.filter((item) => item.level === currentLevel + 1)[0].minActions
      : null;
  const percent = parseInt((completedActions / nextLevelThreshold) * 100);
  return (
    <div className="w-100 cf">
      <div className="cf ph2 bg-white">
        <div className="w-10 w-20-m fl">
          <h1
            className="relative tc w-100 dib red barlow-condensed ma0 ph4 v-mid top--1"
            style={{ fontSize: '8rem' }}
          >
            {currentLevel}
          </h1>
        </div>
        <div className="w-60-l w-80-m w-100 fl pl2-ns">
          {nextLevelThreshold && (
            <ProgressBar height={2} className="pt3 mt4 bg-white" secondBarValue={percent}>
              <p className="f6 lh-copy ma0 white f7 fw4">
                <FormattedMessage
                  {...messages.levelTooltip}
                  values={{
                    n: <FormattedNumber value={completedActions} />,
                    total: <FormattedNumber value={nextLevelThreshold} />,
                    percent: percent,
                    nextLevel: <strong>{currentLevel + 1}</strong>,
                  }}
                />
              </p>
            </ProgressBar>
          )}
        </div>
        <div className="w-100 fl">
          <p>
            <FormattedMessage
              {...messages.levelInfo}
              values={{
                org: <strong>{orgName}</strong>,
                level: currentLevel,
              }}
            />{' '}
            {nextLevelThreshold ? (
              <FormattedMessage
                {...messages.nextLevelInfo}
                values={{
                  n: (
                    <strong>
                      <FormattedNumber value={nextLevelThreshold - completedActions} />
                    </strong>
                  ),
                  nextLevel: currentLevel + 1,
                }}
              />
            ) : (
              <FormattedMessage {...messages.topLevelInfo} />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
