import { CheckBoxInput } from '../formInputs';
import { FormattedMessage } from 'react-intl';
import ReactTooltip from 'react-tooltip';

import messages from './messages';
import statusMessages from '../projectDetail/messages';
import { TASK_COLOURS } from '../../config';
import { AnimatedLoadingIcon } from '../button';

export const ProjectsAOILayerCheckBox = ({ isActive, setActive, disabled, isAoiLoading }) => {
  return (
    <>
      <div className="bg-white fl dib pv1 ph2 blue-dark mt2 mh2 f7 br1 shadow-1">
        <CheckBoxInput
          isActive={isActive}
          disabled={disabled}
          changeState={() => setActive(!isActive)}
          className="dib mr2 v-mid"
        />
        <span className="di v-mid" data-tip>
          <FormattedMessage {...messages.showProjectsAOILayer} />
        </span>
        <span className="ml1">{isAoiLoading && <AnimatedLoadingIcon />}</span>
        <ReactTooltip place="bottom">
          {disabled ? (
            <FormattedMessage {...messages.disabledAOILayer} />
          ) : (
            <div>
              <div className="db">
                <FormattedMessage {...messages.enableAOILayer} />
              </div>
              <div className="db pt2 pb1">
                <FormattedMessage {...messages.colorLegend} />
              </div>
              <div className="db">
                <ProjectStatusLegend color={TASK_COLOURS.VALIDATED} />
                <FormattedMessage {...statusMessages.status_PUBLISHED} />
              </div>
              <div className="db">
                <ProjectStatusLegend color={TASK_COLOURS.MAPPED} />
                <FormattedMessage {...statusMessages.status_DRAFT} />
              </div>
              <div className="db">
                <ProjectStatusLegend color={TASK_COLOURS.BADIMAGERY} />
                <FormattedMessage {...statusMessages.status_ARCHIVED} />
              </div>
            </div>
          )}
        </ReactTooltip>
      </div>
    </>
  );
};

const ProjectStatusLegend = ({ color }) => (
  <span style={{ backgroundColor: color }} className="h1 w1 dib mr2"></span>
);
