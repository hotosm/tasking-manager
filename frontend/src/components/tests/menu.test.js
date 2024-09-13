import { Link, MemoryRouter } from 'react-router-dom';
import TestRenderer from 'react-test-renderer';

import { SectionMenu } from '../menu';

it('test SectionMenu result', () => {
  const items = [
    { url: 'link/to/page', label: 'Link to page' },
    { url: 'another/link', label: 'Another Link' },
  ];
  const element = TestRenderer.create(
    <MemoryRouter>
      <SectionMenu items={items} />
    </MemoryRouter>,
  );
  const instance = element.root;
  expect(
    instance.findByProps({ className: 'cf mb2 pb3 pt3-ns ph4 ph2-m bg-grey-light dib' }).type,
  ).toBe('div');

  expect(instance.findAllByProps({ className: 'db dib-ns' }).length).toBe(2);
  expect(instance.findAllByType(Link).length).toBe(2);
  expect(instance.findAllByType(Link)[0].props.to).toBe('link/to/page');
  expect(instance.findAllByProps({ className: 'db dib-ns' })[0].children).toEqual(['Link to page']);
});
