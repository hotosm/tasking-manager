import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from '@reach/router';

import { UserTopBar } from '../components/user/settings';
import { HelpCard, FirstProjectBanner } from '../components/user/content';
import { calculateCompleteness } from '../components/user/completeness';
import { UserInformationForm } from '../components/user/forms';
import { WelcomeCard } from '../components/user/content';
import { ProjectCard } from '../components/projectcard/projectCard';
import { useFetch } from '../hooks/UseFetch';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import { nCardPlaceholders } from '../components/projectcard/nCardPlaceholder';

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
          <UserInformationForm />
        </div>
      </div>
    </>
  );
}

const RecommendedProjectsCards = ({ projects }) => {
  return projects.slice(0, 5).map((card, n) => {
    return <ProjectCard {...card} key={n} showBottomButtons />;
  });
};

const RecommendedProjects = ({ username, userIsloggedIn }) => {
  const [error, loading, projects] = useFetch(
    `users/${username}/recommended-projects/`,
    username !== undefined,
  );

  const cardWidthClass = 'w-third-l';

  return (
    <div className="ml2 pv2 w-100">
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
  const userDetails = useSelector(state => state.auth.get('userDetails'));
  const userIsloggedIn = useSelector(state => state.auth.get('token'));
  if (userIsloggedIn) {
    const completeness = calculateCompleteness(userDetails);
    return (
      <div className="pull-center">
        {completeness <= 0.5 ? (
          <IncompleteProfile />
        ) : userDetails.tasksMapped ? (
          <Redirect to={'/contributions/projects'} noThrow />
        ) : (
          <NewContributor username={userDetails.username} userIsloggedIn={userIsloggedIn} />
        )}
      </div>
    );
  } else {
    return <Redirect to={'login'} noThrow />;
  }
}
