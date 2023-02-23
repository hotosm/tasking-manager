import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { AddButton } from '../teamsAndOrgs/management';
import { useExploreProjectsQueryParams, stringify } from '../../hooks/UseProjectsQueryAPI';
import { useFetch } from '../../hooks/UseFetch';
import { ProjectSearchBox } from './projectSearchBox';
import ClearFilters from './clearFilters';
import { ProjectFilterSelect } from './filterSelectFields';
import { OrderBySelector } from './orderBy';
import { ShowMapToggle, ProjetListViewToggle } from './projectNav';
import { CustomButton } from '../button';

export const MyProjectNav = (props) => {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const isOrgManager = useSelector(
    (state) => state.auth.organisations && state.auth.organisations.length > 0,
  );
  const isPMTeamMember = useSelector(
    (state) => state.auth.pmTeams && state.auth.pmTeams.length > 0,
  );
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();
  const notAnyFilter = !stringify(fullProjectsQuery);

  const isActiveButton = (buttonName, projectQuery) =>
    JSON.stringify(projectQuery).indexOf(buttonName) !== -1 ? true : false;

  const projectStatusMenus = [
    {
      isActiveArg: 'PUBLISHED',
      label: <FormattedMessage {...messages.active} />,
      queryParams: {
        status: 'PUBLISHED',
        stale: undefined,
      },
    },
    {
      isActiveArg: 'DRAFT',
      label: <FormattedMessage {...messages.draft} />,
      queryParams: {
        status: 'DRAFT',
        stale: undefined,
      },
    },
    {
      isActiveArg: 'ARCHIVED',
      label: <FormattedMessage {...messages.archived} />,
      queryParams: {
        status: 'ARCHIVED',
        stale: undefined,
      },
    },
    {
      isActiveArg: 'stale',
      label: <FormattedMessage {...messages.stale} />,
      queryParams: {
        status: undefined,
        stale: 1,
      },
    },
  ];

  return (
    <header className="bt bb b--tan">
      <div className="cf pt4">
        <h3 className="barlow-condensed blue-dark f2 ma0 pb2 dib v-mid ttu">
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
      <div className="dib lh-copy w-100 cf">
        <div className="w-90-ns w-100 fl dib">
          <div className="cf w-100">
            <FormattedMessage {...messages.searchPlaceholder}>
              {(msg) => {
                return (
                  <ProjectSearchBox
                    className="dib fl ph1 w-20-l w-25-m w-100 ph1"
                    setQuery={setQuery}
                    fullProjectsQuery={fullProjectsQuery}
                    placeholder={msg}
                  />
                );
              }}
            </FormattedMessage>
            {props.management && <ManagerFilters query={fullProjectsQuery} setQuery={setQuery} />}
            <div className="w-40-ns w-100 fl dib ph1">
              <OrderBySelector
                className={`fl f5 mt1 mt2-ns`}
                setQuery={setQuery}
                allQueryParams={fullProjectsQuery}
              />

              {!notAnyFilter && (
                <ClearFilters
                  url={
                    props.management
                      ? './?status=PUBLISHED&managedByMe=1&action=any'
                      : './?mappedByMe=1&action=any'
                  }
                  className="v-top mh1 mt1 mt2-ns dib"
                />
              )}
            </div>
          </div>
          <div className="mt1 mb3 cf">
            {!props.management && (
              <>
                <FilterButton
                  query={fullProjectsQuery}
                  newQueryParams={{
                    favoritedByMe: undefined,
                    mappedByMe: 1,
                    managedByMe: undefined,
                    createdByMe: undefined,
                    status: undefined,
                  }}
                  setQuery={setQuery}
                  isActive={isActiveButton('mappedByMe', fullProjectsQuery)}
                >
                  <FormattedMessage {...messages.contributed} />
                </FilterButton>
                <FilterButton
                  query={fullProjectsQuery}
                  newQueryParams={{
                    favoritedByMe: 1,
                    mappedByMe: undefined,
                    managedByMe: undefined,
                    createdByMe: undefined,
                    status: undefined,
                  }}
                  setQuery={setQuery}
                  isActive={isActiveButton('favoritedByMe', fullProjectsQuery)}
                >
                  <FormattedMessage {...messages.favorited} />
                </FilterButton>
                {(isPMTeamMember || isOrgManager) && (
                  <FilterButton
                    query={fullProjectsQuery}
                    newQueryParams={{
                      favoritedByMe: undefined,
                      mappedByMe: undefined,
                      createdByMe: undefined,
                      managedByMe: 1,
                      status: undefined,
                    }}
                    setQuery={setQuery}
                    isActive={fullProjectsQuery.managedByMe}
                  >
                    <FormattedMessage {...messages.managed} />
                  </FilterButton>
                )}
                <FilterButton
                  query={fullProjectsQuery}
                  newQueryParams={{
                    favoritedByMe: undefined,
                    mappedByMe: undefined,
                    managedByMe: undefined,
                    createdByMe: 1,
                    status: undefined,
                  }}
                  setQuery={setQuery}
                  isActive={isActiveButton('createdByMe', fullProjectsQuery)}
                >
                  <FormattedMessage {...messages.created} />
                </FilterButton>
              </>
            )}
            {props.management && (userDetails.role === 'ADMIN' || isOrgManager) && (
              <>
                <div className="dib pr4">
                  {projectStatusMenus.map((menu) => (
                    <FilterButton
                      key={menu.isActiveArg}
                      query={fullProjectsQuery}
                      newQueryParams={menu.queryParams}
                      setQuery={setQuery}
                      isActive={isActiveButton(menu.isActiveArg, fullProjectsQuery)}
                    >
                      {menu.label}
                    </FilterButton>
                  ))}
                </div>
                <FilterButton
                  query={fullProjectsQuery}
                  newQueryParams={{
                    managedByMe: undefined,
                    createdByMe: 1,
                  }}
                  setQuery={setQuery}
                  isActive={isActiveButton('createdByMe', fullProjectsQuery)}
                >
                  <FormattedMessage {...messages.created} />
                </FilterButton>
                <FilterButton
                  query={fullProjectsQuery}
                  newQueryParams={{ managedByMe: 1, createdByMe: undefined }}
                  setQuery={setQuery}
                  isActive={isActiveButton('managedByMe', fullProjectsQuery)}
                >
                  <FormattedMessage {...messages.managed} />
                </FilterButton>
              </>
            )}
          </div>
        </div>
        <div className="w-10-ns w-100 fr tr">
          <ShowMapToggle />
          {props.management && <ProjetListViewToggle />}
        </div>
      </div>
    </header>
  );
};

export function FilterButton({
  currentQuery,
  newQueryParams,
  setQuery,
  isActive,
  children,
}: Object) {
  const linkCombo = 'di mh1 link ph3 f6 pv2 mv1 ba b--grey-light';
  return (
    <CustomButton
      onClick={() => setQuery({ ...currentQuery, page: undefined, ...newQueryParams })}
      className={`${isActive ? 'bg-blue-grey white fw5' : 'bg-white blue-grey'} ${linkCombo}`}
    >
      {children}
    </CustomButton>
  );
}

function ManagerFilters({ query, setQuery }: Object) {
  const userDetails = useSelector((state) => state.auth.userDetails);
  const [campaignsError, campaignsLoading, campaigns] = useFetch('campaigns/');
  const [orgsError, orgsLoading, organisations] = useFetch(
    `organisations/?omitManagerList=true${
      userDetails.role === 'ADMIN' ? '' : `&manager_user_id=${userDetails.id}`
    }`,
    userDetails && userDetails.id,
  );
  const { campaign: campaignInQuery, organisation: orgInQuery } = query;
  return (
    <>
      <ProjectFilterSelect
        fieldsetName="campaign"
        fieldsetStyle={'w-20-l w-25-m w-50 fl mh0 ph1 pv2 v-top bn dib'}
        titleStyle={'dn'}
        selectedTag={campaignInQuery}
        options={{
          isError: campaignsError,
          isLoading: campaignsLoading,
          tags: Object.keys(campaigns).length > 0 ? campaigns.campaigns : [],
        }}
        setQueryForChild={setQuery}
        allQueryParamsForChild={query}
      />

      <ProjectFilterSelect
        fieldsetName="organisation"
        fieldsetStyle={'w-20-l w-25-m w-50 fl ph1 pv2 mh0 v-top bn dib'}
        titleStyle={'dn'}
        selectedTag={orgInQuery}
        options={{
          isError: orgsError,
          isLoading: orgsLoading,
          tags: Object.keys(organisations).length > 0 ? organisations.organisations : [],
        }}
        setQueryForChild={setQuery}
        allQueryParamsForChild={query}
      />
    </>
  );
}
