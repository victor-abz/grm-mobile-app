import { Map } from 'immutable';
import { createActions, handleActions } from 'redux-actions';

const defaultState = Map({
  userDocument: null,
});

export const { setDocument } = createActions({
  SET_DOCUMENT: (doc) => ({ doc }),
});

const userDocument = handleActions(
  {
    [setDocument]: (draft, { payload: { doc } }) =>
      draft.withMutations((state) => {
        state.set('userDocument', doc);
      }),
  },
  defaultState
);

export default userDocument;
