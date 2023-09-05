import { FormattedMessage } from 'react-intl';

import {
  DisasterResponseIcon,
  HealthIcon,
  RefugeeResponseIcon,
  WaterSanitationIcon,
} from '../svgIcons';
import messages from './messages';

export function CreatingChange() {
  const categories = [
    {
      label: 'refugeeResponse',
      icon: RefugeeResponseIcon,
    },
    {
      label: 'publicHealth',
      icon: HealthIcon,
    },
    {
      label: 'disasterResponse',
      icon: DisasterResponseIcon,
    },
    {
      label: 'waterAndSanitation',
      icon: WaterSanitationIcon,
    },
  ];

  return (
    <section className="bg-blue-dark ph6-l ph4 pt5 pb6">
      <div className="bg-red ph3 pv2 dib white ttu fw5 f2 barlow-condensed mb5">
        <FormattedMessage {...messages.creatingChange} />
      </div>
      <div className="category-cards-ctr mt4">
        {categories.map((category) => (
          <InterestCard key={category.label} label={category.label} Icon={category.icon} />
        ))}
      </div>
    </section>
  );
}

function InterestCard({ Icon, label }) {
  const iconClass = 'red';
  const iconStyle = { height: '69px' };

  return (
    <article className="interest bg-white tc">
      <div className="w-100 tc bg-mask flex items-center justify-center card-image br1 br--top ">
        <Icon className={iconClass} style={iconStyle} />
      </div>
      <div className="detail-container">
        <h6 className="fw7 f125 mt0 mb2 blue-dark">
          <FormattedMessage {...messages[`${label}`]} />
        </h6>
        <p className="blue-grey lh-title f6 f5-ns ma0">
          <FormattedMessage {...messages[`${label}Desc`]} />
        </p>
      </div>
    </article>
  );
}
