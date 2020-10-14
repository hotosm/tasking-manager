import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { TopBar } from '../components/header/topBar';
import { PlayIcon, CloseIcon } from '../components/svgIcons';

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

const Videos = ({ contents }) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const iframeStyle = {
    border: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
  };
  return (
    <div className="mv3">
      <h3 className="f2 ttu barlow-condensed fw6">
        <FormattedMessage {...messages.learnVideosTitle} />
      </h3>
      <div className="w-100 cf">
        {contents.map((content) => {
          return (
            <div className="w-25-l w-third-m w-100 fl ph2">
              <div className="shadow-4 pointer" onClick={() => setActiveVideo(content)}>
                <div
                  className="bg-tan w-100 tc h5-l h4"
                  style={{
                    background: `linear-gradient(rgba(0, 0, 0, 0.3) 100%, rgba(0, 0, 0, 0.3) 100%), url(https://img.youtube.com/vi/${content.youTubeId}/hqdefault.jpg) no-repeat center`,
                    backgroundSize: 'cover',
                  }}
                >
                  <PlayIcon className="white pv5-l pv0 mv3" height="6rem" />
                </div>
                <div className="pa3 db" style={{ height: '8rem' }}>
                  <p className="fw7 f4 mt0 blue-dark">
                    <FormattedMessage {...messages[`${content.message}Title`]} />
                  </p>
                  <p className="blue-grey lh-title f5 db">
                    <FormattedMessage {...messages[`${content.message}Description`]} />
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {activeVideo && (
        <Popup
          modal
          open
          closeOnEscape={true}
          closeOnDocumentClick={true}
          onClose={() => setActiveVideo(null)}
          className="video-popup"
        >
          {(close) => (
            <div className="pa3 blue-dark">
              <CloseIcon
                className="fr pointer"
                width="18px"
                height="18px"
                onClick={() => close()}
              />
              <h3 className="mt0 f4">
                <FormattedMessage {...messages[`${activeVideo.message}Title`]} />
              </h3>
              <div className="tc overflow-hidden relative" style={{ paddingTop: '56.25%' }}>
                <iframe
                  title="videotutorial"
                  style={iframeStyle}
                  src={`https://www.youtube.com/embed/${activeVideo.youTubeId}?autoplay=1`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen="allowFullScreen"
                ></iframe>
              </div>
            </div>
          )}
        </Popup>
      )}
    </div>
  );
};

const Manuals = ({ contents }) => {
  return (
    <div className="mv3">
      <h3 className="f2 ttu barlow-condensed fw6">
        <FormattedMessage {...messages.learnManualsTitle} />
      </h3>
      <div className="w-100 cf">
        {contents.map((content) => {
          return (
            <div style={{ height: '20rem' }} className="w-25-l w-third-m w-100 fl ph2">
              <div className="shadow-4">
                <a
                  className="no-underline"
                  rel="noopener noreferrer"
                  target="_blank"
                  href={content.url}
                >
                  <div
                    className="bg-tan w-100 tc h4"
                    style={{
                      background: `#f0efef url(${content.img}) no-repeat center`,
                      backgroundSize: '55%',
                    }}
                    bac
                  ></div>
                  <div className="pa3" style={{ height: '12rem' }}>
                    <p className="fw7 f4 mt0 blue-dark">
                      <FormattedMessage {...messages[`${content.message}Title`]} />
                    </p>

                    <p className="blue-grey lh-title f5">
                      <FormattedMessage {...messages[`${content.message}Description`]} />
                    </p>
                  </div>
                </a>
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
      url: 'https://learnosm.org/en/coordination/tm-admin/',
      img: LearnOSMLogo,
    },
  ];

  return (
    <div className="w-100">
      <LearnStruct section={section} messagesObjs={messagesObjs} items={items} />
      <Manuals contents={tutorials} />
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

  const videos = [
    {
      message: 'learnValidateHowToVideo',
      youTubeId: 'frVwlJn4tdI',
    },
    {
      message: 'learnValidateTrainingVideo',
      youTubeId: 'YQ18XfRM6d4',
    },
  ];

  return (
    <div className="w-100">
      <LearnStruct section={section} messagesObjs={messagesObjs} items={items} />
      <p className="w-60 lh-copy f5 left mb5">
        {<FormattedMessage {...messages.learnValidateNote} />}
      </p>
      <Videos contents={videos} />
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
      url: 'https://learnosm.org/en/coordination/tm-user/',
      img: LearnOSMLogo,
    },
    {
      message: 'learnOSMStepByStepTutorial',
      url: 'https://learnosm.org/en/beginner/',
      img: LearnOSMLogo,
    },
  ];

  const videos = [
    {
      message: 'learnSignUp',
      youTubeId: 'wqQdDgjBOvY',
    },
    {
      message: 'learnMapBuildings',
      youTubeId: 'nswUcgMfKTM',
    },
    {
      message: 'learnMapRoads',
      youTubeId: 'NzZWur1YG1k',
    },
  ];

  return (
    <div className="w-100 cf">
      <Intro section={section} messagesObjs={messagesObjs} />
      <Steps items={items} />
      <Manuals contents={tutorials} />
      <Videos contents={videos} />
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
