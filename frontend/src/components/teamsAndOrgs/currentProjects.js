import React, { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import messages from './messages';
// import Swiper core and required modules
import { TasksMap } from '../taskSelection/map';
import SwiperCore, { Navigation, Pagination, Scrollbar, A11y } from 'swiper';
import ReactPlaceholder from 'react-placeholder';
import { Swiper, SwiperSlide } from 'swiper/react';
// Import Swiper styles
import './styles.scss';
import 'swiper/swiper.scss';
import 'swiper/swiper-bundle.css';
import 'swiper/core';
import 'swiper/components/navigation/navigation.scss';
import 'swiper/components/pagination/pagination.scss';
import 'swiper/components/scrollbar/scrollbar.scss';
import { Button } from '../button';
import { Link } from 'react-router-dom';
import ProjectProgressBar from '../projectCard/projectProgressBar';

// install Swiper modules
SwiperCore.use([Navigation, Pagination, Scrollbar, A11y]);

export function CurrentProjects({ currentProjects }) {
  const [projectsData, setProjectsData] = useState([]);
  const [error, setError] = useState(false);
  const pagination = {
    clickable: true,
    renderBullet: function (index, className) {
      return '<span class="' + className + '">' + (index + 1) + '</span>';
    },
  };

  const text = `This remote mapping of buildings will support the implementation of planned activities and
  largely the generation of data for humanitarian activities in the identified provinces. `;
  const fetchData = async () => {
    try {
      const projectIds = currentProjects.split(',').map((id) => parseInt(id.trim(), 10));
      const promises = projectIds.map(async (id) => {
        const response = await fetch(
          `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${id}/tasks/`,
        );

        if (!response.ok) {
          setError(true);
          throw new Error(`Failed to fetch tasks for project ${id}`);
        }
        const responseInfo = await fetch(
          `https://tasking-manager-tm4-production-api.hotosm.org/api/v2/projects/${id}/queries/summary/`,
        );
        if (!responseInfo.ok) {
          throw new Error(`Failed to fetch project info for project ${id}`);
        }
        const jsonData = await response.json();
        const jsonInfo = await responseInfo.json();
        return {
          id,
          tasks: jsonData,
          info: jsonInfo.projectInfo,
          percentMapped: jsonInfo.percentMapped,
          percentValidated: jsonInfo.percentValidated,
          percentBadImagery: jsonInfo.percentBadImagery,
        };
      });

      const projects = await Promise.all(promises);
      setProjectsData(projects);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProjects]);

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
          style={{
            backgroundColor: 'white',
            width: '100%',
            borderColor: 'gray',
            borderRadius: 5,
            height: 500,
            border: '1px solid',
          }}
        >
          {projectsData.map((project, index) => (
            <SwiperSlide key={index}>
              <TasksMap className="w-100 h-50 m2-l" mapResults={project.tasks} />
              <div className="mv2-l mh2 flex justify-between items-center">
                <h4>
                  {project.id} - {project.info.name}
                </h4>
                <Link  to={`/projects/` + project.id}>
                  <Button className="bg-red ba b--red white pv2 ph3">
                    <FormattedMessage {...messages.startMapping} />
                  </Button>
                </Link>
              </div>
              <div className="mh3-l mv3-l">
                <ProjectProgressBar
                  percentMapped={project.percentMapped}
                  percentValidated={project.percentValidated}
                  percentBadImagery={project.percentBadImagery}
                />
                <p>{text}</p>
                <Link
                  to={`/projects/` + project.id}
                  className="link base-font f6 mt3 bn pn red pointer"
                >
                  <span className="pr2 ttu f6 fw6">
                    <FormattedMessage {...messages.readMore} />
                  </span>
                </Link>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </ReactPlaceholder>
  );
}
