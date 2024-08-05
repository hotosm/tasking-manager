import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import { FormattedMessage } from 'react-intl';
import PropTypes from 'prop-types';

import { Alert } from '../alert';
import { DateCustomInput } from '../projectEdit/partnersForm';
import { useAllPartnersQuery } from '../../api/projects';
import messagesFromProjectEdit from '../projectEdit/messages';
import messages from './messages.js';

export const PartnersFilterSelect = ({ fieldsetName, fieldsetStyle, titleStyle }) => {
  const [selectedPartner, setSelectedPartner] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const [errorMessage, setErrorMessage] = useState({});
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (dateRange.endDate && dateRange.startDate > dateRange.endDate) {
      setErrorMessage(messagesFromProjectEdit.partnerEndDateError);
      return;
    }

    if (!dateRange.endDate && errorMessage.id === messagesFromProjectEdit.partnerEndDateError.id) {
      setErrorMessage({});
    }

    // clear error message if present when the selected endDate is after startDate
    if (
      dateRange.endDate &&
      dateRange.startDate < dateRange.endDate &&
      errorMessage.id === messagesFromProjectEdit.partnerEndDateError.id
    ) {
      setErrorMessage({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const { isPending, isError, data: partners } = useAllPartnersQuery(token, userDetails.id);

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
        onChange={(value) => (value ? setSelectedPartner(value) : setSelectedPartner({}))}
        styles={{
          menu: (baseStyles) => ({
            ...baseStyles,
            // having greater zIndex than switch toggle(5)
            zIndex: 6,
          }),
        }}
      />

      <div className="mt3">
        <legend className={titleStyle}>
          <FormattedMessage {...messages.partnerDates} />
        </legend>
        <div className="mt2 flex items-start justify-between">
          <div className="flex flex-column">
            <ReactDatePicker
              selected={Date.parse(dateRange.startDate)}
              onChange={(date) =>
                setDateRange({
                  ...dateRange,
                  startDate: date,
                })
              }
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              scrollableYearDropdown
              customInput={
                <DateCustomInput
                  date={dateRange.startDate}
                  handleClear={() => {
                    setDateRange({
                      ...dateRange,
                      startDate: null,
                    });
                  }}
                />
              }
            />
            <p className="f7 ma0 gray mt1 pl2">
              <FormattedMessage {...messagesFromProjectEdit.partnerDateFormat} />
            </p>
          </div>

          <div className="flex flex-column">
            <ReactDatePicker
              selected={Date.parse(dateRange.endDate)}
              onChange={(date) =>
                setDateRange({
                  ...dateRange,
                  endDate: date,
                })
              }
              dateFormat="dd/MM/yyyy"
              showYearDropdown
              scrollableYearDropdown
              customInput={
                <DateCustomInput
                  date={dateRange.endDate}
                  handleClear={() => {
                    setDateRange({
                      ...dateRange,
                      endDate: null,
                    });
                  }}
                  isStartDate={false}
                />
              }
            />
            <p className="f7 ma0 gray mt1 pl2">
              <FormattedMessage {...messagesFromProjectEdit.partnerDateFormat} />
            </p>
          </div>
        </div>
      </div>

      {errorMessage.id ? (
        <div className="mt2">
          <Alert type="error" compact>
            <FormattedMessage {...errorMessage} />
          </Alert>
        </div>
      ) : null}
    </fieldset>
  );
};

PartnersFilterSelect.propTypes = {
  fieldsetName: PropTypes.string.isRequired,
  fieldsetStyle: PropTypes.string.isRequired,
  titleStyle: PropTypes.string.isRequired,
};
