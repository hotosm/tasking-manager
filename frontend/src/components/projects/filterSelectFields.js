import React from 'react';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import Select from 'react-select';

import { FormattedMessage } from 'react-intl';
import messages from './messages';

export const ProjectFilterSelect = (props) => {
  const state = props.options;
  const fieldsetTitle = <FormattedMessage {...messages[props.fieldsetName]} />;
  const fieldsetTitlePlural = <FormattedMessage {...messages[`${props.fieldsetName}s`]} />;

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
      <ReactPlaceholder type="text" rows={2} ready={!state.isLoading}>
        <TagFilterPickerAutocomplete
          fieldsetTitle={fieldsetTitle}
          defaultSelectedItem={fieldsetTitlePlural}
          fieldsetName={props.fieldsetName}
          queryParamSelectedItem={props.selectedTag || fieldsetTitle}
          tagOptionsFromAPI={props.options}
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
  const getLabel = (option) => {
    if (option.name) {
      return option.name;
    } else {
      return option;
    }
  };
  const getValue = (option) => {
    if (option.value) {
      return option.value;
    }
    if (option.name) {
      return option.name;
    }
    return option;
  };

  const handleTagChange = (change) => {
    const value = getValue(change);
    const isAllTags = change && value === defaultSelectedItem;
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
      classNamePrefix="react-select"
      getOptionLabel={getLabel}
      getOptionValue={getValue}
      autoFocus={true}
      placeholder={allQueryParams[fieldsetName] || fieldsetTitle}
      options={tagOptions}
      value={queryParamSelectedItem}
    />
  );
};
