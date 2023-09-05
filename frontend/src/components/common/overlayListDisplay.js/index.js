import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../button';
import messages from '../../homepage/messages';
import './styles.scss';

export function OverlayListDisplay({ title, description, organizations, contactTitle, variant }) {
  return (
    <section
      className={`bg-${variant === 'dark' ? 'blue-dark' : 'tan'} overlay-list-diplay-ctr mb5-m`}
    >
      <div className={`ph6-l ph4 ${variant === 'dark' ? 'white' : 'black'}`}>
        <div className="w-100">
          <h3
            className={`${
              variant === 'dark' ? 'bg-red title-padding' : ''
            } dib fw5 tc lh-copy ttu barlow-condensed ma0`}
          >
            <FormattedMessage {...title} />
          </h3>
        </div>
        <div className="w-75-l w-100">
          <p className={`mb4 f5 ${variant === 'dark' ? 'f3-ns' : 'f125'} lh-title mw6 mt4`}>
            <FormattedMessage {...description} />
          </p>
          <div className="pb4 pb2-l flex flex-wrap logo-ctr organizations">
            {organizations.map((org, n) => (
              <div key={org.name} className="org">
                <a href={org.url} aria-label={`Visit ${org.name}`}>
                  <org.Icon
                    className="logo-svg"
                    height="69px"
                    isShowWhiteLogo={variant === 'dark'}
                  />
                </a>
              </div>
            ))}
          </div>
        </div>
        <ContactCard title={contactTitle} />
      </div>
    </section>
  );
}

function ContactCard({ title }) {
  const navigate = useNavigate();

  return (
    <div className="blue-dark bg-white contact-card br1">
      <h4 className="f3 fw5 ttu barlow-condensed ma0">
        <FormattedMessage {...title} />
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
