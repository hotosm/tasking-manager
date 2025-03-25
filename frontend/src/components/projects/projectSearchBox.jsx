import { useRef, useCallback } from 'react';
import { SearchIcon, CloseIcon } from '../svgIcons';

export const ProjectSearchBox = ({
  fullProjectsQuery,
  setQuery,
  className,
  placeholder,
  searchField = 'text',
}) => {
  const inputRef = useRef(null);
  const isQueryPresent = Boolean(fullProjectsQuery[searchField]);
  const iconColor = isQueryPresent ? 'red' : 'blue-grey';

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

  return (
    <div className={`${className || ''} relative mt1 mt2-ns`}>
      <SearchIcon
        onClick={() => inputRef.current.focus()}
        aria-label="Search"
        className={`absolute ${iconColor}`}
        style={{ top: 10, left: 12 }}
      />
      <input
        id="name"
        ref={inputRef}
        autoComplete="off"
        value={fullProjectsQuery[searchField] || ''}
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
      {isQueryPresent && (
        <CloseIcon
          role="button"
          onClick={() => {
            setQuerySearch(undefined);
          }}
          className={`absolute w1 h1 red top-0 pt2 pointer pr2 right-0 dn dib-ns`}
        />
      )}
    </div>
  );
};
