import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import { UserTopBar } from '../components/user/topBar';
import { HelpCard, FirstProjectBanner } from '../components/user/content';
import { calculateCompleteness } from '../components/user/completeness';
import { PersonalInformationForm } from '../components/user/forms/personalInformation';
import { WelcomeCard } from '../components/user/content';
import { ProjectCard } from '../components/projectCard/projectCard';
import { nCardPlaceholders } from '../components/projectCard/nCardPlaceholder';
import { useFetch } from '../hooks/UseFetch';
import { useSetTitleTag } from '../hooks/UseMetaTags';

function IncompleteProfile() {
  return (
    <>
      <UserTopBar />
      <div className="cf pa4 bg-tan">
        <div className="fl w-100 w-60-l pb3 pr3-l">
          <WelcomeCard />
          <HelpCard />
        </div>
        <div className="fl w-100 w-40-l pb3 pl3-l">
          <PersonalInformationForm />
        </div>
      </div>
    </>
  );
}

const RecommendedProjectsCards = ({ projects }) => {
  return projects.slice(0, 5).map((card, n) => {
    return <ProjectCard {...card} key={n} />;
  });
};

const RecommendedProjects = ({ username, userIsloggedIn }) => {
  const [error, loading, projects] = useFetch(
    `users/${username}/recommended-projects/`,
    username !== undefined,
  );
  const cardWidthClass = 'w-third-l';

  return (
    <div className="pv4 w-100">
      <ReactPlaceholder
        customPlaceholder={nCardPlaceholders(5, cardWidthClass)}
        ready={!error && !loading}
      >
        <RecommendedProjectsCards projects={projects.results} />
      </ReactPlaceholder>
    </div>
  );
};

function NewContributor({ username, userIsloggedIn }) {
  return (
    <div className="cf pa4 bg-tan">
      <div className="fl w-100 pb3">
        <FirstProjectBanner />
        <RecommendedProjects username={username} userIsloggedIn={userIsloggedIn} />
      </div>
    </div>
  );
}

export function Welcome() {
  useSetTitleTag('Welcome');
  const userDetails = useSelector((state) => state.auth.get('userDetails'));
  const userIsloggedIn = useSelector((state) => state.auth.get('token'));
  if (userIsloggedIn) {
    const completeness = calculateCompleteness(userDetails);
    return (
      <div className="pull-center">
        {completeness <= 0.5 ? (
          <IncompleteProfile />
        ) : userDetails.projectsMapped ? (
          <Redirect to={'/contributions/projects/?mappedByMe=1'} noThrow />
        ) : (
          <NewContributor username={userDetails.username} userIsloggedIn={userIsloggedIn} />
        )}
      </div>
    );
  } else {
    return <Redirect to={'/login'} noThrow />;
  }
}
