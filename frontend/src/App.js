import React from 'react';
import { Route } from "react-router-dom";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Home } from './views/home';
import { AboutPage } from './views/about';

function App() {
  return (
    <div className="App">
      <Header />
      <div>
        <Route exact path="/" component={ Home } />
        <Route exact path="/about" component={ AboutPage } />
      </div>
    </div>
  );
}

export default App;
