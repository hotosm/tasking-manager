import React from 'react';
import TestRenderer from 'react-test-renderer';

import { CheckIcon } from '../svgIcons';
import { CheckCircle } from '../checkCircle';

it('Verify CheckCircle classes and correct icon', () => {
  const element = TestRenderer.create(<CheckCircle />);
  const instance = element.root;
  expect(instance.findByProps({ className: 'br-100 bg-red white h1 w1 ph1 mr2' }).type).toBe(
    'span',
  );
  expect(instance.findByType(CheckIcon).props.height).toBe('10px');
});
