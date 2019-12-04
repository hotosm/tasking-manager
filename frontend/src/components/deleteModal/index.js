import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { redirectTo } from '@reach/router';
import { FormattedMessage } from 'react-intl';
import Popup from "reactjs-popup";

import messages from './messages';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { DeleteButton } from '../teamsAndOrgs/management';
import { Button } from '../button';
import { AlertIcon } from '../svgIcons';


export function DeleteModal({id, name, type, className}) {
  const token = useSelector(state => state.auth.get('token'));
  const [deleteStatus, setDeleteStatus] = useState(null);
  const [error, setErrorMessage] = useState(null);
  useEffect(
    () => {
      if (deleteStatus === 'success' && type === 'notifications') {
        redirectTo(`../`);
      }
      if (deleteStatus === 'success') {
        redirectTo(`/manage/${type}/`);
      }
    }, [deleteStatus, type]
  );
  const deleteOrg = () => {
    setDeleteStatus('started');
    fetchLocalJSONAPI(`${type}/${id}/`, token, 'DELETE')
    .then(success => setDeleteStatus('success'))
    .catch(e => {
      setDeleteStatus('failure');
      setErrorMessage(e.message);
    });
  }

  const typeFormattedMsg = <FormattedMessage {...messages[type]} />;

  return (
    <Popup
      trigger={<DeleteButton className={`${className || ''} dib ml3`} />}
      modal
      closeOnDocumentClick
    >
      {close => <div className="pv4"
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
      >
        <div className="cf tc red"><AlertIcon height="50px" width="50px"/></div>
        <div className="cf blue-dark tc">
          {!deleteStatus &&
            <>
              <h3 className="barlow-condensed f3">
                <FormattedMessage {...messages.confirmDeleteTitle} values={{name: name, type: typeFormattedMsg}} />
              </h3>
              <div className="pt3">
                <Button className="bg-white blue-dark mr3" onClick={() => {setDeleteStatus(false); close()}}>
                  <FormattedMessage {...messages.cancel} />
                </Button>
                <Button className="bg-red white" onClick={() => deleteOrg()}>
                  <FormattedMessage {...messages.delete} />
                </Button>
              </div>
            </>
          }
          {deleteStatus === 'failure' &&
            <>
              <h3 className="barlow-condensed f3">
                <FormattedMessage {...messages.failure} values={{type: typeFormattedMsg}} />
              </h3>
              <p>{error}</p>
            </>
          }
        </div>
      </div>}
    </Popup>
);}
