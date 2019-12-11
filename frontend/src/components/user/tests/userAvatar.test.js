import React from 'react';
import TestRenderer from 'react-test-renderer';

import { UserAvatar } from '../avatar';
import { CloseIcon } from '../../svgIcons';

it('UserAvatar with picture url and default size', () => {
  const element = TestRenderer.create(<UserAvatar username={'Mary'} picture={'http://image.xyz/photo.jpg'} />);
  const elementInstance = element.root;
  expect(elementInstance.findByType('img').props.src).toBe('http://image.xyz/photo.jpg');
  expect(elementInstance.findByType('img').props.className).toBe('tc br-100 dib v-mid h2 w2 f5 ');
  expect(elementInstance.findByType('img').props.alt).toBe('Mary');
});

it('UserAvatar with picture url and large size', () => {
  const element = TestRenderer.create(<UserAvatar username={'Mary'} size="large" picture={'http://image.xyz/photo.jpg'} />);
  const elementInstance = element.root;
  expect(elementInstance.findByType('img').props.src).toBe('http://image.xyz/photo.jpg');
  expect(elementInstance.findByType('img').props.className).toBe('tc br-100 dib v-mid h3 w3 f2 ');
  expect(elementInstance.findByType('img').props.alt).toBe('Mary');
});

it('UserAvatar without picture url and with large size', () => {
  const element = TestRenderer.create(
    <UserAvatar username={'Mary'} size="large" colorClasses="white bg-red"/>
  );
  const elementInstance = element.root;
  expect(
    elementInstance.findByType('div').props.className
  ).toBe('dib mh1 br-100 tc v-mid white bg-red h3 w3 f2');
  expect(elementInstance.findByType('span').props.children).toContain('M');
  expect(elementInstance.findByType('span').props.style).toStrictEqual({paddingTop: "0.625rem"});
});

it('UserAvatar with name with default size', () => {
  const element = TestRenderer.create(
    <UserAvatar username={'Mary'} name={'Mary Poppins'} colorClasses="white bg-red"/>
  );
  const elementInstance = element.root;
  expect(
    elementInstance.findByType('div').props.className
  ).toBe('dib mh1 br-100 tc v-mid white bg-red h2 w2 f5');
  expect(elementInstance.findByType('span').props.children).toContain('MP');
  expect(elementInstance.findByType('span').props.style).toStrictEqual({paddingTop: "0.375rem"});
});

it('UserAvatar with more than 3 words name', () => {
  const element = TestRenderer.create(
    <UserAvatar username={'Mary'} name={'Mary Poppins Long Name'} colorClasses="white bg-red"/>
  );
  const elementInstance = element.root;
  expect(elementInstance.findByType('span').props.children).toContain('MPL');
});

it('UserAvatar with username containing space', () => {
  const element = TestRenderer.create(
    <UserAvatar username={'Mary Poppins Long Name'} colorClasses="white bg-red"/>
  );
  const elementInstance = element.root;
  expect(elementInstance.findByType('span').props.children).toContain('MPL');
  expect(
    () => elementInstance.findByType(CloseIcon)
  ).toThrow(new Error('No instances found with node type: "CloseIcon"'));
});

it('UserAvatar with editMode TRUE but without removeFn has NOT a CloseIcon', () => {
  const element = TestRenderer.create(
    <UserAvatar username={'Mary Poppins Long Name'} colorClasses="white bg-red" editMode={true} />
  );
  const elementInstance = element.root;
  expect(elementInstance.findByType('span').props.children).toContain('MPL');
  expect(
    () => elementInstance.findByType(CloseIcon)
  ).toThrow(new Error('No instances found with node type: "CloseIcon"'));
});

it('UserAvatar with removeFn, but with editMode FALSE  has NOT a CloseIcon', () => {
  const element = TestRenderer.create(
    <UserAvatar username={'Mary Poppins Long Name'} colorClasses="white bg-red" removeFn={() => console.log('no')} />
  );
  const elementInstance = element.root;
  expect(elementInstance.findByType('span').props.children).toContain('MPL');
  expect(
    () => elementInstance.findByType(CloseIcon)
  ).toThrow(new Error('No instances found with node type: "CloseIcon"'));
});

it('UserAvatar with removeFn and editMode TRUE has a CloseIcon', () => {
  let value = 0;
  const element = TestRenderer.create(
    <UserAvatar username={'Mary'} colorClasses="white bg-red" removeFn={() => value = 1} editMode={true}/>
  );
  const elementInstance = element.root;
  expect(
    () => elementInstance.findByType(CloseIcon)
  ).not.toThrow(new Error('No instances found with node type: "CloseIcon"'));

  elementInstance.findByProps({className: "relative top-0 z-1 fr br-100 f7 tc h1 w1 bg-red white pointer"}).props.onClick();
  expect(value).toBe(1);
});
