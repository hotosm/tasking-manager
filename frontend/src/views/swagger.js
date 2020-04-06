import React from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

import { API_URL } from '../config';
import { useSetTitleTag } from '../hooks/UseMetaTags';

export default function SwaggerView() {
  useSetTitleTag('API Docs');
  return <SwaggerUI url={`${API_URL}system/docs/json/`} />;
}
