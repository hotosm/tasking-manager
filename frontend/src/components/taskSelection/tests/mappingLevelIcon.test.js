import React from 'react';
import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { MappingLevelIcon } from '../contributions';
import { FullStarIcon, HalfStarIcon } from '../../svgIcons';

describe('if user is ADVANCED, MappingLevelIcon should return', () => {
  const element = createComponentWithIntl(<MappingLevelIcon mappingLevel="ADVANCED" />);
  const instance = element.root;
  it('FullStarIcon with correct classNames', () => {
    expect(instance.findByType(FullStarIcon).props.className).toBe('h1 w1 v-mid pb1');
  });
  it('FormattedMessage with the correct id', () => {
    expect(instance.findByType(FormattedMessage).props.id).toBe('project.level.advanced');
  });
});

describe('if user is INTERMEDIATE, MappingLevelIcon should return', () => {
  const element = createComponentWithIntl(<MappingLevelIcon mappingLevel="INTERMEDIATE" />);
  const instance = element.root;
  it('FullStarIcon with correct classNames', () => {
    expect(instance.findByType(HalfStarIcon).props.className).toBe('h1 w1 v-mid pb1');
  });
  it('FormattedMessage with the correct id', () => {
    expect(instance.findByType(FormattedMessage).props.id).toBe('project.level.intermediate');
  });
});

describe('if user is BEGINNER, MappingLevelIcon should not return', () => {
  const element = createComponentWithIntl(<MappingLevelIcon mappingLevel="BEGINNER" />);
  const instance = element.root;
  it('icon and FormattedMessage', () => {
    expect(() => instance.findByType(FullStarIcon)).toThrow(
      new Error('No instances found with node type: "FullStarIcon"'),
    );
    expect(() => instance.findByType(HalfStarIcon)).toThrow(
      new Error('No instances found with node type: "HalfStarIcon"'),
    );
    expect(() => instance.findByType(FormattedMessage)).toThrow(
      new Error('No instances found with node type: "MemoizedFormattedMessage"'),
    );
  });
});
