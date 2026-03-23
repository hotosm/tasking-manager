import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { MappingLevelIcon } from '../contributions';
import { FullStarIcon, FullStarIconYellow, HalfStarIcon } from '../../svgIcons';

const mappingLevelList = [
  { name: 'BEGINNER', ordering: 1 },
  { name: 'INTERMEDIATE', ordering: 2 },
  { name: 'ADVANCED', ordering: 3 },
  { name: 'SUPER_MAPPER', ordering: 4 },
];

describe('if mappingLevel is "Intermediate mapper"', () => {
  const element = createComponentWithIntl(
    <MappingLevelIcon mappingLevel="INTERMEDIATE" mappingLevelList={mappingLevelList} />,
  );
  const instance = element.root;
  it('HalfStarIcon with correct classNames', () => {
    expect(instance.findByType(HalfStarIcon).props.className).toBe('h1 w1 v-mid pb1');
  });
});

describe('if mappingLevel is "Advanced mapper"', () => {
  const element = createComponentWithIntl(
    <MappingLevelIcon mappingLevel="ADVANCED" mappingLevelList={mappingLevelList} />,
  );
  const instance = element.root;
  it('should render a FullStarIcon', () => {
    expect(instance.findByType(FullStarIcon).props.className).toBe('h1 w1 v-mid pb1');
  });
});

describe('if mappingLevel is "Super Mapper"', () => {
  const element = createComponentWithIntl(
    <MappingLevelIcon mappingLevel="SUPER_MAPPER" mappingLevelList={mappingLevelList} />,
  );
  const instance = element.root;
  it('should render a FullStarIconYellow', () => {
    expect(instance.findByType(FullStarIconYellow).props.className).toBe('h1 w1 v-mid pb1');
  });
});

describe('if mappingLevel is anything else', () => {
  it('should not render anything', () => {
    const element = createComponentWithIntl(
      <MappingLevelIcon mappingLevel="MAPPER" mappingLevelList={mappingLevelList} />,
    );
    expect(element.toJSON()).toBeNull();
  });
});
