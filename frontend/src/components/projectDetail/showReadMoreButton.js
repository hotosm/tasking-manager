import React, {useState} from 'react';
import { ChevronDownIcon, ChevronUpIcon} from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const ShowReadMoreButton = props => {
    const [isShowing, setShowing] = useState(false);
  
    return (
      <>
        <button
          type="button"
          onClick={() => setShowing(!isShowing)}
          className="input-reset dim base-font bg-white button-reset f6 bn pn red"
        >
          <span className="pr2 ttu f6">
            <FormattedMessage {...messages.readMore} />
          </span>
        {isShowing? <ChevronUpIcon className="pt2" /> : <ChevronDownIcon className="pt2" /> }
        </button>
        {isShowing && props.children}
      </>
    );
  };
  