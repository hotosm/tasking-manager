export const initialMetadata = {
  geom: null,
  area: 0,
  tasksNumber: 0,
  taskGrid: null,
  projectName: '',
  zoomLevel: 9,
  tempTaskGrid: null,
  arbitraryTasks: false,
  organisation: '',
};

export const projectMetadata = {
  geom: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [18.323789834976196, 13.220383742855674],
              [18.326772451400757, 13.220383742855674],
              [18.326772451400757, 13.223088852363466],
              [18.323789834976196, 13.223088852363466],
              [18.323789834976196, 13.220383742855674],
            ],
          ],
        },
      },
    ],
  },
  area: '0.10',
  tasksNumber: 0,
  taskGrid: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          x: 1128,
          y: 1099,
          zoom: 11,
          isSquare: true,
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [
                [18.281249999270102, 13.068776733844956],
                [18.45703124926311, 13.068776733844956],
                [18.45703124926311, 13.239945498767128],
                [18.281249999270102, 13.239945498767128],
                [18.281249999270102, 13.068776733844956],
              ],
            ],
          ],
        },
      },
    ],
  },
  projectName: '',
  zoomLevel: 11,
  arbitraryTasks: false,
  organisation: '',
};
