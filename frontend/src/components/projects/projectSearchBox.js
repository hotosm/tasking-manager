import React, { useState, useRef, useCallback } from 'react';
import { SearchIcon, CloseIcon } from '../svgIcons';
import { useProjectAutocompleteAPI } from '../../hooks/UseProjectAutocompleteAPI';

import { useOnClickOutside } from '../../hooks/UseOnClickOutside';
/* via https://github.com/Pomax/react-onclickoutside/issues/310 b/c of ref problems with onClickOutside */

const AutocompleteNav = ({options, setQuerySearch}) => {
  const [highlightedIndex, setHighlightedIndex] = useState(false);
  const menuStylesSelect = {
    maxHeight: '600px',
    overflowY: 'auto',
    position: 'absolute',
    margin: 0,
    borderTop: 0,
    zIndex: 3,
    background: 'white',
  };

  return (
    <ul className={`list pl0 ml0 center mw5 br3`} style={menuStylesSelect}>
            {options.length>0  && options.map((option, index) => (
              <li
                className={`ph3 pv2 bb b--light-silver ${highlightedIndex === option.projectId ? 'bg-tan' : ''}`}
                key={`${option.projectId}${index}`}
                onMouseEnter={() => setHighlightedIndex(option.projectId)}
                onClick={() => setQuerySearch(["#",option.projectId].join(""))}
              >
                {option.name}
              </li>
            ))}
        </ul>
  );
}

export const ProjectSearchBox = ({
  fullProjectsQuery,
  fullProjectsQuery: { text: queryParamText },
  setQuery,
  className,
  isMobile,
}) => {
  const [isFocus, setFocus] = useState(false);
  // const [searchTerm, setSearchTerm] = useState(props.fullProjectsQuery.text);

  const inputRef = useRef(null);
  const navRef = useRef(null);

  useOnClickOutside(navRef, () => setFocus(false));

  const setQuerySearch = useCallback(
    newValue =>
      setQuery(
        {
          ...fullProjectsQuery,
          page: undefined,
          text: newValue,
        },
        'pushIn',
      ),
    [fullProjectsQuery, setQuery],
  );
  
  const onKeyPressPreventEnter = event => {
    if (event.which === 13 /* Enter */) {
      event.preventDefault();
    }
  }

  const isFocusMobile = isMobile && isFocus;
  const iconStyleForInputtedText = !fullProjectsQuery.text ? 'grey-light' : 'red';
  const clearIconStyleForInputtedText = !fullProjectsQuery.text ? 'dn' : 'red dib-ns';
  
  const [autocompleteResults] = useProjectAutocompleteAPI(queryParamText)
  
  return (
    <nav ref={navRef} className={`${className} mt1`}>
      <form className="relative" onKeyPress={onKeyPressPreventEnter}>
        <div>
          <SearchIcon
            onClick={() => inputRef.current.focus()}
            className={`absolute ${iconStyleForInputtedText} pl2 pt2`}
          />
        </div>
        <input
          id="name"
          ref={inputRef}
          autoComplete="off"
          value={queryParamText || ''}
          onFocus={() => setFocus(true)}
          onChange={event => {
            const value = event.target.value;
            if (event.target.value === "") {
              /* hide the popup when last character is deleted */
              setFocus(false);
            }
            setQuerySearch(value);
          }}
          placeholder="Search Projects"
          className={'input-reset ba b--grey-light pa1 lh-copy db'}
          style={{ textIndent: '30px' }}
          type="text"
          aria-describedby="name-desc"
        />

        <CloseIcon
          onClick={() => {
            setQuerySearch(undefined);
          }}
          onBlur={e => {
            setFocus(false);
          }}
          onFocus={() => setFocus(true)}
          className={`absolute ${clearIconStyleForInputtedText} w1 h1 top-0 pt2 ${
            !isFocusMobile ? 'pr2 right-0 dn ' : 'pr2 right-0'
          }`}
        />
       {isFocus && <AutocompleteNav options={autocompleteResults.projects} setQuerySearch={setQuerySearch}/>}
      </form>
    </nav>
  );
};
