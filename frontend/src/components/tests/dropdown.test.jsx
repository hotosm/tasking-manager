import { MemoryRouter } from 'react-router-dom';
import TestRenderer from 'react-test-renderer';

import { CustomButton } from '../button';
import { Dropdown } from '../dropdown';
import { act } from '@testing-library/react';

export const createTestDropdown = (options) => {
  const testElement = TestRenderer.create(
    <MemoryRouter>
      <Dropdown
        value={'English'}
        options={options}
        display={'Language'}
        className="blue-dark bg-white"
      />
    </MemoryRouter>,
  );
  return testElement.root;
};

test('dropdown svg icon exists and height is 15px', () => {
  let elementInstance = createTestDropdown([{ label: 'English' }, { label: 'Português' }]);
  expect(elementInstance.findByType('svg').props.height).toBe('15px');
});

test('dropdown-content is not rendered before the user clicks on the button', () => {
  let elementInstance = createTestDropdown([{ label: 'English' }, { label: 'Português' }]);
  expect(elementInstance.findByType('div').props.className).toBe('dib pointer relative');
  expect(() =>
    elementInstance.findByProps({
      className: 'db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column',
    }),
  ).toThrow(
    new Error(
      'No instances found with props: {"className":"db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column"}',
    ),
  );
});

test('dropdown-content disappear after click on option', () => {
  const elementInstance = createTestDropdown([{ label: 'English' }, { label: 'Portuguese (pt)' }]);
  act(() => elementInstance.findByType(CustomButton).props.onClick());
  act(() =>
    elementInstance
      .findAllByProps({ className: 'pa3 nowrap bg-animate bg-white hover-bg-tan' })[0]
      .children[0].props.onClick(),
  );
  // dropdown-content should disappear after selecting an option
  expect(() =>
    elementInstance.findByProps({
      className: 'db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column',
    }),
  ).toThrow(
    new Error(
      'No instances found with props: {"className":"db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column"}',
    ),
  );
});

test('dropdown behaviour with href props', () => {
  const elementInstance = createTestDropdown([
    { label: 'A', href: 'http://a.co' },
    { label: 'B', href: 'http://b.co' },
    { label: 'C', href: 'http://c.co' },
  ]);
  act(() => elementInstance.findByType(CustomButton).props.onClick());
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps({
      className: 'db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column',
    }).type,
  ).toBe('div');
  // number of dropdown options should be 3
  expect(
    elementInstance.findAllByProps({ className: 'pa3 nowrap bg-animate bg-white hover-bg-tan' })
      .length,
  ).toBe(3);
  // dropdown options type should be an <a>
  expect(
    elementInstance.findAllByProps({ className: 'pa3 nowrap bg-animate bg-white hover-bg-tan' })[0]
      .children[0].type,
  ).toBe('a');
  // a elements should have the href property filled
  expect(
    elementInstance.findAllByProps({ className: 'pa3 nowrap bg-animate bg-white hover-bg-tan' })[0]
      .children[0].props.href,
  ).toBe('http://a.co');
});

test('dropdown behaviour with multi enabled', () => {
  const testElement = TestRenderer.create(
    <MemoryRouter>
      <Dropdown
        value={'A'}
        options={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        display={'Options'}
        multi={true}
        className="blue-dark bg-white"
      />
    </MemoryRouter>,
  );
  const elementInstance = testElement.root;
  act(() => elementInstance.findByType(CustomButton).props.onClick());
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps({
      className: 'db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column',
    }).type,
  ).toBe('div');
  // number of dropdown options should be 3
  expect(
    elementInstance.findAllByProps({ className: 'pa3 nowrap bg-animate bg-white hover-bg-tan' })
      .length,
  ).toBe(3);
  // when multi is true element type should be input
  expect(
    elementInstance.findAllByProps({ className: 'pa3 nowrap bg-animate bg-white hover-bg-tan' })[0]
      .children[0].type,
  ).toBe('input');
});

test('dropdown with toTop enabled should have bottom-3 class', () => {
  const testElement = TestRenderer.create(
    <MemoryRouter>
      <Dropdown
        value={'A'}
        options={[{ label: 'A' }, { label: 'B' }, { label: 'C' }]}
        display={'Options'}
        multi={true}
        className="blue-dark bg-white"
        toTop={true}
      />
    </MemoryRouter>,
  );
  const elementInstance = testElement.root;
  act(() => elementInstance.findByType(CustomButton).props.onClick());
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps({
      className: 'db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column bottom-3',
    }).type,
  ).toBe('div');
});

test('dropdown with more than 9 options has "h5 overflow-y-scroll" classes', () => {
  const twelveOptions = [
    { label: 'A' },
    { label: 'B' },
    { label: 'C' },
    { label: 'D' },
    { label: 'E' },
    { label: 'F' },
    { label: 'G' },
    { label: 'H' },
    { label: 'I' },
    { label: 'K' },
    { label: 'K' },
    { label: 'L' },
  ];
  const testElement = TestRenderer.create(
    <MemoryRouter>
      <Dropdown
        value={'A'}
        options={twelveOptions}
        display={'Options'}
        multi={true}
        className="blue-dark bg-white"
        toTop={true}
      />
    </MemoryRouter>,
  );
  const elementInstance = testElement.root;
  act(() => elementInstance.findByType(CustomButton).props.onClick());
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps({
      className:
        'db tl mt1 ba b--grey-light br1 absolute shadow-1 z-5 flex flex-column bottom-3 h5 overflow-y-scroll',
    }).type,
  ).toBe('div');
});
