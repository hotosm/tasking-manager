import React from 'react';
import { Route } from "react-router-dom";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { Login } from './views/login';

function App() {
  return (
    <div className="App w-100 base-font">
      <Header />
      <div className="cf w-100 base-font">
        <Route exact path="/" component={ Home } />
        <Route path="/about" component={ AboutPage } />
        <Route path="/login" component={ Login } />
      </div>
    </div>
  );
}

export default App;
