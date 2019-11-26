import React from 'react';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';

import messages from './messages';
import { useExploreProjectsQueryParams, stringify } from '../../hooks/UseProjectsQueryAPI';
import { MappingLevelMessage } from '../mappingLevel';
import { Dropdown } from '../dropdown';
import { ProjectSearchBox } from './projectSearchBox';
import { OrderBySelector } from './orderBy';
import { SwitchToggle } from '../switch';


const ShowMapToggle = props => {
  const dispatch = useDispatch();
  const isMapShown = useSelector(state => state.preferences['mapShown']);
  return (
    <SwitchToggle
      onChange={() => dispatch({ type: 'TOGGLE_MAP' })}
      isChecked={isMapShown}
      label={<FormattedMessage {...messages.showMapToggle} />}
    />
  );
};

const DifficultyDropdown = props => {
  return (
    <Dropdown
      onAdd={() => {}}
      onRemove={() => {}}
      onChange={n => {
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
        { label: <MappingLevelMessage level="ALL" className="" />, value: 'ALL' },
        { label: <MappingLevelMessage level="BEGINNER" className="" />, value: 'BEGINNER' },
        { label: <MappingLevelMessage level="INTERMEDIATE" className="" />, value: 'INTERMEDIATE' },
        { label: <MappingLevelMessage level="ADVANCED" className="" />, value: 'ADVANCED' },
      ]}
      display={<FormattedMessage {...messages.mappingDifficulty} />}
      className={'ba b--grey-light bg-white mr1 f6 v-mid dn dib-ns pv2'}
    />
  );
};

export const ProjectNav = props => {
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();
  const encodedParams = stringify(fullProjectsQuery)
    ? ['?', stringify(fullProjectsQuery)].join('')
    : '';

  const linkCombo = 'link ph3 f6 pv2 ba b--grey-light';

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
    props.location.pathname.indexOf('filters') > -1
      ? '/contribute' + encodedParams
      : './filters/' + encodedParams;

  // onSelectedItemChange={(changes) => console.log(changes)}
  return (
    /* mb1 mb2-ns (removed for map, but now small gap for more-filters) */
    <header className="bt bb b--tan w-100 ">
      <div className="mt2 mb1 ph2 dib lh-copy w-100 cf">
        <div className="w-90-ns w-100 fl dib">
          <div className="dib">
            <div className="mv2 dib">
              <DifficultyDropdown setQuery={setQuery} fullProjectsQuery={fullProjectsQuery} />
            </div>
            <Link
              to={filterRouteToggled}
              className={`dn mh1 di-l ${linkCombo} ${moreFiltersCurrentActiveStyle}`}
            >
              <FormattedMessage {...messages.moreFilters} />
            </Link>
            <Link
              to={filterRouteToggled}
              className={`di di-m dn-l mh1 ${linkCombo} ${moreFiltersCurrentActiveStyle}`}
            >
              <FormattedMessage {...messages.filters} />
            </Link>
            <OrderBySelector
              setQuery={setQuery}
              allQueryParams={fullProjectsQuery}
            />
            {!filterIsEmpty && (
              <Link to="./" className="red link ph3 f6 pv2 mv2 mh1 fr dn dib-l">
                <FormattedMessage {...messages.clearFilters} />
              </Link>
            )}

            <ProjectSearchBox
              className="dib fr mh1"
              setQuery={setQuery}
              fullProjectsQuery={fullProjectsQuery}
            />
          </div>
        </div>
        <div className="w-10-ns w-100 fr">
          <ShowMapToggle />
        </div>
      </div>
      {props.children}
    </header>
  );
};
