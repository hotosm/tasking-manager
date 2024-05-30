import TestRenderer from 'react-test-renderer';

import { CheckIcon } from '../svgIcons';
import { CheckCircle } from '../checkCircle';

it('Verify CheckCircle classes and correct icon', () => {
  const element = TestRenderer.create(<CheckCircle className="bg-red white" />);
  const instance = element.root;
  expect(instance.findByProps({ className: 'br-100 h1 w1 ph1 mr2 bg-red white' }).type).toBe(
    'span',
  );
  expect(instance.findByType(CheckIcon).props.height).toBe('10px');
});
