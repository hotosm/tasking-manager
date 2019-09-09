import React from 'react';
import { HomeIcon, RoadIcon, WavesIcon, TaskIcon } from '../svgIcons';

import { useTagAPI } from '../../hooks/UseTagAPI';
import { MappingTypeFilterPicker } from './mappingTypeFilterPicker';
import { TagFilterPickerCheckboxes } from './tagFilterPicker';
import { ShowAllTagFilterButton } from './showAllTagFilterButton';

import { useQueryParams, useQueryParam, StringParam, NumberParam } from 'use-query-params';
import { CommaArrayParam } from '../../utils/CommaArrayParam';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const MoreFiltersForm = props => {
  /* one useQueryParams for the main form */
  const [formQuery, setFormQuery] = useQueryParams({
    difficulty: StringParam,
    organisation: StringParam,
    campaign: StringParam,
    location: StringParam,
    page: NumberParam,
  });

  const handleInputChange = event => {
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
  const { campaign: campaignInQuery, organisation: orgInQuery } = formQuery;
  const [campaignAPIState] = useTagAPI([], 'campaigns');
  const [orgAPIState] = useTagAPI([], 'organisations');

  /* another useQueryParam for the second form */
  const [mappingTypesInQuery, setMappingTypes] = useQueryParam('types', CommaArrayParam);

  const fieldsetStyle = 'w-100 bn';
  const titleStyle = 'tc w-100 db ttu fw5 blue-grey';
  const inputStyle = 'inline-flex w-50 items-center mb2';

  return (
    <form className="pa4" onChange={handleInputChange}>
      <fieldset id="mappingType" className={fieldsetStyle}>
        <legend className={titleStyle}>
          <FormattedMessage {...messages.typesOfMapping} />
        </legend>
        <MappingTypeFilterPicker
          mappingTypes={mappingTypesInQuery}
          setMappingTypesQuery={setMappingTypes}
          titledIcons={[
            { icon: RoadIcon, title: 'Roads', value: 'ROADS' },
            { icon: HomeIcon, title: 'Buildings', value: 'BUILDINGS' },
            { icon: WavesIcon, title: 'Waterways', value: 'WATERWAYS' },
            { icon: TaskIcon, title: 'Land use', value: 'LAND_USE' },
          ]}
        />
      </fieldset>

      <TagFilterPickerCheckboxes
        fieldsetTitle=<FormattedMessage {...messages.campaign} />
        fieldsetTitlePlural=<FormattedMessage {...messages.campaigns} />
        fieldsetName="campaign"
        fieldsetStyle={fieldsetStyle}
        titleStyle={titleStyle}
        selectedTag={campaignInQuery}
        tagOptionsFromAPI={campaignAPIState}
        setQueryForChild={setFormQuery}
        allQueryParamsForChild={formQuery}
      />

      {/* Example, may be removed for location as per design */}
      <div className="db dn-l">
        <TagFilterPickerCheckboxes
          fieldsetTitle=<FormattedMessage {...messages.organisation} />
          fieldsetTitlePlural=<FormattedMessage {...messages.organisations} />
          fieldsetName="organisation"
          fieldsetStyle={fieldsetStyle}
          titleStyle={titleStyle}
          selectedTag={orgInQuery}
          tagOptionsFromAPI={orgAPIState}
          setQueryForChild={setFormQuery}
          allQueryParamsForChild={formQuery}
        />
      </div>

      {/* Example location field, to be implemented on backend*/}
      <fieldset id="location" className={fieldsetStyle}>
        <legend className={titleStyle}>
          <FormattedMessage {...messages.location} />
        </legend>
        <div className={inputStyle}>
          <input className="mr2" type="radio" name="location" id="spacejam2" value="in" />
          <label htmlFor="spacejam2" className="lh-copy">
            India
          </label>
        </div>
        <div className={inputStyle}>
          <input className="mr2" type="radio" name="location" id="airbud2" value="mz" />
          <label htmlFor="airbud2" className="lh-copy">
            Mozambique
          </label>
        </div>
        <div className={inputStyle}>
          <input className="mr2" type="radio" name="location" id="hocuspocus2" value="su" />
          <label htmlFor="hocuspocus2" className="lh-copy">
            Sudan
          </label>
        </div>
        <div className={inputStyle}>
          <input className="mr2" type="radio" name="location" id="diehard2" value="gie" />
          <label htmlFor="diehard2" className="lh-copy">
            Guinea
          </label>
        </div>
        <div className={inputStyle}>
          <input className="mr2" type="radio" name="location" id="primer2" value="ug" />
          <label htmlFor="primer2" className="lh-copy">
            Uganda
          </label>
        </div>
        <div className={inputStyle}>
          <input className="mr2" type="radio" name="location" id="proxy2" value="tz" />
          <label htmlFor="proxy2" className="lh-copy">
            Tanzania
          </label>
        </div>
        <ShowAllTagFilterButton
          title=<FormattedMessage {...messages.locations} />
          showingToggle={true}
        ></ShowAllTagFilterButton>
      </fieldset>
    </form>
  );
};
