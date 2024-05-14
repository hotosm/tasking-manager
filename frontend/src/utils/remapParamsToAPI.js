const fromEntries = require('fromentries');
/* read about it at MDN's Object.fromEntries – this is a tiny polyfill/ponyfill. 

/* The API uses slightly different JSON keys than the queryParams,
   this fn takes an object with queryparam keys and outputs JSON keys
   while maintaining the same values 
   
   left key is client query param, right value is what backend calls the parameter
   */

export const remapParamsToAPI = (param, conversion) => {
  function mapObject(obj, fn) {
    /* like Object.fromEntries */
    return fromEntries(Object.entries(obj).map(fn));
  }
  const remapped = mapObject(param, (n) => {
    /* fn operates on a array with [key, value] format */

    /* mappingTypes's value needs to be converted to comma delimited again */
    const value = Array.isArray(n[1]) ? n[1].join(',') : n[1];

    return [conversion[n[0]] || n[0], value];
  });
  return remapped;
};
