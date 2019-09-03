import React from 'react';
import { Location, Router } from "@reach/router";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { Authorized } from './views/authorized';
import { Login } from './views/login';
import { SignUp } from './views/signUp';
import { Welcome } from './views/welcome';
import { Settings } from './views/settings';
import { NotFound } from './views/notFound';


function App() {
  return (
    <Location>
      {({ location }) => (
        <div className="App w-100 base-font">
          <Header location={location} />
          <div className="cf w-100 base-font">
            <Router>
              <Home path="/" />
              <AboutPage path="about" />
              <Authorized path="authorized" />
              <Login path="login" />
              <Welcome path="welcome" />
              <Settings path="settings" />
              <SignUp path="signup" />
              <NotFound default />
            </Router>
          </div>
          <Footer />
        </div>
      )}
    </Location>
  );
}

export default App;
