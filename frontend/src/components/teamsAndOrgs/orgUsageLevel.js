import React from 'react';
import { getYear } from 'date-fns';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { StatsCardContent } from '../statsCardContent';
import { ProgressBar } from '../progressBar';
import { usePredictYearlyTasks } from '../../hooks/UsePredictYearlyTasks';
import { useOrganisationLevel, useGetLevel } from '../../hooks/UseOrganisationLevel';

export function OrganisationUsageLevel({ completedActions, orgName, type, userIsOrgManager }) {
  const [currentLevel, nextLevelThreshold] = useOrganisationLevel(completedActions);
  const percent = parseInt((completedActions / nextLevelThreshold) * 100);
  const yearPrediction = usePredictYearlyTasks(completedActions, new Date());
  const levelPrediction = useGetLevel(yearPrediction);

  const showTierInfo = ['DISCOUNTED', 'FULL_FEE'].includes(type) && userIsOrgManager;
  const currentYear = getYear(new Date());

  return (
    <div className="w-100 cf pb2">
      <div className="cf ph2 bg-white">
        <div className={`${showTierInfo ? 'w-20-l w-third-m' : 'w-10-l w-20-m'} w-100 fl`}>
          {showTierInfo ? (
            <h1 className="relative f1 tc w-100 dib ttu red barlow-condensed ma0 pv2 mt3">
              <FormattedMessage {...messages[`${currentLevel.tier}Tier`]} />
            </h1>
          ) : (
            <h1
              className="relative tc w-100 dib red barlow-condensed ma0 ph4 v-mid top--1"
              style={{ fontSize: '8rem' }}
            >
              {currentLevel.level}
            </h1>
          )}
        </div>
        <div className={`${showTierInfo ? 'w-50-l w-two-thirds-m' : 'w-60-ns'} w-100 fl pl2-ns`}>
          {nextLevelThreshold && (
            <ProgressBar
              height={2}
              className={`${showTierInfo ? 'pt1' : 'pt3'} mt4 bg-white`}
              secondBarValue={percent}
            >
              <p className="f6 lh-copy ma0 white f7 fw4">
                <FormattedMessage
                  {...messages[showTierInfo ? 'tierTooltip' : 'levelTooltip']}
                  values={{
                    n: <FormattedNumber value={completedActions} />,
                    total: <FormattedNumber value={nextLevelThreshold} />,
                    percent: percent,
                    nextTier: (
                      <strong>
                        <FormattedMessage {...messages[`${levelPrediction.tier}Tier`]} />
                      </strong>
                    ),
                    nextLevel: <strong>{currentLevel.level + 1}</strong>,
                  }}
                />
              </p>
            </ProgressBar>
          )}
        </div>
        <div className="w-100 fl mt3">
          {(nextLevelThreshold || showTierInfo) && (
            <div className="pa2 w-25-l w-50-m w-100 fl">
              <div className="cf pa3 bg-white shadow-4">
                <StatsCardContent
                  label={
                    <FormattedMessage
                      {...messages[showTierInfo ? 'estimatedTier' : 'estimatedLevel']}
                      values={{ year: currentYear }}
                    />
                  }
                  className="tc"
                  value={
                    showTierInfo ? (
                      <span className="ttu">
                        <FormattedMessage {...messages[`${levelPrediction.tier}Tier`]} />
                      </span>
                    ) : (
                      <FormattedNumber value={levelPrediction.level} />
                    )
                  }
                />
              </div>
            </div>
          )}
          {showTierInfo && (
            <div className="pa2 w-25-l w-50-m w-100 fl">
              <div className="cf pa3 bg-white shadow-4">
                <StatsCardContent
                  label={
                    <FormattedMessage {...messages.estimatedCost} values={{ year: currentYear }} />
                  }
                  className="tc"
                  value={
                    // eslint-disable-next-line
                    <FormattedNumber value={levelPrediction.fee} style="currency" currency="USD" />
                  }
                />
              </div>
            </div>
          )}
          {nextLevelThreshold && (
            <div className="pa2 w-25-l w-50-m w-100 fl">
              <div className="cf pa3 bg-white shadow-4">
                <StatsCardContent
                  label={
                    <FormattedMessage
                      {...messages[showTierInfo ? 'actionsToNextTier' : 'actionsToNextLevel']}
                      values={{ n: currentLevel.level + 1 }}
                    />
                  }
                  className="tc"
                  value={<FormattedNumber value={nextLevelThreshold - completedActions} />}
                />
              </div>
            </div>
          )}
        </div>
        {!nextLevelThreshold &&
          !showTierInfo && ( // message on level 5 FREE tier organisations
            <div className="w-100 fl pv2">
              <div>
                <FormattedMessage
                  {...messages.levelInfo}
                  values={{
                    org: <strong>{orgName}</strong>,
                    level: currentLevel.level,
                  }}
                />{' '}
                <FormattedMessage {...messages.topLevelInfo} />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
