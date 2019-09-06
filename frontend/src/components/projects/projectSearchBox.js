import React, { useState, useRef, useCallback } from 'react';
import { SearchIcon, CloseIcon } from '../svgIcons';

// import onClickOutside from 'react-click-outside';
import { useOnClickOutside } from '../../hooks/UseOnClickOutside'
/* via https://github.com/Pomax/react-onclickoutside/issues/310 b/c of ref problems with onClickOutside */

export const ProjectSearchBox = ({
    fullProjectsQuery,
    fullProjectsQuery: { text: queryParamText },
    setQuery,
    className,
    isMobile
  }) => {
    const [isFocus, setFocus] = useState(false);
    // const [searchTerm, setSearchTerm] = useState(props.fullProjectsQuery.text);

    const inputRef = useRef(null);
    const navRef = useRef(null);

    useOnClickOutside(navRef, () =>  setFocus(false));

    const setQuerySearch = useCallback( (newValue) =>  setQuery(
        {
          ...fullProjectsQuery,
          page: undefined, 
          text: newValue
        },
        "pushIn"
        ), [fullProjectsQuery, setQuery]);

    const isFocusMobile = isMobile && isFocus;

    const smallInactiveIcon="pl2 left-0";
    const activeIcon="left-1";

    const smallInactiveInput="mw2 mw4-m mw5-l";
    const smallActiveInput="mw4";

    const iconStyleForInputtedText = !fullProjectsQuery.text ? "grey-light" : "red";
    const clearIconStyleForInputtedText = !fullProjectsQuery.text ? "dn dn-ns" : "red dib-ns";

    return (
    <nav ref={navRef} className={`${className} fl relative`}> {/* USE REACT DOWNSHIFT FOR AUTOCOMPLETE */}
        <form>
        <SearchIcon 
          onClick={() => inputRef.current.focus()}  
          className={`absolute ${iconStyleForInputtedText} top-0 pt2 ${!isFocusMobile ? smallInactiveIcon : activeIcon}`}/>
          <input id="name"
            ref={inputRef}
            autoComplete="off"
            value={queryParamText || ''}
            onFocus={() => setFocus(true)}
            onChange={(event) => {
                const value = event.target.value;
                setQuerySearch(value)
            }}
            placeholder="Search Projects"
            className={`input-reset ba b--grey-light pa1 lh-copy db ${!isFocusMobile ? smallInactiveInput : smallActiveInput}`}
            style={{'textIndent':"30px"}}
            type="text"
            aria-describedby="name-desc" 
            />
           
          <CloseIcon
            onClick={() => {setQuerySearch(undefined)}}  
            onBlur={(e) => {setFocus(false)}}
            onFocus={() => setFocus(true)}
            className={`absolute ${clearIconStyleForInputtedText} w1 h1 top-0 pt2 ${!isFocusMobile ? "pr2 right-0 dn " : "pr2 right-0"}`}/>
          </form>
      </nav>
      
    )
  }
