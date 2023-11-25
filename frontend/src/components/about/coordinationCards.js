import { FormattedMessage } from 'react-intl';

import { MappingIcon, ValidationIcon, ProjectManagementIcon } from '../svgIcons';
import messages from './messages';

const cards = [
  {
    image: <MappingIcon />,
    label: 'mappers',
  },
  {
    image: <ValidationIcon />,
    label: 'validators',
  },
  {
    image: <ProjectManagementIcon />,
    label: 'projectManagers',
  },
];

export function CoordinationCards() {
  return (
    <section className="ph6-l ph4 pb4">
      <div className="coordination-cards-container-parent mv6">
        <div className="flex flex-column flex-row-l coordination-cards-container">
          {cards.map((card) => (
            <CoordinationCard key={card.label} image={card.image} label={card.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CoordinationCard({ image, label }) {
  return (
    <article className="pv3 drop-shadow-1 bg-white">
      <div className="pa4 ph3-m flex flex-column items-center tc">
        <div className="red dib">{image}</div>
        <h4 className="blue-dark b f125 mb3 mt4">
          <FormattedMessage {...messages[`${label}`]} />
        </h4>
        <p className="blue-grey f125 ma0">
          <FormattedMessage {...messages[`${label}Desc`]} />
        </p>
      </div>
    </article>
  );
}
