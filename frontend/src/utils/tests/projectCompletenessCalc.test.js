import { computeCompleteness } from '../projectCompletenessCalc';
import { tasksGeojson } from './snippets/tasksGeometry';

it('computeCompleteness', () => {
  const project = computeCompleteness(tasksGeojson);
  expect(project.percentMapped).toBe(28);
  expect(project.percentValidated).toBe(14);
  expect(project.percentBadImagery).toBe(12);
});
