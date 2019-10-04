import React from 'react';
import TestRenderer from 'react-test-renderer';
import { IntlProvider, FormattedMessage } from 'react-intl';

import { Imagery } from '../imagery';

const createComponentWithIntl = (children, props = {locale: 'en'}) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('test if Imagery returns the correct FormattedMessage to TMS', () => {
  const element = createComponentWithIntl(
    <Imagery
      value={'tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'}
    />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(FormattedMessage).props.id
  ).toBe('project.imagery.tms');
});

it('test if Imagery returns the correct FormattedMessage to WMS', () => {
  const element = createComponentWithIntl(
    <Imagery
      value={'wms[1,22]:https://service.com/earthservice/wms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'}
    />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(FormattedMessage).props.id
  ).toBe('project.imagery.wms');
});

it('test if Imagery returns the correct FormattedMessage to WMTS', () => {
  const element = createComponentWithIntl(
    <Imagery
      value={'wmts[1,22]:https://service.com/earthservice/wms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'}
    />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(FormattedMessage).props.id
  ).toBe('project.imagery.wmts');
});

it('test if Imagery returns the correct FormattedMessage to custom layer', () => {
  const element = createComponentWithIntl(
    <Imagery
      value={'https://s3.amazonaws.com/layer/{zoom}/{x}/{y}.jpg'}
    />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(FormattedMessage).props.id
  ).toBe('project.imagery.customLayer');
});

it('test if Imagery returns the correct imagery layer name', () => {
  const element = createComponentWithIntl(
    <Imagery value={'Mapbox Satellite'} />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType('span').children
  ).toEqual(['Mapbox Satellite']);
});

it('test if Imagery returns the correct FormattedMessage to undefined imagery', () => {
  const element = createComponentWithIntl(
    <Imagery value={null} />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(FormattedMessage).props.id
  ).toEqual('project.imagery.noDefined');
});
