import { useEffect, useState, forwardRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import { FormattedMessage } from 'react-intl';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

import messages from './messages';
import { Alert } from '../alert';
import { ChevronDownIcon, CloseIcon } from '../svgIcons';
import { Button } from '../button';
import { styleClasses } from '../../views/projectEdit';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { useAllPartnersQuery } from '../../api/projects';
import { Listing } from './partnersListing';

export const DateCustomInput = forwardRef(
  ({ value, onClick, date, handleClear, isStartDate = true, hideCloseIcon = false }, ref) => {
    return (
      <div className="relative">
        <FormattedMessage {...messages[isStartDate ? 'partnerStartDate' : 'partnerEndDate']}>
          {(message) => {
            return (
              <input
                className="ba b--grey-light pa2 pointer"
                onClick={onClick}
                ref={ref}
                value={value}
                style={{ height: '42px', boxSizing: 'border-box', maxWidth: '9rem' }}
                placeholder={message}
              />
            );
          }}
        </FormattedMessage>

        {((date && hideCloseIcon) || !date) && (
          <button
            className="absolute pointer b--none bg-inherit"
            style={{ top: '0.75rem', right: '0.25rem' }}
            onClick={onClick}
          >
            <ChevronDownIcon style={{ color: 'grey', width: '12px', height: '12px' }} />
          </button>
        )}

        {date && !hideCloseIcon && (
          <button
            className="absolute pointer b--none bg-inherit"
            style={{ top: '0.7rem', right: '0.25rem' }}
            onClick={handleClear}
          >
            <CloseIcon style={{ color: 'grey', width: '10px', height: '10px' }} />
          </button>
        )}
      </div>
    );
  },
);

DateCustomInput.propTypes = {
  value: PropTypes.string,
  date: PropTypes.instanceOf(Date),
  onClick: PropTypes.func.isRequired,
  handleClear: PropTypes.func,
  isStartDate: PropTypes.bool,
  hideCloseIcon: PropTypes.bool,
};

export const PartnersForm = () => {
  const [selectedPartner, setSelectedPartner] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: null,
  });
  const [errorMessage, setErrorMessage] = useState({});
  const userDetails = useSelector((state) => state.auth.userDetails);
  const token = useSelector((state) => state.auth.token);
  const queryClient = useQueryClient();
  const { id } = useParams();

  // clear partnerNotSelectedError message when partner gets selected
  useEffect(() => {
    if (
      selectedPartner &&
      errorMessage.id &&
      errorMessage.id === messages.partnerNotSelectedError.id
    ) {
      setErrorMessage({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPartner]);

  // clear dateRange error messages when the right dates are picked
  useEffect(() => {
    if (!dateRange.endDate && errorMessage.id === messages.partnerEndDateError.id) {
      setErrorMessage({});
      return;
    }

    // clear error message if present when the selected endDate is after startDate
    if (
      dateRange.endDate &&
      dateRange.startDate < dateRange.endDate &&
      errorMessage.id === messages.partnerEndDateError.id
    ) {
      setErrorMessage({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const { isPending, isError, data: partners } = useAllPartnersQuery(token, userDetails.id);

  const savePartnerMutation = useMutation({
    mutationFn: () => {
      const startDate = `${format(dateRange.startDate, 'yyyy-MM-dd')}T00:00:00.000Z`;
      const endDate = dateRange.endDate
        ? `${format(dateRange.endDate, 'yyyy-MM-dd')}T00:00:00.000Z`
        : null;

      return pushToLocalJSONAPI(
        `projects/partnerships/`,
        JSON.stringify({
          endedOn: endDate,
          partnerId: selectedPartner.id,
          projectId: id,
          startedOn: startDate,
        }),
        token,
        'POST',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-partners', id] });
      setDateRange({
        startDate: new Date(),
        endDate: null,
      });
      toast.success(<FormattedMessage {...messages.partnerLinkActionSuccessToast} />);
    },
    onError: () => {
      toast.error(<FormattedMessage {...messages.partnerActionsApiError} />);
    },
  });

  const partnerIdToDetailsMapping = useMemo(() => {
    const mapping = {};
    for (let i = 0; i < partners?.length; i++) {
      mapping[partners[i].id] = partners[i];
    }
    return mapping;
  }, [partners]);

  const handleSave = () => {
    if (!selectedPartner?.id) {
      setErrorMessage(messages.partnerNotSelectedError);
      return;
    }

    if (dateRange.endDate && dateRange.startDate > dateRange.endDate) {
      setErrorMessage(messages.partnerEndDateError);
      return;
    }

    savePartnerMutation.mutate();
  };

  return (
    <div className={styleClasses.divClass}>
      <div className={styleClasses.divClass}>
        <label className={styleClasses.labelClass}>
          <FormattedMessage {...messages.partner} />
        </label>
        <p className={styleClasses.pClass}>
          <FormattedMessage {...messages.partnerDescription} />
        </p>
        <Select
          classNamePrefix="react-select"
          isClearable
          isLoading={isPending}
          isDisabled={isPending || isError}
          getOptionLabel={(option) => option.name}
          getOptionValue={(option) => option.id}
          options={partners}
          placeholder={
            isError ? (
              <FormattedMessage {...messages.partnerActionsApiError} />
            ) : (
              <FormattedMessage {...messages.selectPartner} />
            )
          }
          onChange={(value) => setSelectedPartner(value)}
        />

        <div className="mt2 flex items-start" style={{ gap: '0.75rem' }}>
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
              customInput={<DateCustomInput date={dateRange.startDate} hideCloseIcon />}
            />
            <p className="f7 ma0 gray mt1 pl2">
              <FormattedMessage {...messages.partnerDateFormat} />
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
              <FormattedMessage {...messages.partnerDateFormat} />
            </p>
          </div>

          <Button
            className={`${styleClasses.redButtonClass} br2`}
            style={{ height: '42px' }}
            onClick={handleSave}
            loading={savePartnerMutation.isLoading}
          >
            <FormattedMessage {...messages.savePartner} />
          </Button>
        </div>

        {errorMessage.id ? (
          <div className="mt2">
            <Alert type="error" compact>
              <FormattedMessage {...errorMessage} />
            </Alert>
          </div>
        ) : null}
      </div>

      <div>
        <Listing partnerIdToDetailsMapping={partnerIdToDetailsMapping} />
      </div>
    </div>
  );
};
