import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { Field } from 'react-final-form';
import { Link } from 'react-router-dom';

import messages from '../teamsAndOrgs/messages';
import { Management } from '../teamsAndOrgs/management';
import { nCardPlaceholders } from '../licenses/licensesPlaceholder';

export const BadgeCard = ({ badge }) => {
  return (
    <Link to={`${badge.id}/`} className="bg-white shadow-4 w-100 pa3 black-90 no-underline badge-item">
      <div>
        <img src={ badge.imagePath } className="w3" />
      </div>
      <div>
        <strong className="ttu">{ badge.name }</strong>
        <p className="mb0">{ badge.description }</p>
      </div>
    </Link>
  );
};

export const BadgesManagement = ({badges, isFetched}) => {
  return (
    <Management
      title={
        <FormattedMessage
          {...messages.manage}
          values={{ entity: <FormattedMessage {...messages.badges} /> }}
        />
      }
      showAddButton={true}
      managementView
    >
      <ReactPlaceholder
        showLoadingAnimation={true}
        customPlaceholder={nCardPlaceholders(4)}
        delay={10}
        ready={isFetched}
      >
        {badges?.length ? (
          <div className="badges-container">
            { badges.map((i, n) => <BadgeCard key={n} badge={i} />) }
          </div>
        ) : (
          <div className="pv3">
            <FormattedMessage {...messages.noBadges} />
          </div>
        )}
      </ReactPlaceholder>
    </Management>
  );
};

export const BadgeInformation = () => {
  const labelClasses = 'db pt3 pb2';
  const fieldClasses = 'blue-grey w-100 pv3 ph2 input-reset ba b--grey-light bg-transparent';

  return (
    <>
      <div className="cf">
        <label className={labelClasses}>
          <FormattedMessage {...messages.name} />
        </label>
        <Field name="name" component="input" type="text" className={fieldClasses} required />
        <label className={labelClasses}>
          <FormattedMessage {...messages.description} />
        </label>
        <Field name="description" component="textarea" rows={7} className={fieldClasses} required />
        <label className={labelClasses}>
          <FormattedMessage {...messages.image} />
        </label>
        <Field name="imagePath" component="input" type="text" className={fieldClasses} required />
        <label className={labelClasses}>
          <FormattedMessage {...messages.requirements} />
        </label>
        <Field name="requirements" component="textarea" rows={7} className={fieldClasses} required />
      </div>
    </>
  );
};
