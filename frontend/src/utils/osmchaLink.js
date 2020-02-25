export function formatOSMChaLink(infoObj) {
  const baseURL = 'https://osmcha.org/';
  // If a custom filter id is given, ignores everything else
  if (infoObj.osmchaFilterId) {
    return `${baseURL}?aoi=${encodeURIComponent(infoObj.osmchaFilterId)}`;
  }

  let filterParams = {};
  if (infoObj.aoiBBOX) {
    filterParams['in_bbox'] = buildFilter(
      typeof infoObj.aoiBBOX === 'string' ? infoObj.aoiBBOX : infoObj.aoiBBOX.join(','),
    );
    filterParams['area_lt'] = buildFilter(2);
  }

  if (infoObj.created) {
    filterParams['date__gte'] = buildFilter(infoObj.created.split('T')[0]);
  }

  if (infoObj.usernames) {
    filterParams['users'] = buildFilter(infoObj.usernames);
  }

  if (infoObj.mappingTeams) {
    filterParams['mapping_teams'] = buildFilter(infoObj.mappingTeams);
  }

  if (infoObj.changesetComment) {
    filterParams['comment'] = buildFilter(infoObj.changesetComment);
  }

  return `${baseURL}?filters=${encodeURIComponent(JSON.stringify(filterParams))}`;
}

function buildFilterValue(value) {
  return { label: value, value: value };
}

function buildFilter(values) {
  const valuesArray = Array.isArray(values) ? values : [values];
  return valuesArray.map(values => buildFilterValue(values));
}
