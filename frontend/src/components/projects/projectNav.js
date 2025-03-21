import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import messages from './messages';
import { useExploreProjectsQueryParams, stringify } from '../../hooks/UseProjectsQueryAPI';
import { DifficultyMessage } from '../mappingLevel';
import { Dropdown } from '../dropdown';
import { ProjectSearchBox } from './projectSearchBox';
import ClearFilters from './clearFilters';
import { OrderBySelector } from './orderBy';
import { ProjectsActionFilter } from './projectsActionFilter';
import { SwitchToggle } from '../formInputs';
import DownloadAsCSV from './downloadAsCSV';
import { GripIcon, ListIcon, FilledNineCellsGridIcon, TableListIcon } from '../svgIcons';

export const ShowMapToggle = (props) => {
  const dispatch = useDispatch();
  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const isExploreProjectsTableView = useSelector(
    (state) => state.preferences['isExploreProjectsTableView'],
  );

  useEffect(() => {
    if (isExploreProjectsTableView && isMapShown) {
      dispatch({ type: 'TOGGLE_MAP' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExploreProjectsTableView]);

  return (
    <div className={`fr pv2 dib-ns dn ${isExploreProjectsTableView ? 'moon-gray' : 'blue-dark'}`}>
      <SwitchToggle
        onChange={() => dispatch({ type: 'TOGGLE_MAP' })}
        isChecked={isMapShown}
        label={<FormattedMessage {...messages.showMapToggle} />}
        isDisabled={isExploreProjectsTableView}
      />
    </div>
  );
};

export const ProjectListViewToggle = (props) => {
  const dispatch = useDispatch();
  const listViewIsActive = useSelector((state) => state.preferences['projectListView']);
  return (
    <div className="fr pv2 dib-ns dn">
      <ListIcon
        height="25"
        width="25"
        role="graphics-symbol"
        className={`dib pointer v-mid ph1 ${listViewIsActive ? 'blue-grey' : 'blue-light'}`}
        onClick={() => dispatch({ type: 'TOGGLE_LIST_VIEW' })}
      />
      <GripIcon
        height="20"
        width="20"
        role="graphics-symbol"
        className={`dib pointer v-mid ph1 ${!listViewIsActive ? 'blue-grey' : 'blue-light'}`}
        onClick={() => dispatch({ type: 'TOGGLE_CARD_VIEW' })}
      />
    </div>
  );
};

const ExploreProjectsViewToggle = () => {
  const dispatch = useDispatch();
  const isExploreProjectsTableView = useSelector(
    (state) => state.preferences['isExploreProjectsTableView'],
  );

  return (
    <>
      <FilledNineCellsGridIcon
        height="21"
        width="21"
        role="graphics-symbol"
        className={`pointer ${isExploreProjectsTableView ? 'moon-gray' : 'blue-dark'}`}
        onClick={() => dispatch({ type: 'SET_EXPLORE_PROJECTS_CARD_VIEW' })}
      />
      <TableListIcon
        height="21"
        width="21"
        role="graphics-symbol"
        className={`pointer ${isExploreProjectsTableView ? 'blue-dark' : 'moon-gray'}`}
        onClick={() => dispatch({ type: 'SET_EXPLORE_PROJECTS_TABLE_VIEW' })}
      />
    </>
  );
};

const DifficultyDropdown = (props) => {
  return (
    <Dropdown
      onChange={(n) => {
        const value = n && n[0] && n[0].value;
        props.setQuery(
          {
            ...props.fullProjectsQuery,
            page: undefined,
            difficulty: value,
          },
          'pushIn',
        );
      }}
      value={props.fullProjectsQuery.difficulty || []}
      options={[
        { label: <DifficultyMessage level="ALL" className="" />, value: 'ALL' },
        { label: <DifficultyMessage level="EASY" className="" />, value: 'EASY' },
        { label: <DifficultyMessage level="MODERATE" className="" />, value: 'MODERATE' },
        { label: <DifficultyMessage level="CHALLENGING" className="" />, value: 'CHALLENGING' },
      ]}
      display={<FormattedMessage {...messages.mappingDifficulty} />}
      className={'ba b--tan bg-white mr3 f6 v-mid dn dib-ns pv2 br1 pl3 fw5 blue-dark'}
    />
  );
};

export const ProjectNav = ({ isExploreProjectsPage, children }) => {
  const location = useLocation();
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();
  const encodedParams = stringify(fullProjectsQuery)
    ? ['?', stringify(fullProjectsQuery)].join('')
    : '';
  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  const isExploreProjectsTableView = useSelector(
    (state) => state.preferences['isExploreProjectsTableView'],
  );

  useEffect(() => {
    setQuery(
      {
        ...fullProjectsQuery,
        omitMapResults: !isMapShown,
      },
      'pushIn',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapShown]);
  const linkCombo = 'link ph3 f6 pv2 ba b--tan br1 ph3 fw5';

  const moreFiltersAnyActive =
    fullProjectsQuery.organisation ||
    fullProjectsQuery.location ||
    fullProjectsQuery.campaign ||
    fullProjectsQuery.types ||
    fullProjectsQuery.partnerId ||
    fullProjectsQuery.partnershipFrom ||
    fullProjectsQuery.partnershipTo;
  const fullProjectsQueryCopy = { ...fullProjectsQuery };
  delete fullProjectsQueryCopy.omitMapResults;
  const filterIsEmpty = !stringify(fullProjectsQueryCopy);
  const moreFiltersCurrentActiveStyle = moreFiltersAnyActive
    ? 'bg-red white'
    : 'bg-white blue-dark';
  const filterRouteToggled =
    location.pathname.indexOf('filters') > -1
      ? '/explore' + encodedParams
      : './filters/' + encodedParams;
  let clearFiltersURL = './';
  if ((isExploreProjectsPage && isExploreProjectsTableView) || !isMapShown) {
    clearFiltersURL = './?omitMapResults=1';
  }

  // onSelectedItemChange={(changes) => console.log(changes)}
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header id="explore-nav" className="bt bb b--tan w-100 ">
      <div className="mt2 mb1 ph3 dib lh-copy w-100 cf">
        <div className="w-80-l w-90-m w-100 fl dib">
          <div className="dib">
            <div className="mv2 dib">
              <DifficultyDropdown setQuery={setQuery} fullProjectsQuery={fullProjectsQuery} />
            </div>
            <ProjectsActionFilter setQuery={setQuery} fullProjectsQuery={fullProjectsQuery} />
            <Link
              to={filterRouteToggled}
              id="more-filter-id"
              className={`dn mr3 dib-l lh-title f6 ${linkCombo} ${moreFiltersCurrentActiveStyle} blue-dark`}
            >
              <FormattedMessage {...messages.moreFilters} />
            </Link>
            <Link
              to={filterRouteToggled}
              className={`di dib-m dn-l mr3 lh-title f6 ${linkCombo} ${moreFiltersCurrentActiveStyle}`}
            >
              <FormattedMessage {...messages.filters} />
            </Link>
            <OrderBySelector
              setQuery={setQuery}
              allQueryParams={fullProjectsQuery}
              className="f6"
            />
            {!filterIsEmpty && (
              <ClearFilters url={clearFiltersURL} className="mv2 mh1 fr dn dib-l" />
            )}

            <ProjectSearchBox
              className="dib fr mh1"
              setQuery={setQuery}
              fullProjectsQuery={fullProjectsQuery}
            />
          </div>
          <DownloadAsCSV allQueryParams={fullProjectsQuery} />
        </div>
        <div className="w-20-l w-100 fr">
          <div className="flex items-center justify-end gap-1 mt1">
            <ShowMapToggle />
            <ExploreProjectsViewToggle />
          </div>
        </div>
      </div>
      {children}
    </header>
  );
};

ProjectNav.propTypes = {
  isExploreProjectsPage: PropTypes.bool.isRequired,
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
};
