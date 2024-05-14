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
    // add the area_lt only if we are filtering changesets of the entire project
    // on that case, we don't have usernames information
    if (!infoObj.usernames) {
      filterParams['area_lt'] = buildFilter(2);
    }
  }

  if (typeof infoObj.created === 'string') {
    filterParams['date__gte'] = buildFilter(infoObj.created.split('T')[0]);
  }

  if (infoObj.mappingTeams) {
    filterParams['mapping_teams'] = buildFilter(infoObj.mappingTeams);
  }

  if (infoObj.changesetComment) {
    filterParams['comment'] = buildFilter(infoObj.changesetComment);
  }

  if (typeof infoObj.usernames === 'object') {
    filterParams['users'] = buildFilter(infoObj.usernames);
  }

  return `${baseURL}?filters=${encodeURIComponent(JSON.stringify(filterParams))}`;
}

function buildFilterValue(value) {
  return { label: value, value: value };
}

function buildFilter(values) {
  const valuesArray = Array.isArray(values) ? values : [values];
  return valuesArray.map((values) => buildFilterValue(values));
}

export const getFilterId = (value) => {
  if (value.startsWith('https://osmcha.org/') && value.search('aoi=') !== -1) {
    return value.split('aoi=')[1];
  }
  return value;
};
