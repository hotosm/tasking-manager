import React from 'react';
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
  return (
    <div className="pt180 pull-center bg-white blue-dark cf lh-copy f5">
      <TopBar pageName={<FormattedMessage {...messages.quickstartTitle} />} />
      <div className="pl6-l ph4 mr4-l pt4 w-60-l">
        <p>{<FormattedMessage {...messages.quickstartIntro} />}</p>
        <p className="i">{<FormattedMessage {...messages.quickstartStep1Note} />}</p>
        <p><span className="b">1)</span> {
          <FormattedMessage
            {...messages.quickstartStep1}
            values={{
              tmHomepage: (
                <a className="link red fw5" href="/">
                  Tasking Manager
                </a>
              ),
              signUp: (
                <span className="b bg-grey-light"><FormattedMessage {...headerMessages.signUp} /></span>
              ),
            }}
          />}
        </p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep1Picture}
            alt="Quickstart guide screenshot of step 1"
          />
        </div>
        <p><span className="b">2)</span> {<FormattedMessage {...messages.quickstartStep2} />}</p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep2Picture}
            alt="Quickstart guide screenshot of step 2"
          />
        </div>
        <p><span className="b">3)</span> {
          <FormattedMessage
            {...messages.quickstartStep3}
            values={{
              signUp: (
                <span className="b bg-grey-light"><FormattedMessage {...headerMessages.signUp} /></span>
              ),
            }}
          />}
        </p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep3Picture}
            alt="Quickstart guide screenshot of step 3"
          />
        </div>
        <p><span className="b">4)</span> {
          <FormattedMessage
            {...messages.quickstartStep4}
            values={{
              tmHomepage: (
                <a className="link red fw5" href="/">
                  Tasking Manager
                </a>
              ),
              logIn: (
                <span className="b bg-grey-light"><FormattedMessage {...headerMessages.logIn} /></span>
              ),
            }}
          />}
        </p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep4Picture}
            alt="Quickstart guide screenshot of step 4"
          />
        </div>
        <p><span className="b">5)</span> {
          <FormattedMessage
            {...messages.quickstartStep5}
            values={{
              exploreProjects: (
                <span className="b bg-grey-light"><FormattedMessage {...headerMessages.exploreProjects} /></span>
              ),
            }}
          />}
        </p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep5Picture}
            alt="Quickstart guide screenshot of step 5"
          />
        </div>
        <p><span className="b">6)</span> {
          <FormattedMessage
            {...messages.quickstartStep6}
            values={{
              contribute: (
                <span className="b bg-grey-light"><FormattedMessage {...projectMessages.contribute} /></span>
              ),
            }}
          />}
        </p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep6Picture}
            alt="Quickstart guide screenshot of step 6"
          />
        </div>
        <p><span className="b">7)</span> {
          <FormattedMessage
            {...messages.quickstartStep7}
            values={{
              mapATask: (
                <span className="b bg-grey-light"><FormattedMessage {...taskMessages.mapATask} /></span>
              ),
            }}
          />}
        </p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep7Picture}
            alt="Quickstart guide screenshot of step 7"
          />
        </div>
        <p className="i">{<FormattedMessage {...messages.quickstartStep7Note} />}</p>
        <p><span className="b">8)</span> {
          <FormattedMessage {...messages.quickstartStep8} />}</p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep8Picture}
            alt="Quickstart guide screenshot of step 8"
          />
        </div>
        <p className="i">{
          <FormattedMessage
            {...messages.quickstartStep8Note}
            values={{
              learnPage: (
                <a className="link red fw5" href="learn">
                  <FormattedMessage {...messages.learnPages} />
                </a>
              ),
            }}
          />}
        </p>
        <p><span className="b">9)</span> {
          <FormattedMessage
            {...messages.quickstartStep9}
            values={{
              submitTask: (
                <span className="b bg-grey-light"><FormattedMessage {...taskMessages.submitTask} /></span>
              ),
            }}
          />}
        </p>
        <div className="w-60-l cf flex items-center shadow-4">
          <img
            src={QuickstartStep9Picture}
            alt="Quickstart guide screenshot of step 9"
          />
        </div>
        <p className="i">{<FormattedMessage {...messages.quickstartStep9Note} />}</p>
      </div>
    </div>
  );
}
