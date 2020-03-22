import React, { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { TopBar } from '../components/header/topBar';

import CommunityLogo from '../assets/img/icons/community.jpg';
import EmergencyMappingLogo from '../assets/img/icons/emergency-mapping.jpg';
import TechnicalLogo from '../assets/img/icons/technical.jpg';

import ValidateStepIdentity from '../assets/img/icons/validate_step_identify.png';
import ValidateStepBuild from '../assets/img/icons/validate_step_build.png';
import ValidateStepCollaborate from '../assets/img/icons/validate_step_collaborate.png';

import SelectProject from '../assets/img/icons/map_step_select_project.png';
import SelectTask from '../assets/img/icons/map_step_select_task.png';
import MapOSM from '../assets/img/icons/map_step_osm.png';

const LearnNav = ({ sections, section, setSection }) => {
  return (
    <div className="w-50 w-100-m">
      <ul className="pa0 ma0 list bg-tan">
        {sections.map(s => {
          return (
            <li
              className={`f5 dib mh2 pa3 link pointer underline-hover ${
                section === s ? 'underline' : ''
              }`}
              onClick={() => setSection(s)}
            >
              {<FormattedMessage {...messages[s]} />}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const Steps = ({ items }) => {
  return (
    <div className="flex justify-between mv5 db-m relative">
      {items.map((v, i) => {
        return (
          <div className="shadow-1 w-30 pa3 z-2 bg-white">
            <img style={{ width: '36%' }} src={v.img} alt={v.message} />

            <p className="blue-dark b f4 pt0">
              <span className="mr1">{i + 1}.</span>
              {<FormattedMessage {...messages[`${v.message}Title`]} />}
            </p>
            <p className="blue-grey lh-title f5">
              {<FormattedMessage {...messages[`${v.message}Description`]} values={v.values} />}
            </p>
          </div>
        );
      })}
      <div
        style={{ height: '60%' }}
        className="w-100 bg-tan absolute bottom--2 right--2 z-1 "
      ></div>
    </div>
  );
};

const Intro = ({ section, messagesObjs }) => {
  return (
    <div className="w-100 h5">
      <div className="flex justify-between db-m center-m">
        <div className="w-30">
          <p className="barlow-condensed f2 ttu b fw6">
            {<FormattedMessage {...messages[section]} />}
          </p>
        </div>
        <div className="w-60 lh-copy f4">
          <p className="b">{<FormattedMessage {...messages[messagesObjs.intro]} />}</p>
          <p className="f5">{<FormattedMessage {...messages[messagesObjs.description]} />}</p>
        </div>
      </div>
    </div>
  );
};

const Tutorials = ({ tutorials }) => {
  return (
    <div className="mv3">
      <h3 className="f2 ttu barlow-condensed fw6">
        <FormattedMessage {...messages.learnTutorialsTitle} />
      </h3>
      <div className="flex justify-start">
        {tutorials.map(v => {
          return (
            <div style={{ height: '20rem' }} className="w-25 shadow-4 h5 mr4">
              <div style={{ height: '45%' }} className="bg-tan"></div>
              <div className="pa3">
                <p>
                  <a className="blue-dark b" rel="noopener noreferrer" target="_blank" href={v.url}>
                    {<FormattedMessage {...messages[`${v.message}Title`]} />}
                  </a>
                </p>

                <p className="blue-grey lh-title f5">
                  {<FormattedMessage {...messages[`${v.message}Description`]} />}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LearnStruct = ({ section, messagesObjs, items }) => {
  return (
    <div>
      <Intro section={section} messagesObjs={messagesObjs} />
      <Steps items={items} />
    </div>
  );
};

const LearnToManage = ({ section }) => {
  const messagesObjs = {
    intro: 'learnManageIntro',
    description: 'learnManageDescription',
  };

  const items = [
    { message: 'learnManageStepJoin', img: CommunityLogo },
    { message: 'learnManageStepCreate', img: EmergencyMappingLogo },
    {
      message: 'learnManageStepData',
      img: TechnicalLogo,
      values: {
        exportToolLink: (
          <a className="link red fw5" href="https://export.hotosm.org/">
            HOT Export Tool
          </a>
        ),
        overpassLink: (
          <a className="link red fw5" href="https://dev.overpass-api.de/overpass-doc/en">
            Overpass API
          </a>
        ),
      },
    },
  ];

  const tutorials = [
    {
      message: 'learnOSMTutorial',
      url: 'http://nick-tallguy.github.io/en/coordination/tm-admin/',
    },
  ];

  return (
    <div className="w-100">
      <LearnStruct section={section} messagesObjs={messagesObjs} items={items} />
      <Tutorials tutorials={tutorials} />
    </div>
  );
};

const LearnToValidate = ({ section }) => {
  const messagesObjs = {
    intro: 'learnValidateIntro',
    description: 'learnValidateDescription',
  };

  const items = [
    { message: 'learnValidateStepIdentify', img: ValidateStepIdentity },
    {
      message: 'learnValidateStepBuild',
      img: ValidateStepBuild,
      values: {
        taggingLink: (
          <a className="link red fw5" href="https://wiki.openstreetmap.org/wiki/Map_Features">
            OpenStreetMap tagging schema
          </a>
        ),
      },
    },
    {
      message: 'learnValidateStepCollaborate',
      img: ValidateStepCollaborate,
      values: {
        mailingListLink: (
          <a className="link red fw5" href="https://wiki.openstreetmap.org/wiki/Mailing_lists">
            mailing lists
          </a>
        ),
        forumLink: (
          <a className="link red fw5" href="https://forum.openstreetmap.org/">
            forum
          </a>
        ),
      },
    },
  ];

  return (
    <div className="w-100">
      <LearnStruct section={section} messagesObjs={messagesObjs} items={items} />
      <p className="w-60 lh-copy f5 left mb5">
        {<FormattedMessage {...messages.learnValidateNote} />}
      </p>
    </div>
  );
};

const LearnToMap = ({ section }) => {
  const messagesObjs = {
    intro: 'learnMapIntro',
    description: 'learnMapDescription',
  };

  const items = [
    { message: 'learnMapStepSelectProject', img: SelectProject },
    { message: 'learnMapStepSelectTask', img: SelectTask },
    { message: 'learnMapStepMapOSM', img: MapOSM },
  ];

  const tutorials = [
    {
      message: 'learnQuickStartTutorial',
      url: 'https://docs.google.com/document/d/1wrzXROoiR9TgoZvGvho7YGLrGRFmEtZw8ezuW1mewbI/edit',
    },
    {
      message: 'learnTMManualTutorial',
      url: 'http://nick-tallguy.github.io/en/coordination/tm-user/',
    },
    { message: 'learnOSMStepByStepTutorial', url: 'https://learnosm.org/en/beginner/' },
  ];

  return (
    <div className="w-100">
      <Intro section={section} messagesObjs={messagesObjs} />
      <Steps items={items} />
      <Tutorials tutorials={tutorials} />
    </div>
  );
};

const getSection = (section, sections) => {
  switch (section) {
    case sections[0]:
      return <LearnToMap section={section} />;
    case sections[1]:
      return <LearnToValidate section={section} />;
    case sections[2]:
      return <LearnToManage section={section} />;
    default:
      return;
  }
};

export const LearnPage = () => {
  const sections = ['learnMapTitle', 'learnValidateTitle', 'learnManageTitle'];

  const [section, setSection] = useState(sections[0]);
  return (
    <div className="pt180 pull-center">
      <TopBar pageName={<FormattedMessage {...messages.learn} />} />
      <div className="ph6-l">
        <LearnNav sections={sections} section={section} setSection={setSection} />
        <div className="w-100 mt3">{getSection(section, sections)}</div>
      </div>
    </div>
  );
};
