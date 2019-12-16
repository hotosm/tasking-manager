import React from 'react';
import { Link } from '@reach/router';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { AddButton } from '../teamsAndOrgs/management';
import { useExploreProjectsQueryParams, stringify } from '../../hooks/UseProjectsQueryAPI';
import { ProjectSearchBox } from './projectSearchBox';
import { OrderBySelector } from './orderBy';
import { ShowMapToggle } from './projectNav';

const isActiveButton = (buttonName, projectQuery) => {
  const allBoolean =
    projectQuery.createdByMe &&
    projectQuery.contributedToByMe &&
    projectQuery.favoritedByMe &&
    projectQuery.createdByMeArchived;
  if (
    Boolean(projectQuery[buttonName] === true) ^ Boolean(allBoolean) ||
    (buttonName === 'All' && allBoolean)
  ) {
    return 'bg-blue-grey white';
  } else {
    return 'bg-white grey-light';
  }
};

export const MyProjectNav = props => {
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();

  const linkCombo = 'link ph3 f6 pv2 ba b--grey-light';
  const notAnyFilter = !stringify(fullProjectsQuery);

  // onSelectedItemChange={(changes) => console.log(changes)}
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header className="bt bb b--tan">
      <div className="cf">
        <div className="w-75-l w-60 fl">
          <h3 className="barlow-condensed f2 ma0 pv3 v-mid dib ttu pl2 pl0-l">
            <FormattedMessage {...messages.myProjects} />
          </h3>
          {userDetails && ['ADMIN', 'PROJECT_MANAGER'].includes(userDetails.role) &&
            <Link to={'new/'} className="dib ml3">
              <AddButton />
            </Link>
          }
        </div>
      </div>
      <div className="dib lh-copy w-100 cf">
        <div className="w-90-ns w-100 fl dib">
          <div className="cf w-100">
            <ProjectSearchBox
              className="dib fl mh1 w-40"
              setQuery={setQuery}
              fullProjectsQuery={fullProjectsQuery}
              placeholder="Search (localize)"
            />
            <OrderBySelector
              className={`fl mt1 mt2-ns`}
              setQuery={setQuery}
              allQueryParams={fullProjectsQuery}
            />

            {!notAnyFilter && (
              <Link to="./" className={`red link ph3 f6 v-top mh1 mt1 mt2-ns pv2 dib`}>
                <FormattedMessage {...messages.clearFilters} />
              </Link>
            )}
          </div>
        </div>
        <div className="w-10-ns w-100 fr">
          <ShowMapToggle />
        </div>
      </div>
      <div className="mt2 mb3">
        <Link
          to="/projects/?favoritedByMe=1&contributedToByMe=1&createdByMe=1&createdByMeArchived=1"
          className={`di mh1 ${isActiveButton('All', fullProjectsQuery)} strike ${linkCombo}`}
        >
          <FormattedMessage {...messages.allprojects} />
        </Link>
        <Link
          to="/projects/?favoritedByMe=1"
          className={`di mh1 ${isActiveButton(
            'favoritedByMe',
            fullProjectsQuery,
          )} strike ${linkCombo}`}
        >
          <FormattedMessage {...messages.favorite} />
        </Link>
        <Link
          to={`/projects/?contributedToByMe=1`}
          className={`di mh1 ${isActiveButton(
            'contributedToByMe',
            fullProjectsQuery,
          )} strike ${linkCombo}`}
        >
          <FormattedMessage {...messages.contributed} />
        </Link>
        <Link
          to={`/projects/?createdByMe=1`}
          className={`di mh1 ${isActiveButton('createdByMe', fullProjectsQuery)} ${linkCombo}`}
        >
          <FormattedMessage {...messages.created} />
        </Link>
        <Link
          to={`/projects/?createdByMeArchived=1`}
          className={`di mh1 ${isActiveButton(
            'createdByMeArchived',
            fullProjectsQuery,
          )} strike ${linkCombo}`}
        >
          <FormattedMessage {...messages.archived} />
        </Link>
      </div>
      {props.children}
    </header>
  );
};
