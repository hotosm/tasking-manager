import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { DateCustomInput } from '../projectEdit/partnersForm';
import { useAllPartnersQuery } from '../../api/projects';
import messagesFromProjectEdit from '../projectEdit/messages';
import messages from './messages.js';

export const PartnersFilterSelect = ({
  fieldsetName,
  fieldsetStyle,
  titleStyle,
  queryParams,
  setQueryParams,
}) => {
  const [selectedPartner, setSelectedPartner] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const { isPending, isError, data: partners } = useAllPartnersQuery(token, userDetails.id);

  useEffect(() => {
    if (queryParams.partnerId && partners) {
      for (const partner of partners) {
        if (partner.id === queryParams.partnerId) {
          setSelectedPartner(partner);
          break;
        }
      }
    }

    const dateRangeCopy = { ...dateRange };
    if (queryParams.partnershipFrom) {
      dateRangeCopy.startDate = deriveDateObjectFromQueryParam(queryParams.partnershipFrom);
    }

    if (queryParams.partnershipTo) {
      dateRangeCopy.endDate = deriveDateObjectFromQueryParam(queryParams.partnershipTo);
    }
    setDateRange({ ...dateRangeCopy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams, partners]);


  const handlePartnerSelection = (value) => {
    const queryParamsCopy = { ...queryParams };
    setSelectedPartner(value || {});
    queryParamsCopy.partnerId = value ? value.id : null;
    if (!value) {
      queryParamsCopy.partnershipFrom = null;
      queryParamsCopy.partnershipTo = null;
      setDateRange({ startDate: null, endDate: null });
    }

    setQueryParams(
      {
        ...queryParamsCopy,
        page: undefined,
      },
      'pushIn',
    );
  };

  const deriveDateObjectFromQueryParam = (date) => {
    const [year, month, day] = date.split('-');
    const dateObject = new Date(year, month - 1, day);
    return dateObject;
  };

  const getDateString = (date) => {
    const [year, month, day] = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
    const dateString = `${year}-${month}-${day}`;
    return dateString;
  };

  const handleDateSelection = (date, isFromDate = true) => {
    if (!isFromDate) {
      setDateRange({
        ...dateRange,
        endDate: date,
      });
      setQueryParams(
        {
          ...queryParams,
          page: undefined,
          partnershipTo: getDateString(date),
        },
        'pushIn',
      );
      return;
    }

    if (dateRange.endDate && dateRange.endDate < date) {
      setDateRange({
        ...dateRange,
        startDate: date,
        endDate: null,
      });
    } else {
      setDateRange({
        ...dateRange,
        startDate: date,
      });
    }
    setQueryParams(
      {
        ...queryParams,
        page: undefined,
        partnershipFrom: getDateString(date),
      },
      'pushIn',
    );
  };

  const handleDateClear = (isFromDate = true) => {
    if (!isFromDate) {
      setDateRange({
        ...dateRange,
        endDate: null,
      });
      setQueryParams(
        {
          ...queryParams,
          page: undefined,
          partnershipTo: null,
        },
        'pushIn',
      );
      return;
    }

    setDateRange({
      ...dateRange,
      startDate: null,
    });
    setQueryParams(
      {
        ...queryParams,
        page: undefined,
        partnershipFrom: null,
      },
      'pushIn',
    );
  };

  return (
    <fieldset id={fieldsetName} className={fieldsetStyle}>
      <legend className={titleStyle}>
        <FormattedMessage {...messages.partner} />
      </legend>
      <Select
        classNamePrefix="react-select"
        isClearable
        isLoading={isPending}
        isDisabled={isPending || isError}
        getOptionLabel={(option) => option.name}
        getOptionValue={(option) => option.id}
        options={partners}
        value={selectedPartner.id ? selectedPartner : null}
        placeholder={
          isError ? (
            <FormattedMessage {...messagesFromProjectEdit.partnerActionsApiError} />
          ) : (
            <FormattedMessage {...messagesFromProjectEdit.selectPartner} />
          )
        }
        onChange={handlePartnerSelection}
        styles={{
          menu: (baseStyles) => ({
            ...baseStyles,
            // having greater zIndex than switch toggle(5)
            zIndex: 6,
          }),
        }}
      />

      {selectedPartner.id && (
        <div className="mt3">
          <legend className={titleStyle}>
            <FormattedMessage {...messages.partnerDates} />
          </legend>
          <div className="mt2 flex items-start justify-between">
            <ReactDatePicker
              selected={Date.parse(dateRange.startDate)}
              onChange={(date) => handleDateSelection(date)}
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              scrollableYearDropdown
              customInput={
                <DateCustomInput
                  date={dateRange.startDate}
                  handleClear={() => handleDateClear()}
                  placeholderMessage={messages.partnerFromDate}
                />
              }
            />

            <ReactDatePicker
              selected={Date.parse(dateRange.endDate)}
              onChange={(date) => handleDateSelection(date, false)}
              dateFormat="dd/MM/yyyy"
              minDate={dateRange.startDate ? dateRange.startDate : null}
              showYearDropdown
              scrollableYearDropdown
              customInput={
                <DateCustomInput
                  date={dateRange.endDate}
                  handleClear={() => handleDateClear(false)}
                  placeholderMessage={messages.partnerEndDate}
                />
              }
            />
          </div>
        </div>
      )}
    </fieldset>
  );
};

PartnersFilterSelect.propTypes = {
  fieldsetName: PropTypes.string.isRequired,
  fieldsetStyle: PropTypes.string.isRequired,
  titleStyle: PropTypes.string.isRequired,
  queryParams: PropTypes.string,
  setQueryParams: PropTypes.func.isRequired,
};
