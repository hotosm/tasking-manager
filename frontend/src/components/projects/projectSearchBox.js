import React, { useState, useRef, useCallback } from 'react';
import { SearchIcon, CloseIcon } from '../svgIcons';

// import onClickOutside from 'react-click-outside';
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
  // const [searchTerm, setSearchTerm] = useState(props.fullProjectsQuery.text);

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
  const iconStyleForInputtedText = !fullProjectsQuery[searchField] ? 'grey-light' : 'red';
  const clearIconStyleForInputtedText = !fullProjectsQuery[searchField] ? 'dn' : 'red dib-ns';

  return (
    <nav ref={navRef} className={`${className || ''} mt1 mt2-ns`}>
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
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
          value={fullProjectsQuery[searchField] || ''}
          onFocus={() => setFocus(true)}
          onChange={(event) => {
            const value = event.target.value;
            setQuerySearch(value);
          }}
          placeholder={placeholder || 'Search Projects'}
          className={'input-reset ba b--grey-light pa1 lh-copy db w-100'}
          style={{ textIndent: '30px' }}
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
