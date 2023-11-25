import { FormattedMessage } from 'react-intl';

import osiStandardLogo from '../../assets/img/osi_standard_logo_0.png';
import messages from './messages';

export function OpenSource() {
  return (
    <section className="ph6-l ph4 flex flex-row-l flex-column justify-between open-source">
      <h1 className="v-mid f2 barlow-condensed ttu fw5">
        <FormattedMessage {...messages.openSource} />
      </h1>
      <div className="w-40-l flex items-center">
        <img className="mw3 mr2" src={osiStandardLogo} alt="OSI aproved license" />
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
    </section>
  );
}
