// Function to get an object from the search parameters
export default function getURLSearchParamsObject(url) {
  const urlParams = new URLSearchParams(url.split('?')[1]);
  const paramsObject = {};
  urlParams.forEach((value, key) => {
    paramsObject[key] = value;
  });
  return paramsObject;
}
