import React from 'react';
import NavLink from '../header/NavLink';
import { Link } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';

import messages from './messages';
import { MappingLevelMessage } from '../mappingLevel';
import { Dropdown } from '../dropdown';

import { useExploreProjectsQueryParams, stringify } from '../../hooks/UseProjectsQueryAPI';
import { ProjectSearchBox } from './projectSearchBox';
import { TagFilterPickerAutocompleteDownshift } from './tagFilterPicker';

import OrderByPicker from './orderByPicker';

const ShowMapToggle = props => {
  const dispatch = useDispatch();
  const isMapShown = useSelector(state => state.preferences['mapShown']);
  return (
    <div className="fr pv2 dib-ns dn">
      <div className="flex items-center justify-center bg-grey-dark">
        <span className="di mr2 nowrap f6 blue-dark dn-m">
          <FormattedMessage {...messages.showMapToggle} />
        </span>
        <div className="relative dib">
          <input
            className="absolute z-5 w-100 h-100 o-0 pointer checkbox"
            type="checkbox"
            defaultChecked={isMapShown}
            onChange={e => dispatch({ type: 'TOGGLE_MAP' })}
          />
          <div className="relative z-4 dib w3 h2 bg-mid-gray overflow-hidden br4 v-mid bg-animate checkbox-wrapper">
            <div className="absolute right-auto left-0 w2 h2 br4 bg-white ba b-grey-light shadow-4 t-cb bg-animate checkbox-toggle"></div>
          </div>
        </div>
      </div>
    </div>
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
      display={
          <FormattedMessage {...messages.mappingDifficulty} />
      }
      className={'ba b--grey-light bg-white mr1 f6 v-mid dn dib-ns pv1'}
    />
  );
};

export const ProjectNav = props => {
  const [fullProjectsQuery, setQuery] = useExploreProjectsQueryParams();
  const {
    organisation: queryParamOrganisation,
    // campaign: queryParamCampaign
  } = fullProjectsQuery;
  const encodedParams = stringify(fullProjectsQuery)
    ? ['?', stringify(fullProjectsQuery)].join('')
    : '';

  const linkCombo = 'link ph3 f6 pv2 ba b--grey-light';

  const moreFiltersAnyActive =
    fullProjectsQuery.organisation ||
    fullProjectsQuery.location ||
    fullProjectsQuery.campaign ||
    fullProjectsQuery.types;
  const notAnyFilter = !stringify(fullProjectsQuery);
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
            <nav className="dn dib-l mh1">
              {!props.orgAPIState.isError && !props.orgAPIState.isLoading && (
                <TagFilterPickerAutocompleteDownshift
                  className={`${linkCombo} w4 truncate`}
                  tagOptionsFromAPI={props.orgAPIState}
                  queryParamSelectedItem={
                    queryParamOrganisation || <FormattedMessage {...messages.organisation} />
                  }
                  fieldsetName="organisation"
                  defaultSelectedItem=<FormattedMessage {...messages.organisations} />
                  setQuery={setQuery}
                  allQueryParams={fullProjectsQuery}
                />
              )}
              {/* <TagFilterPickerAutocomplete
                    className={`${linkCombo} w4 truncate`}
                    tagOptionsFromAPI={props.campaignAPIState}
                    queryParamSelectedItem={queryParamCampaign || <FormattedMessage {...messages.campaign} />}
                    fieldsetName="campaign"
                    defaultSelectedItem=<FormattedMessage {...messages.campaigns} />
                    setQuery={setQuery}
                    allQueryParams={fullProjectsQuery}
                  /> */}
            </nav>
            <NavLink
              to={filterRouteToggled}
              className={`dn mh1 di-l ${linkCombo} ${moreFiltersCurrentActiveStyle}`}
            >
              <FormattedMessage {...messages.moreFilters} />
            </NavLink>
            <NavLink
              to={filterRouteToggled}
              className={`di di-m dn-l mh1 ${linkCombo} ${moreFiltersCurrentActiveStyle}`}
            >
              <FormattedMessage {...messages.filters} />
            </NavLink>

            <OrderByPicker
              linkCombo={`${linkCombo} mh1`}
              moreFiltersCurrentActiveStyle={moreFiltersCurrentActiveStyle}
              setQuery={setQuery}
              allQueryParams={fullProjectsQuery}
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
