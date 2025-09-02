import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { TextBlock } from 'react-placeholder/lib/placeholders';
import { CustomButton } from '../button';
import messages from './messages';
import { CheckBoxInput } from '../formInputs';

const TeamLinkedProjectCard = ({ projectId, projectName, canUserEditTeam, unLinkFunc, isProjectSelected, handleProjectSelection }: object) => {
  return (
    <div className="flex items-center bb b--black-10">
      {canUserEditTeam && <CheckBoxInput isActive={isProjectSelected} changeState={() => {handleProjectSelection(projectId)}} className="mr3" />}
      <div className="w-70 flex items-center">
        <h3 className="truncate">{projectName}</h3>
      </div>
      <div className="w-30 flex items-center justify-end">
        <Link
          to={`/projects/${projectId}`}
          className="link ttc ph3 pv2 bg-mid-gray br2 white mr3 hover-bg-gray"
        >
          <FormattedMessage {...messages.view} />
        </Link>

        {/* User with a team edit access can unlink the project */}
        {canUserEditTeam && (
          <CustomButton
            className="bg-transparent br2 pr2 ph3 pv2 pointer ba hover-bg-black-10"
            onClick={() => {
              unLinkFunc([projectId]);
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
