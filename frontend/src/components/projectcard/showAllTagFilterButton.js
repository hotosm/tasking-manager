import React  from 'react';
import { ChevronDownIcon  } from '../svgIcons';
import { FormattedMessage } from "react-intl";
import messages from './messages';

export const ShowAllTagFilterButton = props => {
    
    return (
    <><button type="button" onClick={() => {}} className="input-reset dim base-font bg-white button-reset f6 bn pn red">
    <span className="pr2 ttu f6">
      <FormattedMessage 
        {...messages.showAllXTags} 
        values={{typeOfTag: props.title}}
      />
    </span>
    <ChevronDownIcon className="pt2" />
    </button>
    { props.showingToggle===true && props.children}
    </>
   )}