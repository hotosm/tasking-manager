import { useEffect, useState, forwardRef, useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { useSelector } from 'react-redux';
import Select from 'react-select';
import ReactDatePicker from 'react-datepicker';
import { FormattedMessage } from 'react-intl';
import Popup from 'reactjs-popup';
import { Tooltip } from 'react-tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactPlaceholder from 'react-placeholder';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import messages from './messages';
import { Alert } from '../alert';
import { ChevronDownIcon } from '../svgIcons/chevron-down';
import { CloseIcon } from '../svgIcons/close';
import { BanIcon } from '../svgIcons/ban';
import { CircleMinusIcon } from '../svgIcons/circleMinus';
import { CircleExclamationIcon } from '../svgIcons/circleExclamation';
import { Button } from '../button';
import { styleClasses } from '../../views/projectEdit';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';

const DateCustomInput = forwardRef(
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

        {(date && hideCloseIcon) || !date ? (
          <div className="absolute right-1 pointer" style={{ top: '0.9rem' }} onClick={onClick}>
            <ChevronDownIcon style={{ color: 'grey', width: '12px', height: '12px' }} />
          </div>
        ) : null}

        {date && !hideCloseIcon ? (
          <div
            className="absolute right-1 pointer"
            style={{ top: '0.75rem' }}
            onClick={handleClear}
          >
            <CloseIcon style={{ color: 'grey', width: '10px', height: '10px' }} />
          </div>
        ) : null}
      </div>
    );
  },
);

const TableContentPlaceholder = () => (
  <>
    <tr>
      {new Array(4).fill(
        <td>
          <ReactPlaceholder
            type="rect"
            style={{ width: '100%', height: 50 }}
            showLoadingAnimation
          />
        </td>,
      )}
    </tr>
    <tr>
      {new Array(4).fill(
        <td>
          <ReactPlaceholder
            type="rect"
            style={{ width: '100%', height: 50 }}
            showLoadingAnimation
          />
        </td>,
      )}
    </tr>
  </>
);

const Listing = ({ partnerIdToDetailsMapping }) => {
  const [selectedPartner, setSelectedPartner] = useState({});
  const [errorMessage, setErrorMessage] = useState({});
  const [actionType, setActionType] = useState(''); // "edit" or "remove"

  const token = useSelector((state) => state.auth.token);
  const { id } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (actionType.length === 0) {
      setSelectedPartner({});
    }
  }, [actionType]);

  useEffect(() => {
    const startDate = selectedPartner.startedOn && new Date(selectedPartner.startedOn);
    const endDate = selectedPartner.endedOn && new Date(selectedPartner.endedOn);

    if (!endDate && errorMessage.id === messages.partnerEndDateError.id) {
      setErrorMessage({});
      return;
    }

    if (endDate && startDate < endDate && errorMessage.id === messages.partnerEndDateError.id) {
      setErrorMessage({});
      return;
    }
  }, [selectedPartner.startedOn, selectedPartner.endedOn]);

  const {
    isPending,
    isError,
    data: linkedPartners,
    isRefetching,
  } = useQuery({
    queryKey: ['linked-partners', id],
    queryFn: async () => {
      const response = await fetchLocalJSONAPI(`projects/${id}/partners/`);
      const sortedPartnershipsByStartDate = response.partnerships.sort((itemA, itemB) => {
        const dateA = new Date(itemA.startedOn);
        const dateB = new Date(itemB.startedOn);
        // return dateA - dateB; // Ascending order
        return dateB - dateA; // Descending order
      });

      return { partnerships: sortedPartnershipsByStartDate };
    },
  });

  const removePartnerMutation = useMutation({
    mutationFn: () => {
      return pushToLocalJSONAPI(
        `projects/partnerships/${selectedPartner.id}/`,
        null,
        token,
        'DELETE',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-partners', id] });
      setActionType('');
      toast.success(<FormattedMessage {...messages.partnerRemoveActionSuccessToast} />);
    },
    onError: () => {
      toast.error(<FormattedMessage {...messages.partnerActionsApiError} />);
    },
  });

  const updatePartnerMutation = useMutation({
    mutationFn: () => {
      const startDate = `${format(selectedPartner.startedOn, 'yyyy-MM-dd')}T00:00:00.000Z`;
      const endDate = selectedPartner.endedOn
        ? `${format(selectedPartner.endedOn, 'yyyy-MM-dd')}T00:00:00.000Z`
        : null;

      return pushToLocalJSONAPI(
        `projects/partnerships/${selectedPartner.id}`,
        JSON.stringify({
          endedOn: endDate,
          startedOn: startDate,
        }),
        token,
        'PATCH',
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked-partners', id] });
      setActionType('');
      toast.success(<FormattedMessage {...messages.partnerUpdateActionSuccessToast} />);
    },
    onError: () => {
      toast.error(<FormattedMessage {...messages.partnerActionsApiError} />);
    },
  });

  const handleUpdate = () => {
    const startDate = selectedPartner.startedOn && new Date(selectedPartner.startedOn);
    const endDate = selectedPartner.endedOn && new Date(selectedPartner.endedOn);

    if (endDate && startDate > endDate) {
      setErrorMessage(messages.partnerEndDateError);
      return;
    }

    updatePartnerMutation.mutate();
  };

  const isEmpty =
    !isPending && !isRefetching && !isError && linkedPartners?.partnerships?.length === 0;

  const tableContents = linkedPartners?.partnerships?.map((partner) => {
    const [startYear, startMonth, startDay] = partner.startedOn.split('T')[0].split('-');
    const startDateString = `${startDay}/${startMonth}/${startYear}`;
    const startDate = new Date(startYear, startMonth - 1, startDay);

    let endDateString = 'N/A',
      endDate = null;
    if (partner.endedOn) {
      const [endYear, endMonth, endDay] = partner.endedOn.split('T')[0].split('-');
      endDateString = `${endDay}/${endMonth}/${endYear}`;
      endDate = new Date(endYear, endMonth - 1, endDay);
    }

    const isInactive = endDate && endDate < new Date() ? true : false;

    return (
      <tr className={isInactive ? 'gray' : ''} key={partner.id}>
        <td className="pv3 f5 pr3 bb b--black-20">
          <span
            className="pointer"
            data-tooltip-id="edit-partner-action"
            data-tooltip-content="Double click to edit"
            onDoubleClick={() => {
              setSelectedPartner({ ...partner, startedOn: startDate, endedOn: endDate });
              setActionType('edit');
            }}
          >
            {partnerIdToDetailsMapping[partner.partnerId]?.name}
          </span>
        </td>
        <td className="pv3 f5 pr3 bb b--black-20">{startDateString}</td>
        <td className="pv3 f5 pr3 bb b--black-20">{endDateString}</td>
        <td className="pv3 f5 pr3 bb b--black-20">
          <CircleMinusIcon
            className="red pointer"
            onClick={() => {
              setSelectedPartner({ ...partner });
              setActionType('remove');
            }}
            data-tooltip-id="remove-partner-action"
            data-tooltip-content="Remove this partner"
          />
        </td>
        <Tooltip id="remove-partner-action" />
        <Tooltip id="edit-partner-action" />
      </tr>
    );
  });

  return (
    <div>
      <div className="overflow-auto">
        <table className="f6 w-100 mw8 center" cellspacing="0">
          <thead>
            <tr>
              <th className="fw6 f5 bb b--black-50 tl pb3 pr3">
                <FormattedMessage {...messages.partner} />
              </th>
              <th className="fw6 f5 bb b--black-50 tl pb3 pr3">
                <FormattedMessage {...messages.partnerStartDate} />
              </th>
              <th className="fw6 f5 bb b--black-50 tl pb3 pr3">
                <FormattedMessage {...messages.partnerEndDate} />
              </th>
              <th className="fw6 f5 bb b--black-50 tl pb3 pr3"></th>
            </tr>
          </thead>

          <tbody className="lh-copy">
            <ReactPlaceholder
              customPlaceholder={<TableContentPlaceholder />}
              ready={!isPending && !isRefetching}
              showLoadingAnimation
            >
              {tableContents}
            </ReactPlaceholder>
          </tbody>
        </table>

        {isError ? (
          <div className="flex items-center justify-center pa4 flex-column gap-1">
            <BanIcon className="red" width="20" height="20" />
            <p className="ma0">
              <FormattedMessage {...messages.partnerListingError} />
            </p>
          </div>
        ) : null}

        {isEmpty ? (
          <div className="flex items-center justify-center pa4 flex-column gap-1">
            <CircleExclamationIcon className="red" width="20" height="20" />
            <p className="ma0">
              <FormattedMessage {...messages.partnerListingEmpty} />
            </p>
          </div>
        ) : null}
      </div>

      <Popup
        modal
        open={actionType === 'remove'}
        closeOnDocumentClick={false}
        nested
        onClose={() => setActionType('')}
      >
        {(close) => (
          <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
            <h3 className="barlow-condensed f3 fw6 mv0">
              <FormattedMessage {...messages.partnerRemoveModalTitle} />
            </h3>
            <p className="mt4">
              <FormattedMessage {...messages.partnerRemoveModalText} />
            </p>

            <dl class="lh-title mt0">
              <dt class="f5 b">{partnerIdToDetailsMapping[selectedPartner.partnerId]?.name}</dt>
              <dd class="ml0">
                From&nbsp;
                {selectedPartner.startedOn
                  ? format(new Date(selectedPartner.startedOn), 'dd/MM/yyyy')
                  : 'N/A'}
                &nbsp;to&nbsp;
                {selectedPartner.endedOn
                  ? format(new Date(selectedPartner.endedOn), 'dd/MM/yyyy')
                  : 'N/A'}
              </dd>
            </dl>

            <div className="w-100 pt3 flex justify-end">
              <Button
                className="mr2 br1 f5 bn pointer br2"
                onClick={() => {
                  setActionType('');
                  close();
                }}
              >
                <FormattedMessage {...messages.cancel} />
              </Button>

              <Button
                onClick={() => {
                  removePartnerMutation.mutate();
                }}
                className={`${styleClasses.redButtonClass} br2`}
                loading={removePartnerMutation.isLoading}
              >
                <FormattedMessage {...messages.partnerRemove} />
              </Button>
            </div>
          </div>
        )}
      </Popup>

      <Popup
        modal
        open={actionType === 'edit'}
        closeOnDocumentClick
        nested
        onClose={() => setActionType('')}
        contentStyle={{ overflow: 'visible' }}
      >
        {(close) => (
          <div className="blue-dark bg-white pv2 pv4-ns ph2 ph4-ns">
            <h3 className="barlow-condensed f3 fw6 mv0">
              <FormattedMessage {...messages.partnerUpdateModalTitle} />
            </h3>
            <div className="mt4 mb3 relative">
              <h6 class="f5 b mb3 mt0">
                {partnerIdToDetailsMapping[selectedPartner.partnerId]?.name}
              </h6>
              <div className="flex items-center flex-wrap" style={{ gap: '1.75rem' }}>
                <div className="flex flex-column">
                  <p className="ma0 gray f6 mb1">
                    <FormattedMessage {...messages.partnerStartDate} />
                  </p>
                  <ReactDatePicker
                    className={styleClasses.inputClass}
                    selected={Date.parse(selectedPartner.startedOn)}
                    onChange={(date) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        startedOn: date,
                      })
                    }
                    dateFormat="dd/MM/yyyy"
                    showYearDropdown
                    scrollableYearDropdown
                    customInput={<DateCustomInput date={selectedPartner.startedOn} hideCloseIcon />}
                  />
                  <p className="ma0 gray f7 mt1 pl2">
                    <FormattedMessage {...messages.partnerDateFormat} />
                  </p>
                </div>

                <div className="flex flex-column">
                  <p className="ma0 gray f6 mb1">
                    <FormattedMessage {...messages.partnerEndDate} />
                  </p>
                  <ReactDatePicker
                    selected={Date.parse(selectedPartner.endedOn)}
                    placeholderText={<FormattedMessage {...messages.partnerEndDate} />}
                    className={styleClasses.inputClass}
                    onChange={(date) =>
                      setSelectedPartner({
                        ...selectedPartner,
                        endedOn: date,
                      })
                    }
                    dateFormat="dd/MM/yyyy"
                    showYearDropdown
                    scrollableYearDropdown
                    customInput={
                      <DateCustomInput
                        date={selectedPartner.endedOn}
                        isStartDate={false}
                        hideCloseIcon
                      />
                    }
                  />
                  <p className="ma0 gray f7 mt1 pl2">
                    <FormattedMessage {...messages.partnerDateFormat} />
                  </p>
                </div>
              </div>
              {errorMessage.id ? (
                <div className="mt2">
                  <Alert type="error" compact>
                    <FormattedMessage {...errorMessage} />
                  </Alert>
                </div>
              ) : null}
            </div>

            <div className="w-100 pt3 flex justify-end">
              <Button
                className="mr2 br1 f5 bn pointer br2"
                onClick={() => {
                  setActionType('');
                  close();
                }}
              >
                <FormattedMessage {...messages.cancel} />
              </Button>

              <Button
                onClick={handleUpdate}
                className={`${styleClasses.redButtonClass} br2`}
                loading={updatePartnerMutation.isLoading}
              >
                <FormattedMessage {...messages.savePartner} />
              </Button>
            </div>
          </div>
        )}
      </Popup>
    </div>
  );
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

  useEffect(() => {
    if (
      selectedPartner &&
      errorMessage.id &&
      errorMessage.id === messages.partnerNotSelectedError.id
    ) {
      setErrorMessage({});
    }
  }, [selectedPartner]);

  useEffect(() => {
    if (!dateRange.endDate && errorMessage.id === messages.partnerEndDateError.id) {
      setErrorMessage({});
      return;
    }

    if (
      dateRange.endDate &&
      dateRange.startDate < dateRange.endDate &&
      errorMessage.id === messages.partnerEndDateError.id
    ) {
      setErrorMessage({});
      return;
    }
  }, [dateRange]);

  const {
    isPending,
    isError,
    data: partners,
  } = useQuery({
    queryKey: ['all-partners', userDetails.id],
    queryFn: () => fetchLocalJSONAPI('partners/', token),
  });

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
    if (!selectedPartner || !selectedPartner.id) {
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
