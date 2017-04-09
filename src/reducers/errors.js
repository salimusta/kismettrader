import { } from 'lodash';

const rates = (state = [], action) => {
  switch (action.type) {
    case 'RESET_ERRORS':
      return {
        ...state,
        sellError: null,
        buyError: null
      };
    case 'ERROR_SELL_REAL_COIN':
      return {
        ...state,
        sellError: action.message
      };
    case 'ERROR_BUY_REAL_COIN':
      return {
        ...state,
        buyError: action.message
      };
    default:
      return state;
  }
};

export default rates;
