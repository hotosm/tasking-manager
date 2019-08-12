import {
  useQueryParams,
  StringParam,
  stringify as stringifyUQP,
} from 'use-query-params';
import { CommaArrayParam } from '../utils/CommaArrayParam'

/* See also moreFiltersForm, these are duplicated there for specific modular usage */
/* This one is e.g. used for updating the URL when returning to /contribute
 *  and directly submitting the query to the API */
export const useFullProjectsQuery = () => {
    return useQueryParams({
    difficulty: StringParam,
    organisation: StringParam,
    campaign: StringParam,
    location: StringParam,
    types: CommaArrayParam
    });
}

export const stringify = () => stringifyUQP;