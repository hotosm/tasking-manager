import React from 'react';
import TestRenderer from 'react-test-renderer';

import { listPageOptions, howManyPages, PageButton, PaginatorLine } from '../index';

it('test if listPageOptions returns the correct options', () => {
  expect(listPageOptions(1, 0)).toEqual([1]);
  expect(listPageOptions(1, 1)).toEqual([1]);
  expect(listPageOptions(1, 5)).toEqual([1, 2, 3, 4, 5]);
  expect(listPageOptions(3, 5)).toEqual([1, 2, 3, 4, 5]);
  expect(listPageOptions(1, 10)).toEqual([1, 2, 3, '...', 10]);
  expect(listPageOptions(2, 10)).toEqual([1, 2, 3, '...', 10]);
  expect(listPageOptions(3, 10)).toEqual([1, 2, 3, 4, '...', 10]);
  expect(listPageOptions(5, 10)).toEqual([1, '...', 4, 5, 6, '...', 10]);
  expect(listPageOptions(10, 10)).toEqual([1, '...', 8, 9, 10]);
  expect(listPageOptions(9, 10)).toEqual([1, '...', 8, 9, 10]);
  expect(listPageOptions(8, 10)).toEqual([1, '...', 7, 8, 9, 10]);
});

it('test if howManyPages returns the correct number of pages', () => {
  expect(howManyPages(23, 6)).toBe(4);
  expect(howManyPages(24, 6)).toBe(4);
  expect(howManyPages(25, 6)).toBe(5);
  expect(howManyPages(25, 5)).toBe(5);
  expect(howManyPages(25, 0)).toBe(1);
  expect(howManyPages(1, 10)).toBe(1);
  expect(howManyPages(0, 10)).toBe(0);
});

it('test if PageButton returns a button with onClick function and correct children', () => {
  let value = 0;
  function updateValue(v) {
    value = v;
  }
  const element = TestRenderer.create(
    <PageButton activePage={1} label={3} setPageFn={updateValue} />,
  );
  const testInstance = element.root;
  expect(testInstance.findByType('button').findByType('span').children).toEqual(['3']);
  testInstance.findByType('button').props.onClick();
  expect(value).toBe(3);
});

it('test if PageButton with label "..." returns a span element', () => {
  const element = TestRenderer.create(<PageButton activePage={1} label={'...'} />);
  const testInstance = element.root;
  expect(testInstance.findByType('span').children).toEqual(['...']);
});

it('test if PaginatorLine returns the correct children elements', () => {
  let value = 0;
  function updateValue(v) {
    value = v;
  }
  const element = TestRenderer.create(
    <PaginatorLine activePage={1} lastPage={5} setPageFn={updateValue} />,
  );
  const testInstance = element.root;
  expect(testInstance.findAllByType('button').length).toBe(5);
  testInstance.findAllByType('button')[2].props.onClick();
  expect(value).toBe(3);
});

it('test if PaginatorLine with 3 pages returns the correct number of buttons', () => {
  const element = TestRenderer.create(<PaginatorLine activePage={1} lastPage={3} />);
  const testInstance = element.root;
  expect(testInstance.findAllByType('button').length).toBe(3);
});

it('test if PaginatorLine returns the correct number of active and inactive buttons', () => {
  const element = TestRenderer.create(<PaginatorLine activePage={1} lastPage={23} />);
  const testInstance = element.root;
  expect(testInstance.findAllByType('button').length).toBe(4);
  // '...' span elements should be 1
  expect(testInstance.findAllByProps({ className: 'f5 blue-grey' }).length).toBe(1);
  // 3 page links
  expect(
    testInstance.findAllByProps({
      className:
        'bg-white blue-grey f5 br2 base-font button-reset justify-center inline-flex items-center w2 h2 ba ma1 border-box pointer',
    }).length,
  ).toBe(3);
  // active page buttons should be 1
  expect(
    testInstance.findAllByProps({
      className:
        'bg-blue-dark white f5 br2 base-font button-reset justify-center inline-flex items-center w2 h2 ba ma1 border-box pointer',
    }).length,
  ).toBe(1);
});
