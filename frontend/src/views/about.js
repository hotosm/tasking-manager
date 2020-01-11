import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TopBar } from '../components/header/topBar';

export function AboutPage() {
  return <div className="pt180 pull-center bg-white blue-dark cf">
    <TopBar pageName={<FormattedMessage {...messages.about} />} />
    <div className="pl6-l ph4 mr4-l pt4 f4 w-60-l">
      <p className="avenir b f4 tracked mt0"><FormattedMessage {...messages.tmDescription} /></p>
      <blockquote className="pt3 f5 pb2 helvetica normal tracked mt0">
        <FormattedMessage
          {...messages.osmDescription}
          values={{
            osmLink: <a className="link red fw5" href="https://openstreetmap.org">OpenStreetMap</a>,
            osmWikiLink: <a className="link red fw5" href="https://wiki.openstreetmap.org/">OSM Wiki</a>
          }}
        />
      </blockquote>
    </div>
    <div className="pl6-l ph4 pt2 mr4-l f4 w-60-l">
      <h3 className="avenir b f4 tracked mt0"><FormattedMessage {...messages.howItWorks} /></h3>
      <p className="avenir f4 normal tracked mt0"><FormattedMessage {...messages.howItWorksPart1} /></p>
      <p className="avenir f4 normal tracked mt0"><FormattedMessage {...messages.howItWorksPart2} /></p>
    </div>
    <div className="ph6-l ph4 pt2">
      <div className="w-100 w-50-l fl">
        <h1 className="v-mid f2 barlow-condensed ttu fw8"><FormattedMessage {...messages.floss} /></h1>
      </div>
      <div className="w-100 w-50-l fl">
        <img className="w-25 fl mw3" src="https://opensource.org/files/OSIApproved_1.png" alt="OSI aproved license" />
        <div className="w-75 fl v-mid pl3 f5">
          <p>
            <FormattedMessage {...messages.flossDescription} />
          </p>
          <p>
            <FormattedMessage
              {...messages.repositoryLink}
              values={{
                code: <a className="link red fw5" href="https://github.com/hotosm/tasking-manager"><FormattedMessage {...messages.appCode} /></a>
              }}
            />
          </p>
        </div >
      </div>
    </div>
  </div>;
}
