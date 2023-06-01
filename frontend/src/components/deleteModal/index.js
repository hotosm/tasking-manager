import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import Popup from 'reactjs-popup';

import messages from './messages';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { DeleteButton } from '../teamsAndOrgs/management';
import { Button } from '../button';
import { AlertIcon } from '../svgIcons';

export function DeleteModal({ id, name, type, className }: Object) {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [error, setErrorMessage] = useState(null);

  const deleteEntity = () => {
    setDeleteStatus('started');
    fetchLocalJSONAPI(`${type}/${id}/`, token, 'DELETE')
      .then((success) => {
        setDeleteStatus('success');
        if (type === 'notifications') {
          setTimeout(() => navigate(`/inbox`), 750);
        } else {
          setTimeout(() => navigate(`/manage/${type !== 'interests' ? type : 'categories'}`), 750);
        }
      })
      .catch((e) => {
        setDeleteStatus('failure');
        setErrorMessage(e.message);
      });
  };

  return (
    <Popup
      trigger={<DeleteButton className={`${className || ''} dib ml3`} />}
      modal
      closeOnDocumentClick
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
                    <FormattedMessage {...messages.delete} />
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
