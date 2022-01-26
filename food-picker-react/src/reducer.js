import * as actions from './actions';

const initialState = {

}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_USER:
      return { ...state, user: action.payload.user };
    default:
      return state;
  }
}