import React from "react";
import { FormattedMessage, FormattedRelative } from "react-intl";

import DueDateBox from "./dueDateBox";
import ProjectProgressBar from "./projectProgressBar";
import messages from "./messages";
import { PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD } from '../../config/index';


function PriorityBox({ priority }: Object) {
  let color = "blue-grey";
  let borderColor = "b--grey";
  if (priority === "URGENT") {
    color = "red";
    borderColor = "b--red";
  }
  const translated = priority ? <FormattedMessage {...messages["projectPriority"+priority]} /> : ""
  return <div className={`pa1 fr w-33 tc br1 mt3 f7 ttu ba ${borderColor} ${color}`}>
    {translated}
  </div>;
}

function ProjectTeaser({ lastUpdated, totalMappers }: Object) {
  if (totalMappers < PROJECTCARD_CONTRIBUTION_SHOWN_THRESHOLD) {
    return (
      <div className="db tl f7 blue-grey truncate mv2" >
        <FormattedMessage  {...messages["projectLastContribution"]} /> <FormattedRelative value={lastUpdated} />
      </div>
    );
  } else {
    return(
      <div className="f7 tl blue-light mv2" >
        <FormattedMessage {...messages["projectTotalContributors"]}
          values={{number: <span className="blue-grey b f6">{totalMappers||0}</span>}}
        />
      </div>
    );
  }
}

function ProjectOrgLogo(organisationTag) {
  return (
    <div className="bg-black pa1" style={{'filter':'invert(1)'}}>
      <div title={organisationTag.organisationTag}
        className={`contain ${getLogoClass(organisationTag)} w-auto h2`}
      ></div>
    </div>
  );
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

  if (organisationTag.organisationTag) {
    const searchResult = orgs.find((a) => a.organisationTag === organisationTag.organisationTag);
    return searchResult && searchResult.className;
  } else {
    return null;
  }



}

export function MapperLevelLabel({mapperLevel}: Object) {
  const translated = mapperLevel ? <FormattedMessage {...messages["projectMapperLevel"+mapperLevel]} /> : "";
  return (
  <span className="fl f7 mt1 ttc fw5 blue-grey">
    {translated}
  </span>);
}

export function MapperLevelLabel({mapperLevel}: Object) {
  const translated = mapperLevel ? <FormattedMessage {...messages["projectMapperLevel"+mapperLevel]} /> : "";
  return (
  <span className="fl f7 mt1 ttc fw5 blue-grey">
    {translated}
    </span>);
}

export function ProjectCard({
  projectId,
  name,
  shortDescription,
  organisationTag,
  lastUpdated,
  dueDate,
  priority,
  mapperLevel,
  campaignTag,
  percentMapped,
  percentValidated,
  totalMappers
}: Object) {
  return (
    <a className="" href={`#project=${projectId}`}>
      <article className="fl w-25-l base-font w-50-m w-100 mb3 ph2 blue-dark mw5">
        <div className="pv3 ph3 ba br1 b--grey-light shadow-hover ">
          <PriorityBox priority={priority} />
          <div className="w-50 red dib"><ProjectOrgLogo organisationTag={organisationTag} /></div>
          <div className="ma1 w-100">
            <div className="f7 blue-grey">#{projectId}</div>
            <h3 title={name} className="pb2 f5 fw6 h3 lh-title overflow-y-hidden">
              {name}
            </h3>
            <div className="tc f6">
              <div className="w-100 tl pr2 f7 blue-light dib lh-title mb2 h2 overflow-y-hidden">
                {shortDescription} {campaignTag ? " · " + campaignTag : ""}
              </div>
              <ProjectTeaser totalMappers={totalMappers} lastUpdated={lastUpdated} />
              <ProjectProgressBar percentMapped={percentMapped} percentValidated={percentValidated} />
              <div className="cf pt2 h2">
                <MapperLevelLabel mapperLevel={mapperLevel} />
                <DueDateBox dueDate={dueDate} />
              </div>
            </div>
          </div>
        </div>
      </article>
    </a>
  );
}
