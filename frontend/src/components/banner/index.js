import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ORG_PRIVACY_POLICY_URL } from '../../config';

export function Banner() {
  const form = document.getElementById('optout-form');

  if (typeof form !== 'undefined' && form != null) {
    if (!localStorage.getItem('optout-closed')) {
      form.style.display = 'grid';
    }
    document.getElementById('optout-agree').onclick = function() {
      setAgree();
    };
    document.getElementById('optout-disagree').onclick = function() {
      setDisagree();
    };
  }

  function closeForm() {
    form.style.display = 'none';
    localStorage.setItem('optout-closed', 'true');
  }
  function setAgree() {
    window._paq.push(['rememberConsentGiven']);
    closeForm();
  }
  function setDisagree() {
    window._paq.push(['forgetConsentGiven']);
    closeForm();
  }

  const privacyPolicyLink = (
    <a
      href={`https://${ORG_PRIVACY_POLICY_URL}`}
      className="red underline link fw6"
      target="_blank"
      rel="noopener noreferrer"
    >
      <FormattedMessage {...messages.privacyPolicy} />
    </a>
  );

  return (
    <div
      id="optout-form"
      className="fixed bottom-0 left-0 cf f5 w-100 tc ph6-l ph4-m ph2 pb2 bg-blue-dark white z-5 dn"
    >
      <div id="optout-contents">
        <p>
          <a
            id="privlink"
            className="red link f4 fw6"
            href={`https://${ORG_PRIVACY_POLICY_URL}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.aboutInfoCollect} />
          </a>
        </p>
        <p>
          <FormattedMessage {...messages.bannerText} values={{ link: privacyPolicyLink }} />
        </p>
        <div id="optout-buttons">
          <div className="white bg-red pv2 ph3 mh1 br1 dib fw6 pointer" id="optout-disagree">
            <FormattedMessage {...messages.disagree} />
          </div>
          <div className="white bg-red pv2 ph3 mh1 br1 dib fw6 pointer" id="optout-agree">
            <FormattedMessage {...messages.agree} />
          </div>
        </div>
      </div>
    </div>
  );
}
