import React from "react";
import { FormattedMessage, FormattedRelative } from "react-intl";
import humanizeDuration from 'humanize-duration'

import messages from "./messages";


function PriorityBox({ priority }: Object) {
  let color = "blue-grey";
  let borderColor = "b--grey";
  if (priority === "URGENT") {
    color = "red";
    borderColor = "b--red";
  }
  return <div className={`pa1 fr w-33 tc br1 mt3 mr2 f7 ttu ba ${borderColor} ${color}`}>
    <FormattedMessage {...messages["projectPriority"+priority]} />
    </div>;
}


function ProjectTeaser({ lastUpdated, totalMappers }: Object) {
    if (totalMappers < 5) {
        return (<p className="db tl f7 blue-grey truncate" >
          Last contribution <FormattedRelative value={lastUpdated} />
          </p>)

    } else {
        return (<p className="f7 tl blue-grey" ><span className="b">
        {totalMappers}</span> total contributors
        </p>)
    }
  }

function ProjectProgressBar({ percentMapped, percentValidated }: Object) {
  /* tooltip component credit: https://codepen.io/syndicatefx/pen/QVPbJg */
  return   (<> 
  <div className="cf db">
    <div className="relative">
      <div className={`absolute bg-blue-grey br-pill hhalf hide-child ${tachyonsWidthClass(percentMapped)}`} >
        <span className="db absolute top-2 z-1 w3 w4-m w4-l bg-black ba br2 b--moon-gray pa2 shadow-5 child">
        <p className="f6 lh-copy near-black ma0 white f7 fw4"> <span className="fw8">{percentMapped}%</span> Mapped</p>
        <span className="absolute top-0 center-2 nt2 w1 h1 bg-black bl bt b--moon-gray rotate-45"></span>
        </span>
      </div>
      <div className={`absolute bg-red br-pill hhalf hide-child ${tachyonsWidthClass(percentValidated)}`} >
        <span className="db absolute top-2 z-1 w3 w4-m w4-l bg-black ba br2 b--blue-dark pa2 shadow-5 child">
        <p className="f6 lh-copy near-black ma0 white f7 fw4"> <span className="fw8">{percentValidated}%</span> Validated</p>
        <span className="absolute top-0 left-2 nt2 w1 h1 bg-black bl bt b--blue-dark rotate-45"></span>
        </span>
      </div>
      <div className={`bg-grey-light br-pill hhalf overflow-y-hidden`}></div>
  </div>
</div>
</>);
}


function ProjectOrgLogo(organisationTag) {
  return (
      <div className="bg-black pa1">
          <div className={`contain ${getLogoClass(organisationTag)} w-auto h3`}></div>
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

export function DueDateBox({dueDate}: Object) {
  if (dueDate === undefined) {
    return null;
  }
  const milliDifference = (dueDate - Date.now());

  if (milliDifference > 0) {
    return (
    <span className="fr w-50 f7 tc link ph1 pv1 bg-grey-light blue-grey">
      <FormattedMessage
        {...messages["dueDateRelativeRemainingDays"]}
        values={{
          daysLeft: (<FormattedRelative value={dueDate} />),
          daysLeftHumanize: humanizeDuration(milliDifference, { largest: 1 }) 
        }}
      />
    </span>
    );
   } else {
     return null;
   }
}

function tachyonsWidthClass(percent: Number) {
   const tachyonsWidths =  [
     {
       className: "",
       value: 0},
     {
        className: "w-10",
        value: 10},
{
        className: "w-20",
        value: 20},
{
        className: "w-25",
        value: 25},
{
        className: "w-30",
        value: 30},
{       
        className: "w-33",
        value: 33},
{
        className: "w-third",
        value: 33},
{
        className: "w-34",
        value: 34},
{
        className: "w-40",
        value: 40},
{
        className: "w-50",
        value: 50},
{
        className: "w-60",
        value: 60},
{
        className: "w-two-thirds",
        value: 66},
{
        className: "w-75",
        value: 75},
{
        className: "w-80",
        value: 80},
{
        className: "w-90",
        value: 90},
{
        className: "w-100",
        value: 100
}];

    return tachyonsWidths.slice().reverse().find((a) => a.value <= percent ).className
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
    <article className="fl w-25-l w-50-m w-100 ph2 blue-dark ">
      <div className="pv3 ba b--blue-grey ph3"  >
        <PriorityBox priority={projectPriority} />
        <div className="w-50 red dib"><ProjectOrgLogo organisationTag={organisationTag} /></div>
        <div className="ma1 w-100">
          <div className="f7 blue-grey">#{projectId}</div>
          <h3 className="pb2 f5 fw6 h3 lh-title overflow-y-visible">
            {title}
          </h3>
          <div className="tc f6">
            <p className="w-100 tl pr2 f7 dib lh-title mb2 h2 overflow-y-hidden">
              {shortDescription}
            </p>
            <ProjectTeaser totalMappers={totalMappers} lastUpdated={lastUpdated} />
            <ProjectProgressBar percentMapped={percentMapped} percentValidated={percentValidated} />
            <p className="cf">
              <span className="fl f7 mt1 ttc fw5 blue-grey"><FormattedMessage {...messages["projectMapperLevel"+mapperLevel]} /></span>
              <DueDateBox dueDate={dueDate} />          
            </p>
          </div>
        </div>
      </div>
    </article>
    </a>
  );
}
