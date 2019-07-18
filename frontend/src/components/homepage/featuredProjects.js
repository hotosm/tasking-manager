import React from 'react';
import { FormattedMessage, FormattedNumber } from 'react-intl';
import { MappingIcon, RightIcon, LeftIcon } from '../svgIcons';
import { ProjectCard } from '../../components/projectcard/projectCard';
import { useState, useEffect } from 'react';

import messages from './messages';

function FeaturedProjectPaginateArrows({pages, activeProjectCardPage, setProjectCardPage}: Object) {

    let enableLeft = false;
    let enableRight = false;
    if (pages.length - 1 > activeProjectCardPage) {
        enableRight = true;
    }
    if (activeProjectCardPage !== 0) {
        enableLeft = true;
    } 
    return (
        <div className="fr dib f2 mr2 pv3 pr6">
            <div className={`dib mr2 dim ${enableLeft ? 'red' : 'light-red'}`} onClick={() => enableLeft && setProjectCardPage(activeProjectCardPage - 1)}><LeftIcon /></div>
            <div className={`dib dim ${enableRight ? 'red' : 'light-red'}`} onClick={() => enableRight && setProjectCardPage(activeProjectCardPage + 1)}><RightIcon /></div>
        </div>
    );
}

const chunkArray = chunkSize => array => {
    return array.reduce((acc, each, index, src) => {
        if (!(index % chunkSize)) { 
            return [...acc, src.slice(index, index + chunkSize)];
        } 
        return acc;
        },
    []);
}
const projectPaginate = chunkArray(4);

export function FeaturedProjects() {
  const [activeProjectCardPage, setProjectCardPage] = useState(0);

  const imageHeight = "5rem";
  /* quoted keys are from project activity API */
  const cards = [
    {
      image: <MappingIcon style={{height: imageHeight}} />,
      projectId: 6106,
      projectStatus: "PUBLISHED",
      projectPriority: "URGENT",
      mapperLevel: "BEGINNER",
      title: "Response to the impact of Cyclone Idai in Mozambique",
      shortDescription: "Disaster Response · Cyclone Idai · Mozambique",
      created: new Date("2019-04-23T14:49:23.809743"),
      lastUpdated: new Date("2019-07-17T18:50:28.081458"),
      "campaignTag": "#UNICEF",
      "organisationTag": "UNICEF",
      "percentMapped": 100,
      "percentValidated": 96,
      "percentBadImagery": 1,
      "totalMappers": 10,
      "totalTasks": 152,
      "totalComments": 0,
      "totalMappingTime": 80214,
      "totalValidationTime": 458741,
      "totalTimeSpent": 538955,
      "averageMappingTime": 8912.666666666666,
      "averageValidationTime": 114685.25,
      "status": "PUBLISHED"
    },
    {
        image: <MappingIcon style={{height: imageHeight}} />,
        projectId: 5001,
        projectStatus: "PUBLISHED",
        projectPriority: "MEDIUM",
        mapperLevel: "ADVANCED",
        title: "Prepare for the influx of Venezuelan refugees into Colombia",
        shortDescription: "Refugee Response · AyudaVenezuela · Colombia",
        created: new Date("2019-04-23T14:49:23.809743"),
        lastUpdated: new Date("2019-07-17T18:50:28.081458"),
        "campaignTag": "American Red Cross",
        "organisationTag": "American Red Cross",
        "percentMapped": 50,
        "percentValidated": 30,
        "percentBadImagery": 1,
        "totalMappers": 20,
        "totalTasks": 152,
        "totalComments": 0,
        "totalMappingTime": 80214,
        "totalValidationTime": 458741,
        "totalTimeSpent": 538955,
        "averageMappingTime": 8912.666666666666,
        "averageValidationTime": 114685.25,
        "status": "PUBLISHED"
      },
      {
        image: <MappingIcon style={{height: imageHeight}} />,
        projectId: 5707,
        projectStatus: "PUBLISHED",
        projectPriority: "MEDIUM",
        mapperLevel: "INTERMEDIATE",
        title: "Tracing borderlands to contain Ebola outbreak",
        shortDescription: "Public Health · Ebola · DRC",
        created: new Date("2019-04-23T14:49:23.809743"),
        lastUpdated: new Date("2019-07-17T18:50:28.081458"),
        "campaignTag": "#Allpeopleonmap",
        "organisationTag": "Médecins Sans Frontières",
        "percentMapped": 66,
        "percentValidated": 50,
        "percentBadImagery": 1,
        "totalMappers": 2,
        "totalTasks": 152,
        "totalComments": 0,
        "totalMappingTime": 80214,
        "totalValidationTime": 458741,
        "totalTimeSpent": 538955,
        "averageMappingTime": 8912.666666666666,
        "averageValidationTime": 114685.25,
        "status": "PUBLISHED"
      },
      {
        image: <MappingIcon style={{height: imageHeight}} />,
        projectId: 6106,
        projectStatus: "PUBLISHED",
        projectPriority: "LOW",
        mapperLevel: "INTERMEDIATE",
        title: "Mapping mosquito net coverage",
        shortDescription: "Public Health · Malaria2018 · Mozambique",
        created: new Date("2019-04-23T14:49:23.809743"),
        lastUpdated: new Date("2019-07-17T18:50:28.081458"),
        "campaignTag": "#Allpeopleonmap",
        "organisationTag": "#YouthMappers",
        "percentMapped": 70,
        "percentValidated": 20,
        "percentBadImagery": 1,
        "totalMappers": 50,
        "totalTasks": 152,
        "totalComments": 0,
        "totalMappingTime": 80214,
        "totalValidationTime": 458741,
        "totalTimeSpent": 538955,
        "averageMappingTime": 8912.666666666666,
        "averageValidationTime": 114685.25,
        "status": "PUBLISHED"
      },
        {
          image: <MappingIcon style={{height: imageHeight}} />,
          projectId: 6106,
          projectStatus: "PUBLISHED",
          projectPriority: "LOW",
          mapperLevel: "INTERMEDIATE",
          title: "Mapping mosquito net coverage",
          shortDescription: "Public Health · Malaria2018 · Mozambique",
          created: new Date("2019-04-23T14:49:23.809743"),
          lastUpdated: new Date("2019-07-17T18:50:28.081458"),
          "campaignTag": "#Allpeopleonmap",
          "organisationTag": "#YouthMappers",
          "percentMapped": 70,
          "percentValidated": 20,
          "percentBadImagery": 1,
          "totalMappers": 50,
          "totalTasks": 152,
          "totalComments": 0,
          "totalMappingTime": 80214,
          "totalValidationTime": 458741,
          "totalTimeSpent": 538955,
          "averageMappingTime": 8912.666666666666,
          "averageValidationTime": 114685.25,
          "status": "PUBLISHED"
        },
      {
        image: <MappingIcon style={{height: imageHeight}} />,
        projectId: 6106,
        projectStatus: "PUBLISHED",
        projectPriority: "LOW",
        mapperLevel: "INTERMEDIATE",
        title: "Mapping mosquito net coverage",
        shortDescription: "Public Health · Malaria2018 · Mozambique",
        created: new Date("2019-04-23T14:49:23.809743"),
        lastUpdated: new Date("2019-07-17T18:50:28.081458"),
        "campaignTag": "#Allpeopleonmap",
        "organisationTag": "#YouthMappers",
        "percentMapped": 70,
        "percentValidated": 20,
        "percentBadImagery": 1,
        "totalMappers": 50,
        "totalTasks": 152,
        "totalComments": 0,
        "totalMappingTime": 80214,
        "totalValidationTime": 458741,
        "totalTimeSpent": 538955,
        "averageMappingTime": 8912.666666666666,
        "averageValidationTime": 114685.25,
        "status": "PUBLISHED"
      }];
      const paginatedProjectCards = projectPaginate(cards)
  return(
    <div className="bg-white black">
      <div className="pt4-l pb5 ph5-l ph4 cf">

      <div className=" w-75 fl">
      <h3 className=" f2 ttu barlow-condensed fw8">
          <FormattedMessage {...messages.featuredProjects} />
        </h3>
      </div>
      <div className=" fl w-25 pa3 mb4 mw6">
        <FeaturedProjectPaginateArrows pages={paginatedProjectCards} activeProjectCardPage={activeProjectCardPage} setProjectCardPage={setProjectCardPage}/>
      </div>
        <div className="cf ">
          {paginatedProjectCards[activeProjectCardPage].map((card, n) => <ProjectCard { ...card } key={n} />)}
        </div>
      </div>
    </div>
  );
}
