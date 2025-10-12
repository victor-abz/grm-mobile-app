import { combineReducers } from 'redux-immutable';
import userDocument from './userDocument.duck';

const reducers = combineReducers({ userDocument });

export default reducers;
