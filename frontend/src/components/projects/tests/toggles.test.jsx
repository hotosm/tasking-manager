import { render } from '@testing-library/react';
import { store } from '../../../store';
import { ReduxIntlProviders } from '../../../utils/testWithIntl';
import { ShowMapToggle, ProjectListViewToggle } from '../projectNav';
import userEvent from '@testing-library/user-event';

describe('test if ShowMapToggle component', () => {
  const setup = () =>
    render(
      <ReduxIntlProviders>
        <ShowMapToggle />
      </ReduxIntlProviders>,
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
  const setup = () =>
    render(
      <ReduxIntlProviders>
        <ProjectListViewToggle />
      </ReduxIntlProviders>,
    );
  const user = userEvent.setup();
  it('has the correct CSS classes', () => {
    const { container } = setup();
    expect(container.getElementsByTagName('div').length).toBe(1);
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-light')).toBeInTheDocument();
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-grey')).toBeInTheDocument();
  });
  it('updates the redux state and css classes when clicked', async () => {
    const { container } = setup();
    expect(store.getState().preferences['projectListView']).toBeFalsy();
    await user.click(container.querySelector('svg.dib.pointer.v-mid.ph1.blue-light'));
    expect(store.getState().preferences['projectListView']).toBeTruthy();

    // Check both icons have the correct classes
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-grey')).toBeInTheDocument();
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-light')).toBeInTheDocument();

    // click on GripIcon
    await user.click(container.querySelector('svg.dib.pointer.v-mid.ph1.blue-light'));
    expect(store.getState().preferences['projectListView']).toBeFalsy();

    // Check both icons have the correct classes
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-light')).toBeInTheDocument();
    expect(container.querySelector('.dib.pointer.v-mid.ph1.blue-grey')).toBeInTheDocument();
  });
});
