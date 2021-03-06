const agent = require('superagent-promise')(require('superagent'), Promise);
const nonce = require('nonce')();
const crypto  = require('crypto');

import { data } from '../allData';
window.index = 0;

console.log(data.length)
import { secret, apiKey } from '../config/config'

export const REQUEST_BTC_RATES = 'REQUEST_BTC_RATES';
export const RECEIVE_BTC_RATES = 'RECEIVE_BTC_RATES';

export const REQUEST_ACCOUNT_BALANCES = 'REQUEST_ACCOUNT_BALANCES';
export const RECEIVE_ACCOUNT_BALANCES = 'RECEIVE_ACCOUNT_BALANCES';

export const REQUEST_TICKER = 'REQUEST_TICKER';
export const RECEIVE_TICKER = 'RECEIVE_TICKER';

export const BUY_COIN = 'BUY_COIN';
export const SELL_COIN = 'SELL_COIN';

export const REQUEST_BUY_REAL_COIN = 'REQUEST_BUY_REAL_COIN';
export const RECEIVE_BUY_REAL_COIN = 'RECEIVE_BUY_REAL_COIN';
export const ERROR_BUY_REAL_COIN = 'ERROR_BUY_REAL_COIN';

export const REQUEST_SELL_REAL_COIN = 'REQUEST_SELL_REAL_COIN';
export const RECEIVE_SELL_REAL_COIN = 'RECEIVE_SELL_REAL_COIN';
export const ERROR_SELL_REAL_COIN = 'ERROR_SELL_REAL_COIN';

export const REQUEST_TRADING_HISTORY = 'REQUEST_TRADING_HISTORY';
export const RECEIVE_TRADING_HISTORY = 'RECEIVE_TRADING_HISTORY';
export const ERROR_TRADING_HISTORY = 'ERROR_TRADING_HISTORY';

export const SELL_ALL_COIN = 'SELL_ALL_COIN';
export const BUY_ALL_COIN = 'BUY_ALL_COIN';

export const RESET_ERRORS = 'RESET_ERRORS';

export function simulateTick() {
  if (window.index >= data.length) {
    return {
      type: RECEIVE_TICKER,
      data: null
    };
  }
  const jsonData = {

  }
  for(const coin in data[window.index]) {
    jsonData[coin] = {
      lowestAsk: data[window.index][coin][0],
      highestBid: data[window.index][coin][1]
    }
  }
  window.index ++ ;
  return {
    type: RECEIVE_TICKER,
    data: jsonData
  };
}

export function resetErrors() {
  return {
    type: RESET_ERRORS
  };
}

export function buyAll() {
  return {
    type: BUY_ALL_COIN
  };
}
export function sellAll() {
  return {
    type: SELL_ALL_COIN
  };
}
export function buyCoin(coin) {
  return {
    type: BUY_COIN,
    coin
  };
}

export function sellCoin(coin) {
  return {
    type: SELL_COIN,
    coin
  };
}

export function getBtcRates() {
  return dispatch => {
    agent.get('https://api.coinbase.com/v2/prices/ETH-USD/buy')
      .then(json => dispatch(receiveBtcRates(json)));
    return {
      type: REQUEST_BTC_RATES
    };
  };
}

export function receiveBtcRates(jsonData) {
  return {
    type: RECEIVE_BTC_RATES,
    rates: jsonData.body
  };
}


//RETURN TICKER POLONIEX
export function returnTicker() {
  return dispatch => {
    agent.get('https://poloniex.com/public?command=returnTicker')
      .then(json => dispatch(receiveTicker(json)));
    return {
      type: REQUEST_TICKER
    };
  };
}

export function receiveTicker(jsonData) {
  return {
    type: RECEIVE_TICKER,
    data: jsonData.body
  };
}


//GET ACCOUNT BALANCES----------------------------------------
export function accountBalances() {
  return dispatch => {
    const postData = {
      command: 'returnCompleteBalances',
      nonce: nonce(16)
    };
    const paramString = Object.keys(postData).map(function(param) {
      return encodeURIComponent(param) + '=' + encodeURIComponent(postData[param]);
    }).join('&');
    const signature = crypto.createHmac('sha512', secret).update(paramString).digest('hex');
    agent.post('https://poloniex.com/tradingApi', postData).set('Key', apiKey).set('Sign', signature).set('Content-Type', 'application/x-www-form-urlencoded')
      .then(accountData => dispatch(tradingHistory(accountData.body)));
    return {
      type: REQUEST_ACCOUNT_BALANCES
    };
  };
}

//GET TRADING HISTORY----------------------------------------
export function tradingHistory(accountData) {
  return dispatch => {
    const postData = {
      command: 'returnTradeHistory',
      nonce: nonce(16),
      currencyPair: 'all',
      start: '1491004800'
    };
    const paramString = Object.keys(postData).map(function(param) {
      return encodeURIComponent(param) + '=' + encodeURIComponent(postData[param]);
    }).join('&');
    const signature = crypto.createHmac('sha512', secret).update(paramString).digest('hex');
    agent.post('https://poloniex.com/tradingApi', postData).set('Key', apiKey).set('Sign', signature).set('Content-Type', 'application/x-www-form-urlencoded')
      .then(json => dispatch(receiveTradingHistory(accountData, json.body)));
    return {
      type: REQUEST_TRADING_HISTORY
    };
  };
}

export function receiveTradingHistory(accountData, jsonData) {
  return {
    type: RECEIVE_TRADING_HISTORY,
    trades: jsonData,
    balances: accountData
  };
}

//BUY---------------------------------------------------------
export function buyForReal(coin, rate, amount) {
  console.log("buyForReal", coin, rate, amount)
  return dispatch => {
    const postData = {
      command: 'buy',
      nonce: nonce(16),
      currencyPair: 'BTC_' + coin,
      rate,
      amount,
      fillOrKill: 1
    };
    const paramString = Object.keys(postData).map(function(param) {
      return encodeURIComponent(param) + '=' + encodeURIComponent(postData[param]);
    }).join('&');
    const signature = crypto.createHmac('sha512', secret).update(paramString).digest('hex');
    agent.post('https://poloniex.com/tradingApi', postData).set('Key', apiKey).set('Sign', signature).set('Content-Type', 'application/x-www-form-urlencoded')
      .then(json => dispatch(receiveBuyReal(json)))
      .catch(err => dispatch(errorBuyReal(err)));
    return {
      type: REQUEST_BUY_REAL_COIN
    };
  };
}

export function receiveBuyReal(jsonData) {
  return {
    type: RECEIVE_BUY_REAL_COIN
  };
}

export function errorBuyReal(jsonData) {
  return {
    type: ERROR_BUY_REAL_COIN,
    message: 'ERROR WHEN BUYING COIN AMOUNT'
  };
}

//SELL---------------------------------------------------------
export function sellForReal(coin, rate, amount) {
  console.log("sellForReal", coin, rate, amount)
  return dispatch => {
    const postData = {
      command: 'sell',
      nonce: nonce(16),
      currencyPair: 'BTC_' + coin,
      rate,
      amount,
      fillOrKill: 1
    };
    const paramString = Object.keys(postData).map(function(param) {
      return encodeURIComponent(param) + '=' + encodeURIComponent(postData[param]);
    }).join('&');
    const signature = crypto.createHmac('sha512', secret).update(paramString).digest('hex');
    agent.post('https://poloniex.com/tradingApi', postData).set('Key', apiKey).set('Sign', signature).set('Content-Type', 'application/x-www-form-urlencoded')
      .then(json => dispatch(receiveSellReal(json)))
      .catch(err => dispatch(errorSellReal(err)));
    return {
      type: REQUEST_SELL_REAL_COIN
    };
  };
}

export function receiveSellReal(jsonData) {
  return {
    type: RECEIVE_SELL_REAL_COIN
  };
}

export function errorSellReal(err) {
  return {
    type: ERROR_SELL_REAL_COIN,
    message: 'ERROR WHEN SELLING COIN AMOUNT'
  };
}
