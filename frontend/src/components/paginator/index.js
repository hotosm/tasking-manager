import './styles.scss';

export function listPageOptions(page, lastPage) {
  let pageOptions = [1];
  if (lastPage === 0) {
    return pageOptions;
  }
  if (page === 0 || page > lastPage) {
    return pageOptions.concat([2, '...', lastPage]);
  }
  if (lastPage > 5) {
    if (page < 3) {
      return pageOptions.concat([2, 3, '...', lastPage]);
    }
    if (page === 3) {
      return pageOptions.concat([2, 3, 4, '...', lastPage]);
    }
    if (page === lastPage) {
      return pageOptions.concat(['...', page - 2, page - 1, lastPage]);
    }
    if (page === lastPage - 1) {
      return pageOptions.concat(['...', page - 1, page, lastPage]);
    }
    if (page === lastPage - 2) {
      return pageOptions.concat(['...', page - 1, page, page + 1, lastPage]);
    }
    return pageOptions.concat(['...', page - 1, page, page + 1, '...', lastPage]);
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
    return (numberOfItems - mod) / pageSize + 1;
  }
}

export const PageButton = (props) => {
  const pagerStyle = `f6 br1 base-font button-reset justify-center bn border-box shadow-3 pointer paginator-btn`;
  const currentStyle =
    props.label === props.activePage ? 'bg-blue-dark white' : 'bg-white blue-grey';

  if (props.label === '...') {
    return <span className="f5 blue-grey">...</span>;
  } else {
    return (
      <button
        href="#"
        onClick={() => props.setPageFn && props.setPageFn(props.label)}
        className={`${currentStyle} ${pagerStyle}`}
      >
        <span className="lh-copy">{props.label}</span>
      </button>
    );
  }
};

export function PaginatorLine({ activePage, lastPage, setPageFn, className }: Object) {
  const pageOptions = listPageOptions(activePage, lastPage);
  return (
    <div className={`${className} paginator-btn-ctr`}>
      {pageOptions.map((item, n) => (
        <PageButton key={n} activePage={activePage} label={item} setPageFn={setPageFn} />
      ))}
    </div>
  );
}
