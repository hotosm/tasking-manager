import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

import { useExploreProjectsQueryParams, stringify } from '../../hooks/UseProjectsQueryAPI';
import { ProjectSearchBox } from './projectSearchBox';
import { OrderBySelector } from './orderBy';
import { ShowMapToggle } from './projectNav';

const isActiveButton = (buttonName, projectQuery) => {
  const allBoolean = projectQuery.createdByMe &&
    projectQuery.contributedToByMe &&
    projectQuery.favoritedByMe &&
    projectQuery.createdByMeArchived;
  if (Boolean(projectQuery[buttonName] === true) ^ Boolean(allBoolean) || (buttonName ==='All' && allBoolean)) {
    return 'bg-blue-dark grey-light';
  } else {
    return 'bg-white grey-light';
  }
}

export const MyProjectNav = props => {
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();

  const linkCombo = 'link ph3 f6 pv2 ba b--grey-light';
  const notAnyFilter = !stringify(fullProjectsQuery);

  // onSelectedItemChange={(changes) => console.log(changes)}
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header className="bt bb b--tan ">
      <div className="cf">
        <div className="w-75-l w-60 fl">
          <h3 className="dib fl f2 ttu barlow-condensed fw8 ph3">
            <FormattedMessage {...messages.myProjects} />
          </h3>
          <div className="w-10-ns pt4 fr">
          <ShowMapToggle />
        </div>
        </div>
      </div>
      <div className="mt2 mb1 ph2 dib lh-copy w-100 cf">
        <div className="w-90-ns w-100 fl dib">
          <div className="dib w-100">

            <div className="dib fl w-70-l"> <ProjectSearchBox
              className="dib fl mh1 w-70-l w-50"
              setQuery={setQuery}
              fullProjectsQuery={fullProjectsQuery}
              placeholder="Search (localize)" />

            <OrderBySelector
              className={`fl mt2`}
              setQuery={setQuery}
              allQueryParams={fullProjectsQuery}
            />
            </div>

            {!notAnyFilter && (
              <Link
                to="./"
                className={`red link ph3 f6 pv3-l mh1 fl`}
              >
                <FormattedMessage {...messages.clearFilters} />
              </Link>
            )}

          </div>
        </div>

      </div>
      <div className="ma2-ns">
              <Link
                to="/projects/?favoritedByMe=1&contributedToByMe=1&createdByMe=1&createdByMeArchived=1"
                className={`di di-m mh1 ${isActiveButton('All',fullProjectsQuery)}  strike ${linkCombo}
                `}
              >
                <FormattedMessage {...messages.allprojects} />
              </Link>
              <Link
                to="/projects/?favoritedByMe=1"
                className={`di di-m mh1 ${isActiveButton('favoritedByMe',fullProjectsQuery)} strike ${linkCombo}
                `}
              >
                <FormattedMessage {...messages.favorite} />
              </Link>
              <Link
              to={`/projects/?contributedToByMe=1`}
              className={`di di-m mh1  ${isActiveButton('contributedToByMe',fullProjectsQuery)} strike ${linkCombo} `}
            >
              <FormattedMessage {...messages.contributed} />
            </Link>
              <Link
              to={`/projects/?createdByMe=1`}
              className={`di di-m mh1 ${isActiveButton('createdByMe',fullProjectsQuery)}  ${linkCombo}`}
            >
              <FormattedMessage {...messages.created} />
            </Link>
              <Link
              to={`/projects/?createdByMeArchived=1`}
              className={`dib di-m mh1 ${isActiveButton('createdByMeArchived',fullProjectsQuery)} strike  ${linkCombo}`}
            >
              <FormattedMessage {...messages.archived} />
            </Link>
        </div>
      {props.children}
    </header>
  );
};
