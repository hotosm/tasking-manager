import React, { useEffect, useState } from 'react';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';
import Select from 'react-select';
import { format, parse } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FormattedMessage, useIntl } from 'react-intl';
import { dateRanges } from '../../utils/date';
import messages from './messages';
import { CalendarIcon } from '../svgIcons';

export const ProjectFilterSelect = ({
  fieldsetName,
  fieldsetStyle,
  titleStyle,
  selectedTag,
  setQueryForChild,
  allQueryParamsForChild,
  options,
}) => {
  const state = options;
  const fieldsetTitle = <FormattedMessage {...messages[fieldsetName]} />;
  const fieldsetTitlePlural = <FormattedMessage {...messages[`${fieldsetName}s`]} />;

  return (
    <fieldset id={fieldsetName} className={fieldsetStyle}>
      <legend className={titleStyle}>{fieldsetTitle}</legend>
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
          fieldsetName={fieldsetName}
          queryParamSelectedItem={selectedTag || fieldsetTitle}
          tagOptionsFromAPI={options}
          setQuery={setQueryForChild}
          allQueryParams={allQueryParamsForChild}
        />
      </ReactPlaceholder>
    </fieldset>
  );
};

export const DateRangeFilterSelect = ({
  fieldsetName,
  fieldsetStyle,
  titleStyle,
  setQueryForChild,
  allQueryParamsForChild,
  isCustomDateRange,
  setIsCustomDateRange,
  startDateInQuery,
  endDateInQuery,
}) => {
  const [dateRange, setDateRange] = useState('thisYear');

  const dropdownOptions = [
    { value: 'thisWeek', label: <FormattedMessage {...messages.thisWeek} /> },
    { value: 'thisMonth', label: <FormattedMessage {...messages.thisMonth} /> },
    { value: 'thisYear', label: <FormattedMessage {...messages.thisYear} /> },
    { value: 'lastWeek', label: <FormattedMessage {...messages.lastWeek} /> },
    { value: 'lastMonth', label: <FormattedMessage {...messages.lastMonth} /> },
    { value: 'lastYear', label: <FormattedMessage {...messages.lastYear} /> },
    (isCustomDateRange || dateRange === 'custom') && {
      value: 'custom',
      label: <FormattedMessage {...messages.customRange} />,
      isOptionDisabled: true,
    },
  ].filter((a) => a);

  useEffect(() => {
    if (!endDateInQuery && startDateInQuery === dateRanges['thisYear'].start) {
      setDateRange('thisYear');
      return;
    }
    const doesRangeMatch = Object.keys(dateRanges).find(
      (range) =>
        dateRanges[range].start === startDateInQuery && dateRanges[range].end === endDateInQuery,
    );
    doesRangeMatch ? setDateRange(doesRangeMatch) : setDateRange('custom');
  }, [startDateInQuery, endDateInQuery]);

  return (
    <fieldset id={fieldsetName} className={fieldsetStyle}>
      <legend className={titleStyle}>
        <FormattedMessage {...messages.dateRange} />
      </legend>
      <Select
        onChange={({ value }) => {
          setQueryForChild(
            {
              ...allQueryParamsForChild,
              page: undefined,
              startDate: dateRanges[value].start,
              endDate: dateRanges[value].end,
            },
            'pushIn',
          );
          setIsCustomDateRange(false);
          setDateRange(value);
        }}
        classNamePrefix="react-select"
        options={dropdownOptions}
        value={
          isCustomDateRange
            ? dropdownOptions.filter((option) => option.value === 'custom')
            : dropdownOptions.filter((option) => option.value === dateRange)
        }
        isOptionDisabled={(option) => option.isOptionDisabled}
      />
    </fieldset>
  );
};

export const DateFilterPicker = ({
  fieldsetName,
  fieldsetStyle,
  titleStyle,
  selectedValue,
  setQueryForChild,
  allQueryParamsForChild,
  setIsCustomDateRange,
}) => {
  const intl = useIntl();
  const dateFormat = 'yyyy-MM-dd';
  return (
    <fieldset id={fieldsetName} className={fieldsetStyle}>
      <legend className={titleStyle}>
        <FormattedMessage {...messages[fieldsetName]} />
      </legend>
      <CalendarIcon className="blue-grey dib w1 pr2 v-mid" />
      <DatePicker
        selected={selectedValue ? parse(selectedValue, dateFormat, new Date()) : null}
        onChange={(date) => {
          setQueryForChild(
            {
              ...allQueryParamsForChild,
              page: undefined,
              [fieldsetName]: date ? format(date, dateFormat) : null,
            },
            'pushIn',
          );
          setIsCustomDateRange(true);
        }}
        dateFormat={dateFormat}
        className="w-auto pv2 ph1 ba b--grey-light"
        placeholderText={intl.formatMessage(messages[`${fieldsetName}Placeholder`])}
        showYearDropdown
        scrollableYearDropdown
      />
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
    if (option && option.value) {
      return option.value;
    }
    if (option && option.name) {
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
        [fieldsetName]: newValue || undefined,
      },
      'pushIn',
    );
  };

  const [selectedOption] = tagOptions.filter((option) => option.name === queryParamSelectedItem);

  return (
    <Select
      onChange={handleTagChange}
      classNamePrefix="react-select"
      getOptionLabel={getLabel}
      getOptionValue={getValue}
      autoFocus={true}
      placeholder={allQueryParams[fieldsetName] || fieldsetTitle}
      options={tagOptions}
      value={selectedOption || null}
      isClearable={true}
    />
  );
};
