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
import LearnOSMLogo from '../assets/img/learn-osm-logo.svg';
import QuickstartLogo from '../assets/img/info-logo.svg';
import { useSetTitleTag } from '../hooks/UseMetaTags';

const LearnNav = ({ sections, section, setSection }) => {
  useSetTitleTag('Learn');
  return (
    <div className="w-50 w-100-m">
      <ul className="pa0 ma0 list bg-tan dib">
        {sections.map((s) => {
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
    <div className="w-100 cf relative">
      {items.map((v, i) => {
        return (
          <div className="w-third-ns w-100 fl pa2 z-2 bg-white">
            <div className="shadow-1 pa3">
              <img className="w-35" src={v.img} alt={v.message} />

              <p className="blue-dark b f4 pt0">
                <span className="mr1">{i + 1}.</span>
                {<FormattedMessage {...messages[`${v.message}Title`]} />}
              </p>
              <p className="blue-grey lh-title f5">
                {<FormattedMessage {...messages[`${v.message}Description`]} values={v.values} />}
              </p>
            </div>
          </div>
        );
      })}
      <div
        style={{ height: '60%' }}
        className="w-100 bg-tan relative bottom--2 right--2 z-1 "
      ></div>
    </div>
  );
};

const Intro = ({ section, messagesObjs }) => {
  return (
    <div className="w-100 cf">
      <div className="w-100 cf">
        <div className="w-30-ns w-100 fl">
          <p className="barlow-condensed f2 ttu b fw6">
            {<FormattedMessage {...messages[section]} />}
          </p>
        </div>
        <div className="w-70-ns w-100 fr lh-copy f4">
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
      <div className="w-100 cf">
        {tutorials.map((v) => {
          return (
            <div style={{ height: '20rem' }} className="w-25-l w-third-m w-100 fl ph2">
              <div className="shadow-4">
                <div
                  className="bg-tan w-100 tc h4"
                  style={{
                    background: `#f0efef url(${v.img}) no-repeat center`,
                    backgroundSize: '55%',
                  }}
                  bac
                ></div>
                <div className="pa3" style={{ height: '12rem' }}>
                  <p>
                    <a
                      className="blue-dark b"
                      rel="noopener noreferrer"
                      target="_blank"
                      href={v.url}
                    >
                      {<FormattedMessage {...messages[`${v.message}Title`]} />}
                    </a>
                  </p>

                  <p className="blue-grey lh-title f5">
                    {<FormattedMessage {...messages[`${v.message}Description`]} />}
                  </p>
                </div>
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
      img: LearnOSMLogo,
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
      url: 'learn/quickstart',
      img: QuickstartLogo,
    },
    {
      message: 'learnTMManualTutorial',
      url: 'http://nick-tallguy.github.io/en/coordination/tm-user/',
      img: LearnOSMLogo,
    },
    {
      message: 'learnOSMStepByStepTutorial',
      url: 'https://learnosm.org/en/beginner/',
      img: LearnOSMLogo,
    },
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
      <div className="ph6-l ph4-m ph2">
        <LearnNav sections={sections} section={section} setSection={setSection} />
        <div className="w-100 mt3">{getSection(section, sections)}</div>
      </div>
    </div>
  );
};
