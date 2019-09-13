import React from 'react';
import TestRenderer from 'react-test-renderer';
import { IntlProvider, FormattedMessage } from 'react-intl';

import { Imagery } from '../imagery';
import { MappingTypes } from '../mappingTypes';
import { TaskSelectionFooter } from '../footer';
import { Button } from '../../button';

const createComponentWithIntl = (children, props = {locale: 'en'}) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};

it('test if footer has MappingTypes component defined set with the correct mappingTypes', () => {
  const element = createComponentWithIntl(<TaskSelectionFooter mappingTypes={['ROADS', 'BUILDINGS']}/>);
  const testInstance = element.root;
  expect(
    testInstance.findByType(MappingTypes).props.types
  ).toStrictEqual(['ROADS', 'BUILDINGS']);
});

it('test if footer has MappingTypes component defined set with the correct mappingTypes', () => {
  const element = createComponentWithIntl(<TaskSelectionFooter mappingTypes={['LAND_USE']}/>);
  const testInstance = element.root;
  expect(
    testInstance.findByType(MappingTypes).props.types
  ).toStrictEqual(['LAND_USE']);
});

it('test if footer has imagery component returning the correct message', () => {
  const element = createComponentWithIntl(
    <TaskSelectionFooter
      mappingTypes={['LAND_USE']}
      imagery={'tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg'}
    />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(Imagery).props.value
  ).toBe('tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg');
});

it('test if footer returns the correct contribute button message when type is "mapping"', () => {
  const element = createComponentWithIntl(
    <TaskSelectionFooter
      mappingTypes={['LAND_USE']}
      type={'mapping'}
    />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(Button).findByType(FormattedMessage).props.id
  ).toBe('project.selectTask.footer.button.mapRandomTask');
});

it('test if footer returns the correct contribute button message when type is "validation"', () => {
  const element = createComponentWithIntl(
    <TaskSelectionFooter
      mappingTypes={['LAND_USE']}
      type={'validation'}
    />
  );
  const testInstance = element.root;
  expect(
    testInstance.findByType(Button).findByType(FormattedMessage).props.id
  ).toBe('project.selectTask.footer.button.validateRandomTask');
});
