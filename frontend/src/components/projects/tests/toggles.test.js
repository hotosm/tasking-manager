import { act } from 'react-test-renderer';

import { store } from '../../../store';
import { createComponentWithReduxAndIntl } from '../../../utils/testWithIntl';
import { ShowMapToggle, ProjetListViewToggle } from '../projectNav';
import { GripIcon, ListIcon } from '../../svgIcons';

describe('test if ShowMapToggle component', () => {
  const element = createComponentWithReduxAndIntl(<ShowMapToggle />);
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

describe('test if ProjetListViewToggle', () => {
  const element = createComponentWithReduxAndIntl(<ProjetListViewToggle />);
  const instance = element.root;
  it('has the correct CSS classes', () => {
    expect(() => instance.findByType('div')).not.toThrow(
      new Error('No instances found with node type: "div"'),
    );
    expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
  });
  it('updates the redux state and css classes when clicked', () => {
    expect(store.getState().preferences['projectListView']).toBeFalsy();
    act(() => {
      instance.findByType(ListIcon).props.onClick();
      return undefined;
    });
    expect(store.getState().preferences['projectListView']).toBeTruthy();
    expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
    expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    // click on GripIcon
    act(() => {
      instance.findByType(GripIcon).props.onClick();
      return undefined;
    });
    expect(store.getState().preferences['projectListView']).toBeFalsy();
    expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
  });
});
