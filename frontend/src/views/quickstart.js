import React from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import headerMessages from '../components/header/messages';
import projectMessages from '../components/projectDetail/messages';
import taskMessages from '../components/taskSelection/messages';
import { TopBar } from '../components/header/topBar';
import { useSetTitleTag } from '../hooks/UseMetaTags';

import QuickstartStep1Picture from '../assets/img/quickstart/quickstart-step-1.jpg';
import QuickstartStep2Picture from '../assets/img/quickstart/quickstart-step-2.jpg';
import QuickstartStep3Picture from '../assets/img/quickstart/quickstart-step-3.jpg';
import QuickstartStep4Picture from '../assets/img/quickstart/quickstart-step-4.jpg';
import QuickstartStep5Picture from '../assets/img/quickstart/quickstart-step-5.jpg';
import QuickstartStep6Picture from '../assets/img/quickstart/quickstart-step-6.jpg';
import QuickstartStep7Picture from '../assets/img/quickstart/quickstart-step-7.jpg';
import QuickstartStep8Picture from '../assets/img/quickstart/quickstart-step-8.jpg';
import QuickstartStep9Picture from '../assets/img/quickstart/quickstart-step-9.jpg';

export function QuickstartPage() {
  useSetTitleTag('Quickstart guide');

  const steps = [
    {
      message: 'quickstartStep1',
      values: {
        tmHomepage: (
          <Link className="link red fw5" to="/">
            Tasking Manager
          </Link>
        ),
        signUp: (
          <span className="b bg-grey-light">
            <FormattedMessage {...headerMessages.signUp} />
          </span>
        ),
      },
      img: QuickstartStep1Picture,
    },
    {
      message: 'quickstartStep2',
      img: QuickstartStep2Picture,
    },
    {
      message: 'quickstartStep3',
      img: QuickstartStep3Picture,
      values: {
        signUp: (
          <span className="b bg-grey-light">
            <FormattedMessage {...headerMessages.signUp} />
          </span>
        ),
      },
    },
    {
      message: 'quickstartStep4',
      img: QuickstartStep4Picture,
      values: {
        tmHomepage: (
          <Link className="link red fw5" to="/">
            Tasking Manager
          </Link>
        ),
        logIn: (
          <span className="b bg-grey-light">
            <FormattedMessage {...headerMessages.logIn} />
          </span>
        ),
      },
    },
    {
      message: 'quickstartStep5',
      img: QuickstartStep5Picture,
      values: {
        exploreProjects: (
          <span className="b bg-grey-light">
            <FormattedMessage {...headerMessages.exploreProjects} />
          </span>
        ),
      },
    },
    {
      message: 'quickstartStep6',
      img: QuickstartStep6Picture,
      values: {
        contribute: (
          <span className="b bg-grey-light">
            <FormattedMessage {...projectMessages.contribute} />
          </span>
        ),
      },
    },
    {
      message: 'quickstartStep7',
      img: QuickstartStep7Picture,
      values: {
        mapATask: (
          <span className="b bg-grey-light">
            <FormattedMessage {...taskMessages.mapATask} />
          </span>
        ),
      },
      note: 'quickstartStep7Note',
    },
    {
      message: 'quickstartStep8',
      img: QuickstartStep8Picture,
      values: {
        learnPage: (
          <Link className="link red fw5" to="/learn/map">
            <FormattedMessage {...messages.learnPages} />
          </Link>
        ),
        submitTask: (
          <span className="b bg-grey-light">
            <FormattedMessage {...taskMessages.submitTask} />
          </span>
        ),
      },
      note: 'quickstartStep8Note',
    },
    {
      message: 'quickstartStep9',
      img: QuickstartStep9Picture,
      values: {
        submitTask: (
          <span className="b bg-grey-light">
            <FormattedMessage {...taskMessages.submitTask} />
          </span>
        ),
      },
      note: 'quickstartStep9Note',
    },
  ];

  return (
    <div className="pt180 pull-center bg-white blue-dark cf lh-copy f5">
      <TopBar pageName={<FormattedMessage {...messages.quickstartTitle} />} />
      <div className="pl6-l ph4 mr4-l pt4 w-60-l">
        <p>{<FormattedMessage {...messages.quickstartIntro} />}</p>
        <p className="i">{<FormattedMessage {...messages.quickstartStep1Note} />}</p>

        <div>
          {steps.map((v, i) => {
            const idx = i + 1;
            return (
              <div className="pv2" key={v.message}>
                <p>
                  <span className="b mr1">{idx}.</span>
                  {<FormattedMessage {...messages[v.message]} values={v.values} />}
                  <div className="w-60-l cf flex items-center shadow-4 mv3">
                    <img src={v.img} alt={`Quickstart guide screenshot of step ${idx}`} />
                  </div>
                </p>
                {v.note ? (
                  <p className="i">
                    {<FormattedMessage {...messages[v.note]} values={v.values} />}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
