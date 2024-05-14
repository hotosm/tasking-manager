import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import { UserTopBar } from '../components/user/topBar';
import { HelpCard, FirstProjectBanner, WelcomeCard } from '../components/user/content';
import { calculateCompleteness } from '../components/user/completeness';
import { PersonalInformationForm } from '../components/user/forms/personalInformation';
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

  return (
    <div className="pv4 w-100">
      <div className="cards-container">
        <ReactPlaceholder customPlaceholder={nCardPlaceholders(5)} ready={!error && !loading}>
          <RecommendedProjectsCards projects={projects.results} />
        </ReactPlaceholder>
      </div>
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
  const navigate = useNavigate();
  const userDetails = useSelector((state) => state.auth.userDetails);
  const userIsloggedIn = useSelector((state) => state.auth.token);
  const completeness = calculateCompleteness(userDetails);

  useEffect(() => {
    if (!userIsloggedIn) {
      navigate('/login');
    }
  }, [navigate, userIsloggedIn]);

  useEffect(() => {
    if (completeness >= 0.5 && userDetails.projectsMapped) {
      navigate('/contributions/projects/?mappedByMe=1&action=any');
    }
  }, [completeness, navigate, userDetails.projectsMapped]);

  return (
    <div className="pull-center">
      {completeness <= 0.5 ? (
        <IncompleteProfile />
      ) : (
        <NewContributor username={userDetails.username} userIsloggedIn={userIsloggedIn} />
      )}
    </div>
  );
}
