import { getYear } from 'date-fns';
import { FormattedMessage, FormattedNumber } from 'react-intl';

import messages from './messages';
import { StatsCardContent } from '../statsCard';
import { ProgressBar } from '../progressBar';
import { usePredictYearlyTasks } from '../../hooks/UsePredictYearlyTasks';
import {
  useOrganisationLevel,
  usePredictLevel,
  useGetLevel,
  levels,
} from '../../hooks/UseOrganisationLevel';

// this component is designed to the FREE organisation type
export function OrganisationUsageLevel({ completedActions, orgName }) {
  const [currentLevel, nextLevelThreshold] = useOrganisationLevel(completedActions);
  const percent = parseInt((completedActions / nextLevelThreshold) * 100);
  const yearPrediction = usePredictYearlyTasks(completedActions, new Date());
  const levelPrediction = usePredictLevel(yearPrediction, 'FREE');
  const currentYear = getYear(new Date());

  return (
    <div className="w-100 cf pb2">
      <div className="cf ph2 bg-white">
        <div className="w-10-l w-20-m w-100 fl">
          <h1
            className="relative tc w-100 dib red barlow-condensed ma0 ph4 v-mid top--1"
            style={{ fontSize: '8rem' }}
          >
            {currentLevel.level}
          </h1>
        </div>
        <div className="w-60-ns w-100 fl pl2-ns">
          {nextLevelThreshold && (
            <ProgressBar height={2} className="pt3 mt4 bg-white" secondBarValue={percent}>
              <p className="f6 lh-copy ma0 white f7 fw4">
                <FormattedMessage
                  {...messages.levelTooltip}
                  values={{
                    n: <FormattedNumber value={completedActions} />,
                    total: <FormattedNumber value={nextLevelThreshold} />,
                    percent: percent,
                    nextLevel: <strong>{currentLevel.level + 1}</strong>,
                  }}
                />
              </p>
            </ProgressBar>
          )}
        </div>
        <div className="w-100 fl mt3">
          {nextLevelThreshold && (
            <div className="pa2 w-25-l w-50-m w-100 fl">
              <div className="cf pa3 bg-white shadow-4">
                <StatsCardContent
                  label={
                    <FormattedMessage {...messages.estimatedLevel} values={{ year: currentYear }} />
                  }
                  className="tc"
                  value={<FormattedNumber value={levelPrediction.level} />}
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
                      {...messages.actionsToNextLevel}
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
        {!nextLevelThreshold && ( // message on level 5 organisations
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

// this component is designed to the DISCOUNTED and FULL_FEE organisations
export function OrganisationTier({ completedActions, type, subscriptionTier }) {
  const yearPrediction = usePredictYearlyTasks(completedActions, new Date());
  const levelPrediction = usePredictLevel(yearPrediction, type);
  const selectedTier = subscriptionTier
    ? levels.filter((level) => level.level === subscriptionTier)[0]
    : null;
  const selectedTierMax =
    selectedTier && selectedTier.level < 5
      ? levels.filter((level) => level.level === selectedTier.level + 1)[0].minActions
      : null;
  const nextLevel = useGetLevel(selectedTierMax);
  const percent = parseInt((completedActions / selectedTierMax) * 100);
  const showDiscountLabel = levelPrediction.tier !== 'free' && type === 'DISCOUNTED';
  const currentYear = getYear(new Date());

  return (
    <div className="w-100 cf pb2">
      <div className="cf ph2 bg-white">
        <div className="w-20-l w-third-m w-100 fl tc">
          <h1 className="relative f1 tc w-100 dib ttu red barlow-condensed ma0 pt2 mt3">
            {selectedTier && <FormattedMessage {...messages[`${selectedTier.tier}Tier`]} />}
          </h1>
          <span className={`ma0 h2 f7 b blue-grey`}>
            <FormattedMessage {...messages.subscribedTier} />
          </span>
        </div>
        <div className="w-50-l w-two-thirds-m w-100 fl pl2-ns">
          {selectedTierMax && (
            <ProgressBar height={2} className="pt1 mt4 bg-white" secondBarValue={percent}>
              <p className="f6 lh-copy ma0 white f7 fw4">
                <FormattedMessage
                  {...messages.tierTooltip}
                  values={{
                    n: <FormattedNumber value={completedActions} />,
                    total: <FormattedNumber value={selectedTierMax} />,
                    percent: percent,
                    nextTier: (
                      <strong>
                        <FormattedMessage {...messages[`${nextLevel.tier}Tier`]} />
                      </strong>
                    ),
                  }}
                />
              </p>
            </ProgressBar>
          )}
        </div>
        <div className="w-100 fl mt3">
          <div className="pa2 w-25-l w-50-m w-100 fl">
            <div className="cf pa3 bg-white shadow-4">
              <StatsCardContent
                label={
                  <FormattedMessage {...messages.estimatedTier} values={{ year: currentYear }} />
                }
                className="tc"
                value={
                  <span className="ttu">
                    <FormattedMessage {...messages[`${levelPrediction.tier}Tier`]} />
                  </span>
                }
              />
            </div>
          </div>
          <div className="pa2 w-25-l w-50-m w-100 fl">
            <div className="cf pa3 bg-white shadow-4">
              <StatsCardContent
                label={
                  <FormattedMessage {...messages.estimatedCost} values={{ year: currentYear }} />
                }
                className="tc"
                value={
                  <>
                    <FormattedNumber
                      value={levelPrediction.fee}
                      // eslint-disable-next-line
                      style="currency"
                      currency="USD"
                    />
                    {showDiscountLabel ? (
                      <span className="f4 ttl">
                        {' '}
                        (<FormattedMessage {...messages.discounted} />)
                      </span>
                    ) : (
                      ''
                    )}
                  </>
                }
              />
            </div>
          </div>
          {selectedTierMax && (
            <div className="pa2 w-25-l w-50-m w-100 fl">
              <div className="cf pa3 bg-white shadow-4">
                <StatsCardContent
                  label={
                    <FormattedMessage
                      {...messages.actionsRemaining}
                      values={{
                        name: <FormattedMessage {...messages[`${selectedTier.tier}Tier`]} />,
                      }}
                    />
                  }
                  className="tc"
                  value={
                    <FormattedNumber
                      value={
                        completedActions < selectedTierMax ? selectedTierMax - completedActions : 0
                      }
                    />
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
