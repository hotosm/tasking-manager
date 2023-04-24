import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';
import { CloseIcon } from '../svgIcons';
import { registerUser } from '../../store/actions/user';
import { store } from '../../store';
import { createLoginWindow } from '../../utils/login';
import { ORG_PRIVACY_POLICY_URL, OSM_REGISTER_URL } from '../../config';
import { setItem } from '../../utils/safe_storage';

export const LoginModal = ({ step, login }) => {
  return (
    <div>
      <h1 className="pb2 ma0 barlow-condensed blue-dark">
        <span className="mr2">{step.number}.</span>
        <FormattedMessage {...messages.AuthorizeTitle} />
      </h1>
      <div>
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.AuthorizeMessage} />
        </p>
      </div>
      <div className="mt4 tr">
        <Button className="bg-red white" onClick={() => login()}>
          <FormattedMessage {...messages.authorize} />
        </Button>
        <p className="mb0 f6 tr">
          <a
            className="link pointer red fw5"
            target="_blank"
            rel="noopener noreferrer"
            href={OSM_REGISTER_URL}
          >
            <FormattedMessage {...messages.osmRegisterCheck} />
          </a>
        </p>
      </div>
    </div>
  );
};

export const ProceedOSM = ({ data, step, setStep, login }) => {
  const NextStep = (setStep) => {
    window.open(OSM_REGISTER_URL, '_blank');
    setStep((s) => {
      return { ...s, number: 3 };
    });
  };

  const handleLogin = () => {
    login();
    setItem('email_address', data.email);
    setItem('name', data.name);
  };

  return (
    <div>
      <h1 className="pb2 ma0 barlow-condensed blue-dark">
        <span className="mr2">{step.number}.</span>
        <FormattedMessage {...messages.proceedOSMTitle} />
      </h1>
      <div className="mt4">
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.proceedOSMPart1} />
        </p>
        <p className="blue-dark lh-copy">
          <FormattedMessage {...messages.proceedOSMPart2} />
        </p>
      </div>
      <div className="mt5 tr">
        <Button className="bg-red white" onClick={() => NextStep(setStep)}>
          <FormattedMessage {...messages.submitProceedOSM} />
        </Button>
        <p className="tr f6 link pointer red fw5" onClick={() => handleLogin()}>
          <FormattedMessage {...messages.proceedOSMLogin} />
        </p>
      </div>
    </div>
  );
};

const SignupForm = ({ data, setData, step, setStep }) => {
  const onChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
    if (step.errMessage) setStep({ ...step, errMessage: null });
  };

  const checkFields = () => {
    const re =
      // eslint-disable-next-line no-useless-escape
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (re.test(data.email) === false) {
      setStep({ ...step, errMessage: <FormattedMessage {...messages.invalidEmail} /> });
      return;
    }

    const formData = {
      email: data.email,
    };

    const registerPromise = store.dispatch(registerUser(formData));
    registerPromise.then((res) => {
      if (res.success === true) {
        setItem('email_address', data.email);
        setItem('name', data.name);
        setStep({ number: 2, errMessage: null });
      } else {
        setStep({ number: 1, errMessage: res.details });
      }
    });
  };

  return (
    <div>
      <h1 className="pb2 ma0 barlow-condensed blue-dark">
        <span className="mr2">{step.number}.</span>
        <FormattedMessage {...messages.signUpTitle} />
      </h1>
      <p className="blue-dark lh-copy">
        <FormattedMessage {...messages.signUpQuestion} />
      </p>
      <div>
        <div>
          <p className="b f6">
            <FormattedMessage {...messages.signupLabelName} />
          </p>
          <FormattedMessage {...messages.namePlaceHolder}>
            {(msg) => {
              return (
                <input
                  className="pa2 w-60-l w-100 f6"
                  type="text"
                  name="name"
                  placeholder={msg}
                  autoComplete="email"
                  onChange={onChange}
                  value={data.name}
                />
              );
            }}
          </FormattedMessage>
        </div>
        <div>
          <p className="b f6">
            <FormattedMessage {...messages.signupLabelEmail} />
          </p>
          <FormattedMessage {...messages.emailPlaceholder}>
            {(msg) => {
              return (
                <input
                  className="pa2 w-60-l w-100 f6"
                  type="email"
                  name="email"
                  placeholder={msg}
                  autoComplete="email"
                  onChange={onChange}
                  value={data.email}
                />
              );
            }}
          </FormattedMessage>
        </div>
        <p className={`h2 white f6 pa2 tc ${step.errMessage !== null ? 'bg-red' : null}`}>
          {step.errMessage}
        </p>
      </div>
      {ORG_PRIVACY_POLICY_URL && (
        <p className="mb0 f6">
          <a
            className="link pointer red fw5"
            target="_blank"
            rel="noopener noreferrer"
            href={`${ORG_PRIVACY_POLICY_URL}`}
          >
            <FormattedMessage {...messages.privacyPolicy} />
          </a>
        </p>
      )}
      <div className="mt3 tr">
        <Button
          className="bg-red white"
          onClick={() => checkFields()}
          disabled={step.errMessage !== null || !data.name || !data.email}
        >
          <FormattedMessage {...messages.submitProceed} />
        </Button>
      </div>
    </div>
  );
};

export const SignUp = ({ closeModal }) => {
  const [data, setData] = useState({ name: '', email: '' });
  const [step, setStep] = useState({ number: 1, errMessage: null });

  const login = () => {
    let redirect = '/welcome';
    if (window.location.pathname.startsWith('/projects')) {
      redirect = window.location.pathname;
    }

    closeModal();
    createLoginWindow(redirect);
  };

  const getStep = (step) => {
    switch (step.number) {
      case 2:
        return <ProceedOSM data={data} step={step} setStep={setStep} login={login} />;
      case 3:
        return <LoginModal step={step} login={login} />;
      default:
        return <SignupForm data={data} setData={setData} step={step} setStep={setStep} />;
    }
  };

  return (
    <div className="tl pa4 bg-white">
      <span className="fr relative blue-light pt1 link pointer" onClick={() => closeModal()}>
        <CloseIcon aria-label="Close popup" style={{ height: '18px', width: '18px' }} />
      </span>
      {getStep(step)}
    </div>
  );
};
