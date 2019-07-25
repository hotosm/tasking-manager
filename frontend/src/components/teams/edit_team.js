import React from 'react';
import { cancelablePromise } from '../../utils/promise';
import { pushToLocalJSONAPI, fetchLocalJSONAPI } from '../../network/genericJSONRequest';
import { Redirect } from '@reach/router';
import * as safeStorage from '../../utils/safe_storage';
import { Button } from '../button';

export class EditTeam extends React.Component {
  tmTeamsPromise;
  constructor(props) {
    super(props);
    this.state = {
      team: [],
      members: [],
      selectedMembers: [],
      name: "",
      organisation: "",
      description: "",
      inviteOnly: false,
      visibility: null,
      teamProjects: [],
      orgProjects: [],
      newProject: null,
      showDeleteTeamModal: false,
      showDeleteUsersModal: false,
      redirectPage: false,
    };
  }

  componentDidMount() {
    console.log(this.props);
    console.log(this.state.isAdmin);
    this.getTeam();
  }

  getTeam = () => {
    this.tmTeamsPromise = cancelablePromise(fetchLocalJSONAPI('team/' + this.props.team_id));
    this.tmTeamsPromise.promise.then(
      r => {
        this.setState({
          team: r,
          name: r.name,
          organisation: r.organisation,
          description: r.description,
          inviteOnly: r.inviteOnly,
          visibility: r.visibility,
          members: r.members,
          orgProjects: r.organisation_projects,
          teamProjects: r.team_projects,
          is_general_admin: r.is_general_admin,
          is_org_admin: r.is_org_admin,
        },()=>{console.log(this.state.team)});
      }
    ).catch(e => console.log(e));
  }

  // Deletion

  // Deletes The team and redirects to the teams page
  handleTeamDeletion = (e) => {
    console.log('Delete team');
    this.setState({ showDeleteTeamModal: false});
    this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/' + this.state.team.teamId, JSON.stringify({}), safeStorage.getItem('token'), 'DELETE'));
    this.tmTeamsPromise.promise.then(
        res => {
        console.log(res);
        this.setState({ redirectPage: true});
        }
        ).catch(e => console.log(e));
  }

  // Delete Multple team members and admins
  deleteMultipleTeamMembers = (e) => {
    console.log(this.state.selectedMembers);
    this.toggleUsersDeletionModal(e);
    let body = { usernames: this.state.selectedMembers, team_id:this.state.team.teamId };
    this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/remove-user', JSON.stringify(body), safeStorage.getItem('token'), 'DELETE'));
    this.tmTeamsPromise.promise.then(
      r => {console.log(r);
        this.getTeam();
      }).catch(e => console.log(e));
  }

  //delete the team-project association
  deleteProject = (e, id) => {
    e.preventDefault();
    let body = { project_id:id, team_id:this.state.team.teamId };
    this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/project', JSON.stringify(body), safeStorage.getItem('token'), 'DELETE'));
    this.tmTeamsPromise.promise.then(
      r => {  this.getTeam();
      }).catch(e => console.log(e));
  }

  // Events
  handleChange = (e) => {
    console.log(e.target.value);
    this.setState({
      [e.target.name]: e.target.value
    })
  }

  handleRoleChange = (e, id) => {
    var newRole = this.state.teamProjects;
    newRole[id].role = e.target.value;
    this.setState({
      teamProjects: newRole
    }, ()=>console.log(this.state.teamProjects))
  }

  handleSave = (e) => {
    e.preventDefault();
    var newTeam = { name: this.state.name, organisation: this.state.organisation, description: this.state.description,
       invite_only: this.state.inviteOnly, visibility: this.state.visibility, members: this.state.members, organisation_id: this.state.team.organisation_id};
    console.log(newTeam);
    this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/' + this.state.team.teamId, JSON.stringify(newTeam), safeStorage.getItem('token'), 'POST'));
    this.tmTeamsPromise.promise.then(
      r => {  this.getTeam();
      }).catch(e => console.log(e));
  }

  handleProjectSave = (e, project_id, role) => {
    e.preventDefault();
    let body = { team_id: this.state.team.teamId, project_id: project_id, role: role};
    this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/project' , JSON.stringify(body), safeStorage.getItem('token'), 'PUT'));
    this.tmTeamsPromise.promise.then(
      r => {  this.getTeam();
      }).catch(e => console.log(e));
  }

  // Add team-project association
  addProject = (e) => {
    if(this.state.newProject!=null){
      e.preventDefault();
      let body = { project_id:this.state.newProject, team_id:this.state.team.teamId };
      this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI('team/project', JSON.stringify(body), safeStorage.getItem('token'), 'POST'));
      this.tmTeamsPromise.promise.then(
        r => {console.log(r);
          this.getTeam();
        }).catch(e => console.log(e));
    }
  }

  // Select multiple members and team admins
  selectUsers = (e) => {
    // console.log(e.target.value);
    if(this.state.selectedMembers.indexOf(e.target.value) > -1){
      console.log("Removing from selected users");
      console.log(e.target.value);
      var tmp = [...this.state.selectedMembers];
      var index = this.state.selectedMembers.indexOf(e.target.value);
      tmp.splice(index, 1);
      this.setState({ selectedMembers: tmp }, ()=>console.log(this.state.selectedMembers));
    }
    else{
      e.persist();
      this.setState(state => ({ selectedMembers: [...state.selectedMembers, e.target.value] }), ()=>console.log(this.state.selectedMembers));
      console.log("Adding in selected users");
      console.log(e.target.value);
    }
  }

  // Modals
  toggleTeamDeletionModal = (e) => {
    e.preventDefault();
    this.setState(state => ({ showDeleteTeamModal: !state.showDeleteTeamModal }));
  }

  toggleUsersDeletionModal = (e) => {
    e.preventDefault();
    this.setState(state => ({ showDeleteUsersModal: !state.showDeleteUsersModal }));
  }

  componentDidCatch = (error, info) => {
      console.log(error);
      console.log(info);
  }

  renderRedirect = () => {
      console.log("Redirect to teams");
      if(this.state.redirectPage)
        return (<Redirect to='/teams' noThrow />);
  }

  render() {
    if(this.state.team.members)
    return(
      <div className="cf pv5 ph5-l ph4 bg-white">
        {this.renderRedirect()}
        <div className="dt-rows">
            <h1 className="gray tl tl">{this.state.team.name}</h1>
        </div>
          <Button onClick={this.toggleTeamDeletionModal} children='Delete' className='delete-team' />
          <div className="dt-rows">
          {/* <main className="pa4 black-80"> */}
              <form className="measure">
                <fieldset id="sign_up" className="ba b--transparent ph0 mh0">
                    <div className="mt3">
                      <label className="db fw6 lh-copy f6">Name</label>
                      <input className="pa2 input-reset ba bg-transparent w-100" value={this.state.name}
                         type="text" name="name" onChange={this.handleChange} />
                    </div>
                    <div className="mt3">
                      <label className="db fw6 lh-copy f6">Organisation</label>
                      <input className="pa2 input-reset ba bg-transparent w-100" value={this.state.organisation} 
                         type="text" name="organisation" onChange={this.handleChange} 
                         disabled={(this.state.is_general_admin) ? false : true }/>
                    </div>
                    <div className="mv3">
                      <label className="db fw6 lh-copy f6">Description</label>
                      <textarea className="b measure-wide pa2-ns input-reset ba bg-transparent w-100" 
                        value={this.state.description} type="text" onChange={this.handleChange} name="description"  id="description" />
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
                    <div className="">
                      <Button onClick={this.handleSave} children='Save' />
                    </div>
                    <div className="mt3">
                      <label className="db fw6 lh-copy f4">Projects</label>
                      <ol>
                        {this.state.teamProjects.map( (project, id)=>{
                          return(
                          <li key={id} className="f5">{project.project_name}
                            <div>
                              Role
                              <select value={project.role} onChange={(e) => this.handleRoleChange(e, id)} name="role">
                              <option value="READ_ONLY">Read Only</option>
                              <option value="MAPPER">Mapper</option>
                              <option value="VALIDATOR">Validator</option>
                              <option value="PROJECT_MANAGER">Project Manager</option>
                              </select>
                              <Button children="save" onClick={(e) => this.handleProjectSave(e, project.project_id, project.role)}/>
                              <Button children="delete" onClick={(e) => this.deleteProject(e, project.project_id)}/>
                            </div>
                          </li>);
                        })}
                      </ol>
                    </div>
                    <div className="mt3">
                      <div>
                        <label className="db fw6 lh-copy f4">Add Project</label>
                        <select onChange={this.handleChange} name="newProject">
                          <option selected disabled>None</option>
                          {this.state.orgProjects.map((project) => {
                            let result = this.state.teamProjects.map(obj => obj.project_id);
                            if(!result.includes(project.project_id))
                              return(
                                <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                              );
                            else
                              return null;
                          })}
                        </select>
                      </div>
                      <Button children="Add" onClick={this.addProject}/>
                    </div>
                </fieldset>
                <div>
                  <h3 className="gray tl">Members</h3>
                  {this.state.members.map((member,i) => {
                    if(member.function === 'EDITOR')
                      return(<div key={i}><input type="checkbox" name="username" value={member.username}
                        onClick={this.selectUsers} />{member.username}
                      </div>);
                    else
                      return null;
                  })}
                </div>
                <div>
                  <h3 className="gray tl">Team Admins</h3>
                  {this.state.members.map((member,i) => {
                    if(member.function === 'MANAGER')
                      return(<div key={i}><input type="checkbox" name="username" value={member.username}
                        onClick={this.selectUsers} 
                        disabled={(this.state.is_general_admin) ? false :
                          (this.state.is_org_admin) ? false : true
                          }/>{member.username}
                      </div>);
                      else
                          return null;
                  })}
                </div>
                <div className="">
                  <Button onClick={this.toggleUsersDeletionModal} children='Delete selected users' />
                </div>
            </form>
          </div>

        {/* Modal for deleting Team */}
        {(this.state.showDeleteTeamModal) ? <DeleteTeamModal handleTeamDeletion={(e)=>this.handleTeamDeletion(e)}
          teamId={this.state.team.teamId} toggleModal={this.toggleTeamDeletionModal}/> : null }

        {/* Modal for deleting users */}
        {(this.state.showDeleteUsersModal) ? <DeleteUsersModal deleteMultipleTeamMembers={(e)=>this.deleteMultipleTeamMembers(e)}
          toggleModal={(e)=>this.toggleUsersDeletionModal(e)}/> : null }
      </div>
    )
    else
        return(<div>Loading ...</div>)
  }
}

export function DeleteTeamModal(props){
  return(
    <div className="aspect-ratio--object pv7">
      <section className="ph3 ph5-ns pv5">
        <article className="mw6 center br2 ba b--light-blue bg-white">
          <div className="dt-ns dt--fixed-ns w-100">
            <div className="dt-rows tc">
              <h2 className="fw4 red mt0 mb3 tc">Delete Team</h2>
            </div>
            <div className="dt-rows">
              <div className="fl w-50 pa5 pa3-ns">
                <Button onClick={props.handleTeamDeletion} className="f6 tc db pv3 bg-red white br2 center" children='Confirm'/>
              </div>
              <div className="fl w-50 pa3 pa3-ns">
                <Button onClick={props.toggleModal} className="f6 tc db pv3 bg-red white br2 center" children='Cancel'/>
              </div>
            </div>
          </div>
        </article>
      </section>
  </div>)
}


export function DeleteUsersModal(props){
  return(
    <div className="fixed aspect-ratio--object pv7">
      <section className="ph3 ph5-ns pv5">
      <article className="mw6 center br2 ba b--light-blue bg-white">
        <div className="dt-ns dt--fixed-ns w-100">
          <div className="dt-rows tc">
            <h2 className="fw4 red mt0 mb3 tc">Delete users from the team</h2>
          </div>
          <div className="dt-rows">
            <div className="fl w-50 pa5 pa3-ns">
              <Button onClick={props.deleteMultipleTeamMembers} className="f6 tc db pv3 bg-red white br2 center" children='Confirm'/>
            </div>
            <div className="fl w-50 pa3 pa3-ns">
              <Button onClick={props.toggleModal} className="f6 tc db pv3 bg-red white br2 center" children='Cancel'/>
            </div>
          </div>
        </div>
      </article>
    </section>
  </div>)
}