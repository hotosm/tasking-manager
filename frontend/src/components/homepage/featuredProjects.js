import React from 'react';
import { FormattedMessage} from 'react-intl';
import { RightIcon, LeftIcon } from '../svgIcons';
import { ProjectCard } from '../../components/projectcard/projectCard';
import { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import axios from 'axios';

import cards from '../projectcard/demoProjectCardsData';

import messages from './messages';

function FeaturedProjectPaginateArrows({pages, activeProjectCardPage, setProjectCardPage}: Object) {

    let enableLeft = false;
    let enableRight = false;
    if (activeProjectCardPage !== 0) {
        enableLeft = true;
    } 
    if (pages.length - 1 > activeProjectCardPage && pages.length !== 1) {
        enableRight = true;
    }
    return (
        <div className="fr dib f2 mr2 pv3 pr6-l pr3">
            <div className={`dib mr2  ${enableLeft ? 'red dim' : 'light-red'}`} onClick={() => enableLeft && setProjectCardPage(activeProjectCardPage - 1)}><LeftIcon /></div>
            <div className={`dib dim ${enableRight ? 'red dim' : 'light-red'}`} onClick={() => enableRight && setProjectCardPage(activeProjectCardPage + 1)}><RightIcon /></div>
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
const projectPaginateMobile = chunkArray(2);


export function FeaturedProjects() {
  const blankAPI = {mapResults:{features: [],type:"FeatureCollection"}, results:[], pagination: {hasNext: false, hasPrev: false, page: 1}};
  const [projects, setProjects] = useState(blankAPI);
  const [activeProjectCardPage, setProjectCardPage] = useState(0);
  const [activeProjectCardPageMobile, setProjectCardPageMobile] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setIsError(false);

      try {
      const result = await axios(
        `${API_URL}project/search?mapperLevel=ALL`,
      );
      
      setProjects(result.data);

      } catch (error) {
        setIsError(true);
      } 
      setIsLoading(false);
    };

    fetchData();
  },[]);


  const apiResults = projects.results.length > 0 ? projects.results: cards 
  const pagedProjs = projectPaginate(apiResults)
  const pagedProjsMobile = projectPaginateMobile(apiResults)

  return(
    <>
    <section className="pt4-l pb5 pl5-l pr1-l pl3 bg-white black">
      <div className="cf">
        <div className="w-75-l w-60 fl">
        <h3 className="f2 ttu barlow-condensed fw8">
            <FormattedMessage {...messages.featuredProjects} />
            </h3>
        </div>
        <div className="fl w-25-l pa3 mb4 mw6 dn db-l">
            <FeaturedProjectPaginateArrows 
                pages={pagedProjs}
                activeProjectCardPage={activeProjectCardPage}
                setProjectCardPage={setProjectCardPage} />
        </div>
        <div className="fl w-40 pa3 mb4 mw6 db dn-l">
            <FeaturedProjectPaginateArrows 
                pages={pagedProjsMobile}
                activeProjectCardPage={activeProjectCardPageMobile}
                setProjectCardPage={setProjectCardPageMobile} />
        </div>
      </div>
        {isLoading ? (
          <div>Loading ...</div>
        ) : null}
        {isError ? (
          <div class="bg-tan">Error loading the featured projects.</div>
        ) : null}
        <div className="cf dn db-l">
          {pagedProjs[activeProjectCardPage].map((card, n) => <ProjectCard { ...card } key={n} />)}
        </div>
        <div className="cf db dn-l">
          {pagedProjsMobile[activeProjectCardPageMobile].map((card, n) => <ProjectCard { ...card } key={n} />)}
        </div>
    </section>

      </>
  );
}
