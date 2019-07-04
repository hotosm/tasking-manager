import React from 'react';
import { Link } from "react-router-dom";
import { FormattedMessage } from 'react-intl';

import { Button } from '../button';
import messages from './messages';


export function Jumbotron() {
  return(
    <div className="cover bg-jumbotron white">
      <div className="pl6-l pl4 pv5-ns pv3">
        <h3 className="mb4 mw6-ns mw-20rem f-4rem-l f1 ttu barlow-condensed fw8">
          <FormattedMessage {...messages.jumbotronTitle}/>
        </h3>
        <p className="pr2 f4 f3-ns mw7">
          <FormattedMessage {...messages.jumbotronHeadLine}/>
        </p>
        <p>
          <Link to={"/contribute"}>
            <Button className="bg-red white mr3"><FormattedMessage {...messages.startButton} /></Button>
          </Link>
          <Link to={"/sign-in"}>
            <Button className="bg-white blue-dark mt3 mt0-ns"><FormattedMessage {...messages.joinButton} /></Button>
          </Link>
        </p>
      </div>
    </div>
  );
}
