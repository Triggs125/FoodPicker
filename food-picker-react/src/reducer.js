import * as actions from './actions';

const initialState = {
  lastPage: ["/"]
}

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actions.SET_USER:
      return { ...state, user: action.payload.user };
    case actions.SET_HEADER_TITLE:
      return { ...state, headerTitle: action.payload.headerTitle };
    case actions.PUSH_LAST_PAGE:
      if (state.lastPage[state.lastPage.length - 1] !== action.payload.lastPage) {
        state.lastPage.push(action.payload.lastPage)
      }
      state.lastPage = state.lastPage.filter((page) => !state.lastPage.includes(page));
      return { ...state };
    case actions.REMOVE_LAST_PAGE:
      state.lastPage.length > 1 ?? state.lastPage.pop();
      return { ...state };
    default:
      return state;
  }
}