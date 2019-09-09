import React, { useLayoutEffect } from 'react';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

import { useDownshiftSelection } from 'downshift-hooks';
import Select from 'react-select';

export const TagFilterPickerCheckboxes = props => {
  const state = props.tagOptionsFromAPI;

  //fieldsetName
  return (
    <fieldset id={props.fieldsetName} className={props.fieldsetStyle}>
      <legend className={props.titleStyle}>{props.fieldsetTitle}</legend>
      {state.isError ? (
        <div className="bg-tan pa4">
          <FormattedMessage
            {...messages.errorLoadingTheXForY}
            values={{
              xWord: <FormattedMessage {...messages.filters} />,
              yWord: props.fieldsetTitlePlural,
            }}
          />
        </div>
      ) : null}
      <ReactPlaceholder type="text" rows={3} ready={!state.isLoading}>
        <TagFilterPickerAutocomplete
          fieldsetTitle={props.fieldsetTitle}
          defaultSelectedItem={props.fieldsetTitlePlural}
          fieldsetName={props.fieldsetName}
          queryParamSelectedItem={props.selectedTag || props.fieldsetTitle}
          tagOptionsFromAPI={props.tagOptionsFromAPI}
          setQuery={props.setQueryForChild}
          allQueryParams={props.allQueryParamsForChild}
        />
      </ReactPlaceholder>
    </fieldset>
  );
};

/*
defaultSelectedItem gets appended to top of list as an option for reset
*/
export const TagFilterPickerAutocomplete = ({
  tagOptionsFromAPI,
  tagOptionsFromAPI: { tags: tagOptions },
  fieldsetTitle,
  fieldsetName,
  queryParamSelectedItem,
  onSelectedItemChange,
  className,
  defaultSelectedItem,
  allQueryParams,
  setQuery,
}) => {
  const valueLabelGenerator = inputOptions => {
    return inputOptions.map((n, i) => ({ label: n, value: n }));
  };

  const handleTagChange = change => {
    const isAllTags = change && change.value === defaultSelectedItem;
    /* should we encodeURIComponent the change.value? */
    const newValue = isAllTags ? undefined : change.value;
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        [fieldsetName]: newValue,
      },
      'pushIn',
    );
  };

  // useLayoutEffect(() => {
  // setSelectedItem(queryParamSelectedItem)
  // eslint-disable-next-line
  // },[queryParamSelectedItem])
  return (
    <Select
      onChange={handleTagChange}
      autoFocus={true}
      placeholder={allQueryParams[fieldsetName] || fieldsetTitle}
      options={valueLabelGenerator(tagOptions)}
    />
  );
};

const buttonClasses = 'input-reset dim base-font bg-white button-reset';
const menuStylesSelect = {
  maxHeight: '200px',
  overflowY: 'auto',
  position: 'absolute',
  margin: 0,
  borderTop: 0,
  zIndex: 3,
  background: 'white',
};

/*
defaultSelectedItem gets appended to top of list as an option for reset
*/
export const TagFilterPickerAutocompleteDownshift = ({
  tagOptionsFromAPI,
  tagOptionsFromAPI: { tags: tagOptions },
  fieldsetTitle,
  fieldsetName,
  queryParamSelectedItem,
  onSelectedItemChange,
  className,
  defaultSelectedItem,
  allQueryParams,
  setQuery,
}) => {
  const handleTagChange = change => {
    const isAllTags = change && change.selectedItem === defaultSelectedItem;
    const newValue = isAllTags ? undefined : change.selectedItem;
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        [fieldsetName]: newValue,
      },
      'pushIn',
    );
  };
  const {
    isOpen,
    selectedItem,
    getToggleButtonProps,
    // getLabelProps,
    getMenuProps,
    highlightedIndex,
    getItemProps,
    setSelectedItem,
  } = useDownshiftSelection({
    items: [defaultSelectedItem, ...tagOptions],
    onSelectedItemChange: handleTagChange,
    selectedItem: queryParamSelectedItem,
    circularNavigation: true,
  });

  /* I think this is a bug with useDownshiftSelector, shouldn't need it */
  useLayoutEffect(() => {
    setSelectedItem(queryParamSelectedItem);
    // eslint-disable-next-line
  }, [queryParamSelectedItem]);

  return (
    <div className={'dib'}>
      {/* <label {...getLabelProps()}>Choose an props.fieldsent:</label> */}
      <button className={`${className} ${buttonClasses}`} {...getToggleButtonProps()}>
        {selectedItem}
      </button>
      <ul {...getMenuProps()} className={`list pl0 ml0 center mw5  br3`} style={menuStylesSelect}>
        {isOpen &&
          [defaultSelectedItem, ...tagOptions].map((option, index) => (
            <li
              className={`ph3 pv2 bb b--light-silver ${highlightedIndex === index ? 'bg-tan' : ''}`}
              key={`${option}${index}`}
              {...getItemProps({ item: option, index })}
            >
              {option}
            </li>
          ))}
      </ul>
    </div>
  );
};
