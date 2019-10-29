// Code taken from https://github.com/mapbox/osmcha-frontend/blob/master/src/utils/create_popup.js
export function createPopup(
  title: string = 'Authentication',
  location: string
) {
  const width = 500;
  const height = 600;
  const settings = [
    ['width', width],
    ['height', height],
    ['left', window.innerWidth / 2 - width / 2],
    ['top', window.innerHeight / 2 - height / 2]
  ]
    .map(x => x.join('='))
    .join(',');

  const popup = window.open(location, '_blank', settings);
  if (!popup) return;

  return popup
}