import React from 'react';

import { Jumbotron } from '../components/homepage/jumbotron';


export class Home extends React.Component {
  render() {
    return(
      <div className="pull-center">

        <Jumbotron />
      </div>
    );
  }
}
