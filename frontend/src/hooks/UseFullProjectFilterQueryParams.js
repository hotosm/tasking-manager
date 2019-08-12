import {
  useQueryParams,
  useQueryParam,
  StringParam,
  stringify,
} from 'use-query-params';
import { CommaArrayParam } from '../utils/CommaArrayParam'

export const [fullProjectsQuery, setFullProjectsQuery] = useQueryParams({
    difficulty: StringParam,
    organisation: StringParam,
    campaign: StringParam,
    location: StringParam,
    types: CommaArrayParam
    });