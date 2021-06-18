export const PolygonTypeFeature = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [29.53502655029297, -2.326402131359699],
        [29.528160095214844, -2.329146446976341],
        [29.528846740722656, -2.3360072126138665],
        [29.535369873046875, -2.3414958009992772],
        [29.551849365234375, -2.334292024342484],
        [29.53502655029297, -2.326402131359699],
      ],
    ],
  },
  properties: {},
};

export const LineStringTypeFeature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [98.96896362304688, 63.16303617057089],
      [99.13856506347656, 63.24413943130473],
    ],
  },
};

export const closedLinestringFeature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: [
      [29.46979522705078, -2.1500689371866395],
      [29.56558227539062, -2.125709988871421],
      [29.503440856933597, -2.2303477654133457],
      [29.446792602539062, -2.191581176175016],
      [29.46979522705078, -2.1500689371866395],
    ],
  },
};

export const convertedLineStringToPolygonFeature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [29.46979522705078, -2.1500689371866395],
        [29.56558227539062, -2.125709988871421],
        [29.503440856933597, -2.2303477654133457],
        [29.446792602539062, -2.191581176175016],
        [29.46979522705078, -2.1500689371866395],
      ],
    ],
  },
};

export const MultiPolygonTypeFeature = {
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [29.473786084, -2.27411104],
          [29.604085219, -2.239332023],
          [29.582666183, -2.386467969],
          [29.485388062, -2.402518219],
          [29.473786084, -2.27411104],
        ],
      ],
    ],
  },
};
