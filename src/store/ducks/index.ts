import { combineReducers } from "redux-immutable";
import authentication from "./authentication.duck";
import global from "./global.duck";
import userDocument from "./userDocument.duck";

const reducers = combineReducers({ authentication, userDocument, global });

export default reducers;
