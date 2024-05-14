import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useTaskContributionQueryParams, stringify } from '../../hooks/UseTaskContributionAPI';
import MyTasksOrderDropdown from './myTasksOrderDropdown';
import MyProjectsDropdown from './myProjectsDropdown';

export const isActiveButton = (buttonName, contributionQuery) => {
  let isActive = false;
  try {
    if (contributionQuery.status.includes(buttonName)) {
      isActive = true;
    }
  } catch {
    if (contributionQuery.projectStatus === buttonName) {
      isActive = true;
    }
    if (buttonName === 'All' && !contributionQuery.projectStatus && !contributionQuery.status) {
      isActive = true;
    }
  }

  if (isActive) {
    return 'bg-blue-grey white fw5';
  } else {
    return 'bg-white blue-grey';
  }
};

export const MyTasksNav = (props) => {
  const [contributionsQuery, setContributionsQuery] = useTaskContributionQueryParams();

  const linkCombo = 'dib mh1 mb2 link ph3 f6 pv2 ba b--grey-light';
  const notAnyFilter = !stringify(contributionsQuery);
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header className="w-100">
      <div className="cf">
        <div className="w-75-l w-60 fl mt4">
          <h3 className="barlow-condensed blue-dark f2 ma0 v-mid dib ttu pl2 pl0-l">
            <FormattedMessage {...messages.myTasks} />
          </h3>
        </div>
      </div>
      <div className="mt2 mb1 dib lh-copy w-100 cf">
        <div className="w-100 fl dib">
          <div className="dib">
            <MyProjectsDropdown
              className={`fl f5 mt1 mt2-ns`}
              setQuery={setContributionsQuery}
              allQueryParams={contributionsQuery}
            />
            <MyTasksOrderDropdown
              className={`fl f5 mt1 mt2-ns`}
              setQuery={setContributionsQuery}
              allQueryParams={contributionsQuery}
            />
            {!notAnyFilter && (
              <Link to="./" className="red link ph3 f6 v-mid dib pv2 mh1 mt1 mt2-ns fr">
                <FormattedMessage {...messages.clearFilters} />
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="mv2">
        <Link to="" className={`${isActiveButton('All', contributionsQuery)} ${linkCombo}`}>
          <FormattedMessage {...messages.all} />
        </Link>
        <Link
          to="?status=MAPPED"
          className={`${isActiveButton('MAPPED', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.mapped} />
        </Link>
        <Link
          to="?status=VALIDATED"
          className={`${isActiveButton('VALIDATED', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.validated} />
        </Link>
        <Link
          to="?status=INVALIDATED"
          className={`${isActiveButton('INVALIDATED', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.invalidated} />
        </Link>
        <Link
          to="?projectStatus=ARCHIVED"
          className={`${isActiveButton('ARCHIVED', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.archived} />
        </Link>
      </div>
    </header>
  );
};
