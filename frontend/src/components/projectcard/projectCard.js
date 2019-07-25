import React from "react";
import { FormattedMessage, FormattedRelative } from "react-intl";
import DueDateBox from "./dueDateBox"
import ProjectProgressBar from "./projectProgressBar"

import messages from "./messages";

import { PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD } from '../../config/index';

function PriorityBox({ priority }: Object) {
  let color = "blue-grey";
  let borderColor = "b--grey";
  if (priority === "URGENT") {
    color = "red";
    borderColor = "b--red";
  }
  return <div className={`pa1 fr w-33 tc br1 mt3 f7 ttu ba ${borderColor} ${color}`}>
    <FormattedMessage {...messages["projectPriority"+priority]} />
    </div>;
}

function ProjectTeaser({ lastUpdated, totalMappers }: Object) {
    if (totalMappers < PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD) {
        return (<div className="db tl f7 blue-grey truncate mv2" >
           <FormattedMessage  {...messages["projectLastContribution"]} /> <FormattedRelative value={lastUpdated} />
          </div>)

    } else {
        return (<div className="f7 tl blue-light mv2" ><span className="blue-grey b">
        {totalMappers}</span> <FormattedMessage {...messages["projectTotalContributors"]} />
        </div>)
    }
  }

function ProjectOrgLogo(organisationTag) {
  return (
      <div className="bg-black pa1" style={{'filter':'invert(1)'}}>
          <div title={organisationTag.organisationTag} className={`contain ${getLogoClass(organisationTag)} w-auto h2`}></div>
      </div>);
}

function getLogoClass(organisationTag: String) {
  const orgs = [{className: "org-unicef", 
    organisationTag: "UNICEF"},
      {className: "org-usaid",
      organisationTag: "#YouthMappers"
    },
      {className: "org-gfdrr",
      organisationTag: "UNICEF"
    },
      {className: "org-aws",
      organisationTag: "AWS"
    },
      {className: "org-redcross",
      organisationTag: "Missing Maps"
    },
      {className: "org-redcross",
      organisationTag: "American Red Cross"
    },
      {className: "org-msf",
      organisationTag: "Médecins Sans Frontières"
    }];
  //organisationTag: World Bank
  return orgs.find((a) => a.organisationTag === organisationTag.organisationTag).className
  
}

export function ProjectCard({
  projectId,
  title,
  shortDescription,
  organisationTag,
  lastUpdated,
  dueDate,
  mapperLevel,
  projectPriority,
  percentMapped,
  percentValidated,
  totalMappers
}: Object) {
  return (
    <a href={`#project=${projectId}`}>
    <article className="fl w-25-l base-font w-50-m w-100 mb3 ph2 blue-dark mw5">
      <div className="pv3 ba br1  b--grey-light ph3">
        <PriorityBox priority={projectPriority} />
        <div className="w-50 red dib"><ProjectOrgLogo organisationTag={organisationTag} /></div>
        <div className="ma1 w-100">
          <div className="f7 blue-grey">#{projectId}</div>
          <h3 className="pb2 f5 fw6 h3 lh-title overflow-y-visible">
            {title}
          </h3>
          <div className="tc f6">
            <div className="w-100 tl pr2 f7 blue-light dib lh-title mb2 h2 overflow-y-hidden">
              {shortDescription}
            </div>
            <ProjectTeaser totalMappers={totalMappers} lastUpdated={lastUpdated} />
            <ProjectProgressBar percentMapped={percentMapped} percentValidated={percentValidated} />
            <div className="cf pt2 h2">
              <span className="fl f7 mt1 ttc fw5 blue-grey"><FormattedMessage {...messages["projectMapperLevel"+mapperLevel]} /></span>
              <DueDateBox dueDate={dueDate} />          
            </div>
          </div>
        </div>
      </div>
    </article>
    </a>
  );
}
