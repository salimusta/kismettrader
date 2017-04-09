import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import mainReducer from './reducers';
import App from './App';
import Page2 from './Page2';
import './index.css';
import { Router, Route, browserHistory } from 'react-router';

window.outputCsv = '';
window.REAL = true;

window.SELLAT = 2;
window.SELLLIMIT = -20;
window.BUYAT = 0;
window.BUYWHEN = 0.5;
window.AMOUNT = 0.1;
window.LOWHIGH = 5;

window.DISPLAYGRAPH = false;
window.initialMoney = 0.03491153;

const persistedState = {
  rates: {
    mockBalances: {
      BTC: {
        amount: Number(window.initialMoney),
        initialPrice: 1000
      }
    },
    variationList: [],
    sellPrices : {},
    buyPrices: {},
    difPrices: {},
    priceLowHigh24h :{},
    change24h: {}
  },
  errors: {
  }
};

const store = createStore(
  mainReducer,
  persistedState,
  applyMiddleware(thunk)
);
window.store = store;
//Create Initial State


ReactDOM.render(
  <Provider store={ store }>
    <Router history={ browserHistory }>
      <Route path="/" component={ App } />
      <Route path="/page2" component={ Page2 } />
    </Router>
  </Provider>,
  document.getElementById('root')
);
