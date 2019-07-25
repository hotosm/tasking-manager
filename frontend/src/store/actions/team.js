export const types = {
  SET_TEAM_DETAILS: 'SET_TEAM_DETAILS',
};

export function updateTeamDetails(teamDetails) {
  return {
    type: types.SET_TEAM_DETAILS,
    teamDetails: teamDetails
  };
}

export const setTeamDetails= (teamDetails) => (dispatch,getState) => {
    dispatch(updateTeamDetails(teamDetails));
    console.log(getState());
  }

