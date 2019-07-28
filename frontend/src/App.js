import React from 'react';
import { Router } from "@reach/router";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { ProjectPage } from './views/project';
import { MoreFilters } from './components/projectcard/projectNav';
import { Authorized } from './views/authorized';
import { Login } from './views/login';


function App() {
  return (
    <div className="App w-100 base-font">
      <Header />
      <div className="cf w-100 base-font">
        <Router>
          <Home path="/" />
          <ProjectPage path="contribute/">
            <MoreFilters path="contribute/moreFilters/:filters" />
          </ProjectPage>
          <AboutPage path="about" />
          <Authorized path="authorized" />
          <Login path="login" />
        </Router>
      </div>
      <Footer />
    </div>
  );
}

export default App;
