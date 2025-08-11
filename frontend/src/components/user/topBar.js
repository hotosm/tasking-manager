import { useSelector } from 'react-redux';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { TextRow } from 'react-placeholder/lib/placeholders';

import messages from './messages';
import { CurrentUserAvatar } from './avatar';
import { ProfileCompleteness } from './completeness';
import { MappingLevelMessage } from '../mappingLevel';
import { useUserNextLevelQuery } from '../../api/stats';

export function NextMappingLevel({ userId }: Object) {
  const { data } = useUserNextLevelQuery(userId);
  const nextLevel = data?.nextLevel;
  const nextLevelThreshold = data?.aggregatedGoal;
  const changesetsCount = data?.aggregatedProgress;

  if (nextLevel) {
    return (
      <span className="blue-grey">
        <FormattedMessage
          {...messages.nextLevel}
          className="blue-grey"
          values={{
            changesets: (
              <span className="blue-dark f4 fw6">
                <FormattedNumber value={changesetsCount} />
              </span>
            ),
            nextLevelThreshold: <span className="blue-dark f4">{nextLevelThreshold}</span>,
            level: nextLevel,
          }}
        />
      </span>
    );
  }

  return '';
}

export function UserTopBar() {
  const user = useSelector((state) => state.auth.userDetails);
  const osmUserInfo = useSelector((state) => state.auth.osm);

  const placeholder = (
    <div className="pl2 dib">
      <TextRow style={{ width: 150, height: '2.3em' }} color="#eee" />
      <TextRow style={{ width: 150, height: '1em' }} color="#eee" />
      <TextRow style={{ width: 150, height: '1em' }} color="#eee" />
    </div>
  );

  return (
    <div className="cf ph4 pv4 mb2">
      <div className="w-100 w-75-l fl flex flex-column flex-row-ns items-center tc tl-ns">
        <div className="fl dib mr3">
          <CurrentUserAvatar className="h4 w4 br-100 pa1 ba b--grey-light bw3 red" />
        </div>
        <ReactPlaceholder
          showLoadingAnimation={true}
          customPlaceholder={placeholder}
          delay={500}
          ready={user !== undefined && osmUserInfo !== undefined}
        >
          <div className="pl2 dib lh-solid mt3 mt0-ns">
            <h3 className="ttu fw5 mv0 barlow-condensed username-heading">
              {user.name || user.username}
            </h3>
            <p className="f4 blue-dark mv3 fw5">
              <MappingLevelMessage level={user.mappingLevel} />
            </p>
            <NextMappingLevel userId={user.id} />
          </div>
        </ReactPlaceholder>
      </div>
      <div className="w-100 w-25-l fl dn db-ns">
        <ProfileCompleteness userDetails={user} />
      </div>
    </div>
  );
}
