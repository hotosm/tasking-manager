import React  from 'react';
import { ShowAllTagFilterButton } from './showAllTagFilterButton'
import ReactPlaceholder from 'react-placeholder';
import "react-placeholder/lib/reactPlaceholder.css"
import { FormattedMessage } from "react-intl";
import messages from './messages';


export const TagFilterPicker = props => {

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
            {...messages.ErrorLoadingTheXForY}
            values={{
                xWord: <FormattedMessage {...messages.Filters} />,
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
          {!state.isError && <ShowAllTagFilterButton title={props.fieldsetTitlePlural}/>}
          </ReactPlaceholder>
          </fieldset>
    );
  }