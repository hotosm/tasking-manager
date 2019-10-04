import React from 'react';

import { PaginatorLine } from '../paginator'

/*
  projectAPIstate,
  projectAPIstate: {pagination: 'paginationProps',
  activePage,
  pageNum,
  setPageFn,
*/
export const ProjectCardPaginator = props => {
  const apiIsFetched = !props.projectAPIstate.isError && !props.projectAPIstate.isLoading;
  const changeToPage = value => {
    apiIsFetched &&
      props.setQueryParam(
        {
          ...props.projectAPIstate.queryParamsState,
          page: value,
        },
        'pushIn',
      );
  };

  /* the pagination state is needed to create paginator component */

  if (!props.projectAPIstate.pagination) {
    return null;
  }
  const activePage = (apiIsFetched && props.projectAPIstate.pagination.page) || 1;
  const maxPage = (apiIsFetched && props.projectAPIstate.pagination.pages) || 1;

  /* TODO(tdk): redo this logic once we figure out what happens with ...*/
  return (
    <PaginatorLine activePage={activePage} setPageFn={changeToPage} lastPage={maxPage} />
  );
};
