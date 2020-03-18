import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TopBar } from '../components/header/topBar';

export function AboutPage() {
  return (
    <div className="pt180 pull-center bg-white blue-dark cf">
      <TopBar pageName={<FormattedMessage {...messages.about} />} />
      <div className="pl6-l ph4 mr4-l pt4 f4 w-60-l lh-title">
        <p className="f3 b">{<FormattedMessage {...messages.aboutIntro} />}</p>
        <p>{<FormattedMessage {...messages.tmDescription} />}</p>
        <p>{<FormattedMessage {...messages.tmDescription2} />}</p>
        <p>
          <FormattedMessage
            {...messages.osmDescription}
            values={{
              osmLink: (
                <a className="link red fw5" href="https://openstreetmap.org">
                  OpenStreetMap
                </a>
              ),
            }}
          />
        </p>
        <p>
          <FormattedMessage
            {...messages.osmWiki}
            values={{
              osmWikiLink: (
                <a className="link red fw5" href="https://wiki.openstreetmap.org/">
                  OSM Wiki
                </a>
              ),
            }}
          />
        </p>
      </div>
      <div className="w-100 ph6-l ph4 pt2 cf mb4">
        <div className="w-60 fl">
          <h1 className="v-mid f2 barlow-condensed ttu fw8">
            <FormattedMessage {...messages.floss} />
          </h1>
        </div>
        <div className="w-40 fl">
          <img
            className="w-25 fl mw3 mr2"
            src="https://opensource.org/files/OSIApproved_1.png"
            alt="OSI aproved license"
          />
          <div className="w-75 fl v-mid pl3 f5">
            <p className="ma0 lh-title">
              <FormattedMessage
                {...messages.flossDescription}
                values={{
                  hotLink: (
                    <a className="link red fw5" href="https://hotosm.org">
                      Humanitarian OpenStreetMap Team
                    </a>
                  ),
                  code: (
                    <a className="link red fw5" href="https://github.com/hotosm/tasking-manager">
                      Github
                    </a>
                  ),
                }}
              />
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
