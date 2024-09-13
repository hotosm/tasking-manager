import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import ReactPlaceholder from 'react-placeholder';
import { Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { TasksMap } from '../taskSelection/map';
import { Button } from '../button';
import { API_URL } from '../../config';
import messages from './messages';
import ProjectProgressBar from '../projectCard/projectProgressBar';
import { HeaderLine } from '../projectDetail/header';
import { BigProjectTeaser } from '../projectDetail/bigProjectTeaser';

// Import Swiper styles
import './styles.scss';
import 'swiper/css';
import 'swiper/css/bundle';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/scrollbar';

export function CurrentProjects({ currentProjects }) {
  const [projectsData, setProjectsData] = useState([]);
  const [error, setError] = useState(false);
  const pagination = {
    clickable: true,
    el: '.swiper-custom-pagination',
  };

  const fetchData = async () => {
    try {
      const projectIds = currentProjects.split(',').map((id) => parseInt(id.trim(), 10));
      const promises = projectIds.map(async (id) => {
        const response = await fetch(API_URL + `projects/${id}/tasks/`);

        if (!response.ok) {
          setError(true);
          throw new Error(`Failed to fetch tasks for project ${id}`);
        }
        const responseInfo = await fetch(API_URL + `projects/${id}/queries/summary/`);
        if (!responseInfo.ok) {
          throw new Error(`Failed to fetch project info for project ${id}`);
        }
        const jsonData = await response.json();
        const jsonInfo = await responseInfo.json();
        const contributionResponse = await fetch(API_URL + `projects/${id}/contributions/`);
        const jsonContributions = await contributionResponse.json();
        return {
          id,
          tasks: jsonData,
          info: jsonInfo.projectInfo,
          percentMapped: jsonInfo.percentMapped,
          percentValidated: jsonInfo.percentValidated,
          percentBadImagery: jsonInfo.percentBadImagery,
          organisationName: jsonInfo.organisationName,
          lastUpdated: jsonInfo.lastUpdated,
          totalContributors: jsonContributions.userContributions.length,
        };
      });

      const projects = await Promise.all(promises);
      setProjectsData(projects);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    if (!currentProjects) return;
    fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjects]);

  if (!currentProjects)
    return <h3 className="f3 barlow-condensed blue-dark fw6">There are no current projects.</h3>;

  return (
    <ReactPlaceholder
      showLoadingAnimation={true}
      rows={26}
      ready={error || projectsData.length > 0}
      className="pv3 ph2 ph4-ns"
    >
      {!error && (
        <Swiper
          slidesPerView={1}
          autoplay
          pagination={pagination}
          modules={[Pagination]}
          swipeHandler={{ draggable: false }}
          className="shadow-4 bg-white w-100 b--gray"
        >
          {projectsData.map((project) => (
            <SwiperSlide
              key={project.id}
              className="pa3"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: '2rem',
              }}
            >
              <div style={{ gridColumn: 'span 3' }}>
                <HeaderLine
                  author={project.author}
                  projectId={project.id}
                  priority={project.projectPriority}
                  organisation={project.organisationName}
                />
                <div>
                  <h3
                    className="f2 fw5 mt3 mt2-ns mb3 ttu barlow-condensed blue-dark dib mr3"
                    // lang={project.info.locale}
                  >
                    {project.info && project.info.name}
                  </h3>
                </div>
                <section className="lh-title h5 overflow-y-auto mt3 mb3 flex flex-column">
                  <div
                    className="pr2 blue-dark-abbey markdown-content"
                    dangerouslySetInnerHTML={{ __html: project.info.shortDescription }}
                  />

                  <a
                    href="#description"
                    className="link base-font bg-white f6 bn pn red pointer mt2"
                  >
                    <span className="pr2 ttu f6 fw6 ">
                      <FormattedMessage {...messages.readMore} />
                    </span>
                  </a>

                  <div className="mt-auto" style={{ overflowX: 'clip' }}>
                    <BigProjectTeaser
                      className="pt3"
                      totalContributors={project.totalContributors}
                      lastUpdated={project.lastUpdated}
                      style={{ margin: '0.5rem 0', fontSize: '14px' }}
                    />
                    <ProjectProgressBar
                      small={false}
                      className="pb3 bg-white"
                      percentMapped={project.percentMapped}
                      percentValidated={project.percentValidated}
                      percentBadImagery={project.percentBadImagery}
                    />
                  </div>
                </section>
              </div>
              <div className="w-100 relative" style={{ gridColumn: 'span 2' }}>
                <TasksMap
                  className="w-100 h-100 m2-l"
                  mapResults={project.tasks}
                  style={{ height: '5rem' }}
                />
                <Link
                  to={`/projects/` + project.id}
                  style={{ position: 'absolute', bottom: '1.5rem', right: '0.75rem' }}
                >
                  <Button className="bg-red ba b--red white pv2 ph3">
                    <FormattedMessage {...messages.startMapping} />
                  </Button>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      <div
        className="swiper-custom-pagination mt2 w-100 flex justify-center"
        style={{ gap: '0.5rem' }}
      />
    </ReactPlaceholder>
  );
}
