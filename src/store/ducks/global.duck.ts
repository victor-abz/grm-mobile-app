import { Map } from "immutable";
import * as reduxActions from "redux-actions";

const defaultState = Map({
  globalLoading: false,
  newCommentsFlag: false,
});

export const { setGlobalLoading, setNewCommentsFlag } = reduxActions.createActions({
  SET_GLOBAL_LOADING: (globalLoading: boolean) => {
    return {
      globalLoading
    };
  },

  SET_NEW_COMMENTS_FLAG: (newCommentsFlag: boolean) => {
    return {
      newCommentsFlag
    };
  },
});

const global = reduxActions.handleActions(
  {
    [setGlobalLoading]: (draft, { payload: { globalLoading } }) => {
      return draft.withMutations((state) => {
        state.set('globalLoading', globalLoading);
      });
    },
    [setNewCommentsFlag]: (draft, { payload: { newCommentsFlag } }) => {
      return draft.withMutations((state) => {
        state.set('newCommentsFlag', newCommentsFlag);
      });
    },
  },
  defaultState
);

export default global;