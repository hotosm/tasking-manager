import React from 'react';

const pagerStyle = `f5 br2 base-font button-reset justify-center inline-flex items-center w2 h2 ba ma1 border-box pointer`;
const activeStyle = 'bg-blue-dark white';
const inactiveStyle = 'bg-white blue-grey';

export function listPageOptions(page, lastPage) {
  let pageOptions = [1];
  if (page === 0 || page > lastPage) {
    return pageOptions.concat([2, '...', lastPage]);
  }
  if (lastPage > 5) {
    if (page < 3) {
      return pageOptions.concat([2, 3, '...', lastPage])
    }
    if (page === 3) {
      return pageOptions.concat([2, 3, 4, '...', lastPage])
    }
    if (page === lastPage) {
      return pageOptions.concat(['...', page - 2, page - 1, lastPage])
    }
    if (page === lastPage - 1) {
      return pageOptions.concat(['...', page - 1, page, lastPage])
    }
    if (page === lastPage - 2) {
      return pageOptions.concat(['...', page - 1, page, page + 1, lastPage])
    }
    return pageOptions.concat(['...', page - 1, page, page + 1, '...', lastPage])
  } else {
    let range = [];
    for (let i = 1; i <= lastPage; i++) {
      range.push(i);
    }
    return range;
  }
}

export function howManyPages(numberOfItems, pageSize) {
  if (pageSize === 0) {
    return 1;
  }
  const mod = numberOfItems % pageSize;
  if (mod === 0) {
    return numberOfItems / pageSize;
  } else {
    return ((numberOfItems - mod) / pageSize) + 1;
  }
}

export const PageButton = props => {
  const currentStyle = props.label === props.activePage ? activeStyle : inactiveStyle;
  if (props.label === '...') {
    return <span className="f5 blue-grey">...</span>
  } else {
    return (
      <button
        href="#"
        onClick={() => props.setPageFn && props.setPageFn(props.label)}
        className={`${currentStyle} ${pagerStyle}`}
      >
        <span>{props.label}</span>
      </button>
    );
  }
};

export function PaginatorLine({activePage, lastPage, setPageFn}: Object) {
  const pageOptions = listPageOptions(activePage, lastPage);
  return <div className="flex items-center justify-center pa4">
      {pageOptions.map(
        (item, n) => <PageButton key={n} activePage={activePage} label={item} setPageFn={setPageFn} />
      )}
  </div>;
}
