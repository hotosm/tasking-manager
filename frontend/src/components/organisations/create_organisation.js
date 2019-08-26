import React from 'react';
import { Redirect } from '@reach/router';
import { cancelablePromise } from '../../utils/promise';
import { pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { connect } from "react-redux";
import { Button } from '../button';

class CreateOrganisation extends React.Component{
    tmTeamsPromise;
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            logo: "",
            url: "",
            visibility: "PUBLIC",
            org_id: null,
        };
    }

    handleChange = (e) => {
        this.setState({
          [e.target.name]: e.target.value
        })
    }

    handleCreate = () => {
        let body = { name: this.state.name, logo: this.state.logo, url: this.state.url, visibility: this.state.visibility};
        this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('organisations', JSON.stringify(body), this.props.token, 'POST'));
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
        return (<Redirect to={"/organisations/" + this.state.org_id} noThrow />);
    }

    render(){
            if(!this.props.token)
                return(<div>Not authorized</div>)
            else
                return(
                    <div className="ma3">
                        {this.renderRedirect()}
                        <h3>Create Organisation</h3>
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

const mapStateToProps = state => ({
    username: state.auth.getIn(['userDetails', 'username']),
    token: state.auth.get('token'),
  });
  
CreateOrganisation = connect(mapStateToProps)(CreateOrganisation);
  
  export { CreateOrganisation };