import React  from 'react';
import {ProjectNav} from '../components/projectcard/projectNav';

import { useTagAPI } from '../hooks/UseTagAPI'
import { MappingTypeFilterPicker } from '../components/projectcard/mappingTypeFilterPicker'
import { TagFilterPicker } from '../components/projectcard/tagFilterPicker'
import { ShowAllTagFilterButton } from '../components/projectcard/showAllTagFilterButton'

import { HomeIcon, RoadIcon, WavesIcon, TaskIcon  } from '../components/svgIcons';
import {
  useQueryParams,
  useQueryParam,
  StringParam,
  stringify,
} from 'use-query-params';
import { CommaArrayParam } from '../utils/CommaArrayParam'


export const ProjectsPage = props => {

  return (
    <div className="pt180 pull-center">
      <ProjectNav>
        {props.children}
      </ProjectNav>
    </div>
  );
}

export const ProjectsPageIndex = props => {
  return null;
}

export const MoreFilters = props => {
  /* one useQueryParams for the main form */
  const [formQuery, setFormQuery] = useQueryParams({
    difficulty: StringParam,
    organisation: StringParam,
    campaign: StringParam,
    location: StringParam
    });
    
   /* dereference the formQuery */
   const {campaign: campaignInQuery, organisation: orgInQuery } = formQuery;
   const [campaignAPIState] = useTagAPI([],"campaigns");
   const [orgAPIState] = useTagAPI([],"organisations");

   /* another useQueryParam for the second form */
   const [mappingTypesInQuery, setMappingTypes] = useQueryParam('types', CommaArrayParam);

   /* These two divs define the More Filters page. */
   /* z-2 is needed because the progress bar hide-child hover popups are z-1.  */
   const leftpanelDivStyle = "absolute left-0 z-2 mt1 w-40-l w-100 h-100 bg-white h4 pa3";
   const rightpanelShadowDivStyle = "absolute right-0 z-2 br w-60-l w-0 h-100 bg-blue-dark o-90 h6";
  
   const handleInputChange = (event) => {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    if (name === "types") {
      //handle mappingTypes toggles in its separate fn inside that component
      return
    }

    setFormQuery({
      ...formQuery,
      [name]: value
    }, 'pushIn');
  }
  const fieldsetStyle = "w-100 bn"
  const titleStyle = "tc w-100 db ttu fw5 blue-grey";
  const inputStyle="inline-flex w-50 items-center mb2";

   return (
    <form className="pa4" onChange={handleInputChange}>

      <div className={leftpanelDivStyle}>
        <fieldset id="mappingType" className={fieldsetStyle}>
        <legend className={titleStyle}>Types of Mapping</legend>
        <MappingTypeFilterPicker mappingTypes={mappingTypesInQuery} setMappingTypesQuery={setMappingTypes}
         titledIcons ={[
          {icon: RoadIcon, title: "Roads", value:'ROADS' },
          {icon: HomeIcon, title: "Buildings", value: 'BUILDINGS'},
          {icon: WavesIcon, title: "Waterways", value: 'WATERWAYS'},
          {icon: TaskIcon, title: "Land use", value: 'LAND_USE'}
      ]} /> 
        </fieldset>

          <TagFilterPicker 
           fieldsetTitle="Campaign"
           fieldsetName="campaign"
           fieldsetStyle={fieldsetStyle}
           titleStyle={titleStyle}
           selectedTag={campaignInQuery}
           tagOptionsFromAPI={campaignAPIState}
           />

        {/* Example, may be removed for location as per design */}
          <TagFilterPicker 
           fieldsetTitle="Organisation"
           fieldsetName="organisation"
           fieldsetStyle={fieldsetStyle}
           titleStyle={titleStyle}
           selectedTag={orgInQuery}
           tagOptionsFromAPI={orgAPIState}
           />

        {/* Example location field, to be implemented on backend*/}
        <fieldset id="location" className={fieldsetStyle}>
        <legend className={titleStyle}>Location</legend>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location"  id="spacejam2" value="in" />
            <label htmlFor="spacejam2" className="lh-copy">India</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="airbud2" value="mz" />
            <label htmlFor="airbud2" className="lh-copy">Mozambique</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="hocuspocus2" value="su" />
            <label htmlFor="hocuspocus2" className="lh-copy">Sudan</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="diehard2" value="gie" />
            <label htmlFor="diehard2" className="lh-copy">Guinea</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="primer2" value="ug" />
            <label htmlFor="primer2" className="lh-copy">Uganda</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="proxy2" value="tz" />
            <label htmlFor="proxy2" className="lh-copy">Tanzania</label>
          </div>
        <ShowAllTagFilterButton title="Locations" showingToggle={true}>

        </ShowAllTagFilterButton>
        </fieldset>
        {props.children}
      </div>

       <div 
        onClick={() => props.navigate(`/contribute?${stringify(formQuery)}&${stringify(mappingTypesInQuery)}`)}
        className={rightpanelShadowDivStyle}>
       </div>
       </form>
   )
}
