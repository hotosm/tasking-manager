import { FormattedNumber } from 'react-intl';

import { NextMappingLevel } from '../topBar';
import { MappingLevelMessage } from '../../mappingLevel';
import { createComponentWithIntl } from '../../../utils/testWithIntl';

it('changesets missing to intermediate level', () => {
  const element = createComponentWithIntl(<NextMappingLevel changesetsCount={100} />);
  const elementInstance = element.root;
  expect(elementInstance.findAllByType(FormattedNumber)[0].props.value).toBe(100);
  expect(elementInstance.findAllByType(FormattedNumber)[1].props.value).toBe(250);
  expect(elementInstance.findByType(MappingLevelMessage).props.level).toBe('INTERMEDIATE');
});

it('changesets missing to advanced level', () => {
  const element = createComponentWithIntl(<NextMappingLevel changesetsCount={300} />);
  const elementInstance = element.root;
  expect(elementInstance.findAllByType(FormattedNumber)[0].props.value).toBe(300);
  expect(elementInstance.findAllByType(FormattedNumber)[1].props.value).toBe(500);
  expect(elementInstance.findByType(MappingLevelMessage).props.level).toBe('ADVANCED');
});

it('user is advanced already', () => {
  const element = createComponentWithIntl(<NextMappingLevel changesetsCount={600} />);
  const elementInstance = element.root;
  expect(() => elementInstance.findByType(FormattedNumber)).toThrow(
    new Error('No instances found with node type: "FormattedNumber"'),
  );
  expect(() => elementInstance.findByType(MappingLevelMessage)).toThrow(
    new Error('No instances found with node type: "MappingLevelMessage"'),
  );
});
