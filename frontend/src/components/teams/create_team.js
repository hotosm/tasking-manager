import React from 'react';
import { Redirect } from '@reach/router';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI,
        pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { Button } from '../button';
import { connect } from "react-redux";

class CreateTeam extends React.Component{
    tmTeamsPromise;
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            org: [],
            logo: "",
            description: "",
            inviteOnly: false,
            visibility: "PUBLIC",
            organisations: [],
            team_id: null,
            hasError: false,
        };
    }

    componentDidMount = () => {
        this.getOrgs();
    }

    getOrgs = () => {
        this.tmTeamsPromise = cancelablePromise(fetchLocalJSONAPI('organisations'));
        this.tmTeamsPromise.promise.then(
          r => {
            this.setState({
                organisations: r.organisations,
                org:r.organisations[0],
            },()=>{console.log(this.state.organisations)});
          }
        ).catch(e => {console.log(e)});
    }

    handleChange = (e) => {
        this.setState({
          [e.target.name]: e.target.value
        })
    }

    handleCreate = () => {
        let body = { name: this.state.name, organisation_id: this.state.org.organisationId, logo: this.state.logo, description: this.state.description, visibility: this.state.visibility, inviteOnly: this.state.inviteOnly};
        this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('teams', JSON.stringify(body), this.props.token, 'POST'));
        this.tmTeamsPromise.promise.then(
            res => {
                this.setState({
                    team_id: res.teamId
                });
                }
            ).catch(e => console.log(e));
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        this.setState({ hasError: true });
    }

    renderRedirect = () => {
        if(this.state.team_id)
        return (<Redirect to={`/teams/${this.state.team_id}/edit`} noThrow />);
    }

    render(){
            if(this.props.token === null)
                return(<div>Not Authorized</div>);
            else if(this.state.hasError)
                return(<h1>Something went wrong.</h1>)
            else if(this.state.organisations.length !== 0 && this.state.org.length !== 0)
                    return(
                        <div className="ma3">
                            {this.renderRedirect()}
                            <div className="cf pv5 ph5-l ph4 bg-white">
                                <div className="dt-rows">
                                    <form className="measure">
                                        <fieldset id="sign_up" className="ba b--transparent ph0 mh0">
                                            <div className="mt3">
                                                <label className="db fw6 lh-copy f6">Name</label>
                                                <input className="pa2 input-reset ba bg-transparent w-100" value={this.state.name}
                                                type="text" name="name" onChange={this.handleChange} />
                                            </div>
                                            <div className="mt3">
                                                <label className="db fw6 lh-copy f6">Organisation</label>
                                                <select onChange={this.handleChange} name="org" defaultValue={this.state.org.name}>
                                                {this.state.organisations.map(org => {
                                                return(
                                                    <option key={org.organisationId} value={org.organisationId}>{org.name}</option>                  
                                                )
                                                })}
                                                </select>
                                            </div>
                                            <div className="mt3">
                                                <label className="db fw6 lh-copy f6">Logo</label>
                                                <input className="pa2 input-reset ba bg-transparent w-100" value={this.state.logo}
                                                type="text" name="logo" onChange={this.handleChange} />
                                            </div>
                                            <div className="mt3">
                                                <label className="db fw6 lh-copy f6">Description</label>
                                                <textarea className="measure-wide pa2-ns input-reset ba bg-transparent w-100"
                                                value={this.state.description} type="text" onChange={this.handleChange} name="description" />
                                            </div>
                                            <div className="mt3">
                                                <label className="db fw6 lh-copy f6">Invite Only</label>
                                                <input defaultChecked={this.state.inviteOnly} value={this.state.inviteOnly}
                                                    type="checkbox" name="inviteOnly" onChange={()=>this.setState(state=>({inviteOnly:!state.inviteOnly}))} />
                                            </div>
                                            <div className="mt3">
                                                <label className="db fw6 lh-copy f6">visibility</label>
                                                <select value={this.state.visibility} onChange={this.handleChange} name="visibility">
                                                    <option value="PUBLIC">Public</option>
                                                    <option value="PRIVATE">Private</option>
                                                    <option value="SECRET">Secret</option>
                                                </select>
                                            </div>
                                        </fieldset>
                                    </form>
                                    <Button children="Create" onClick={this.handleCreate}/>
                                </div>
                            </div>
                        </div>
                )
            else
                return(<div>Loading ...</div>)
    }
}

const mapStateToProps = state => ({
    username: state.auth.getIn(['userDetails', 'username']),
    token: state.auth.get('token'),
  });
  
CreateTeam = connect(mapStateToProps)(CreateTeam);
  
  export { CreateTeam };