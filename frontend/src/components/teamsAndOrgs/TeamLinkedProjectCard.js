import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { TextBlock } from 'react-placeholder/lib/placeholders';
import { CustomButton } from '../button';
import messages from './messages';

const TeamLinkedProjectCard = ({ projectId, projectName, canUserEditTeam, unLinkFunc }: object) => {
  return (
    <div className="flex bb b--black-10">
      <div className="w-70 flex items-center">
        <h3 className="truncate">{projectName}</h3>
      </div>
      <div className="w-30 flex items-center justify-end">
        <Link
          to={`/projects/${projectId}`}
          className="link ttc ph3 pv2 bg-gray bn white mr4 hover-bg-mid-gray"
        >
          <FormattedMessage {...messages.view} />
        </Link>

        {/* User with a team edit access can unlink the project */}
        {canUserEditTeam && (
          <CustomButton
            className="bg-red pr2 white ph3 pv2 bn pointer hover-bg-dark-red"
            onClick={() => {
              unLinkFunc(projectId);
            }}
          >
            <FormattedMessage {...messages.unlink} />
          </CustomButton>
        )}
      </div>
    </div>
  );
};

export const TeamLinkedProjectCardPlaceholderTemplate = () => (_, i) =>
  (
    <div className="flex bb b--black-10">
      <div className="w-70 flex items-center">
        <TextBlock
          className="show-loading-animation"
          color="#CCC"
          style={{ width: 70, height: 40 }}
        />
      </div>
      <div className="w-30 flex items-center justify-end">
        <TextBlock className="show-loading-animation" color="#CCC" style={{ height: 40 }} />
        <TextBlock className="show-loading-animation" color="#CCC" style={{ height: 40 }} />
      </div>
    </div>
  );

export const nTeamProjectsCardPlaceholders = (N) => {
  return [...Array(N).keys()].map(TeamLinkedProjectCardPlaceholderTemplate());
};

export default TeamLinkedProjectCard;
