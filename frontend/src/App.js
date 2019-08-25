import React from 'react';
import { Router } from "@reach/router";

import './assets/styles/index.scss';
import { Header } from './components/header';
import { Footer } from './components/footer';
import { Home } from './views/home';
import { AboutPage } from './views/about';
import { Authorized } from './views/authorized';
import { Login } from './views/login';
import { Welcome } from './views/welcome';
import { ListTeams } from './components/teams/teams';
import { TeamProfile } from './components/teams/team_profile';
import { EditTeam } from './components/teams/edit_team';
import { CreateTeam } from './components/teams/create_team';
import { Organisations } from './components/organisations/organisations';
import { CreateOrganisation } from './components/organisations/create_organisation';
import { OrganisationProfile } from './components/organisations/organisation_profile';

function App() {
  return (
    <div className="App w-100 base-font">
      <Header />
      <div className="cf w-100 base-font">
        <Router>
          <Home path="/" />
          <AboutPage path="/about" />
          <ListTeams path="/teams" />
          <TeamProfile path="/team/:team_id" />
          <EditTeam path="/edit_team/:team_id" />
          <CreateTeam path="/team/create" />
          <Organisations path="/organisations" />
          <CreateOrganisation path="/organisation/create" />
          <OrganisationProfile path="/organisation/:org_id" />
          <Authorized path="authorized" />
          <Login path="login" />
          <Welcome path="welcome" />
        </Router>
      </div>
      <Footer />
    </div>
  );
}

export default App;
