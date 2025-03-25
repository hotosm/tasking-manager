import { useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { Button } from '../button';

const organizations = [
  { url: 'https://www.redcross.org/', code: 'redcross', name: 'American Red Cross' },
  { url: 'https://www.redcross.org.uk/', code: 'brc', name: 'British Red Cross' },
  { url: 'https://www.msf.org/', code: 'msf', name: 'Medecins Sans Frontieres' },
  { url: 'https://www.worldbank.org/', code: 'wb', name: 'World Bank' },
  { url: 'https://www.usaid.gov/', code: 'usaid', name: 'USAID' },
  { url: 'https://www.bing.com/', code: 'bing', name: 'Bing' },
];

function ContactCard() {
  const navigate = useNavigate();
  return (
    <div className="blue-dark bg-white contact-card br1">
      <h4 className="f3 fw5 ttu barlow-condensed ma0">
        <FormattedMessage {...messages.organizationContactTitle} />
      </h4>
      <div className="w-100 w-auto-ns">
        <Button
          className="w-100 tc bg-red white mt5-ns nowrap mt0-m"
          onClick={() => navigate('/contact')}
        >
          <FormattedMessage {...messages.organizationContactButton} />
        </Button>
      </div>
    </div>
  );
}

export function WhoIsMapping() {
  return (
    <div className="bg-blue-dark who-is-mapping mb5-m">
      <div className="ph6-l ph4 white">
        <div className="w-100">
          <h3 className="bg-red dib fw5 tc lh-copy white ttu barlow-condensed ma0">
            <FormattedMessage {...messages.whoIsMappingTitle} />
          </h3>
        </div>
        <div className="w-75-l w-100">
          <p className="mb4 f5 f3-ns lh-title mw6 mt4">
            <FormattedMessage {...messages.whoIsMappingHeadline} />
          </p>
          <div className="pb4 pb2-l flex flex-wrap logo-ctr organizations">
            {organizations.map((org, n) => (
              <div key={n} className="org w-50">
                <a href={org.url}>
                  <div className={`contain  org-${org.code} w-auto h3`} aria-label={org.name}></div>
                </a>
              </div>
            ))}
          </div>
        </div>
        <ContactCard />
      </div>
    </div>
  );
}
