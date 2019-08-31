import React from 'react';
import { Link, Redirect } from '@reach/router';
import { cancelablePromise } from '../../utils/promise';
import { fetchLocalJSONAPI,
        pushToLocalJSONAPI } from '../../network/genericJSONRequest';
import { Button } from '../button';
import { AreaIcon } from '../svgIcons/area';
import { connect } from "react-redux";

class OrganisationProfile extends React.Component{
    tmTeamsPromise;
    constructor(props) {
        super(props);
        this.state = {
            org: [],
            orgNotFound: null,
            renderRedirect: null,
            hasError: false,
        };
      }

    componentDidMount = () => {
        this.getOrg();
        console.log(this.props);
    }

    getOrg = () => {
        this.tmTeamsPromise = cancelablePromise(fetchLocalJSONAPI(`organisations/${this.props.org_id}`, this.props.token));
        this.tmTeamsPromise.promise.then(
        r => {
            console.log(r);
            this.setState({
            org: r
            });
        }).catch(e => {
            console.log(typeof(e));
            this.setState({orgNotFound:true});
            });
    }

    deleteOrg = () => {
        let body = {};
        this.tmTeamsPromise = cancelablePromise(pushToLocalJSONAPI(`organisations/${this.props.org_id}`, JSON.stringify(body),
        this.props.token, 'DELETE'));
        this.tmTeamsPromise.promise.then(
            res => {
                this.setState({ renderRedirect: true, });
                }).catch(e => console.log(e));
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        this.setState({ hasError: true });
    }
        
    renderRedirect = () => {
        if(this.state.renderRedirect)
            return(<Redirect to='/organisations' noThrow />);
    }

    render(){
            if (this.state.hasError) {
            return <h1>Something went wrong.</h1>;
            }
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
                        
                        {(this.state.org.visibility !== 'PRIVATE') ?
                            <div className="dt-rows">
                                <h3 className="gray tl tl">Organisation admins</h3>
                                <ol>
                                    { this.state.org.admins.map((admin,i)=>{
                                            return(<Link key={i} to={'/users/'+admin} className="b no-underline gray">
                                            <li >{admin}</li></Link>)
                                    })}
                                </ol>
                            </div>
                        : null }
                        <div className="dt-rows">
                            {(this.state.org.isAdmin) ?
                                <Button>
                                    <Link to='/projects/create' className="no-underline gray">Create Project</Link>
                                </Button> : null}
                            <h3 className="gray tl tl">Projects</h3>
                            <ol>
                                { this.state.org.projects.map((project, i)=>{
                                        return(<Link key={i} to={"/projects/" + project[0]} className="b no-underline gray" ><li >{project[1]}</li></Link>)
                                })}
                            </ol>
                        </div>
                        <div className="dt-rows">
                            {(this.state.org.isAdmin) ?
                                <Button>
                                    <Link to='/teams/create' className="no-underline gray">Create Team</Link>
                                </Button> : null}
                            <h3 className="gray tl tl">Teams</h3>
                            <ol>
                                { this.state.org.teams.map((team, i)=>{
                                        return(<Link key={i} to={"/teams/" + team[0]} className="b no-underline gray"><li key={i}>{team[1]}</li></Link>)
                                })}
                            </ol>
                        </div>
                    </div>
                </div>
            )
            else if(this.state.orgNotFound){
                return(<div>Not found</div>)
            }
            else
                return(<div>Loading ...</div>)
    }
}

const mapStateToProps = state => ({
    username: state.auth.getIn(['userDetails', 'username']),
    token: state.auth.get('token'),
  });
  
OrganisationProfile = connect(mapStateToProps)(OrganisationProfile);
  
  export { OrganisationProfile };

