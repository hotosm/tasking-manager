import React from 'react';
import ReactDOM from 'react-dom';
import { Router } from "react-router-dom";
import { Provider } from "react-redux";
import { createHashHistory } from "history";
import { store } from './store';

import App from './App';

const history = createHashHistory();


it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(
    <Provider store={store}>
      <Router history={history}>
        <App />()
      </Router>
    </Provider>,
    div
  );
  ReactDOM.unmountComponentAtNode(div);
});
