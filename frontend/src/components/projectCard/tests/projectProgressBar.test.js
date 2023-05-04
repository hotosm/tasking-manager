import React from 'react';

import ProjectProgressBar from '../projectProgressBar';
import { createComponentWithIntl } from '../../../utils/testWithIntl';

describe('test if projectProgressBar', () => {
  const element = createComponentWithIntl(
    <ProjectProgressBar className="pb2" percentMapped={40} percentValidated={25} />,
  );
  const testInstance = element.root;
  it('mapped bar has the correct width', () => {
    expect(
      testInstance.findByProps({ className: 'absolute bg-blue-grey br-pill hhalf hide-child' })
        .props.style,
    ).toEqual({ width: '40%' });
  });
  it('validated bar has the correct width', () => {
    expect(
      testInstance.findByProps({ className: 'absolute bg-red br-pill hhalf hide-child' }).props
        .style,
    ).toEqual({ width: '25%' });
  });
  it('has a div with the complete background bar', () => {
    expect(
      testInstance.findByProps({ className: 'bg-tan br-pill hhalf overflow-y-hidden' }).type,
    ).toBe('div');
  });
  it('the first div has the correct classes', () => {
    expect(testInstance.findAllByType('div')[0].props.className).toBe('cf db pb2');
  });
  it('tooltip is not present because it is not hovered', () => {
    expect(() =>
      testInstance.findByProps({
        className: 'db absolute top-1 z-1 dib bg-blue-dark ba br2 b--blue-dark pa2 shadow-5',
      }),
    ).toThrow(
      new Error(
        'No instances found with props: {"className":"db absolute top-1 z-1 dib bg-blue-dark ba br2 b--blue-dark pa2 shadow-5"}',
      ),
    );
    expect(testInstance.findByProps({ className: 'relative' }).type).toBe('div');
  });
});

describe('test if projectProgressBar with value higher than 100%', () => {
  const element = createComponentWithIntl(
    <ProjectProgressBar className="pb2" percentMapped={140} percentValidated={125} />,
  );
  const testInstance = element.root;
  it('to mapped returns 100% width', () => {
    expect(
      testInstance.findByProps({ className: 'absolute bg-blue-grey br-pill hhalf hide-child' })
        .props.style,
    ).toEqual({ width: '100%' });
  });
  it('to validated returns 100% width', () => {
    expect(
      testInstance.findByProps({ className: 'absolute bg-red br-pill hhalf hide-child' }).props
        .style,
    ).toEqual({ width: '100%' });
  });
});
