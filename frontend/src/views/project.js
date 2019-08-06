import React from 'react';
import {ProjectNav} from '../components/projectcard/projectNav.js';

import { navigate } from "@reach/router";
import { HomeIcon, RoadIcon, WavesIcon, TaskIcon, ChevronDownIcon  } from '../components/svgIcons';

import {
  encodeDelimitedArray,
  decodeDelimitedArray
} from 'use-query-params';
import {
  useQueryParams,
  StringParam,
  NumberParam,
  stringify,
} from 'use-query-params';
 
/** Uses a comma to delimit entries. e.g. ['a', 'b'] => qp?=a,b */
const CommaArrayParam = {
  encode: (array: string[] | null | undefined) => 
    encodeDelimitedArray(array, ','),
 
  decode: (arrayStr: string | string[] | null | undefined) => 
    decodeDelimitedArray(arrayStr, ',')
};


 


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
  // something like: ?x=123&q=foo&filters=a&filters=b&filters=c in the URL
  const [query, setQuery] = useQueryParams({
    difficulty: StringParam,
    organization: StringParam,
    campaign: StringParam,
    types: CommaArrayParam,
    x: NumberParam,
    });
   const pagerStyle = "link br1 h2 w2 pa1 ma1 dib";
   const activeStyle = "b--red ba bw1";
   const inactiveStyle = "pb1";
   const fieldsetStyle = "w-100 bn"
   const titleStyle = "tc w-100 db ttu fw5 blue-grey";

   const ShowAllCampaignsButton = props => (
    <button type="button" onClick={() => {}} className="input-reset dim base-font bg-white button-reset f6 bn pn red">
    <span className="pr2 ttu f6">Show All Campaigns</span>
    <ChevronDownIcon className="pt2" />
    </button>
   )

   const UseQueryParamsExample = ({query, setQuery}) => {
    const { x: num, organization: searchQuery, types = [] } = query;
    return (
      <div>
        <h4>num is {num}</h4>
        <button onClick={() => setQuery({ x: Math.random() })}>Change</button>
        <h4>searchQuery is {searchQuery}</h4>
        <h4>There are {types.length} filters active.</h4>
        <button
          onClick={() =>
            setQuery(
              { x: Math.random(), types: [...types, 'foo'], organization: 'bar' },
              'push'
            )
          }
        >
          Change All
        </button>
      </div>
    );
  };
   
  

   const inputStyle="inline-flex w-50 items-center mb2";

    const encodedParams = stringify(query) ? "?"+stringify(query) : ""
   /* z-2 is needed because the progress bar hide-child hover popups are z-1.  */
   return (
     <>
       <div className="absolute left-0 z-2 mt1 w-40-l w-100 h-100 bg-white h4 pa3">
        {/* <fieldset id="mappingType" className={fieldsetStyle}> */}
       <h5 className={titleStyle}>Types of Mapping</h5>
         <div className="tc ma2 base-font">
              <RoadIcon title="Roads" className={`${pagerStyle} ${activeStyle}`}/>
              <HomeIcon title="Buildings" className={`${pagerStyle} ${inactiveStyle}`} />
              <WavesIcon title="Waterways" className={`${pagerStyle} ${inactiveStyle}`} />
              <TaskIcon title="Land use" className={`${pagerStyle} ${inactiveStyle}`}/>
          </div>
        {/* </fieldset> */}


        <UseQueryParamsExample query={query} setQuery={setQuery} />

       <form className="pa4">
        <fieldset id="campaign" className={fieldsetStyle}>
        <legend className={titleStyle}>Campaigns</legend>

           <label className="relative flex items-center mv2">
             <input name="campaign" className="absolute z-5 w-100 h-100 o-0 pointerinput-reset pointer radiobutton" type="radio"/>
             <span className="relative z-4 dib w1 h1 bg-white overflow-hidden b--grey-light ba br-100 v-mid bg-animate bg-center radiobutton-wrapper">
              <div className="absolute top-0 left-0 w1 h1 ba bw2 b--transparent br-100"></div>
             </span>
             <div className="dib ml2 silver lh-solid">
               Option 1
               </div></label>
             <label className="relative flex items-center mv2">
               <input className="absolute z-5 w-100 h-100 o-0 input-reset pointer radiobutton" name="campaign" type="radio"/>
               <span className="relative z-4 dib w1 h1 bg-white overflow-hidden b--grey-light ba br-100 v-mid bg-animate bg-center radiobutton-wrapper">
                <div className="absolute top-0 left-0 w1 h1 ba bw2 b--transparent br-100"></div>
               </span>
               <div className="dib ml2 helvetica silver lh-solid">
                 Option 2
              </div>
              </label>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="campaign" id="spacejam" value="spacejam" />
            <label for="spacejam" className="lh-copy">Space Jam</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="campaign" id="airbud" value="airbud" />
            <label for="airbud" className="lh-copy">Air Bud</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="campaign" id="hocuspocus" value="hocuspocus" />
            <label for="hocuspocus" className="lh-copy">Hocus Pocus</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="campaign" id="diehard" value="diehard" />
            <label for="diehard" className="lh-copy">Die Hard</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="campaign" id="primer" value="primer" />
            <label for="primer" className="lh-copy">Primer</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="campaign"  id="proxy" value="proxy" />
            <label for="proxy" className="lh-copy">Hudsucker Proxy</label>
          </div>
        <ShowAllCampaignsButton />
        </fieldset>

        <fieldset id="location" className={fieldsetStyle}>
        <legend className={titleStyle}>Location</legend>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location"  id="spacejam2" value="spacejam" />
            <label for="spacejam2" className="lh-copy">Space Jam</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="airbud2" value="airbud" />
            <label for="airbud2" className="lh-copy">Air Bud</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="hocuspocus2" value="hocuspocus" />
            <label for="hocuspocus2" className="lh-copy">Hocus Pocus</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="diehard2" value="diehard" />
            <label for="diehard2" className="lh-copy">Die Hard</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="primer2" value="primer" />
            <label for="primer2" className="lh-copy">Primer</label>
          </div>
          <div className={inputStyle}>
            <input className="mr2" type="radio" name="location" id="proxy2" value="proxy" />
            <label for="proxy2" className="lh-copy">Hudsucker Proxy</label>
          </div>
        <ShowAllCampaignsButton /> 
        </fieldset>
       </form>
          {props.children}
         </div>
       <div onClick={() => navigate(`/contribute?${stringify(query)}`)} className="absolute right-0 z-2 br w-60-l w-0 h-100 bg-blue-dark o-90 h6">

       </div>
       </>
   )
}
