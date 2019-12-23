import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

/*REMOVE ME*/
import { ProjectSearchBox } from '../projects/projectSearchBox';
import { useTaskContributionQueryParams, stringify } from '../../hooks/UseTaskContributionAPI';

const isActiveButton = (buttonName, contributionQuery) => {
  const allBoolean = !contributionQuery.archivedProjects;
  if (
    JSON.stringify(contributionQuery).indexOf(buttonName) !== -1 ||
    (buttonName === 'All' && allBoolean)
  ) {
    return 'bg-blue-dark grey-light';
  } else {
    return 'bg-white blue-grey';
  }
};

export const MyTasksNav = props => {
  const [contributionsQuery, setContributionsQuery] = useTaskContributionQueryParams();

  const linkCombo = 'link ph3 f6 pv2 ba b--grey-light';
  const notAnyFilter = !stringify(contributionsQuery);
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header className=" w-100 ">
      <div className="cf">
        <div className="w-75-l w-60 fl">
          <h3 className="f2 ttu barlow-condensed fw8">
            <FormattedMessage {...messages.myContributions} />
          </h3>
        </div>
      </div>
      <div className="mt2 mb1 ph2 dib lh-copy w-100 cf">
        <div className="w-90-ns w-100 fl dib">
          <div className="dib">
            <div className="mv2 dib"></div>

            <ProjectSearchBox
              className="dib fl mh1"
              setQuery={setContributionsQuery}
              fullProjectsQuery={contributionsQuery}
              placeholder="Search by Project ID"
            />

            {!notAnyFilter && (
              <Link
                to="./"
                className={`red link ph3 f6 pv2 mh1 fr
                    `}
              >
                <FormattedMessage {...messages.clearFilters} />
              </Link>
            )}
          </div>
        </div>
        <div className="w-10-ns w-100 fr">{/* <ShowMapToggle /> */}</div>
      </div>
      <div className="ma2">
        <Link
          to=""
          className={`di di-m mh1 ${isActiveButton('All', contributionsQuery)} ${linkCombo}`}
        >
          <FormattedMessage {...messages.all} />
        </Link>
        <Link
          to="?archivedProjects=1"
          className={`di di-m mh1 ${isActiveButton('archivedProjects', contributionsQuery)}  ${linkCombo}`}
        >
          <FormattedMessage {...messages.archive} />
        </Link>
      </div>
      {props.children}
    </header>
  );
};
