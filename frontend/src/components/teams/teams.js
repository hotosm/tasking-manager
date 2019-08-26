import React from 'react';
import { Link } from '@reach/router';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI } from '../../network/genericJSONRequest';

export class ListTeams extends React.Component {
  tmTeamsPromise;
  constructor(props) {
    super(props);
    this.state = {
      teams: [],
    };
  }

  componentDidMount() {
    this.getTeams();
  }

  getTeams = () => {
    this.tmTeamsPromise = cancelablePromise(fetchLocalJSONAPI('teams'));
    this.tmTeamsPromise.promise.then(
      r => {
        this.setState({
          teams: r.teams,
        });
      }
    ).catch(e => console.log(e));
  }

  render() {
    return(
      <div className="cf pv5 ph5-l ph4 bg-white">
        <div className="dt-rows">
            <h1 className="gray tl tl">Teams</h1>
        </div>
        <div className="dt-rows">
          <div className="fl w-10 tl">
            Search and filter Teams
          </div>
          <div className="flex flax-wrap justify-center fl w-90">
            {
              this.state.teams.map(team=>{
                return(
                  <article key={team.teamId} className="br2 ba dark-gray b--black-10 mv4 w-100 w-50-m w-25-l mw6 center">
                    <Link to={`/teams/${team.teamId}`} className="no-underline">
                      <div className="pa2 ph3-ns pb3-ns">
                        <div className="dt w-100 mt1">
                          <div className="dtc">
                            <h1 className="f6 f4-ns mv0 gray">#{team.teamId} {team.name}</h1>
                          </div>
                        </div>
                        <p className="f6 lh-copy measure mt2 mid-gray">
                          {(team.description.lenght<250) ? team.description : (team.description.substring(0,250)+'....') }
                        </p>
                          <div className='f6 lh-copy measure mt2 gray'>
                            <span className='b'>Organisation: </span>{team.organisation}
                          </div>
                          <div className='f6 lh-copy measure mt2 gray'>
                            <span className='b'>Role: </span>{team.organisation}
                          </div>
                      </div>
                    </Link>
                  </article>
                  )
              })
            }
          </div>
        </div>
      </div>
    );
  }
}
