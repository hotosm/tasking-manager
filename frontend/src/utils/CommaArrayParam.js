import { encodeDelimitedArray, decodeDelimitedArray } from 'use-query-params';

/** Uses a comma to delimit entries. e.g. ['a', 'b'] => qp?=a,b */
export const CommaArrayParam = {
  encode: (array: string[] | null | undefined) => encodeDelimitedArray(array, ','),

  decode: (arrayStr: string | string[] | null | undefined) => decodeDelimitedArray(arrayStr, ','),
};
