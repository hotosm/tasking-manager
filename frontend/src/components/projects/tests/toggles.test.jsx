import { render } from '@testing-library/react';
import { store } from '../../../store';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { ShowMapToggle, ProjectListViewToggle } from '../projectNav';

describe('test if ShowMapToggle component', () => {
  const setup = () => render(
    <ReduxIntlProviders>
      <ShowMapToggle />
    </ReduxIntlProviders>
  );
  it('has the correct CSS classes', () => {
    const { container } = setup();
    expect(container.querySelector('.fr.pv2.dib-ns.dn.blue-dark')).toBeInTheDocument();
  });
  it('redux state is correct', () => {
    setup();
    expect(store.getState().preferences['mapShown']).toBeFalsy();
  });
});

describe('test if ProjectListViewToggle', () => {
  const setup = () => render(
    <ReduxIntlProviders>
      <ProjectListViewToggle />
    </ReduxIntlProviders>,
  );
  it('has the correct CSS classes', () => {
    const { container } = setup();
    expect(container.getElementsByTagName("div").length).toBe(1);
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-light')).toBeInTheDocument();
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-grey')).toBeInTheDocument();
  });
  test.todo('updates the redux state and css classes when clicked', () => {
    // expect(store.getState().preferences['projectListView']).toBeFalsy();
    // act(() => {
    //   instance.findByType(ListIcon).props.onClick();
    //   return undefined;
    // });
    // expect(store.getState().preferences['projectListView']).toBeTruthy();
    // expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
    // expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    // // click on GripIcon
    // act(() => {
    //   instance.findByType(GripIcon).props.onClick();
    //   return undefined;
    // });
    // expect(store.getState().preferences['projectListView']).toBeFalsy();
    // expect(instance.findByType(GripIcon).props.className).toBe('dib pointer v-mid ph1 blue-grey');
    // expect(instance.findByType(ListIcon).props.className).toBe('dib pointer v-mid ph1 blue-light');
  });
});
