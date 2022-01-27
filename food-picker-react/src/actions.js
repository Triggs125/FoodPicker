export const SET_USER = 'SET_USER';
export const SET_HEADER_TITLE = 'SET_HEADER_TITLE';
export const PUSH_LAST_PAGE = 'PUSH_LAST_PAGE';
export const REMOVE_LAST_PAGE = 'REMOVE_LAST_PAGE';

export const setUser = user => {
  return ({
    type: SET_USER,
    payload: { user }
  });
}

export const setHeaderTitle = headerTitle => {
  return ({
    type: SET_HEADER_TITLE,
    payload: { headerTitle }
  })
}

export const pushLastPage = lastPage => {
  return ({
    type: PUSH_LAST_PAGE,
    payload: { lastPage }
  })
}

export const removeLastPage = () => {
  return ({
    type: REMOVE_LAST_PAGE,
  })
}