import React  from 'react';
import { ChevronDownIcon  } from '../svgIcons';

export const ShowAllTagFilterButton = props => {
    
    return (
    <><button type="button" onClick={() => {}} className="input-reset dim base-font bg-white button-reset f6 bn pn red">
    <span className="pr2 ttu f6">Show All {props.title}s</span>
    <ChevronDownIcon className="pt2" />
    </button>
    { props.showingToggle===true && props.children}
    </>
   )}