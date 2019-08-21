import React from 'react';
import { Link } from '@reach/router';
import * as safeStorage from '../../utils/safe_storage';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI,
        pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { Button } from '../button';
import { AreaIcon } from '../svgIcons/area';

export class TeamProfile extends React.Component{
    tmTeamsPromise;
    constructor(props) {
        super(props);
        this.state = {
            team: [],
            inviteSend: "",
            isMember: false,
            isAdmin: false,
            username: safeStorage.getItem('username'),
        };
      }

    componentDidMount = () => {
        this.getTeam();
        console.log(this.props);
        console.log(this.state.username);
    }

    getTeam = () => {
        this.tmTeamsPromise = cancelablePromise(fetchLocalJSONAPI('team/' + this.props.team_id));
        this.tmTeamsPromise.promise.then(
        r => {
            var isMember = false;
            var isAdmin = false;
            r.members.map(member => {
                if(member.username === this.state.username){
                    isMember = true;
                    if(member.function === 'MANAGER')
                        isAdmin = true;
                }
                return null;
            });
            this.setState({
            team: r,
            isMember: isMember,
            isAdmin: isAdmin,
            });
        }).catch(e => console.log(e));
    }

    handleJoin = () => {
        console.log('Join requested');
        let body = {team_id:this.state.team.teamId, user:this.state.username};
        this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/request-join', JSON.stringify(body),
        safeStorage.getItem('token'), 'POST'));
        this.tmTeamsPromise.promise.then(
            res => {
            this.setState({
                inviteSend:res.Success,
            }, ()=>{ console.log(this.state.inviteSend)});
            }
            ).catch(e => console.log(e));
        }

    handleLeave = () => {
        console.log("Leave Team");
        let body = {team_id:this.state.team.teamId, user:this.state.username};
        this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/leave', JSON.stringify(body),
        safeStorage.getItem('token'), 'DELETE'));
        this.tmTeamsPromise.promise.then(
            res => {
                this.setState({
                team: res,
                isMember: false,
                isAdmin: false,
                });
                }).catch(e => console.log(e));
    }

    render(){
            if(this.state.team.members)
            return(
                <div className="ma3">
                    <div className="cf pv5 ph5-l ph4 bg-white">
                        {(this.state.isAdmin) ?
                            <div className="dt-rows">
                                <Link to={ `/teams/${this.props.team_id}/edit` } className="no-underline">
                                    <Button children='Edit' class='edit-team' /></Link>
                            </div> : null}
                        <div className="dt-rows">
                            <div className="fl w-50 bg-white tc">
                                <h1 className="gray tl tl mv1">{this.state.team.name}</h1>
                                <h3 className="gray ma0 tl">{this.state.team.organisation}</h3>
                            </div>
                            <div className="fl w-50 bg-white tr">
                                <AreaIcon className="tr" />
                            </div>
                        </div>
                        <div className="dt-rows mt6">
                            <p>{this.state.team.description}</p>
                            {(this.state.username === null) ? null : (this.state.isMember) ?
                                <Button onClick={this.handleLeave} children='Leave' class='leave-team'/> :
                                // (this.state.inviteSend != '') ? <Button children='Request Send' class='join-team'/> :
                                (this.state.team.inviteOnly === false) ?
                                <Button onClick={this.handleJoin} children='Join' class='join-team'/> :
                                null
                            }
                        </div>
                        <div className="dt-rows">
                            <h3 className="gray tl tl">Team administrators</h3>
                            <ul>
                                { this.state.team.members.map((member,i)=>{
                                    if(member.function === 'MANAGER')
                                        return(<li key={i}><a href={'localhost:5000/users/'+member.username} className="no-underline gray">
                                        {member.username}</a></li>)
                                    else
                                        return null;
                                })}
                            </ul>
                        </div>
                        <div className="dt-rows">
                            <h3 className="gray tl tl">Team members</h3>
                            <ul>
                                {this.state.team.members.map((member, i)=>{
                                    if(member.function === 'EDITOR')
                                        return(<li key={i}><a href={'localhost:5000/users/'+member.username} className="no-underline gray">
                                        {member.username}</a></li>)
                                    else
                                        return null;
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            )
            else
                return(<div>Loading ...</div>)
    }
}
