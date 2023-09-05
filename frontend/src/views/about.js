import { FormattedMessage } from 'react-intl';

import { useSetTitleTag } from '../hooks/UseMetaTags';
import { TopBar } from '../components/header/topBar';
import {
  CoordinationCards,
  CreatingChange,
  CrisisStats,
  OpenSource,
  SponsorshipAndFunding,
  GetInTouch,
} from '../components/about';
import messages from './messages';

export function AboutPage() {
  useSetTitleTag('About');

  return (
    <div className="pt180 pull-center bg-white blue-dark cf lh-copy f5">
      <TopBar pageName={<FormattedMessage {...messages.about} />} />
      <div className="pl6-l ph4 mr4-l pt4 mw8">
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
        <p>
          <FormattedMessage
            {...messages.sustainabilityModel}
            values={{
              faqs: (
                <a
                  className="link red fw5"
                  href="https://docs.google.com/document/d/1p0zGfvANgrynn7vnOND-2rK4HHKbWVha9Xx8jfOwick"
                >
                  <FormattedMessage {...messages.smFAQ} />
                </a>
              ),
            }}
          />
        </p>
      </div>
      <CoordinationCards />
      <CreatingChange />
      <CrisisStats />
      <SponsorshipAndFunding />
      <OpenSource />
      <GetInTouch />
    </div>
  );
}
