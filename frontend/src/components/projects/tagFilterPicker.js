import React, { useLayoutEffect } from 'react';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import { FormattedMessage } from 'react-intl';
import messages from './messages';

import { useDownshiftSelection } from 'downshift-hooks';
import Select from 'react-select';

export const TagFilterPickerCheckboxes = props => {
  const state = props.tagOptionsFromAPI;
  const fieldsetTitle = <FormattedMessage {...messages[props.fieldsetName]} />;
  const fieldsetTitlePlural = <FormattedMessage {...messages[`${props.fieldsetName}s`]} />;

  //fieldsetName
  return (
    <fieldset id={props.fieldsetName} className={props.fieldsetStyle}>
      <legend className={props.titleStyle}>{fieldsetTitle}</legend>
      {state.isError ? (
        <div className="bg-tan pa4">
          <FormattedMessage
            {...messages.errorLoadingTheXForY}
            values={{
              xWord: <FormattedMessage {...messages.filters} />,
              yWord: fieldsetTitlePlural,
            }}
          />
        </div>
      ) : null}
      <ReactPlaceholder type="text" rows={3} ready={!state.isLoading}>
        <TagFilterPickerAutocomplete
          fieldsetTitle={fieldsetTitle}
          defaultSelectedItem={fieldsetTitlePlural}
          fieldsetName={props.fieldsetName}
          queryParamSelectedItem={props.selectedTag || fieldsetTitle}
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
  const getLabelAndValue = (option) => {
    if (option.name) {
      return option.name;
    } else {
      return option;
    }
  }

  const handleTagChange = change => {
    const value = change.name ? change.name : change;
    const isAllTags = change && (value === defaultSelectedItem);
    /* should we encodeURIComponent the change.value? */
    const newValue = isAllTags ? undefined : value;
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        [fieldsetName]: newValue,
      },
      'pushIn',
    );
  };

  return (
    <Select
      onChange={handleTagChange}
      getOptionLabel={getLabelAndValue}
      getOptionValue={getLabelAndValue}
      autoFocus={true}
      placeholder={allQueryParams[fieldsetName] || fieldsetTitle}
      options={tagOptions}
    />
  );
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

  return (
    <div className={'dib'}>
      {/* <label {...getLabelProps()}>Choose an props.fieldsent:</label> */}
      <button className={`${className || ''} ${buttonClasses}`} {...getToggleButtonProps()}>
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
