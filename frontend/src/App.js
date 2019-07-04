import React from 'react';
import { Route } from "react-router-dom";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { Authorized } from './views/authorized';
import { API_URL } from './config';

function App() {
  let login_url = API_URL + 'auth/login'; 
  return (
    <div className="App">
      <Header />
      <div>
        <Route exact path="/" component={ Home } />
        <Route path="/about" component={ AboutPage } />
        <Route path="/authorized" component={ Authorized } />
        <Route path="/login" component={() => {
          window.location.href = login_url;
          return null; 
        }} />
      </div>
    </div>
  );
}

export default App;
