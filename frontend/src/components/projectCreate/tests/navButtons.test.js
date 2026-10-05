import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

import NavButtons from '../navButtons';
import { projectMetadata } from '../../../utils/tests/snippets/projectMetadata';
import { IntlProviders } from '../../../utils/testWithIntl';

describe('NavButtons', () => {
  it('keeps the task grid from metadata when moving from step 2 to step 3', async () => {
    // maplibre-gl >= 5.x no longer exposes the GeoJSON on the private `_data` property.
    const mapObj = { map: { getSource: jest.fn(() => ({ setData: jest.fn() })) }, draw: {} };
    const updateMetadata = jest.fn();
    const setStep = jest.fn();
    const user = userEvent.setup();
    render(
      <IntlProviders>
        <NavButtons
          index={2}
          metadata={projectMetadata}
          mapObj={mapObj}
          updateMetadata={updateMetadata}
          setStep={setStep}
          setErr={jest.fn()}
          maxArea={5000}
          handleCreate={jest.fn()}
          cloneProjectData={{ name: null }}
        />
      </IntlProviders>,
    );

    await user.click(screen.getByText('Next'));

    expect(updateMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        taskGrid: projectMetadata.taskGrid,
        tempTaskGrid: projectMetadata.taskGrid,
      }),
    );
    expect(setStep).toHaveBeenCalledWith(3);
  });
});
