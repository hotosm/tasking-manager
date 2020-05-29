import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Imagery } from '../imagery';
import { MappingTypes } from '../../mappingTypes';
import TaskSelectionFooter from '../footer';
import { Button } from '../../button';
import { createComponentWithReduxAndIntl } from '../../../utils/testWithIntl';

describe('test if footer', () => {
  it('has MappingTypes with ROADS and BUILDINGS', () => {
    const element = createComponentWithReduxAndIntl(
      <TaskSelectionFooter
        project={{
          projectId: 1,
          mappingTypes: ['ROADS', 'BUILDINGS'],
          mappingEditors: ['ID', 'JOSM'],
        }}
        taskAction={'mapSelectedTask'}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(MappingTypes).props.types).toStrictEqual(['ROADS', 'BUILDINGS']);
  });

  it('has imagery component returning the correct message', () => {
    const element = createComponentWithReduxAndIntl(
      <TaskSelectionFooter
        project={{
          projectId: 3,
          mappingEditors: ['ID', 'JOSM'],
          mappingTypes: ['ROADS', 'BUILDINGS'],
          imagery:
            'tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg',
        }}
        taskAction={'mapATask'}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Imagery).props.value).toBe(
      'tms[1,22]:https://service.com/earthservice/tms/Layer@EPSG:3857@jpg/{zoom}/{x}/{-y}.jpg',
    );
  });

  it('returns the correct contribute button message when action is "mapATask"', () => {
    const element = createComponentWithReduxAndIntl(
      <TaskSelectionFooter
        project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
        taskAction={'mapATask'}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.mapRandomTask',
    );
  });

  it('returns the correct contribute button message when action is "selectAnotherProject"', () => {
    const element = createComponentWithReduxAndIntl(
      <TaskSelectionFooter
        project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
        taskAction={'selectAnotherProject'}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });

  it('returns the correct contribute button message when action is "mappingIsComplete"', () => {
    const element = createComponentWithReduxAndIntl(
      <TaskSelectionFooter
        project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
        taskAction={'mappingIsComplete'}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });

  it('returns the correct contribute button message when action is "projectIsComplete"', () => {
    const element = createComponentWithReduxAndIntl(
      <TaskSelectionFooter
        project={{ projectId: 1, mappingTypes: ['LAND_USE'], mappingEditors: ['ID', 'JOSM'] }}
        taskAction={'projectIsComplete'}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.selectAnotherProject',
    );
  });

  it('returns the correct contribute button message when taskAction is "validateSelectedTask"', () => {
    const element = createComponentWithReduxAndIntl(
      <TaskSelectionFooter
        project={{
          projectId: 1,
          mappingTypes: ['LAND_USE'],
          mappingEditors: ['ID', 'JOSM'],
          validationEditors: ['ID', 'JOSM'],
        }}
        taskAction={'validateSelectedTask'}
      />,
    );
    const testInstance = element.root;
    expect(testInstance.findByType(Button).findByType(FormattedMessage).props.id).toBe(
      'project.selectTask.footer.button.validateSelectedTask',
    );
  });
});
