import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { ORG_PRIVACY_POLICY_URL } from '../../config';

export function Banner() {
  const form = document.getElementById('optout-form');

  if (typeof form !== 'undefined' && form != null) {
    if (!localStorage.getItem('optout-closed')) {
      form.style.display = 'grid';
    }
    document.getElementById('optout-agree').onclick = function () {
      setAgree();
    };
    document.getElementById('optout-disagree').onclick = function () {
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
      href={`${ORG_PRIVACY_POLICY_URL}`}
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
            href={`${ORG_PRIVACY_POLICY_URL}`}
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

export function DonationBanner() {
  const form = document.getElementById('donation-form');

  if (typeof form !== 'undefined' && form != null) {
    if (!localStorage.getItem('donation-closed')) {
      form.style.display = 'grid';
    }
    document.getElementById('donation-close').onclick = function () {
      closeForm();
    };
  }

  function closeForm() {
    form.style.display = 'none';
    localStorage.setItem('donation-closed', 'true');
  }

  return (
    <div
      id="donation-form"
      className="fixed bottom-0 left-0 cf f5 w-100 tc ph6-l ph4-m ph2 pb2 bg-blue-dark white z-5 dn"
    >
      <div id="donation-contents">
        <p>
          <a
            id="privlink"
            className="red link f4 fw6"
            href={`http://bit.ly/HOTSummit2021`}
            target="_blank"
            rel="noopener noreferrer"
          >
            2021 HOT Summit
          </a>
        </p>
        <p>Join the virtual HOT Summit 2021 on November 22! All are invited; RSVP for free.</p>
        <div id="donation-buttons">
          <div className="white bg-red pv2 ph3 mh1 br1 dib fw6 pointer" id="donation-close">
            Close
          </div>
        </div>
      </div>
    </div>
  );
}

export function ArchivalNotificationBanner() {
  const form = document.getElementById('archival-notification-form');

  if (typeof form !== 'undefined' && form != null) {
    if (!localStorage.getItem('archival-notification-closed')) {
      form.style.display = 'grid';
    }
    document.getElementById('archival-notification-learnmore').onclick = function () {
      openWikiLink(
        '/Humanitarian_OSM_Team/Working_groups/Data_Quality_Control_and_Assurance/Tasking_Manager_Project_Gardening',
      );
    };
    document.getElementById('archival-notification-close').onclick = function () {
      closeForm();
    };
  }

  function closeForm() {
    form.style.display = 'none';
    localStorage.setItem('archival-notification-closed', 'true');
  }
  function openWikiLink(path) {
    window.open('https://wiki.openstreetmap.org/wiki' + path, '_blank');
    closeForm();
  }

  return (
    <div
      id="archival-notification-form"
      className="fixed bottom-0 left-0 cf f5 w-100 tc ph6-l ph4-m ph2 pb2 bg-blue-dark white z-5 dn"
    >
      <div id="archival-notification-contents">
        <p>
          <a
            id="privlink"
            className="red link f4 fw6"
            href={
              'https://wiki.openstreetmap.org/wiki/Humanitarian_OSM_Team/Working_groups/Data_Quality_Control_and_Assurance/Tasking_Manager_Project_Gardening'
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <FormattedMessage {...messages.importantNotification} />
          </a>
        </p>
        <p>
          <FormattedMessage {...messages.archivalNotificationText} />
        </p>
        <div id="archival-notification-buttons">
          <div
            className="white bg-red pv2 ph3 mh1 br1 dib fw6 pointer"
            id="archival-notification-learnmore"
          >
            <FormattedMessage {...messages.learnMore} />
          </div>
          <div
            className="white bg-red pv2 ph3 mh1 br1 dib fw6 pointer"
            id="archival-notification-close"
          >
            <FormattedMessage {...messages.close} />
          </div>
        </div>
      </div>
    </div>
  );
}
