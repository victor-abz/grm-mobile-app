import { Map } from "immutable";
import * as reduxActions from "redux-actions";

const defaultState = Map({
  globalLoading: false,
});

export const { setGlobalLoading } = reduxActions.createActions({
  SET_GLOBAL_LOADING: (globalLoading: boolean) => {
    return {
      globalLoading
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
  },
  defaultState
);

export default global;