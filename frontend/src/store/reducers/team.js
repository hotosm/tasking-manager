import { Map } from 'immutable';

import { types } from '../actions/team';


const initialState = Map({
  teamDetails: {},
});

export function teamReducer (state = initialState, action) {
  switch (action.type) {
    case types.SET_TEAM_DETAILS: {
      return [action.teamDetails];
    }
    default:
      return state;
  }
}
