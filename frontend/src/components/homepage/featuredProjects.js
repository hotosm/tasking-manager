import React from 'react';
import { FormattedMessage } from 'react-intl';
import ReactPlaceholder from 'react-placeholder';
import { nCardPlaceholders } from '../projectcard/nCardPlaceholder';
import 'react-placeholder/lib/reactPlaceholder.css';

import { RightIcon, LeftIcon } from '../svgIcons';
import { ProjectCard } from '../../components/projectcard/projectCard';

import messages from './messages';

import { useFeaturedProjectAPI } from '../../hooks/UseFeaturedProjectAPI';

function FeaturedProjectPaginateArrows({ pages, activeProjectCardPage, mobile, dispatch }: Object) {
  let enableLeft = false;
  let enableRight = false;
  if (activeProjectCardPage !== 0) {
    enableLeft = true;
  }
  if (pages.length - 1 > activeProjectCardPage && pages.length !== 1) {
    enableRight = true;
  }
  const mobileActionType = mobile ? '_MOBILE' : '';
  return (
    <div className="fr dib f2 mr2 pv3 pr6-l pr3">
      <div
        className={`dib mr2 red ${enableLeft ? 'dim' : 'o-50'}`}
        onClick={() => enableLeft && dispatch({ type: `LAST_PAGE${mobileActionType}` })}
      >
        <LeftIcon />
      </div>
      <div
        className={`dib red ${enableRight ? 'dim' : 'o-50'}`}
        onClick={() => enableRight && dispatch({ type: `NEXT_PAGE${mobileActionType}` })}
      >
        <RightIcon />
      </div>
    </div>
  );
}

const chunkArray = chunkSize => array => {
  return array.reduce((acc, each, index, src) => {
    if (!(index % chunkSize)) {
      return [...acc, src.slice(index, index + chunkSize)];
    }
    return acc;
  }, []);
};
const projectPaginate = chunkArray(4);
const projectPaginateMobile = chunkArray(2);

export function FeaturedProjects() {
  const initialData = {
    mapResults: {
      features: [],
      type: 'FeatureCollection',
    },
    results: [],
    pagination: { hasNext: false, hasPrev: false, page: 1 },
  };
  const [state, dispatch] = useFeaturedProjectAPI(initialData);

  const apiResults = state.projects && state.projects.results;
  const pagedProjs = projectPaginate(apiResults);
  const pagedProjsMobile = projectPaginateMobile(apiResults);

  return (
    <section className="pt4-l pb5 pl5-l pr1-l pl3 black">
      <div className="cf">
        <div className="w-75-l w-60 fl">
          <h3 className="f2 ttu barlow-condensed fw8">
            <FormattedMessage {...messages.featuredProjects} />
          </h3>
        </div>
        <div className="fl w-25-l pa3 mb4 mw6 dn db-l">
          {!state.isLoading && (
            <FeaturedProjectPaginateArrows
              pages={pagedProjs}
              activeProjectCardPage={state.activeProjectCardPage}
              mobile={false}
              dispatch={dispatch}
            />
          )}
        </div>
        <div className="fl w-40 pa3 mb4 mw6 db dn-l">
          {!state.isLoading && (
            <FeaturedProjectPaginateArrows
              pages={pagedProjsMobile}
              mobile={true}
              activeProjectCardPage={state.activeProjectCardPageMobile}
              dispatch={dispatch}
            />
          )}
        </div>
      </div>
      {state.isError ? (
        <div className="bg-tan pa4">
          <FormattedMessage
            {...messages.errorLoadingTheX}
            values={{
              xWord: <FormattedMessage {...messages.featuredProjects} />,
            }}
          />
        </div>
      ) : null}
      <div className="cf dn db-l">
        <ReactPlaceholder customPlaceholder={nCardPlaceholders(4)} ready={!state.isLoading}>
          <FeaturedProjectCards
            pageOfCards={pagedProjs}
            pageNum={state.activeProjectCardPage}
            ready={!state.isLoading}
          />
        </ReactPlaceholder>
      </div>
      <div className="cf db dn-l">
        <ReactPlaceholder type="media" rows={10} ready={!state.isLoading}>
          <FeaturedProjectCards
            pageOfCards={pagedProjsMobile}
            pageNum={state.activeProjectCardPageMobile}
          />
        </ReactPlaceholder>
      </div>
    </section>
  );
}

function FeaturedProjectCards({ pageOfCards, pageNum }: Object) {
  if (pageOfCards && pageOfCards.length === 0) {
    return null;
  }
  return pageOfCards[pageNum].map((card, n) => <ProjectCard {...card} key={n + 'featured'} />);
}
