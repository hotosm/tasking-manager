import { forwardRef, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import Popup from 'reactjs-popup';

import messages from './messages';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { DeleteButton } from '../teamsAndOrgs/management';
import { Button } from '../button';
import { AlertIcon } from '../svgIcons';

const DeleteTrigger = forwardRef((props, ref) => <DeleteButton {...props} />);

/**
 * Called when an object is deleted
 * @callback onDelete
 * @param success The success object
 */

/**
 * Create a delete modal
 * @param {number} [id] The id of the object to delete. Ignored if className is defined.
 * @param {str} [name] The name of the object (unused)
 * @param {('notifications'|'comments'|'users'|'interests'|'categories')} [type] The type of the object to delete. Ignored if className is defined.
 * @param {str} [className] The additional css class names
 * @param {str} [endpointURL] The endpoint to call
 * @param {onDelete} [onDelete] Called when the object is deleted
 * @typedef {import('@formatjs/intl').MessageDescriptor} MessageDescriptor
 * @param {MessageDescriptor} [message] The message to show the user
 * @returns {Element} The delete modal
 * @constructor
 */
export function DeleteModal({
  id,
  name,
  type,
  className,
  endpointURL,
  onDelete,
  message = messages.delete,
}: Object) {
  const navigate = useNavigate();
  const modalRef = useRef();
  const token = useSelector((state) => state.auth.token);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [error, setErrorMessage] = useState(null);
  const intl = useIntl();

  const deleteURL = endpointURL ? endpointURL : `${type}/${id}/`;

  const deleteEntity = () => {
    setDeleteStatus('started');
    fetchLocalJSONAPI(deleteURL, token, 'DELETE')
      .then(() => {
        setDeleteStatus('success');
        if (type === 'notifications') {
          setTimeout(() => navigate(`/inbox`), 750);
        } else if (type === 'comments' || type === 'users') {
          setTimeout(() => {
            onDelete(success);
            modalRef.current.close();
          }, 750);
          return;
        } else {
          setTimeout(() => navigate(`/manage/${type !== 'interests' ? type : 'categories'}`), 750);
        }
      })
      .catch((e) => {
        let errorMessage = e.message;

        if (Object.prototype.hasOwnProperty.call(messages, errorMessage)) {
          errorMessage = intl.formatMessage({...messages[e.message]});
        }

        setDeleteStatus('failure');
        setErrorMessage(errorMessage);
      });
  };

  return (
    <Popup
      ref={modalRef}
      trigger={
        <DeleteTrigger
          className={`${className || ''} dib ml3`}
          showText={type !== 'comments' && type !== 'users'}
          message={message}
        />
      }
      modal
      closeOnDocumentClick
      nested
      onClose={() => {
        setDeleteStatus(null);
        setErrorMessage(null);
      }}
    >
      {(close) => (
        <div
          className="pv4"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="cf tc red">
            <AlertIcon height="50px" width="50px" />
          </div>
          <div className="cf blue-dark tc">
            {!deleteStatus && (
              <>
                <h3 className="barlow-condensed f3">
                  <FormattedMessage {...messages[`confirmDeleteTitle_${type}`]} />
                </h3>
                <div className="pt3">
                  <Button
                    className="bg-white blue-dark mr3"
                    onClick={() => {
                      setDeleteStatus(false);
                      close();
                    }}
                  >
                    <FormattedMessage {...messages.cancel} />
                  </Button>
                  <Button className="bg-red white" onClick={() => deleteEntity()}>
                    <FormattedMessage {...message} />
                  </Button>
                </div>
              </>
            )}
            {deleteStatus && (
              <h3 className="barlow-condensed f3">
                {deleteStatus === 'started' && (
                  <>
                    <FormattedMessage {...messages.processing} />
                    &hellip;
                  </>
                )}
                {deleteStatus === 'success' && (
                  <FormattedMessage {...messages[`success_${type}`]} />
                )}
                {deleteStatus === 'failure' && (
                  <FormattedMessage {...messages[`failure_${type}`]} />
                )}
              </h3>
            )}
            {deleteStatus === 'failure' && (
              <p>
                {(error && messages[`${error}Error`] && (
                  <FormattedMessage {...messages[`${error}Error`]} />
                )) ||
                  error}
              </p>
            )}
          </div>
        </div>
      )}
    </Popup>
  );
}
