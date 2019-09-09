import React from 'react';

const pagerStyle =
  'f5 items-center br2 input-reset base-font bg-white button-reset justify-center no-underline  bg-animate hover-bg-blue-grey hover-white inline-flex items-center w2 h2 ba ma1 border-box';
const activeStyle = 'bg-blue-dark white';
const inactiveStyle = 'blue-grey';
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
  const maxPageMinusOne = (apiIsFetched && props.projectAPIstate.pagination.pages - 1) || false;

  /* TODO(tdk): redo this logic once we figure out what happens with ...*/
  return (
    <div className="flex items-center justify-center pa4">
      <PageButton pageNum={1} setPageFn={changeToPage} activePage={activePage} />
      {maxPage > 1 && <PageButton pageNum={2} setPageFn={changeToPage} activePage={activePage} />}
      {maxPage > 3 && <PageButton pageNum={'…'} activePage={activePage} />}
      {maxPageMinusOne && maxPageMinusOne !== 2 && (
        <PageButton pageNum={maxPageMinusOne} setPageFn={changeToPage} activePage={activePage} />
      )}
      {maxPage !== 1 && (
        <PageButton pageNum={maxPage} setPageFn={changeToPage} activePage={activePage} />
      )}
    </div>
  );
};

const PageButton = props => {
  const currentStyle = props.pageNum === props.activePage ? activeStyle : inactiveStyle;
  return (
    <button
      href="#"
      onClick={() => props.setPageFn && props.setPageFn(props.pageNum)}
      className={`${currentStyle} ${pagerStyle} `}
    >
      <span>{props.pageNum}</span>
    </button>
  );
};
