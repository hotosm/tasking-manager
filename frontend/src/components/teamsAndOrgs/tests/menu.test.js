import React from 'react';

import { createComponentWithIntl } from '../../../utils/testWithIntl';
import { ManagementMenu } from '../menu';

describe('ManagementMenu itens for', () => {
  it('ADMIN users should include all itens', () => {
    const element = createComponentWithIntl(<ManagementMenu isAdmin={true} />);
    const testInstance = element.root;
    expect(testInstance.findAllByType('a').length).toBe(7);
  });

  it('non ADMIN users should include only 3 itens', () => {
    const element = createComponentWithIntl(<ManagementMenu isAdmin={false} />);
    const testInstance = element.root;
    expect(testInstance.findAllByType('a').length).toBe(3);
  });
});
