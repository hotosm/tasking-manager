import React, { useRef, useCallback } from 'react';
import { SearchIcon, CloseIcon } from '../svgIcons';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
/* via https://github.com/Pomax/react-onclickoutside/issues/310 b/c of ref problems with onClickOutside */

export const MemberSearchBox = ({ searchQuery, setSearchQuery, className }) => {
  const inputRef = useRef(null);
  const navRef = useRef(null);

  const setQuerySearch = useCallback((newValue) => setSearchQuery(newValue), [setSearchQuery]);
  const iconStyleForInputtedText = !searchQuery ? 'grey-light' : 'red';
  const clearIconStyleForInputtedText = !searchQuery ? 'dn' : 'red dib-ns';

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
        <FormattedMessage {...messages.searchUsers}>
          {(msg) => {
            return (
              <input
                id="name"
                ref={inputRef}
                autoComplete="off"
                value={searchQuery}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuerySearch(value);
                }}
                placeholder={msg}
                className={'input-reset ba b--grey-light pa1 lh-copy db w-100'}
                style={{ textIndent: '30px' }}
                type="text"
                aria-describedby="name-desc"
              />
            );
          }}
        </FormattedMessage>

        <CloseIcon
          onClick={() => {
            setQuerySearch('');
          }}
          onBlur={() => {}}
          className={`absolute ${clearIconStyleForInputtedText} w1 h1 top-0 pt2 pointer ${'pr2 right-0 dn'}`}
        />
      </form>
    </nav>
  );
};
