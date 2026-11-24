import { getTaskIdsInPriorityAreas } from '../priorityAreaSelection';

const square = (x, y, size = 1) => ({
  type: 'Polygon',
  coordinates: [
    [
      [x, y],
      [x + size, y],
      [x + size, y + size],
      [x, y + size],
      [x, y],
    ],
  ],
});

const task = (taskId, geometry) => ({ type: 'Feature', properties: { taskId }, geometry });

const multiSquare = (...squares) => ({
  type: 'MultiPolygon',
  coordinates: squares.map((s) => s.coordinates),
});

describe('getTaskIdsInPriorityAreas', () => {
  // 3x3 grid of 1x1 tasks with ids 1..9, origin at (0, 0)
  const grid = {
    type: 'FeatureCollection',
    features: [0, 1, 2].flatMap((row) =>
      [0, 1, 2].map((col) => task(row * 3 + col + 1, square(col * 0.01, row * 0.01, 0.01))),
    ),
  };

  it('returns an empty list without tasks or priority areas', () => {
    expect(getTaskIdsInPriorityAreas(grid, [])).toEqual([]);
    expect(getTaskIdsInPriorityAreas(undefined, [square(0, 0)])).toEqual([]);
    expect(getTaskIdsInPriorityAreas({ features: [] }, [square(0, 0)])).toEqual([]);
  });

  it('selects tasks contained in a priority area', () => {
    // covers the bottom row exactly
    const area = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0.03, 0],
          [0.03, 0.01],
          [0, 0.01],
          [0, 0],
        ],
      ],
    };
    expect(getTaskIdsInPriorityAreas(grid, [area]).sort()).toEqual([1, 2, 3]);
  });

  it('excludes tasks that only touch the edge of a priority area', () => {
    // The area is the centre task; its 8 neighbours share an edge or a corner with it
    expect(getTaskIdsInPriorityAreas(grid, [square(0.01, 0.01, 0.01)])).toEqual([5]);
  });

  it('excludes tasks with a sliver overlap', () => {
    // overlaps task 5 fully and its right neighbour (task 6) by 0.5% of its width
    const area = square(0.01, 0.01, 0.01005);
    expect(getTaskIdsInPriorityAreas(grid, [area]).sort()).toEqual([5]);
  });

  it('selects a task that contains a small priority area', () => {
    const smallArea = square(0.012, 0.012, 0.002);
    expect(getTaskIdsInPriorityAreas(grid, [smallArea])).toEqual([5]);
  });

  it('handles MultiPolygon tasks and priority areas', () => {
    const tasks = {
      type: 'FeatureCollection',
      features: [
        task(1, multiSquare(square(0, 0, 0.01), square(0.05, 0.05, 0.01))),
        task(2, square(0.1, 0.1, 0.01)),
      ],
    };
    // the area only hits the second polygon of task 1
    expect(getTaskIdsInPriorityAreas(tasks, [square(0.05, 0.05, 0.01)])).toEqual([1]);
    const areas = [multiSquare(square(0.1, 0.1, 0.01), square(0.3, 0.3, 0.01))];
    expect(getTaskIdsInPriorityAreas(tasks, areas)).toEqual([2]);
  });

  it('accepts priority areas given as features and several areas', () => {
    const areas = [
      { type: 'Feature', properties: {}, geometry: square(0, 0, 0.01) },
      square(0.02, 0.02, 0.01),
    ];
    expect(getTaskIdsInPriorityAreas(grid, areas).sort()).toEqual([1, 9]);
  });

  it('skips tasks with invalid geometry instead of throwing', () => {
    const tasks = {
      type: 'FeatureCollection',
      features: [
        // unclosed ring with too few positions
        task(1, {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0.01, 0],
            ],
          ],
        }),
        task(2, null),
        task(3, square(0, 0, 0.01)),
      ],
    };
    expect(() => getTaskIdsInPriorityAreas(tasks, [square(0, 0, 0.01)])).not.toThrow();
    expect(getTaskIdsInPriorityAreas(tasks, [square(0, 0, 0.01)])).toEqual([3]);
  });

  it('ignores invalid priority areas', () => {
    expect(getTaskIdsInPriorityAreas(grid, [null, { type: 'Polygon', coordinates: [] }])).toEqual(
      [],
    );
  });
});
