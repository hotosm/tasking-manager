import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ProjectSearchBox } from '../projects/projectSearchBox';
import { useTaskContributionQueryParams, stringify } from '../../hooks/UseTaskContributionAPI';

const isActiveButton = (buttonName, contributionQuery) => {
  const allBoolean = !contributionQuery.projectStatus && !contributionQuery.status;
  if (
    JSON.stringify(contributionQuery).indexOf(buttonName) !== -1 ||
    (buttonName === 'All' && allBoolean)
  ) {
    return 'bg-blue-grey white fw5';
  } else {
    return 'bg-white blue-grey';
  }
};

export const MyTasksNav = (props) => {
  const [contributionsQuery, setContributionsQuery] = useTaskContributionQueryParams();

  const linkCombo = 'link ph3 f6 pv2 ba b--grey-light';
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
            <div className="mv2 dib"></div>
            <FormattedMessage {...messages.searchProject}>
              {(msg) => {
                return (
                  <ProjectSearchBox
                    className="dib fl mh1"
                    setQuery={setContributionsQuery}
                    fullProjectsQuery={contributionsQuery}
                    placeholder={msg}
                  />
                );
              }}
            </FormattedMessage>
            {!notAnyFilter && (
              <Link to="./" className="red link ph3 f6 v-mid dib pv2 mh1 mt1 mt2-ns fr">
                <FormattedMessage {...messages.clearFilters} />
              </Link>
            )}
          </div>
        </div>
      </div>
      <div className="mv2" style={{ lineHeight: "200%" }}>
        <Link to="" className={`di mh1 ${isActiveButton('All', contributionsQuery)} ${linkCombo}`}>
          <FormattedMessage {...messages.all} />
        </Link>
        <Link
          to="?status=MAPPED"
          className={`di mh1 ${isActiveButton('MAPPED', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.mapped} />
        </Link>
        <Link
          to="?status=VALIDATED"
          className={`di mh1 ${isActiveButton(
            'status=VALIDATED',
            contributionsQuery,
          )}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.validated} />
        </Link>
        <Link
          to="?status=INVALIDATED"
          className={`di mh1 ${isActiveButton('INVALIDATED', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.invalidated} />
        </Link>
        <Link
          to="?projectStatus=ARCHIVED"
          className={`di mh1 ${isActiveButton('projectStatus', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.archived} />
        </Link>
      </div>
      {props.children}
    </header>
  );
};
