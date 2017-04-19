import { sum, isEmpty, sortBy } from 'lodash';


function sellCoin(balances, coin, sellPrice, mock) {
  const mockBalances = balances;
  const amount = mockBalances[coin].amount;
  const btcAmount = (amount * sellPrice) * (1 - 0.0025);
  const btcUsed = mockBalances[coin].btcUsed;
  const variation = Math.round(((btcAmount / btcUsed) - 1) * 10000) / 100;
  console.log(mock+" Sell Coin "+coin+" @ " + sellPrice+" amount:"+amount+" BTC amount"+btcAmount+" Variation:"+variation+" Tick:"+window.tickCount)

  window.TRADES += 'SELL;';
  window.TRADES += coin+';';
  window.TRADES += amount+';';
  window.TRADES += mockBalances[coin].initialPrice+';';
  window.TRADES += sellPrice+';';
  window.TRADES += variation+';'+mock+';'+window.tickCount+'\n';

  mockBalances[coin].amount = 0;
  mockBalances[coin].initialPrice = null;
  mockBalances[coin].btcUsed = 0;
  mockBalances.BTC.amount += btcAmount;
  mockBalances[coin].tick = window.tickCount;
  return mockBalances;
}

function buyCoin(balances, coin, amount, purchasePrice, mock) {
  const mockBalances = balances;

  const coinAmount = (amount / purchasePrice) * (1 - 0.0025);
  console.log(mock+" Buy Coin "+coin+" @ " + purchasePrice+" amount:"+coinAmount+" BTC amount"+amount+" Tick:"+window.tickCount)

  window.TRADES += 'BUY;';
  window.TRADES += coin+';';
  window.TRADES += coinAmount+';';
  window.TRADES += purchasePrice+';';
  window.TRADES += '--;';
  window.TRADES += '--;'+mock+';'+window.tickCount+'\n';


  if (isEmpty(mockBalances[coin])) {
    mockBalances[coin] = {
      amount: 0,
      btcUsed: 0
    };
  }
  mockBalances[coin].amount += coinAmount;
  mockBalances[coin].initialPrice = purchasePrice;
  mockBalances[coin].btcUsed += amount;
  mockBalances[coin].tick = window.tickCount;
  mockBalances[coin].maxVariation = 0;

  //Retrieve BTC Values
  mockBalances.BTC.amount -= amount;
  return mockBalances;
}
const rates = (state = [], action) => {
  switch (action.type) {
    case 'BUY_ALL_COIN':
      let mockBalances = state.mockBalances;
      for (const coin in state.buyPrices) {
        mockBalances[0] = buyCoin(mockBalances[0], coin, 0.0004, state.buyPrices[coin].Value);
      }
      return {
        ...state,
        mockBalances
      };
    case 'SELL_ALL_COIN':
      mockBalances = state.mockBalances;
      for (const coin in state.sellPrices) {
        mockBalances[0] = sellCoin(mockBalances[0], coin, state.sellPrices[coin].Value);
      }
      return {
        ...state,
        mockBalances
      };
    case 'SELL_COIN':
      mockBalances[0] = sellCoin(state.mockBalances[0], action.coin, state.sellPrices[action.coin].Value);
      return {
        ...state,
        mockBalances
      };
    case 'BUY_COIN':
      mockBalances[0] = buyCoin(state.mockBalances[0], action.coin, 0.01, state.buyPrices[action.coin].Value);
      return {
        ...state,
        mockBalances
      };
    case 'RECEIVE_ACCOUNT_BALANCES':
      return {
        ...state,
        balances: action.balances
      };
    case 'RECEIVE_TICKER':
      if (action.data === null) {
        return {
          ...state
        }
      }

      window.tickCount++;
      let variationBtc = 0;
      let variationGlobal = 0;
      const data = action.data;

      const sellPrices = state.sellPrices;
      const buyPrices = state.buyPrices;
      const difPrices = state.difPrices;
      let difPricesTotal = 0;
      let variationPurchasePrices = 0;
      let variationSellPrices = 0;
      const change24h = {};
      mockBalances = state.mockBalances;
      let balances = state.balances;

      window.DATA += '{'
      var first = true;
      for (const altCoin in data) {
        //Bitcoin market
        if (altCoin.indexOf('BTC_') >= 0) {
          const coinName = altCoin.substring(4, 10)

          change24h[coinName] = Math.round(data[altCoin].percentChange * 10000) / 100;

          variationBtc += Number(data[altCoin].percentChange);

          const purchasePrice = Number(data[altCoin].lowestAsk);
          const sellPrice = Number(data[altCoin].highestBid);

          if(!first) {
            window.DATA +=',\n';
          }
          window.DATA += altCoin+':['+purchasePrice+','+sellPrice+']'

          first = false

          if (sellPrice > 0) {
            if (isEmpty(sellPrices[coinName])) {
              sellPrices[coinName] = {};
              buyPrices[coinName] = {};
              difPrices[coinName] = {};
              sellPrices[coinName].Values20 = [];
              buyPrices[coinName].Values20 = [];
              sellPrices[coinName].Values40 = [];
              buyPrices[coinName].Values40 = [];
              sellPrices[coinName].Values100 = [];
              buyPrices[coinName].Values100 = [];
              sellPrices[coinName].Smooths20 = [];
              buyPrices[coinName].Smooths20 = [];
              sellPrices[coinName].Smooths40 = [];
              buyPrices[coinName].Smooths40 = [];
              sellPrices[coinName].Smooths100 = [];
              buyPrices[coinName].Smooths100 = [];

              sellPrices[coinName].minEvolution100 = 0;
              buyPrices[coinName].maxEvolution100 = 0;
              sellPrices[coinName].minEvolution40 = 0;
              buyPrices[coinName].maxEvolution40 = 0;
            }
            sellPrices[coinName].Value = sellPrice;
            buyPrices[coinName].Value = purchasePrice;
            difPrices[coinName].Value = Math.round(((sellPrices[coinName].Value / buyPrices[coinName].Value) - 1) * 10000) / 100 ;
            difPricesTotal += difPrices[coinName].Value;



            //Store Value for evolution
            const length20 = sellPrices[coinName].Values20.length;
            const length40 = sellPrices[coinName].Values40.length;
            const length100 = sellPrices[coinName].Values100.length;
            if (length20 === 20) {
              sellPrices[coinName].Values20.shift();
              buyPrices[coinName].Values20.shift();
            }
            if (length40 === 40) {
              sellPrices[coinName].Values40.shift();
              buyPrices[coinName].Values40.shift();
            }
            if (length100 === 100) {
              sellPrices[coinName].Values100.shift();
              buyPrices[coinName].Values100.shift();
            }
            sellPrices[coinName].Values20.push(sellPrices[coinName].Value);
            buyPrices[coinName].Values20.push(buyPrices[coinName].Value);
            sellPrices[coinName].Values40.push(sellPrices[coinName].Value);
            buyPrices[coinName].Values40.push(buyPrices[coinName].Value);
            sellPrices[coinName].Values100.push(sellPrices[coinName].Value);
            buyPrices[coinName].Values100.push(buyPrices[coinName].Value);

            //Calculate smooth curves
            sellPrices[coinName].Smooth20 = sum(sellPrices[coinName].Values20) / sellPrices[coinName].Values20.length;
            buyPrices[coinName].Smooth20 = sum(buyPrices[coinName].Values20) / buyPrices[coinName].Values20.length;
            sellPrices[coinName].Smooth40 = sum(sellPrices[coinName].Values40) / sellPrices[coinName].Values40.length;
            buyPrices[coinName].Smooth40 = sum(buyPrices[coinName].Values40) / buyPrices[coinName].Values40.length;
            sellPrices[coinName].Smooth100 = sum(sellPrices[coinName].Values100) / sellPrices[coinName].Values100.length;
            buyPrices[coinName].Smooth100 = sum(buyPrices[coinName].Values100) / buyPrices[coinName].Values100.length;

            const lengthSmooths20 = sellPrices[coinName].Smooths20.length;
            const lengthSmooths40 = sellPrices[coinName].Smooths40.length;
            const lengthSmooths100 = sellPrices[coinName].Smooths100.length;
            if (lengthSmooths20 === 60) {
              sellPrices[coinName].Smooths20.shift();
              buyPrices[coinName].Smooths20.shift();
            }
            if (lengthSmooths40 === 60) {
              sellPrices[coinName].Smooths40.shift();
              buyPrices[coinName].Smooths40.shift();
            }
            if (lengthSmooths100 === 60) {
              sellPrices[coinName].Smooths100.shift();
              buyPrices[coinName].Smooths100.shift();
            }
            sellPrices[coinName].Smooths20.push(sellPrices[coinName].Smooth20);
            buyPrices[coinName].Smooths20.push(buyPrices[coinName].Smooth20);
            sellPrices[coinName].Smooths40.push(sellPrices[coinName].Smooth40);
            buyPrices[coinName].Smooths40.push(buyPrices[coinName].Smooth40);
            sellPrices[coinName].Smooths100.push(sellPrices[coinName].Smooth100);
            buyPrices[coinName].Smooths100.push(buyPrices[coinName].Smooth100);

            //Calculate Evolutions
            sellPrices[coinName].Evolution20 = buyPrices[coinName].Evolution20 = 0;
            sellPrices[coinName].Evolution40 = buyPrices[coinName].Evolution40 = 0;
            sellPrices[coinName].Evolution100 = buyPrices[coinName].Evolution100 = 0;
            if (length20 === 20 && lengthSmooths20 === 60) {
              sellPrices[coinName].Evolution20 = sellPrices[coinName].Smooths20[59] - sellPrices[coinName].Smooths20[0];
              buyPrices[coinName].Evolution20 = buyPrices[coinName].Smooths20[59] - buyPrices[coinName].Smooths20[0];
            }
            if (length40 === 40 && lengthSmooths40 === 60) {
              sellPrices[coinName].Evolution40 = sellPrices[coinName].Smooths40[59] - sellPrices[coinName].Smooths40[0];
              buyPrices[coinName].Evolution40 = buyPrices[coinName].Smooths40[59] - buyPrices[coinName].Smooths40[0];
            }
            if (length100 === 100 && lengthSmooths100 === 60) {
              sellPrices[coinName].Evolution100 = sellPrices[coinName].Smooths100[59] - sellPrices[coinName].Smooths100[0];
              buyPrices[coinName].Evolution100 = buyPrices[coinName].Smooths100[59] - buyPrices[coinName].Smooths100[0];

              //buyPrices[coinName].maxEvolution100 = buyPrices[coinName].maxEvolution100*0.999;
              //sellPrices[coinName].minEvolution100 = sellPrices[coinName].minEvolution100*0.999;
              if (window.tickCount > 100 && window.tickCount < 200) {
                buyPrices[coinName].maxEvolution100 = Math.max(buyPrices[coinName].Evolution100, buyPrices[coinName].maxEvolution100);
                sellPrices[coinName].minEvolution100 = Math.min(sellPrices[coinName].Evolution100, sellPrices[coinName].minEvolution100);
              }

              if (window.tickCount > 50 && window.tickCount < 150) {
                buyPrices[coinName].maxEvolution40 = Math.max(buyPrices[coinName].Evolution40, buyPrices[coinName].maxEvolution40);
                sellPrices[coinName].minEvolution40 = Math.min(sellPrices[coinName].Evolution40, sellPrices[coinName].minEvolution40);
              }

            }

            //variationPurchasePrices += buyPrices[coinName].Evolution20;
            //variationSellPrices += sellPrices[coinName].Evolution20;

            //SHOULD WE BUY ????
            /*
            const evolutionCondition = buyPrices[coinName].Evolution > window.BUYAT;
            const wasCrashinghard = buyPrices[coinName].wasCrashinghard;
            const crashinghard = buyPrices[coinName].Evolution < -0.5 || (wasCrashinghard && buyPrices[coinName].Evolution <= 0);
            const pricePositionCondition = Math.abs(minPurchasePrice24h - purchasePrice) < (Math.abs(maxSellPrice24h - minPurchasePrice24h) * window.BUYWHEN);
            const alreadyPurchasedCondition = mockBalances[coinName] ? mockBalances[coinName].amount > 0 : false;
            const sellingPriceGoingCrazy = sellPrices[coinName].Variation > 2;
            const difPriceCondition = difPrices[coinName].Value < 1;

            const btcUseAmount = mockBalances.BTC.amount > 0.01 ? mockBalances.BTC.amount / 10 : mockBalances.BTC.amount;
            if (sellingPriceGoingCrazy || (difPriceCondition && !alreadyPurchasedCondition && lowHigh24h > window.LOWHIGH &&  pricePositionCondition && evolutionCondition && !crashinghard && wasCrashinghard)) {
              if (btcUseAmount > 0) {
                mockBalances = buyCoin(mockBalances, coinName, btcUseAmount, buyPrices[coinName].Value);
              }
            }
            buyPrices[coinName].wasCrashinghard = crashinghard;
            */

            //Add minimum Price


            buyPrices[coinName].coefUp = [];
            sellPrices[coinName].coefDown = [];
            let usedMock = 0;
            let limitUp = 1.01;
            let coefUp = (buyPrices[coinName].Value * limitUp) - buyPrices[coinName].Value;
            let coefDown = (sellPrices[coinName].Value * 0.995) - sellPrices[coinName].Value;

            buyPrices[coinName].coefUp[usedMock] = coefUp;
            sellPrices[coinName].coefDown[usedMock] = coefDown;

            let alreadyPurchased = mockBalances[usedMock][coinName] ? mockBalances[usedMock][coinName].amount > 0 : false;
            let btcUseAmount = mockBalances[usedMock].BTC.amount > 0.005 ? mockBalances[usedMock].BTC.amount / 5 : mockBalances[usedMock].BTC.amount;

            if (window.tickCount > 100 && sellPrices[coinName].Evolution100 > 0 && buyPrices[coinName].Evolution100 > coefUp && !alreadyPurchased) {
              if (btcUseAmount > 0) {
                mockBalances[usedMock] = buyCoin(mockBalances[usedMock], coinName, btcUseAmount, buyPrices[coinName].Value, usedMock);
              }
            }


            usedMock = 1;
            limitUp = 1.02;
            coefUp = (buyPrices[coinName].Value * limitUp) - buyPrices[coinName].Value;
            coefDown = (sellPrices[coinName].Value * 0.995) - sellPrices[coinName].Value;
            buyPrices[coinName].coefUp[usedMock] = coefUp;
            sellPrices[coinName].coefDown[usedMock] = coefDown;
            alreadyPurchased = mockBalances[usedMock][coinName] ? mockBalances[usedMock][coinName].amount > 0 : false;
            btcUseAmount = mockBalances[usedMock].BTC.amount > 0.005 ? mockBalances[usedMock].BTC.amount / 5 : mockBalances[usedMock].BTC.amount;
            if (window.tickCount > 100 && sellPrices[coinName].Evolution100 > 0 && buyPrices[coinName].Evolution100 > coefUp && !alreadyPurchased) {
              if (btcUseAmount > 0) {
                mockBalances[usedMock] = buyCoin(mockBalances[usedMock], coinName, btcUseAmount, buyPrices[coinName].Value, usedMock);
              }
            }

            usedMock = 2;
            limitUp = 1.04;
            coefUp = (buyPrices[coinName].Value * limitUp) - buyPrices[coinName].Value;
            coefDown = (sellPrices[coinName].Value * 0.99) - sellPrices[coinName].Value;
            buyPrices[coinName].coefUp[usedMock] = coefUp;
            sellPrices[coinName].coefDown[usedMock] = coefDown;
            alreadyPurchased = mockBalances[usedMock][coinName] ? mockBalances[usedMock][coinName].amount > 0 : false;
            btcUseAmount = mockBalances[usedMock].BTC.amount > 0.005 ? mockBalances[usedMock].BTC.amount / 5 : mockBalances[usedMock].BTC.amount;
            if (window.tickCount > 100 && sellPrices[coinName].Evolution100 > 0 && buyPrices[coinName].Evolution100 > coefUp && !alreadyPurchased) {
              if (btcUseAmount > 0) {
                mockBalances[usedMock] = buyCoin(mockBalances[usedMock], coinName, btcUseAmount, buyPrices[coinName].Value, usedMock);
              }
            }

            usedMock = 3;
            limitUp = 1.01;
            coefUp = (buyPrices[coinName].Value * limitUp) - buyPrices[coinName].Value;
            coefDown = (sellPrices[coinName].Value * 0.995) - sellPrices[coinName].Value;
            buyPrices[coinName].coefUp[usedMock] = coefUp;
            sellPrices[coinName].coefDown[usedMock] = coefDown;
            alreadyPurchased = mockBalances[usedMock][coinName] ? mockBalances[usedMock][coinName].amount > 0 : false;
            btcUseAmount = mockBalances[usedMock].BTC.amount > 0.005 ? mockBalances[usedMock].BTC.amount / 5 : mockBalances[usedMock].BTC.amount;
            if (window.tickCount > 100 && sellPrices[coinName].Evolution40 > 0 && buyPrices[coinName].Evolution40 > coefUp && !alreadyPurchased) {
              if (btcUseAmount > 0) {
                mockBalances[usedMock] = buyCoin(mockBalances[usedMock], coinName, btcUseAmount, buyPrices[coinName].Value, usedMock);
              }
            }

            usedMock = 4;
            limitUp = 1.02;
            coefUp = (buyPrices[coinName].Value * limitUp) - buyPrices[coinName].Value;
            coefDown = (sellPrices[coinName].Value * 0.995) - sellPrices[coinName].Value;
            buyPrices[coinName].coefUp[usedMock] = coefUp;
            sellPrices[coinName].coefDown[usedMock] = coefDown;
            alreadyPurchased = mockBalances[usedMock][coinName] ? mockBalances[usedMock][coinName].amount > 0 : false;
            btcUseAmount = mockBalances[usedMock].BTC.amount > 0.005 ? mockBalances[usedMock].BTC.amount / 5 : mockBalances[usedMock].BTC.amount;
            if (window.tickCount > 100 && sellPrices[coinName].Evolution40 > 0 && buyPrices[coinName].Evolution40 > coefUp && !alreadyPurchased) {
              if (btcUseAmount > 0) {
                mockBalances[usedMock] = buyCoin(mockBalances[usedMock], coinName, btcUseAmount, buyPrices[coinName].Value, usedMock);
              }
            }

            /*usedMock = 3;
            coefUp = buyPrices[coinName].maxEvolution100 * 2;
            coefDown = sellPrices[coinName].minEvolution100;
            buyPrices[coinName].coefUp[usedMock] = coefUp;
            sellPrices[coinName].coefDown[usedMock] = coefDown;
            alreadyPurchased = mockBalances[usedMock][coinName] ? mockBalances[usedMock][coinName].amount > 0 : false;
            btcUseAmount = mockBalances[usedMock].BTC.amount > 0.005 ? mockBalances[usedMock].BTC.amount / 5 : mockBalances[usedMock].BTC.amount;
            if (window.tickCount > 200 && sellPrices[coinName].Evolution100 > 0 && buyPrices[coinName].Evolution100 > coefUp && !alreadyPurchased) {
              if (btcUseAmount > 0) {
                mockBalances[usedMock] = buyCoin(mockBalances[usedMock], coinName, btcUseAmount, buyPrices[coinName].Value, usedMock);
              }
            }

            usedMock = 4;
            coefUp = buyPrices[coinName].maxEvolution100 * 3;
            coefDown = sellPrices[coinName].minEvolution100*2;
            buyPrices[coinName].coefUp[usedMock] = coefUp;
            sellPrices[coinName].coefDown[usedMock] = coefDown;
            alreadyPurchased = mockBalances[usedMock][coinName] ? mockBalances[usedMock][coinName].amount > 0 : false;
            btcUseAmount = mockBalances[usedMock].BTC.amount > 0.005 ? mockBalances[usedMock].BTC.amount / 5 : mockBalances[usedMock].BTC.amount;
            if (window.tickCount > 200 && sellPrices[coinName].Evolution100 > 0 && buyPrices[coinName].Evolution100 > coefUp && !alreadyPurchased) {
              if (btcUseAmount > 0) {
                mockBalances[usedMock] = buyCoin(mockBalances[usedMock], coinName, btcUseAmount, buyPrices[coinName].Value, usedMock);
              }
            }*/
          }
        }
      }

      window.DATA += '},'
      let nbTrades = state.nbTrades;
      //Should we sell?
      /*
      for (const coinName in mockBalances) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const amount = mockBalances[coinName].amount;
          const variation = mockBalances[coinName].variation;
          const sellPrice = sellPrices[coinName].Value;
          const previousVariation = mockBalances[coinName].previousVariation;

          if (amount > 0 && variation >= Number(window.SELLAT) && previousVariation > variation) {
            mockBalances = sellCoin(mockBalances, coinName, sellPrice);
            nbTrades++;
          } else if (amount > 0 && variation <= Number(window.SELLLIMIT)) {
            mockBalances = sellCoin(mockBalances, coinName, sellPrice);
            nbTrades++;
          }
          mockBalances[coinName].previousVariation = variation;
        }
      }*/



      let usedMock = 0;
      let limitDown = 0.995;
      for (const coinName in mockBalances[usedMock]) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const amount = mockBalances[usedMock][coinName].amount;
          const sellPrice = sellPrices[coinName].Value;
          const variation = mockBalances[usedMock][coinName].variation;
          const coefDown = sellPrices[coinName].coefDown[usedMock];
          const tickDif = Number(window.tickCount) - Number(mockBalances[usedMock][coinName].tick);
          if (tickDif > 4 && amount > 0 && window.tickCount > 100 && (sellPrices[coinName].Evolution100 < coefDown)) {
            mockBalances[usedMock] = sellCoin(mockBalances[usedMock], coinName, sellPrice, usedMock);
            nbTrades[usedMock]++;
          }
        }
      }

      usedMock = 1;
      for (const coinName in mockBalances[usedMock]) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const coefDown = sellPrices[coinName].coefDown[usedMock];
          const amount = mockBalances[usedMock][coinName].amount;
          const sellPrice = sellPrices[coinName].Value;
          const variation = mockBalances[usedMock][coinName].variation;
          const tickDif = Number(window.tickCount) - Number(mockBalances[usedMock][coinName].tick);
          if (tickDif > 4 && amount > 0 && window.tickCount > 100 && (sellPrices[coinName].Evolution100 < coefDown)) {
            mockBalances[usedMock] = sellCoin(mockBalances[usedMock], coinName, sellPrice, usedMock);
            nbTrades[usedMock]++;
          }
        }
      }

      usedMock = 2;
      for (const coinName in mockBalances[usedMock]) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const coefDown = sellPrices[coinName].coefDown[usedMock];
          const amount = mockBalances[usedMock][coinName].amount;
          const sellPrice = sellPrices[coinName].Value;
          const variation = mockBalances[usedMock][coinName].variation;
          const tickDif = Number(window.tickCount) - Number(mockBalances[usedMock][coinName].tick);
          if (tickDif > 4 && amount > 0 && window.tickCount > 100 && (sellPrices[coinName].Evolution100 < coefDown)) {
            mockBalances[usedMock] = sellCoin(mockBalances[usedMock], coinName, sellPrice, usedMock);
            nbTrades[usedMock]++;
          }
        }
      }

      usedMock = 3;
      limitDown = 0.995;
      for (const coinName in mockBalances[usedMock]) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const amount = mockBalances[usedMock][coinName].amount;
          const sellPrice = sellPrices[coinName].Value;
          const variation = mockBalances[usedMock][coinName].variation;
          const maxVariation = mockBalances[usedMock][coinName].maxVariation;
          const coefDown = sellPrices[coinName].coefDown[usedMock];
          const tickDif = Number(window.tickCount) - Number(mockBalances[usedMock][coinName].tick);
          const varCond = variation < -2 || (variation > 2 && variation < maxVariation * 0.9)
          if (varCond && tickDif > 4 && amount > 0 && window.tickCount > 100 && (sellPrices[coinName].Evolution40 < coefDown)) {
            mockBalances[usedMock] = sellCoin(mockBalances[usedMock], coinName, sellPrice, usedMock);
            nbTrades[usedMock]++;
          }
        }
      }

      usedMock = 4;
      for (const coinName in mockBalances[usedMock]) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const coefDown = sellPrices[coinName].coefDown[usedMock];
          const amount = mockBalances[usedMock][coinName].amount;
          const sellPrice = sellPrices[coinName].Value;
          const variation = mockBalances[usedMock][coinName].variation;
          const maxVariation = mockBalances[usedMock][coinName].maxVariation;
          const tickDif = Number(window.tickCount) - Number(mockBalances[usedMock][coinName].tick);
          const varCond = variation > 1;
          if (varCond && tickDif > 4 && amount > 0 && window.tickCount > 100 && (sellPrices[coinName].Evolution40 < coefDown)) {
            mockBalances[usedMock] = sellCoin(mockBalances[usedMock], coinName, sellPrice, usedMock);
            nbTrades[usedMock]++;
          }
        }
      }

      /*usedMock = 3;
      for (const coinName in mockBalances[usedMock]) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const coefDown = sellPrices[coinName].coefDown[usedMock];
          const amount = mockBalances[usedMock][coinName].amount;
          const sellPrice = sellPrices[coinName].Value;
          const variation = mockBalances[usedMock][coinName].variation;
          const tickDif = Number(window.tickCount) - Number(mockBalances[usedMock][coinName].tick);
          if (tickDif > 4 && amount > 0 && window.tickCount > 210 && (sellPrices[coinName].Evolution100 < coefDown)) {
            mockBalances[usedMock] = sellCoin(mockBalances[usedMock], coinName, sellPrice, usedMock);
            nbTrades[usedMock]++;
          }
        }
      }

      usedMock = 4;
      for (const coinName in mockBalances[usedMock]) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const coefDown = sellPrices[coinName].coefDown[usedMock];
          const amount = mockBalances[usedMock][coinName].amount;
          const sellPrice = sellPrices[coinName].Value;
          const variation = mockBalances[usedMock][coinName].variation;
          const tickDif = Number(window.tickCount) - Number(mockBalances[usedMock][coinName].tick);
          if (tickDif > 4 && amount > 0 && window.tickCount > 210 && (sellPrices[coinName].Evolution100 < coefDown)) {
            mockBalances[usedMock] = sellCoin(mockBalances[usedMock], coinName, sellPrice, usedMock);
            nbTrades[usedMock]++;
          }
        }
      }
*/

      //Estimating BTC Value + Variation
      const totalMockBTCValues = [];
      for(let i = 0; i < 5; i++ ) {
        totalMockBTCValues[i] = mockBalances[i].BTC.amount;
        for (const coinName in mockBalances[i]) {
          //Calculate Variation of existing amounts
          if (!isEmpty(mockBalances[i][coinName]) && sellPrices[coinName]) {
            mockBalances[i][coinName].btcValue = sellPrices[coinName].Value * mockBalances[i][coinName].amount * (1 - 0.0025);
            mockBalances[i][coinName].variation = Math.round(((mockBalances[i][coinName].btcValue / mockBalances[i][coinName].btcUsed) - 1) * 10000) / 100;
            mockBalances[i][coinName].maxVariation = Math.max(mockBalances[i][coinName].maxVariation, mockBalances[i][coinName].variation)
            //console.log("maxVar", mockBalances[i][coinName].maxVariation)
            totalMockBTCValues[i] += mockBalances[i][coinName].btcValue;
          }
        }
      }


      //Calculate the variation and BTC amount of real balances
      let totalBTCValue = 0;
      if (balances) {
        totalBTCValue = Number(balances.BTC.available);
        for (const coinName in balances) {
          //Calculate Variation of existing amounts
          if (!isEmpty(balances[coinName]) && sellPrices[coinName]) {
            balances[coinName].btcValue = sellPrices[coinName].Value * balances[coinName].available * (1 - balances[coinName].fee);
            balances[coinName].variation = Math.round(((balances[coinName].btcValue / balances[coinName].btcUsed) - 1) * 10000) / 100;
            if (!isNaN(Number(balances[coinName].btcValue))) {
              totalBTCValue += Number(balances[coinName].btcValue);
            }

          }
        }
      }


      variationBtc = Math.round(variationBtc * 10000) / 100;
      variationGlobal = Math.round((variationBtc) * 100) / 100;
      if (state.variationList.length === 30) {
        state.variationList.shift();
      }
      state.variationList.push(variationBtc);
      const  variationBtcMoy = sum(state.variationList) / state.variationList.length;
      //calcul du gap
      let evolution = 0;
      if (state.oldVariationBtcMoy) {
        evolution = variationBtcMoy - state.oldVariationBtcMoy;
      }
      state.oldVariationBtcMoy = variationBtcMoy;

      variationPurchasePrices = Math.round(variationPurchasePrices * 100) / 100;
      variationSellPrices = Math.round(variationSellPrices * 100) / 100;
      const marketVariation = {
        variationBtc,
        variationBtcMoy,
        variationPurchasePrices,
        variationSellPrices,
        evolution,
        variationGlobal,
        mockBalances
      };

      const tick = state.tick + 1;

      if( tick%12 == 0) {
        if (!window.outputCsv) {
          window.outputCsv = 'variationBtcMoy'+';'+'evolution'+';'+'variationGlobal'+';'+'totalBTCValue'+';';
          window.outputCsv += 'totalMock0;trade0;totalMock1;trade1;totalMock2;trade2;totalMock3;trade3;totalMock4;trade4\n';

        }
        window.outputCsv += variationBtcMoy+';'+evolution+';'+variationGlobal+';'+totalBTCValue+';'
        window.outputCsv += totalMockBTCValues[0]+';'+nbTrades[0]+';'
        window.outputCsv += totalMockBTCValues[1]+';'+nbTrades[1]+';'
        window.outputCsv += totalMockBTCValues[2]+';'+nbTrades[2]+';'
        window.outputCsv += totalMockBTCValues[3]+';'+nbTrades[3]+';'
        window.outputCsv += totalMockBTCValues[4]+';'+nbTrades[4]+'\n'
      }
      const timestamp = new Date();

      if( tick%1 == 0) {
        for(const logCoin in sellPrices) {
          const coin = logCoin;
          if(!window[coin]) {
            window[coin] = 'timestamp;sellPrice;buyPrice;buyEvol100;sellEvol100;';
            window[coin] += 'coefUp0;coefUp1;coefUp2;coefUp3;coefUp4;';
            window[coin] += 'coefDown0;coefDown1;coefDown2;coefDown3;coefDown4;'
            window[coin] += 'var0;var1;var2;var3;var4;'
            window[coin] += 'mock0;mock1;mock2;mock3;mock4\n'
          }
          //const coinAmount = mockBalances[coin] ? mockBalances[coin].amount : 0;
          const coinBtcValue0 = mockBalances[0][coin] ? mockBalances[0][coin].btcValue : 0;
          const coinBtcValue1 = mockBalances[1][coin] ? mockBalances[1][coin].btcValue : 0;
          const coinBtcValue2 = mockBalances[2][coin] ? mockBalances[2][coin].btcValue : 0;
          const coinBtcValue3 = mockBalances[3][coin] ? mockBalances[3][coin].btcValue : 0;
          const coinBtcValue4 = mockBalances[4][coin] ? mockBalances[4][coin].btcValue : 0;

          let var0 = mockBalances[0][coin] ? mockBalances[0][coin].variation : 0;
          let var1 = mockBalances[1][coin] ? mockBalances[1][coin].variation : 0;
          let var2 = mockBalances[2][coin] ? mockBalances[2][coin].variation : 0;
          let var3 = mockBalances[3][coin] ? mockBalances[3][coin].variation : 0;
          let var4 = mockBalances[4][coin] ? mockBalances[4][coin].variation : 0;

          var0 = isNaN(var0) ? 0 : var0;
          var1 = isNaN(var1) ? 0 : var1;
          var2 = isNaN(var2) ? 0 : var2;
          var3 = isNaN(var3) ? 0 : var3;
          var4 = isNaN(var4) ? 0 : var4;

          window[coin] += timestamp+';'+sellPrices[coin].Value+';'+buyPrices[coin].Value+';'+buyPrices[coin].Evolution100 +';'+sellPrices[coin].Evolution100 +';';
          window[coin] += buyPrices[coin].coefUp[0]+';'+buyPrices[coin].coefUp[1]+';'+buyPrices[coin].coefUp[2]+';'+buyPrices[coin].coefUp[3]+';'+buyPrices[coin].coefUp[4]+';'
          window[coin] += sellPrices[coin].coefDown[0]+';'+sellPrices[coin].coefDown[1]+';'+sellPrices[coin].coefDown[2]+';'+sellPrices[coin].coefDown[3]+';'+sellPrices[coin].coefDown[4]+';'
          window[coin] += var0+';'+var1+';'+var2+';'+var3+';'+var4+';'
          window[coin] += coinBtcValue0+';'+coinBtcValue1+';'+coinBtcValue2+';'+coinBtcValue3+';'+coinBtcValue4 +'\n';

        }
      }

      return {
        ...state,
        marketVariation,
        balances,
        sellPrices,
        buyPrices,
        difPrices,
        difPricesTotal,
        totalBTCValue,
        totalMockBTCValues,
        change24h,
        tick,
        nbTrades
      };

    case 'RECEIVE_TRADING_HISTORY':
      const nonZeroBalances = {};
      for (const altCoin in action.balances) {
        if (Number(action.balances[altCoin].available) > 0 || Number(action.balances[altCoin].onOrders) > 0) {
          nonZeroBalances[altCoin] = action.balances[altCoin];
        }
      }
      balances = nonZeroBalances;
      for (const coin in balances) {
        if (balances[coin].available > 0 && coin !== 'BTC') {
          //search latest transaction in the trade HISTORY
          for (const tradeCoin in action.trades) {
            const purchasedCoin = tradeCoin.substring(4, 10);
            if (tradeCoin.indexOf('BTC_') >= 0 && purchasedCoin === coin) {
              const coinTrades = action.trades[tradeCoin];
              if (coinTrades[0].type === 'buy') {
                balances[coin].initialPrice = coinTrades[0].rate;
                balances[coin].fee = coinTrades[0].fee;
                balances[coin].btcUsed = coinTrades[0].total;
              }

            }

          }
        }
      }
      return {
        ...state,
        balances
      };
    case 'RECEIVE_BTC_RATES':

      //Getting the new Rate
      const rate = Number(action.rates.data.amount);
      const lastRate = state.rate ? state.rate : rate;
      const velocity = ((rate / lastRate) - 1) * 100;

      let lastVelocities = state.lastVelocities;
      if (!lastVelocities) {
        lastVelocities = [];
      }
      if (velocity !== 0) {
        lastVelocities.push(velocity);
      }

      return {
        rate,
        velocity,
        lastRate,
        lastVelocities
      };
    default:
      return state;
  }
};

export default rates;
