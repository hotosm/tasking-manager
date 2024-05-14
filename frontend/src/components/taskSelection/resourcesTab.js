import React, { useMemo, useState } from 'react';
import Select from 'react-select';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useTaskBbox } from '../../hooks/UseTaskBbox';
import { formatOSMChaLink } from '../../utils/osmchaLink';
import { ExternalLinkIcon } from '../svgIcons';
import { CustomButton } from '../button';
import { OSMChaButton } from '../projectDetail/osmchaButton';
import { DownloadAOIButton, DownloadTaskGridButton } from '../projectDetail/downloadButtons';

export const ResourcesTab = ({ project, tasksIds, tasksGeojson }) => {
  const [activeTask, setActiveTask] = useState(tasksIds.length === 1 ? tasksIds[0] : null);
  const bbox = useTaskBbox(activeTask, tasksGeojson);
  const osmchaLink = useMemo(
    () =>
      formatOSMChaLink({
        aoiBBOX: bbox,
        created: project.created,
        changesetComment: project.changesetComment,
      }),
    [bbox, project.created, project.changesetComment],
  );

  return (
    <>
      <h4 className="ttu blue-grey f5">
        <FormattedMessage {...messages.changesets} />
      </h4>
      <div className="ph2">
        <p>
          <OSMChaButton project={project}>
            <CustomButton className="bg-white blue-dark ba b--grey-light pv2 ph3">
              <FormattedMessage {...messages.entireProject} />
              <ExternalLinkIcon className="pl2" />
            </CustomButton>
          </OSMChaButton>
        </p>
        <div className="w-100 cf flex flex-wrap">
          {tasksIds.length > 1 && (
            <Select
              classNamePrefix="react-select"
              className="z-4 flex-auto fl mr3 pb2"
              isClearable={false}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.value}
              isMulti={false}
              options={tasksIds.map((id) => ({ label: id, value: id }))}
              placeholder={<FormattedMessage {...messages.selectTask} />}
              isSearchable={true}
              onChange={(selected) => setActiveTask(selected.value)}
            />
          )}
          <a href={osmchaLink} target="_blank" rel="noopener noreferrer">
            <CustomButton className={'bg-red b--red white ba pv2 ph3'} disabled={!activeTask}>
              <FormattedMessage {...messages.seeTaskChangesets} />
              <ExternalLinkIcon className="pl2" />
            </CustomButton>
          </a>
        </div>
      </div>
      <h4 className="ttu blue-grey f5">
        <FormattedMessage {...messages.projectData} />
      </h4>
      <div className="flex flex-wrap gap-1">
        <DownloadAOIButton
          projectId={project.projectId}
          className="bg-white blue-dark ba b--grey-light pv2 ph3"
        />
        <DownloadTaskGridButton
          projectId={project.projectId}
          className="bg-white blue-dark ba b--grey-light pv2 ph3"
        />
      </div>
    </>
  );
};
