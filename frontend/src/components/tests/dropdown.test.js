import React from 'react';
import TestRenderer from 'react-test-renderer';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

import { Dropdown } from '../dropdown';
import { Button } from '../button';


it('dropdown behaviour', () => {
  const testElement = TestRenderer.create(
    <Dropdown
      value={'English'}
      options={[{label: 'English'}, {label: 'Portuguese (pt)'}]}
      display={'Language'}
      className="btn-tertiary"
      widthClass="w160"
    />
  );
  const elementInstance = testElement.root;
  // dropdown icon must be faChevronDown
  expect(elementInstance.findByType(Button).props.icon).toBe(faChevronDown);
  // dropdown-content is not rendered before the user clicks on the button
  expect(
    () => elementInstance.findByProps({'className': 'dropdown-content wmin96 round w160'})
  ).toThrow(new Error('No instances found with props: {"className":"dropdown-content wmin96 round w160"}'));
  elementInstance.findByType(Button).props.onClick();
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps(
      {'className': 'dropdown-content wmin96 round w160'}
    ).type
  ).toBe('div');
  // number of dropdown options should be 3
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    ).length
  ).toBe(2);
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    )[0].children[0].type
  ).toBe('a');
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    )[0].children[0].children
  ).toEqual(["English"]);
  // dropdown-content should disappear after another button click
  elementInstance.findByType(Button).props.onClick();
  expect(
    () => elementInstance.findByProps({'className': 'dropdown-content wmin96 round w160'})
  ).toThrow(new Error('No instances found with props: {"className":"dropdown-content wmin96 round w160"}'));
});


it('dropdown-content disappear after click on option', () => {
  const testElement = TestRenderer.create(
    <Dropdown
      value={'English'}
      options={[{label: 'English'}, {label: 'Portuguese (pt)'}]}
      display={'Language'}
      className="btn-tertiary"
      widthClass="w160"
    />
  );
  const elementInstance = testElement.root;
  // dropdown-content is not rendered before the user clicks on the button
  expect(
    () => elementInstance.findByProps({'className': 'dropdown-content wmin96 round w160'})
  ).toThrow(
    new Error(
      'No instances found with props: {"className":"dropdown-content wmin96 round w160"}'
    )
  );
  elementInstance.findByType(Button).props.onClick();
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps(
      {'className': 'dropdown-content wmin96 round w160'}
    ).type
  ).toBe('div');
  elementInstance.findAllByProps(
    {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
  )[0].children[0].props.onClick();
  // dropdown-content should disappear after selecting an option
  expect(
    () => elementInstance.findByProps({'className': 'dropdown-content wmin96 round w160'})
  ).toThrow(
    new Error(
      'No instances found with props: {"className":"dropdown-content wmin96 round w160"}'
    )
  );
});


it('dropdown behaviour with href props', () => {
  const testElement = TestRenderer.create(
    <Dropdown
      value={'A'}
      options={[
        {label: 'A', href: 'http://a.co'},
        {label: 'B', href: 'http://b.co'},
        {label: 'C', href: 'http://c.co'}
      ]}
      display={'Options'}
      className="btn-tertiary"
      widthClass="w160"
    />
  );
  const elementInstance = testElement.root;
  // dropdown icon must be faChevronDown
  expect(elementInstance.findByType(Button).props.icon).toBe(faChevronDown);
  // dropdown-content is not rendered before the user clicks on the button
  expect(
    () => elementInstance.findByProps({'className': 'dropdown-content wmin96 round w160'})
  ).toThrow(
    new Error(
      'No instances found with props: {"className":"dropdown-content wmin96 round w160"}'
    )
  );
  elementInstance.findByType(Button).props.onClick();
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps(
      {'className': 'dropdown-content wmin96 round w160'}
    ).type
  ).toBe('div');
  // number of dropdown options should be 3
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    ).length
  ).toBe(3);
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    )[0].children[0].type
  ).toBe('a');
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    )[0].children[0].props.href
  ).toBe('http://a.co');
});


it('dropdown behaviour with multi enabled', () => {
  const testElement = TestRenderer.create(
    <Dropdown
      value={'A'}
      options={[{label: 'A'}, {label: 'B'}, {label: 'C'} ]}
      display={'Options'}
      multi={true}
      className="btn-tertiary"
      widthClass="w160"
    />
  );
  const elementInstance = testElement.root;
  // dropdown icon must be faChevronDown
  expect(elementInstance.findByType(Button).props.icon).toBe(faChevronDown);
  // dropdown-content is not rendered before the user clicks on the button
  expect(
    () => elementInstance.findByProps({'className': 'dropdown-content wmin96 round w160'})
  ).toThrow(
    new Error(
      'No instances found with props: {"className":"dropdown-content wmin96 round w160"}'
    )
  );
  elementInstance.findByType(Button).props.onClick();
  // dropdown-content must be rendered after the click
  expect(
    elementInstance.findByProps(
      {'className': 'dropdown-content wmin96 round w160'}
    ).type
  ).toBe('div');
  // number of dropdown options should be 3
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    ).length
  ).toBe(3);
  // when multi is true element type should be input
  expect(
    elementInstance.findAllByProps(
      {'className': 'flex-parent flex-parent--row flex-parent--center-cross py6 px12'}
    )[0].children[0].type
  ).toBe('input');
});
