import React from 'react';
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

import { API_URL } from '../config';

export default function SwaggerView() {
  return <SwaggerUI url={`${API_URL}system/docs/json/`} />;
};
