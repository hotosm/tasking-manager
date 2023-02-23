import React, { useState, useRef, useCallback } from 'react';
import { SearchIcon, CloseIcon } from '../svgIcons';

import { useOnClickOutside } from '../../hooks/UseOnClickOutside';
/* via https://github.com/Pomax/react-onclickoutside/issues/310 b/c of ref problems with onClickOutside */

export const ProjectSearchBox = ({
  fullProjectsQuery,
  setQuery,
  className,
  isMobile,
  placeholder,
  searchField = 'text',
}) => {
  const [isFocus, setFocus] = useState(false);
  const inputRef = useRef(null);
  const navRef = useRef(null);

  useOnClickOutside(navRef, () => setFocus(false));

  const setQuerySearch = useCallback(
    (newValue) =>
      setQuery(
        {
          ...fullProjectsQuery,
          page: undefined,
          [searchField]: newValue,
        },
        'pushIn',
      ),
    [fullProjectsQuery, setQuery, searchField],
  );

  const isFocusMobile = isMobile && isFocus;
  const iconStyleForInputtedText = !fullProjectsQuery[searchField] ? 'blue-grey' : 'red';
  const clearIconStyleForInputtedText = !fullProjectsQuery[searchField] ? 'dn' : 'red dib-ns';

  return (
    <nav ref={navRef} className={`${className || ''} mt1 mt2-ns`}>
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <SearchIcon
          onClick={() => inputRef.current.focus()}
          className={`absolute blue-grey ${iconStyleForInputtedText}`}
          style={{ top: 10, left: 12 }}
        />
        <input
          id="name"
          ref={inputRef}
          autoComplete="off"
          value={fullProjectsQuery[searchField] || ''}
          onFocus={() => setFocus(true)}
          onChange={(event) => {
            const value = event.target.value;
            setQuerySearch(value);
          }}
          placeholder={placeholder || 'Search Projects'}
          className={'input-reset ba b--grey-light pa2 lh-title db w-100 f6 br1'}
          style={{ textIndent: '32px' }}
          type="text"
          aria-describedby="name-desc"
        />

        <CloseIcon
          onClick={() => {
            setQuerySearch(undefined);
          }}
          onBlur={(e) => {
            setFocus(false);
          }}
          onFocus={() => setFocus(true)}
          className={`absolute ${clearIconStyleForInputtedText} w1 h1 top-0 pt2 pointer ${
            !isFocusMobile ? 'pr2 right-0 dn ' : 'pr2 right-0'
          }`}
        />
      </form>
    </nav>
  );
};
