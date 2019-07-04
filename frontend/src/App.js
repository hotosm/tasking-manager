import React from 'react';
import { Router } from "@reach/router";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { Authorized } from './views/authorized';
import { API_URL } from './config';

function App() {
  let login_url = API_URL + 'auth/login'; 
  return (
    <div className="App w-100 base-font">
      <Header />
      <div className="cf w-100 base-font">
        <Route exact path="/" component={ Home } />
        <Route path="/about" component={ AboutPage } />
        <Route path="/authorized" component={ Authorized } />
        <Route path="/login" component={() => {
          window.location.href = login_url;
          return null; 
        }} />
      </div>
      <Footer />
    </div>
  );
}

export default App;
