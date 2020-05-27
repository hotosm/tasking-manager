import React from 'react';
import TestRenderer from 'react-test-renderer';

import { Button, CustomButton, EditButton } from '../button';

it('children and onClick props of Button', () => {
  let testVar;
  const testButton = TestRenderer.create(
    <Button className="black bg-white" onClick={() => (testVar = true)}>
      Test it
    </Button>,
  );
  const buttonInstance = testButton.root;
  expect(
    buttonInstance.findByProps({ className: 'black bg-white br1 f5 bn pointer' }).children,
  ).toEqual(['Test it']);

  buttonInstance.findByProps({ className: 'black bg-white br1 f5 bn pointer' }).props.onClick();
  expect(testVar).toEqual(true);
});

it('children and onClick props of CustomButton', () => {
  let testVar;
  const testButton = TestRenderer.create(
    <CustomButton className="black bg-white" onClick={() => (testVar = true)}>
      Test it
    </CustomButton>,
  );
  const buttonInstance = testButton.root;
  expect(
    buttonInstance.findByProps({ className: 'black bg-white br1 f5 pointer' }).children,
  ).toEqual(['Test it']);

  buttonInstance.findByProps({ className: 'black bg-white br1 f5 pointer' }).props.onClick();
  expect(testVar).toEqual(true);
});

it('children and link props of EditButton', () => {
  const testButton = TestRenderer.create(
    <EditButton url="/manage/projects/1/">Test it</EditButton>,
  );
  const buttonInstance = testButton.root;

  expect(buttonInstance.findByType('a').props.href).toBe('/manage/projects/1/');
  expect(buttonInstance.findByType('a').props.children).toEqual('Test it');
  expect(buttonInstance.findByType('a').props.className).toBe(
    'pointer no-underline br1 fw6 f7 dib pv2 ph3 ba b--red white bg-red mh1 mv1',
  );
});
