import React from 'react';
import { Redirect } from '@reach/router';
import * as safeStorage from '../../utils/safe_storage';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI,
        pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { Button } from '../button';

export class CreateOrganisation extends React.Component{
    tmTeamsPromise;
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            logo: "",
            url: "",
            visibility: "PUBLIC",
            username: safeStorage.getItem('username'),
            org_id: null,
        };
    }

    componentDidMount = () => {
        this.getOrgs();
    }

    getOrgs = () => {
        this.tmTeamsPromise = cancelablePromise(fetchLocalJSONAPI('organisations/1', safeStorage.getItem('token')));
        this.tmTeamsPromise.promise.then(
          r => {
              console.log(r);
          }
        ).catch(e => console.log(e));
    }

    handleChange = (e) => {
        this.setState({
          [e.target.name]: e.target.value
        })
    }

    handleCreate = () => {
        let body = { name: this.state.name, logo: this.state.logo, url: this.state.url, visibility: this.state.visibility};
        this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('organisations', JSON.stringify(body), safeStorage.getItem('token'), 'POST'));
        this.tmTeamsPromise.promise.then(
            res => {
                this.setState({
                    org_id: res.organisationId
                });
                }
            ).catch(e => console.log(e));
    }

    renderRedirect = () => {
        if(this.state.org_id)
        return (<Redirect to={"/organisation/" + this.state.org_id} noThrow />);
    }

    render(){
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
                                        <label className="db fw6 lh-copy f6">Logo</label>
                                        <input className="pa2 input-reset ba bg-transparent w-100" value={this.state.logo}
                                        type="text" name="logo" onChange={this.handleChange} />
                                    </div>
                                    <div className="mt3">
                                        <label className="db fw6 lh-copy f6">Url</label>
                                        <input value={this.state.url} className="pa2 input-reset ba bg-transparent w-100"
                                            type="text" name="url" onChange={this.handleChange} />
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
    }
}

