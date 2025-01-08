import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ReactDatePicker from 'react-datepicker';
import { FormattedMessage } from 'react-intl';
import Popup from 'reactjs-popup';
import { Tooltip } from 'react-tooltip';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactPlaceholder from 'react-placeholder';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

import messages from './messages';
import { Alert } from '../alert';
import { BanIcon, CircleMinusIcon, CircleExclamationIcon } from '../svgIcons';
import { Button } from '../button';
import { styleClasses } from '../../views/projectEdit';
import { fetchLocalJSONAPI, pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { DateCustomInput } from './partnersForm';

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

export const Listing = ({ partnerIdToDetailsMapping }) => {
  const [selectedPartner, setSelectedPartner] = useState({});
  const [errorMessage, setErrorMessage] = useState({});
  const [actionType, setActionType] = useState(''); // "edit" or "remove"

  const token = useSelector((state) => state.auth.token);
  const { id } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!actionType.length) {
      setSelectedPartner({});
    }
  }, [actionType]);

  // clear dateRange error messages when the right dates are picked
  useEffect(() => {
    const startDate = selectedPartner.startedOn && new Date(selectedPartner.startedOn);
    const endDate = selectedPartner.endedOn && new Date(selectedPartner.endedOn);

    if (!endDate && errorMessage.id === messages.partnerEndDateError.id) {
      setErrorMessage({});
      return;
    }

    // clear error message if present when the selected endDate is after startDate
    if (endDate && startDate < endDate && errorMessage.id === messages.partnerEndDateError.id) {
      setErrorMessage({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        return dateB - dateA; // Descending order; Use dateA - dateB for ascending
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
        `projects/partnerships/${selectedPartner.id}/`,
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

  const getDateObjectAndDateString = (date) => {
    const [year, month, day] = date.split('T')[0].split('-');
    const dateString = `${day}/${month}/${year}`;
    const dateObject = new Date(year, month - 1, day);
    return [dateObject, dateString];
  };

  const isEmpty =
    !isPending && !isRefetching && !isError && linkedPartners?.partnerships?.length === 0;

  const tableContents = linkedPartners?.partnerships?.map((partner) => {
    const [startDate, startDateString] = getDateObjectAndDateString(partner.startedOn);

    let endDateString = 'N/A',
      endDate = null;
    if (partner.endedOn) {
      [endDate, endDateString] = getDateObjectAndDateString(partner.endedOn);
    }

    const isInactive = endDate && endDate < new Date();

    return (
      <tr
        className={`pointer ${isInactive ? 'gray' : ''}`}
        key={partner.id}
        onDoubleClick={() => {
          setSelectedPartner({ ...partner, startedOn: startDate, endedOn: endDate });
          setActionType('edit');
        }}
        style={{ userSelect: 'none' }}
      >
        <td className="pv3 f5 pr3 bb b--black-20" id="edit-partner-action">
          <span>{partnerIdToDetailsMapping[partner.partnerId]?.name}</span>
        </td>
        <td className="pv3 f5 pr3 bb b--black-20" id="edit-partner-action">
          {startDateString}
        </td>
        <td className="pv3 f5 pr3 bb b--black-20" id="edit-partner-action">
          {endDateString}
        </td>
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
        <Tooltip anchorSelect="#edit-partner-action" content="Double click to edit" />
      </tr>
    );
  });

  return (
    <div>
      <div className="overflow-auto">
        <table className="f6 w-100 mw8 center" cellSpacing="0">
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
          <div className="flex items-center justify-start pa4 gap-1 pl1">
            <BanIcon className="red" width="20" height="20" />
            <p className="ma0">
              <FormattedMessage {...messages.partnerListingError} />
            </p>
          </div>
        ) : null}

        {isEmpty ? (
          <div className="flex items-center justify-start pa4 gap-1 pl1">
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

            <dl className="lh-title mt0">
              <dt className="f5 b">{partnerIdToDetailsMapping[selectedPartner.partnerId]?.name}</dt>
              <dd className="ml0">
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
              <h6 className="f5 b mb3 mt0">
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
                    customInput={
                      <DateCustomInput
                        date={selectedPartner.startedOn}
                        hideCloseIcon
                        inputStyles={{ maxWidth: '9rem' }}
                      />
                    }
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
                        inputStyles={{ maxWidth: '9rem' }}
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

Listing.propTypes = {
  partnerIdToDetailsMapping: PropTypes.shape({
    id: PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
    }),
  }).isRequired,
};
