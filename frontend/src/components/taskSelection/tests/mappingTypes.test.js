import React from 'react';
import TestRenderer from 'react-test-renderer';

import { RoadIcon, HomeIcon, WavesIcon, TaskIcon, AsteriskIcon } from '../../svgIcons';
import { MappingTypes } from '../mappingTypes';

it('test if MappingTypes with BUILDINGS option returns the correct icon', () => {
  const element = TestRenderer.create(<MappingTypes types={['BUILDINGS']} colorClass={'blue'} />);
  const testInstance = element.root;
  expect(testInstance.findByType(HomeIcon).props.className).toBe('ml1 mr3 blue');
  expect(testInstance.findByType(HomeIcon).props.height).toBe('23');
});

it('test if MappingTypes with ROADS and WATERWAYS option returns the correct icon', () => {
  const element = TestRenderer.create(
    <MappingTypes types={['ROADS', 'WATERWAYS']} colorClass={'blue'} />,
  );
  const testInstance = element.root;
  expect(testInstance.findByType(RoadIcon).props.className).toBe('ml1 mr3 blue');
  expect(testInstance.findByType(WavesIcon).props.className).toBe('ml1 mr3 blue');
  expect(testInstance.findByType(HomeIcon).props.className).toBe('ml1 mr3 grey-light');
  expect(testInstance.findByType(TaskIcon).props.className).toBe('ml1 mr3 grey-light');
});

it('test if MappingTypes with LAND_USE option returns the correct icon color', () => {
  const element = TestRenderer.create(<MappingTypes types={['LAND_USE']} colorClass={'red'} />);
  const testInstance = element.root;
  expect(testInstance.findByType(TaskIcon).props.className).toBe('ml1 mr3 red');
  expect(testInstance.findByType(HomeIcon).props.className).toBe('ml1 mr3 grey-light');
});

it('test if MappingTypes with OTHER option returns the correct icon color', () => {
  const element = TestRenderer.create(<MappingTypes types={['OTHER']} colorClass={'red'} />);
  const testInstance = element.root;
  expect(testInstance.findByType(AsteriskIcon).props.className).toBe('ml1 mr3 red');
  expect(testInstance.findByType(HomeIcon).props.className).toBe('ml1 mr3 grey-light');
});

it('test if MappingTypes with empty array returns all icons in grey-light', () => {
  const element = TestRenderer.create(<MappingTypes types={[]} colorClass="red" />);
  const testInstance = element.root;
  expect(testInstance.findByType(RoadIcon).props.className).toBe('ml1 mr3 grey-light');
  expect(testInstance.findByType(WavesIcon).props.className).toBe('ml1 mr3 grey-light');
  expect(testInstance.findByType(HomeIcon).props.className).toBe('ml1 mr3 grey-light');
  expect(testInstance.findByType(TaskIcon).props.className).toBe('ml1 mr3 grey-light');
  expect(testInstance.findByType(AsteriskIcon).props.className).toBe('ml1 mr3 grey-light');
});

it('test if MappingTypes with all type options returns all icons in red', () => {
  const element = TestRenderer.create(
    <MappingTypes
      types={['ROADS', 'LAND_USE', 'BUILDINGS', 'WATERWAYS', 'OTHER']}
      colorClass="red"
    />,
  );
  const testInstance = element.root;
  expect(testInstance.findByType(RoadIcon).props.className).toBe('ml1 mr3 red');
  expect(testInstance.findByType(WavesIcon).props.className).toBe('ml1 mr3 red');
  expect(testInstance.findByType(HomeIcon).props.className).toBe('ml1 mr3 red');
  expect(testInstance.findByType(TaskIcon).props.className).toBe('ml1 mr3 red');
  expect(testInstance.findByType(AsteriskIcon).props.className).toBe('ml1 mr3 red');
});
