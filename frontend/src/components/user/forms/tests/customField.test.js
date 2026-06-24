import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { CustomField } from '../customField';
import { IntlProviders } from '../../../../utils/testWithIntl';

describe('CustomField Component', () => {
  const setup = (props) => {
    return render(
      <IntlProviders>
        <CustomField {...props}>
          <div data-testid="child-element">Child</div>
        </CustomField>
      </IntlProviders>
    );
  };

  it('renders correctly with given props', () => {
    // We use actual message keys from messages.js if possible. For tests we can mock or use valid keys.
    // 'expertMode' and 'expertModeDescription' exist in messages.js.
    setup({ labelId: 'expertMode', descriptionId: 'expertModeDescription', isDropdown: false });
    
    // Expect the label to be translated 
    expect(screen.getByText('Expert mode')).toBeInTheDocument(); // translated text for expertMode
    expect(screen.getByText('Child')).toBeInTheDocument();
  });

  it('applies dropdown classes when isDropdown is true', () => {
    const { container } = setup({ labelId: 'defaultEditor', descriptionId: 'defaultEditorDescription', isDropdown: true });
    
    // Expect the translated default editor label
    expect(screen.getByText('Default editor')).toBeInTheDocument();
    
    // Check if the flex row classes are applied
    const flexDiv = container.querySelector('.flex-row-ns');
    expect(flexDiv).toBeInTheDocument();
  });
});
