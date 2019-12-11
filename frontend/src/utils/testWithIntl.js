import React from 'react';
import TestRenderer from 'react-test-renderer';

import { IntlProvider } from 'react-intl';

export const createComponentWithIntl = (children, props = { locale: 'en' }) => {
  return TestRenderer.create(<IntlProvider {...props}>{children}</IntlProvider>);
};
