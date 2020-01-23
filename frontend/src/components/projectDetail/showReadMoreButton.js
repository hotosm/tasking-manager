import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const ShowReadMoreButton = ({ children, isShowing, setShowing }: object) => {
  return (
    <>
      <button
        type="button"
        onClick={() => setShowing(!isShowing)}
        className="input-reset base-font bg-white button-reset f6 bn pn red pointer"
      >
        <span className="pr2 ttu f6">
          <FormattedMessage {...messages[isShowing ? 'readLess' : 'readMore']} />
        </span>
        {isShowing ? <ChevronUpIcon className="pt2" /> : <ChevronDownIcon className="pt2" />}
      </button>
      {isShowing && children}
    </>
  );
};
