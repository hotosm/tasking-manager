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

export const MyProjectNav = (props) => {
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const isOrgManager = useSelector((state) => state.auth.get('isOrgManager'));
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();

  const linkCombo = 'link ph3 f6 pv2 ba b--grey-light';
  const activeButtonClass = 'bg-blue-grey white fw5';
  const inactiveButtonClass = 'bg-white blue-grey';
  const notAnyFilter = !stringify(fullProjectsQuery);

  const isActiveButton = (buttonName, projectQuery) => {
    if (JSON.stringify(projectQuery).indexOf(buttonName) !== -1) {
      return activeButtonClass;
    } else {
      return inactiveButtonClass;
    }
  };

  return (
    <header className="bt bb b--tan">
      <div className="cf">
        <div className="w-75-l w-60 fl">
          <h3 className="barlow-condensed f2 ma0 pv3 dib v-mid ttu pl2 pl0-l">
            {props.management ? (
              <FormattedMessage {...messages.manageProjects} />
            ) : (
              <FormattedMessage {...messages.myProjects} />
            )}
          </h3>
          {(userDetails.role === 'ADMIN' || isOrgManager) && (
            <Link to={'/manage/projects/new/'} className="dib ml3">
              <AddButton />
            </Link>
          )}
        </div>
      </div>
      <div className="dib lh-copy w-100 cf">
        <div className="w-90-ns w-100 fl dib">
          <div className="cf w-100">
            <FormattedMessage {...messages.searchPlaceholder}>
              {(msg) => {
                return (
                  <ProjectSearchBox
                    className="dib fl mh1 w-40"
                    setQuery={setQuery}
                    fullProjectsQuery={fullProjectsQuery}
                    placeholder={msg}
                  />
                );
              }}
            </FormattedMessage>
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
        {!props.management && (
          <>
            <Link
              to={`./?mappedByMe=1`}
              className={`di mh1 ${isActiveButton('mappedByMe', fullProjectsQuery)} ${linkCombo}`}
            >
              <FormattedMessage {...messages.contributed} />
            </Link>
            <Link
              to="./?favoritedByMe=1"
              className={`di mh1 ${isActiveButton(
                'favoritedByMe',
                fullProjectsQuery,
              )} ${linkCombo}`}
            >
              <FormattedMessage {...messages.favorited} />
            </Link>
          </>
        )}
        {props.management && (userDetails.role === 'ADMIN' || isOrgManager) && (
          <>
            <Link
              to={`./?managedByMe=1`}
              className={`di mh1 ${
                fullProjectsQuery.managedByMe && !fullProjectsQuery.status
                  ? activeButtonClass
                  : inactiveButtonClass
              } ${linkCombo}`}
            >
              <FormattedMessage {...messages.active} />
            </Link>
            <Link
              to={`./?status=DRAFT&managedByMe=1`}
              className={`di mh1 ${isActiveButton('DRAFT', fullProjectsQuery)} ${linkCombo}`}
            >
              <FormattedMessage {...messages.draft} />
            </Link>
            <Link
              to={`./?status=ARCHIVED&managedByMe=1`}
              className={`di mh1 ${isActiveButton('ARCHIVED', fullProjectsQuery)} ${linkCombo}`}
            >
              <FormattedMessage {...messages.archived} />
            </Link>
            <Link
              to={`./?createdByMe=1`}
              className={`di mh1 ${isActiveButton('createdByMe', fullProjectsQuery)} ${linkCombo}`}
            >
              <FormattedMessage {...messages.created} />
            </Link>
          </>
        )}
      </div>
      {props.children}
    </header>
  );
};
