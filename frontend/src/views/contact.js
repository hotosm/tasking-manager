import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TopBar } from '../components/header/topBar';
import { ContactForm } from '../components/homepage/contactForm';
import { pushToLocalJSONAPI } from '../network/genericJSONRequest';
import { AlertIcon, HomeIcon } from '../components/svgIcons';
import { Button } from '../components/button';
import { useSetTitleTag } from '../hooks/UseMetaTags';

const ContactUsPopup = ({ icon, title, body, proceed, proceedFn }) => (
  <Popup modal open closeOnDocumentClick>
    {(close) => (
      <div className="pv4">
        <div className="cf tc red">{icon}</div>
        <div className="cf blue-dark tc">
          <>
            <h3 className="barlow-condensed f3">{title}</h3>
            <div className="pt3">{body}</div>
            <Button
              className="bg-red mt3 white"
              onClick={() => {
                proceedFn();
                close();
              }}
            >
              {proceed}
            </Button>
          </>
        </div>
      </div>
    )}
  </Popup>
);

export const ContactPage = () => {
  useSetTitleTag('Contact us');
  const navigate = useNavigate();
  const [sentStatus, setSentStatus] = useState(null);
  const [popups, setPopupMessage] = useState(null);

  useEffect(() => {
    if (sentStatus === 'success') {
      setPopupMessage(
        <ContactUsPopup
          icon={<HomeIcon height="50px" width="50px" />}
          title={<FormattedMessage {...messages.contactUsThanksTitle} />}
          body={<FormattedMessage {...messages.contactUsThanksBody} />}
          proceed={<FormattedMessage {...messages.contactUsThanksProceed} />}
          proceedFn={() => {
            navigate('/');
          }}
        />,
      );
    }
  }, [navigate, sentStatus]);

  const sendContactUs = (form) => {
    setSentStatus('started');

    pushToLocalJSONAPI(`system/contact-admin/`, JSON.stringify(form), null, 'POST')
      .then((success) => setSentStatus('success'))
      .catch((e) => {
        setSentStatus('failure');
        setPopupMessage(
          <ContactUsPopup
            icon={<AlertIcon height="50px" width="50px" />}
            title={<FormattedMessage {...messages.contactUsThanksError} />}
            body={e.message}
            proceed={<FormattedMessage {...messages.contactUsThanksProceed} />}
            proceedFn={() => null}
          />,
        );
      });
  };

  return (
    <div className="pt180 pull-center">
      <TopBar pageName={<FormattedMessage {...messages.contactUs} />} />
      <div className="pl6-l ph4-ns ph2 mr4-l f5 w-60-l">
        <div className="cf f5 blue-dark">
          <ContactForm submitMessage={sendContactUs} />
          {popups}
        </div>
      </div>
    </div>
  );
};
