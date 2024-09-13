import { PaginatorLine } from '../paginator';

export const ProjectCardPaginator = ({ status, pagination, fullProjectsQuery, setQueryParam }) => {
  const apiIsFetched = status === 'success';
  const changeToPage = (value) => {
    apiIsFetched &&
      setQueryParam(
        {
          ...fullProjectsQuery,
          page: value,
        },
        'pushIn',
      );
  };

  // do not show pagination when the data is being fetched or it has zero results
  if (!apiIsFetched || !pagination?.total) {
    return null;
  }
  const activePage = (apiIsFetched && pagination?.page) || 1;
  const maxPage = (apiIsFetched && pagination?.pages) || 1;

  /* TODO(tdk): redo this logic once we figure out what happens with ...*/
  return (
    <PaginatorLine
      activePage={activePage}
      setPageFn={changeToPage}
      lastPage={maxPage}
      className="flex items-center justify-center pa4"
    />
  );
};
