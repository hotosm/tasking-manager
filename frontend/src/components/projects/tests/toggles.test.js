import { act } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { store } from '../../../store';
import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { ShowMapToggle, ProjectListViewToggle } from '../projectNav';
import { GripIcon, ListIcon } from '../../svgIcons';

describe('test if ShowMapToggle component', () => {
  const element = createComponentWithIntl(
    <MemoryRouter>
      <Provider store={store}>
        <ShowMapToggle />
      </Provider>
    </MemoryRouter>,
  );
  const instance = element.root;
  it('has the correct CSS classes', () => {
    expect(instance.findByProps({ className: 'fr pv2 dib-ns dn blue-dark' }).type).toBe('div');
  });
  it('updates the redux state when clicked', () => {
    expect(store.getState().preferences['mapShown']).toBeFalsy();
    act(() => {
      instance.findByType('div').children[0].props.onChange();
      return undefined;
    });
    expect(store.getState().preferences['mapShown']).toBeTruthy();
    act(() => {
      instance.findByType('div').children[0].props.onChange();
      return undefined;
    });
    expect(store.getState().preferences['mapShown']).toBeFalsy();
  });
});

describe('test if ProjectListViewToggle', () => {
  const element = createComponentWithIntl(
    <MemoryRouter>
      <ProjectListViewToggle />
    </MemoryRouter>,
  );
  const instance = element.root;
  it('has the correct CSS classes', () => {
    expect(() => instance.findByType('div')).not.toThrow(
      new Error('No instances found with node type: "div"'),
    );
    expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
  });
  it('updates css classes when clicked', () => {
    act(() => {
      instance.findByType(ListIcon).props.onClick();
      return undefined;
    });
    expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
    expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    // click on GripIcon
    act(() => {
      instance.findByType(GripIcon).props.onClick();
      return undefined;
    });
    expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
  });
});
