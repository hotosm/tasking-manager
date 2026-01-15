import { FormattedMessage } from 'react-intl';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { MappingLevelIcon } from '../contributions';
import { FullStarIcon, HalfStarIcon } from '../../svgIcons';

describe('if mappingLevel is "Intermediate mapper"', () => {
  const element = createComponentWithIntl(<MappingLevelIcon mappingLevel="INTERMEDIATE" />);
  const instance = element.root;
  it('HalfStarIcon with correct classNames', () => {
    expect(instance.findByType(HalfStarIcon).props.className).toBe('h1 w1 v-mid pb1');
  });
  it('FormattedMessage with the correct id', () => {
    expect(instance.findByType(FormattedMessage).props.id).toBe('project.level.intermediate');
  });
});

describe('if mappingLevel is "Advanced mapper"', () => {
  const element = createComponentWithIntl(<MappingLevelIcon mappingLevel="ADVANCED" />);
  const instance = element.root;
  it('should render a FullStarIcon', () => {
    expect(instance.findByType(FullStarIcon).props.className).toBe('h1 w1 v-mid pb1');
  });
  it('should render a FormattedMessage with the correct id', () => {
    expect(instance.findByType(FormattedMessage).props.id).toBe('project.level.advanced');
  });
});

describe('if mappingLevel is anything else', () => {
  it('should not render anything', () => {
    const element = createComponentWithIntl(<MappingLevelIcon mappingLevel="BEGINNER" />);
    expect(element.toJSON()).toBeNull();
  });
});
