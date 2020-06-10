import React from 'react';
import { Link } from '@reach/router';
import { useQueryParam } from 'use-query-params';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { useTagAPI } from '../../hooks/UseTagAPI';
import { useExploreProjectsQueryParams } from '../../hooks/UseProjectsQueryAPI';
import { MappingTypeFilterPicker } from './mappingTypeFilterPicker';
import { ProjectFilterSelect } from './filterSelectFields';
import { CommaArrayParam } from '../../utils/CommaArrayParam';
import { formatFilterCountriesData } from '../../utils/countries';

export const MoreFiltersForm = (props) => {
  /* one useQueryParams for the main form */
  const [formQuery, setFormQuery] = useExploreProjectsQueryParams();

  const handleInputChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (name === 'types') {
      //handle mappingTypes toggles in its separate fn inside that component
      return;
    }
    setFormQuery(
      {
        ...formQuery,
        page: undefined,
        [name]: value,
      },
      'pushIn',
    );
  };

  /* dereference the formQuery */
  const {
    campaign: campaignInQuery,
    organisation: orgInQuery,
    location: countryInQuery,
  } = formQuery;
  const [campaignAPIState] = useTagAPI([], 'campaigns');
  const [orgAPIState] = useTagAPI([], 'organisations');
  const [countriesAPIState] = useTagAPI([], 'countries', formatFilterCountriesData);

  /* another useQueryParam for the second form */
  const [mappingTypesInQuery, setMappingTypes] = useQueryParam('types', CommaArrayParam);

  const fieldsetStyle = 'w-100 bn';
  const titleStyle = 'w-100 db ttu fw5 blue-grey';

  return (
    <form className="pt4" onChange={handleInputChange}>
      <fieldset id="mappingType" className={fieldsetStyle}>
        <legend className={titleStyle}>
          <FormattedMessage {...messages.typesOfMapping} />
        </legend>
        <MappingTypeFilterPicker
          mappingTypes={mappingTypesInQuery}
          setMappingTypesQuery={setMappingTypes}
        />
      </fieldset>

      <ProjectFilterSelect
        fieldsetName="campaign"
        fieldsetStyle={fieldsetStyle}
        titleStyle={titleStyle}
        selectedTag={campaignInQuery}
        options={campaignAPIState}
        setQueryForChild={setFormQuery}
        allQueryParamsForChild={formQuery}
      />

      <ProjectFilterSelect
        fieldsetName="organisation"
        fieldsetStyle={`${fieldsetStyle} mt3`}
        titleStyle={titleStyle}
        selectedTag={orgInQuery}
        options={orgAPIState}
        setQueryForChild={setFormQuery}
        allQueryParamsForChild={formQuery}
      />

      <ProjectFilterSelect
        fieldsetName="location"
        fieldsetStyle={`${fieldsetStyle} mt3`}
        titleStyle={titleStyle}
        selectedTag={countryInQuery}
        options={countriesAPIState}
        setQueryForChild={setFormQuery}
        allQueryParamsForChild={formQuery}
      />
      <div className="tr w-100 mt3">
        <Link to="/explore">
          <Button className="bg-white blue-dark mr1 f6 pv2">
            <FormattedMessage {...messages.clear} />
          </Button>
        </Link>
        <Link to={props.currentUrl}>
          <Button className="white bg-red mr1 f6 dib pv2">
            <FormattedMessage {...messages.apply} />
          </Button>
        </Link>
      </div>
    </form>
  );
};
