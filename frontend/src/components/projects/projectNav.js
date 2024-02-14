import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';

import messages from './messages';
import { useExploreProjectsQueryParams, stringify } from '../../hooks/UseProjectsQueryAPI';
import { DifficultyMessage } from '../mappingLevel';
import { Dropdown } from '../dropdown';
import { ProjectSearchBox } from './projectSearchBox';
import ClearFilters from './clearFilters';
import { OrderBySelector } from './orderBy';
import { ProjectsActionFilter } from './projectsActionFilter';
import { SwitchToggle } from '../formInputs';
import { GripIcon, ListIcon } from '../svgIcons';

export const ShowMapToggle = (props) => {
  const dispatch = useDispatch();
  const isMapShown = useSelector((state) => state.preferences['mapShown']);
  return (
    <div className="fr pv2 dib-ns dn blue-dark">
      <SwitchToggle
        onChange={() => dispatch({ type: 'TOGGLE_MAP' })}
        isChecked={isMapShown}
        label={<FormattedMessage {...messages.showMapToggle} />}
      />
    </div>
  );
};

export const ProjetListViewToggle = (props) => {
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

export const ProjectNav = (props) => {
  const location = useLocation();
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();
  const encodedParams = stringify(fullProjectsQuery)
    ? ['?', stringify(fullProjectsQuery)].join('')
    : '';
  const isMapShown = useSelector((state) => state.preferences['mapShown']);

  useEffect(() => {
    setQuery(
      {
        ...fullProjectsQuery,
        omitMapResults:!isMapShown
      },
      'pushIn',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[isMapShown])
  const linkCombo = 'link ph3 f6 pv2 ba b--tan br1 ph3 fw5';

  const moreFiltersAnyActive =
    fullProjectsQuery.organisation ||
    fullProjectsQuery.location ||
    fullProjectsQuery.campaign ||
    fullProjectsQuery.types;
  const filterIsEmpty = !stringify(fullProjectsQuery);
  const moreFiltersCurrentActiveStyle = moreFiltersAnyActive
    ? 'bg-red white'
    : 'bg-white blue-dark';
  const filterRouteToggled =
    location.pathname.indexOf('filters') > -1
      ? '/explore' + encodedParams
      : './filters/' + encodedParams;

  // onSelectedItemChange={(changes) => console.log(changes)}
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header className="bt bb b--tan w-100 ">
      <div className="mt2 mb1 ph3 dib lh-copy w-100 cf">
        <div className="w-80-l w-90-m w-100 fl dib">
          <div className="dib">
            <div className="mv2 dib">
              <DifficultyDropdown setQuery={setQuery} fullProjectsQuery={fullProjectsQuery} />
            </div>
            <ProjectsActionFilter setQuery={setQuery} fullProjectsQuery={fullProjectsQuery} />
            <Link
              to={filterRouteToggled}
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
            {!filterIsEmpty && <ClearFilters url="./" className="mv2 mh1 fr dn dib-l" />}
            <ProjectSearchBox
              className="dib fr mh1"
              setQuery={setQuery}
              fullProjectsQuery={fullProjectsQuery}
            />
          </div>
        </div>
        <div className="w-20-l w-10-m w-100 fr">
          <ShowMapToggle />
        </div>
      </div>
      {props.children}
    </header>
  );
};
