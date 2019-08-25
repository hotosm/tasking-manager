import React from 'react';
import { Link, Redirect } from '@reach/router';
import * as safeStorage from '../../utils/safe_storage';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI,
        pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { Button } from '../button';
import { AreaIcon } from '../svgIcons/area';

export class OrganisationProfile extends React.Component{
    tmTeamsPromise;
    constructor(props) {
        super(props);
        this.state = {
            org: [],
            e: null,
            redirect: null
        };
      }

    componentDidMount = () => {
        this.getOrg();
        console.log(this.props);
    }

    getOrg = () => {
        this.tmTeamsPromise = cancelablePromise(fetchLocalJSONAPI('organisations/' + this.props.org_id, safeStorage.getItem('token')));
        this.tmTeamsPromise.promise.then(
        r => {
            this.setState({
            org: r
            });
        }).catch(e => {
            console.log(typeof(e));
            this.setState({e:e}, ()=>console.log(this.state.e));
            console.log(e)});
    }

    deleteOrg = () => {
        console.log("Leave Team");
        let body = {};
        this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('organisations/' + this.props.org_id, JSON.stringify(body),
        safeStorage.getItem('token'), 'DELETE'));
        this.tmTeamsPromise.promise.then(
            res => {
                this.setState({
                redirect: res,
                });
                }).catch(e => console.log(e));
    }

    renderRedirect = () => {
        if(this.state.redirect !== null)
            return(<Redirect to='/organisations' />);
    } 

    render(){
            if(this.state.org.length !== 0)
            return(
                <div className="ma3">
                    {this.renderRedirect()}
                    <div className="cf pv5 ph5-l ph4 bg-white">
                        {(this.state.org.isAdmin) ?
                            <div className="dt-rows">
                                <Button children='Delete Organisation' onClick={this.deleteOrg}/>
                            </div> : null}
                        <div className="dt-rows">
                            <div className="fl w-50 bg-white tc">
                                <h1 className="gray tl tl mv1">{this.state.org.name}</h1>
                            </div>
                            <div className="fl w-50 bg-white tr">
                                {/* Logo */}
                                <AreaIcon className="tr" />
                            </div>
                        </div>
                        <div className="dt-rows">
                            <h3 className="gray tl tl">Organisation admins</h3>
                            <ul>
                                { (this.state.org.admins) ? this.state.org.admins.map((admin,i)=>{
                                        return(<li key={i}><Link to={'/users/'+admin} className="no-underline gray">
                                        {admin}</Link></li>)
                                }) : null}
                            </ul>
                        </div>
                        <div className="dt-rows">
                            <h3 className="gray tl tl">Projects</h3>
                            <ul>
                                { (this.state.org.projects) ? this.state.org.projects.map((project, i)=>{
                                        return(<li key={i}>{project}</li>)
                                }) : null}
                            </ul>
                        </div>
                        <div className="dt-rows">
                            <h3 className="gray tl tl">Teams</h3>
                            <ul>
                                { (this.state.org.teams) ? this.state.org.teams.map((team, i)=>{
                                        return(<li key={i}>{team}</li>)
                                }) : null}
                            </ul>
                        </div>
                    </div>
                </div>
            )
            else if(this.state.e){
                return(<div><h3>Organisation not found</h3></div>)
            }
            else
                return(<div>Loading ...</div>)
    }
}

