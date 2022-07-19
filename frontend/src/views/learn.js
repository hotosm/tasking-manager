import React, { useState } from 'react';
import { Link, navigate, useParams } from '@reach/router';
import Popup from 'reactjs-popup';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import { useSetTitleTag } from '../hooks/UseMetaTags';
import { TopBar } from '../components/header/topBar';
import {
  PlayIcon,
  CloseIcon,
  PolygonIcon,
  SelectProject,
  SelectTask,
  ValidationIcon,
  HumanProcessingIcon,
  WorldNodesIcon,
} from '../components/svgIcons';

import CommunityLogo from '../assets/img/icons/community.jpg';
import EmergencyMappingLogo from '../assets/img/icons/emergency-mapping.jpg';
import TechnicalLogo from '../assets/img/icons/technical.jpg';
import LearnOSMLogo from '../assets/img/learn-osm-logo.svg';
import QuickstartLogo from '../assets/img/info-logo.svg';

const LearnNav = ({ sections, section, setSection, urlParamToSection }) => {
  useSetTitleTag('Learn');

  const handleClick = (s) => {
    const typeInUrl = Object.keys(urlParamToSection).find((key) => urlParamToSection[key] === s);
    setSection(s);
    navigate(`/learn/${typeInUrl}`);
  };

  return (
    <div className="w-50 w-100-m">
      <ul className="pa0 ma0 list bg-tan dib">
        {sections.map((s) => (
          <li
            className={`f5 dib mh3 pt3 link pointer no-underline ${
              section === s ? 'bb b--blue-dark bw1 pb1' : 'pb3'
            }`}
            onClick={() => {
              handleClick(s);
            }}
            key={s}
          >
            <FormattedMessage {...messages[s]} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const Intro = ({ section, messagesObjs }) => (
  <div className="w-100 cf">
    <div className="w-100 cf">
      <div className="w-30-ns w-100 fl">
        <p className="barlow-condensed f2 ttu b fw6">
          {<FormattedMessage {...messages[section]} />}
        </p>
      </div>
      <div className="w-70-ns w-100 fr lh-copy f4">
        <p className="b">{<FormattedMessage {...messages[messagesObjs.intro]} />}</p>
        <p className="f5">
          {
            <FormattedMessage
              {...messages[messagesObjs.description]}
              values={messagesObjs.values}
            />
          }
        </p>
      </div>
    </div>
  </div>
);

const Steps = ({ items }) => (
  <div className="w-100 cf flex flex-wrap">
    {items.map((item, i) => (
      <div className="w-50-m w-third-ns pa2 z-2 bg-white" key={i}>
        <div className="shadow-1 pa3 h-100">
          {item.img}
          <p className="blue-dark b f4 pt0">
            <span className="mr1">{i + 1}.</span>
            {item.titleLink ? (
              <Link to={item.titleLink} className="link no-underline blue-dark">
                <FormattedMessage {...messages[`${item.message}Title`]} />
              </Link>
            ) : (
              <FormattedMessage {...messages[`${item.message}Title`]} />
            )}
          </p>
          <p className="blue-grey lh-title f5">
            <FormattedMessage {...messages[`${item.message}Description`]} values={item.values} />
          </p>
        </div>
      </div>
    ))}
  </div>
);

const Manuals = ({ contents }) => (
  <div className="mv3">
    <h3 className="f2 ttu barlow-condensed fw6">
      <FormattedMessage {...messages.learnManualsTitle} />
    </h3>
    <div className="w-100 cf flex flex-wrap">
      {contents.map((content, i) => (
        <div key={i} className="w-50-ns w-50-m w-25-l w-100 fl pa2">
          <div className="shadow-4 h-100">
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
              ></div>
              <div className="pa3">
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
      ))}
    </div>
  </div>
);

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
      <div className="w-100 cf flex flex-wrap">
        {contents.map((content, i) => {
          return (
            <div className="w-50-ns w-50-m w-25-l w-100 pa2" key={i}>
              <div className="shadow-4 pointer h-100" onClick={() => setActiveVideo(content)}>
                <div
                  className="bg-tan w-100 tc h5-l h4"
                  style={{
                    background: `linear-gradient(rgba(0, 0, 0, 0.3) 100%, rgba(0, 0, 0, 0.3) 100%), url(https://img.youtube.com/vi/${content.youTubeId}/hqdefault.jpg) no-repeat center`,
                    backgroundSize: 'cover',
                  }}
                >
                  <PlayIcon className="white pv5-l pv0 mv3" height="6rem" />
                </div>
                <div className="pa3 db">
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

const LearnToManage = ({ section }) => {
  const messagesObjs = {
    intro: 'learnManageIntro',
    description: 'learnManageDescription',
    values: {
      organizationsListLink: (
        <a
          className="link red fw5"
          target="_blank"
          rel="noreferrer"
          href="https://wiki.openstreetmap.org/wiki/Humanitarian_OSM_Team/HOT_Tasking_Manager_Organizations"
        >
          <FormattedMessage {...messages.list} />
        </a>
      ),
      createNewOrganizationFormLink: (
        <a
          className="link red fw5"
          target="_blank"
          rel="noreferrer"
          href="https://docs.google.com/forms/d/e/1FAIpQLSdW4O4qVYI7vdway5qdqMxp_gLhSuYVKYAwpq_jUzrcqipNeg/viewform"
        >
          <FormattedMessage {...messages.form} />
        </a>
      ),
    },
  };

  const items = [
    {
      message: 'learnManageStepJoin',
      img: <img className="w-35" src={CommunityLogo} alt={'join a community'} />,
    },
    {
      message: 'learnManageStepCreate',
      img: <img className="w-35" src={EmergencyMappingLogo} alt={'create project'} />,
    },
    {
      message: 'learnManageStepData',
      img: <img className="w-35" src={TechnicalLogo} alt={'use the data'} />,
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
      <Intro section={section} messagesObjs={messagesObjs} />
      <Steps items={items} />
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
    { message: 'learnValidateStepIdentify', img: <ValidationIcon className="red" /> },
    {
      message: 'learnValidateStepBuild',
      img: <HumanProcessingIcon className="red" />,
      values: {
        taggingLink: (
          <a className="link red fw5" href="https://wiki.openstreetmap.org/wiki/Map_Features">
            <FormattedMessage {...messages.osmTaggingSchema} />
          </a>
        ),
      },
    },
    {
      message: 'learnValidateStepCollaborate',
      img: <WorldNodesIcon className="red" />,
      values: {
        mailingListLink: (
          <a className="link red fw5" href="https://wiki.openstreetmap.org/wiki/Mailing_lists">
            <FormattedMessage {...messages.mailingLists} />
          </a>
        ),
        forumLink: (
          <a className="link red fw5" href="https://forum.openstreetmap.org/">
            <FormattedMessage {...messages.forum} />
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
      <Intro section={section} messagesObjs={messagesObjs} />
      <Steps items={items} />
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
    {
      message: 'learnMapStepSelectProject',
      img: <SelectProject className="red" />,
      titleLink: '/explore',
    },
    { message: 'learnMapStepSelectTask', img: <SelectTask className="red" /> },
    { message: 'learnMapStepMapOSM', img: <PolygonIcon className="red" /> },
  ];

  const tutorials = [
    {
      message: 'learnQuickStartTutorial',
      url: 'quickstart',
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
    {
      message: 'learnTMCheatsheet',
      url: 'https://drive.google.com/file/d/19pckU4Cru-cSz_aclsLsBk-45SQ1Qyy_/view?usp=sharing',
      img: QuickstartLogo,
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
  const { type } = useParams();
  const sections = ['learnMapTitle', 'learnValidateTitle', 'learnManageTitle'];
  const urlParamToSection = { map: sections[0], validate: sections[1], manage: sections[2] };

  const [section, setSection] = useState(urlParamToSection[type]);

  return (
    <div className="pt180 pull-center blue-dark">
      <TopBar pageName={<FormattedMessage {...messages.learn} />} />
      <div className="ph6-l ph4-m ph2">
        <LearnNav
          sections={sections}
          section={section}
          setSection={setSection}
          urlParamToSection={urlParamToSection}
        />
        <div className="w-100 mt3">{getSection(section, sections)}</div>
      </div>
    </div>
  );
};
