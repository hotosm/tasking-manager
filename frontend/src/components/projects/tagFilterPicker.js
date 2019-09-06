import React, {useLayoutEffect}  from 'react';
import { ShowAllTagFilterButton } from './showAllTagFilterButton'
import ReactPlaceholder from 'react-placeholder';
import "react-placeholder/lib/reactPlaceholder.css"
import { FormattedMessage } from "react-intl";
import messages from './messages';

import {useDownshiftSelection} from 'downshift-hooks'
import Select from 'react-select'

export const TagFilterPickerCheckboxes = props => {

    const inputStyle ="absolute z-5 w-100 h-100 o-0  pointerinput-reset pointer radiobutton";

    const exteriorCircleStyle = "relative z-4 dib w1 h1 bg-white overflow-hidden b--grey-light ba br-100 v-mid bg-animate bg-center radiobutton-wrapper";
    const interiorCircleStyle = "absolute top-0 left-0 w1 h1 ba bw2 b--transparent br-100";

    const textStyle = "dib ml2 blue-grey f6 mw4 truncate lh-copy"

    const queryParamSelectedTag = props.selectedTag || [];
    const state = props.tagOptionsFromAPI;
    const firstSixTags = props.tagOptionsFromAPI.tags.slice(0,6);
    const firstSixTagsLabeled = firstSixTags.map(n => ({optionValue: n, optionLabel: n}));

    //fieldsetName
    return (
        <fieldset id={props.fieldsetName} className={props.fieldsetStyle}>
        <legend className={props.titleStyle}>{props.fieldsetTitle}</legend>
        {state.isError ? (
            <div className="bg-tan pa4"><FormattedMessage
            {...messages.errorLoadingTheXForY}
            values={{
                xWord: <FormattedMessage {...messages.filters} />,
                yWord: props.fieldsetTitlePlural
            }}
          /></div>
        ) : null}
        <ReactPlaceholder type='text' rows={3} ready={!state.isLoading}>
        { firstSixTagsLabeled.map((tagOption, key) => 
          <label className="relative inline-flex w-50 items-center mb2" title={tagOption.optionLabel} key={key}>
            <input name={props.fieldsetName}
            className={inputStyle}
            value={tagOption.optionValue}
            defaultChecked={queryParamSelectedTag === tagOption.optionValue}
              type="radio"
            />
            <span className={exteriorCircleStyle} key={"spn"+key}>
              <div className={interiorCircleStyle}></div>
            </span>
            <div className={textStyle}>
              {tagOption.optionLabel}
            </div>
          </label>
          )}
          {!state.isError && <ShowAllTagFilterButton title={props.fieldsetTitlePlural}>
          <TagFilterPickerAutocomplete
              fieldsetTitle={props.fieldsetTitle}
              defaultSelectedItem={props.fieldsetTitlePlural}
              fieldsetName={props.fieldsetName}
              queryParamSelectedItem={props.selectedTag || props.fieldsetTitle}
              tagOptionsFromAPI={props.tagOptionsFromAPI}
              setQuery={props.setQueryForChild}
              allQueryParams={props.allQueryParamsForChild}
            />
            </ShowAllTagFilterButton>}
          </ReactPlaceholder>
          </fieldset>
    );
  }

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
setQuery
}) =>  {
  const valueLabelGenerator = inputOptions => {
    return inputOptions.map((n,i) => ({"label": n , "value": n}))
  };

  const handleTagChange = change => {
    const isAllTags = (change && change.value === defaultSelectedItem)
    /* should we encodeURIComponent the change.value? */
    const newValue = isAllTags ? undefined : (change.value);
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        [fieldsetName]: newValue
      },
      "pushIn"
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
  )
}

const buttonClasses = "input-reset dim base-font bg-white button-reset";
const menuStylesSelect = {
  maxHeight: '200px',
  overflowY: 'auto',
  position: 'absolute',
  margin: 0,
  borderTop: 0,
  zIndex: 3,
  background: 'white',
}


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
setQuery
}) =>  {

  const handleTagChange = change => {
    const isAllTags = (change && change.selectedItem === defaultSelectedItem)
    const newValue = isAllTags ? undefined : change.selectedItem;
    setQuery(
      {
        ...allQueryParams,
        page: undefined,
        [fieldsetName]: newValue
      },
      "pushIn"
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
    setSelectedItem
  } = useDownshiftSelection(
    {
     items: [defaultSelectedItem,...tagOptions],
     onSelectedItemChange: handleTagChange,
     selectedItem: queryParamSelectedItem,
     circularNavigation: true
     })

  /* I think this is a bug with useDownshiftSelector, shouldn't need it */
  useLayoutEffect(() => {
    setSelectedItem(queryParamSelectedItem)
          // eslint-disable-next-line
  },[queryParamSelectedItem])

  return (
    <div className={'dib'}>
      {/* <label {...getLabelProps()}>Choose an props.fieldsent:</label> */}
      <button className={`${className} ${buttonClasses}`} {...getToggleButtonProps()}>{selectedItem}</button>
      <ul {...getMenuProps()} className={`list pl0 ml0 center mw5  br3`} style={menuStylesSelect}>
        {isOpen &&
          [defaultSelectedItem,...tagOptions].map((option, index) => (
            <li
              className={`ph3 pv2 bb b--light-silver ${highlightedIndex === index ? 'bg-tan' : ''}`}
              key={`${option}${index}`}
              {...getItemProps({item: option, index})}
            >
              {option}
            </li>
          ))}
      </ul>
    </div>
  )
}
