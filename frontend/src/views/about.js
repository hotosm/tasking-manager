import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TopBar } from '../components/header/topBar';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export function AboutPage() {
  useSetTitleTag('About');
  return (
    <div className="pt180 pull-center bg-white blue-dark cf lh-copy f5">
      <TopBar pageName={<FormattedMessage {...messages.about} />} />
      <div className="pl6-l ph4 mr4-l pt4 w-60-l">
        <p className="f4 b">{<FormattedMessage {...messages.aboutIntro} />}</p>
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
        <h1 className="v-mid f2 barlow-condensed ttu fw8">
          <FormattedMessage {...messages.floss} />
        </h1>
        <div className="w-60-l cf flex items-center">
          <img
            className="mw3 mr2"
            src="https://opensource.org/files/OSIApproved_1.png"
            alt="OSI aproved license"
          />
          <div className="v-mid pl3">
            <p className="ma0">
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
                      GitHub
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
