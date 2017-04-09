import { combineReducers } from 'redux';
import rates from './rates';
import errors from './errors';

const mainReducer = combineReducers({
  rates,
  errors
});

export default mainReducer;
