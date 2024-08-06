export function formatOverpassLink(users, bbox, download = false) {
  let baseUrl = 'https://overpass-turbo.eu/map.html?Q=';
  let format = 'json';
  if (download) {
    baseUrl = 'https://overpass-api.de/api/interpreter?data=';
    format = 'xml';
  }
  const swneBbox = [bbox[1], bbox[0], bbox[3], bbox[2]];
  const usersQuery = users.map((user) => formatUserQuery(user, swneBbox)).join('');
  const query = `[out:${format}][timeout:250];(${usersQuery});out body;>;out skel qt;`;

  return `${baseUrl}${encodeURIComponent(query)}`;
}

export function formatUserQuery(user, bbox) {
  return `node(user:"${user}")(${bbox});way(user:"${user}")(${bbox});relation(user:"${user}")(${bbox});`;
}
