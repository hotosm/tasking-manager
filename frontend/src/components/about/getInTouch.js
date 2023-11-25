import { FormattedMessage } from 'react-intl';

import messages from './messages';

export function GetInTouch() {
  return (
    <section className="ph6-l ph4 bg-blue-grey pt5 pb6 flex flex-column flex-row-l justify-between get-in-touch">
      <div className="bg-red ph3 pv2 dib white ttu fw5 f2 barlow-condensed mb6 heading mr5">
        <FormattedMessage {...messages.getInTouchHeader} />
      </div>
      <div className="white description">
        <FormattedMessage {...messages.generalQuestions} />
        <p className="fw7">info@hotosm.org</p>
        <hr className="solid" />
        <FormattedMessage {...messages.mappingHelp} />
      </div>
    </section>
  );
}
