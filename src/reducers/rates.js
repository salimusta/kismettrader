import { sum, isEmpty, sortBy } from 'lodash';


function sellCoin(balances, coin, sellPrice) {
  const mockBalances = balances;
  const amount = mockBalances[coin].amount;
  const btcAmount = (amount * sellPrice) * (1 - 0.0025);
  console.log("Sell Coin "+coin+" @ " + sellPrice+" amount:"+amount+" BTC amount"+btcAmount)

  mockBalances[coin].amount = 0;
  mockBalances[coin].initialPrice = null;
  mockBalances[coin].btcUsed = 0;
  mockBalances.BTC.amount += btcAmount;
  return mockBalances;
}

function buyCoin(balances, coin, amount, purchasePrice) {
  const mockBalances = balances;

  const coinAmount = (amount / purchasePrice) * (1 - 0.0025);
  console.log("Buy Coin "+coin+" @ " + purchasePrice+" amount:"+coinAmount+" BTC amount"+amount)
  if (isEmpty(mockBalances[coin])) {
    mockBalances[coin] = {
      amount: 0,
      btcUsed: 0
    };
  }
  mockBalances[coin].amount += coinAmount;
  mockBalances[coin].initialPrice = purchasePrice;
  mockBalances[coin].btcUsed += amount;

  //Retrieve BTC Values
  mockBalances.BTC.amount -= amount;
  return mockBalances;
}
const rates = (state = [], action) => {
  switch (action.type) {
    case 'BUY_ALL_COIN':
      let mockBalances = state.mockBalances;
      for (const coin in state.buyPrices) {
        mockBalances = buyCoin(mockBalances, coin, 0.01, state.buyPrices[coin].Value);
      }

      return {
        ...state,
        mockBalances
      };
    case 'SELL_ALL_COIN':
      mockBalances = state.mockBalances;
      for (const coin in state.sellPrices) {
        mockBalances = sellCoin(mockBalances, coin, state.sellPrices[coin].Value);
      }

      return {
        ...state,
        mockBalances
      };
    case 'SELL_COIN':
      mockBalances = sellCoin(state.mockBalances, action.coin, state.sellPrices[action.coin].Value);
      return {
        ...state,
        mockBalances
      };
    case 'BUY_COIN':
      mockBalances = buyCoin(state.mockBalances, action.coin, 0.01, state.buyPrices[action.coin].Value);
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
      let variationBtc = 0;
      let variationGlobal = 0;
      const data = action.data;

      const sellPrices = state.sellPrices;
      const buyPrices = state.buyPrices;
      const difPrices = state.difPrices;
      const priceLowHigh24h = state.priceLowHigh24h;
      let difPricesTotal = 0;
      let variationPurchasePrices = 0;
      let variationSellPrices = 0;
      const change24h = {};
      mockBalances = state.mockBalances;
      let balances = state.balances;
      let totalBTCValue = mockBalances.BTC.amount;
      for (const altCoin in data) {
        //Bitcoin market
        if (altCoin.indexOf('BTC_') >= 0) {
          const coinName = altCoin.substring(4, 10);

          change24h[coinName] = Math.round(data[altCoin].percentChange * 10000) / 100;

          variationBtc += Number(data[altCoin].percentChange);

          const volume24h = Number(data[altCoin].baseVolume);
          const maxSellPrice24h = Number(data[altCoin].high24hr);
          const minPurchasePrice24h = Number(data[altCoin].low24hr);
          const lowHigh24h = Math.round(((maxSellPrice24h / minPurchasePrice24h) - 1) * 10000) / 100;
          const purchasePrice = Number(data[altCoin].lowestAsk);
          const sellPrice = Number(data[altCoin].highestBid);

          if (sellPrice > 0.000001 && Number(volume24h) > 100 && lowHigh24h > 5) {
            if (isEmpty(sellPrices[coinName])) {
              sellPrices[coinName] = {};
              buyPrices[coinName] = {};
              difPrices[coinName] = {};
              priceLowHigh24h[coinName] = {};
              sellPrices[coinName].Values = [];
              buyPrices[coinName].Values = [];
            }
            sellPrices[coinName].Value = sellPrice;
            buyPrices[coinName].Value = purchasePrice;
            difPrices[coinName].Value = Math.round(((sellPrices[coinName].Value / buyPrices[coinName].Value) - 1) * 10000) / 100 ;
            difPricesTotal += difPrices[coinName].Value;

            priceLowHigh24h[coinName].Value = lowHigh24h ;

            //Store Value for evolution
            const length = sellPrices[coinName].Values.length;
            if (length === 30) {
              sellPrices[coinName].Values.shift();
              buyPrices[coinName].Values.shift();
            }
            sellPrices[coinName].Values.push(sellPrices[coinName].Value);
            buyPrices[coinName].Values.push(buyPrices[coinName].Value);
            sellPrices[coinName].Evolution = Math.round(((sellPrices[coinName].Values[length - 1] / sellPrices[coinName].Values[0]) - 1) * 10000) / 100;
            buyPrices[coinName].Evolution = Math.round(((buyPrices[coinName].Values[length - 1] / buyPrices[coinName].Values[0]) - 1) * 10000) / 100;
            variationPurchasePrices += buyPrices[coinName].Evolution;
            variationSellPrices += sellPrices[coinName].Evolution;

            //SHOULD WE BUY ????
            const evolutionCondition = buyPrices[coinName].Evolution > window.BUYAT;
            const wasCrashinghard = buyPrices[coinName].wasCrashinghard;
            const crashinghard = buyPrices[coinName].Evolution < -0.8 || (wasCrashinghard && buyPrices[coinName].Evolution <= -0.3);
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
          }
        }
      }

      //Should we sell?
      for (const coinName in mockBalances) {
        //Calculate Variation of existing amounts
        if (coinName !== 'BTC') {
          const amount = mockBalances[coinName].amount;
          const variation = mockBalances[coinName].variation;
          const sellPrice = sellPrices[coinName].Value;
          const previousVariation = mockBalances[coinName].previousVariation;

          if (amount > 0 && variation >= Number(window.SELLAT) && previousVariation > variation) {
            mockBalances = sellCoin(mockBalances, coinName, sellPrice);
          } else if (amount > 0 && variation <= Number(window.SELLLIMIT)) {
            mockBalances = sellCoin(mockBalances, coinName, sellPrice);
          }
          sellPrices[coinName].previousVariation = variation;
        }
      }

      totalBTCValue = mockBalances.BTC.amount;
      for (const coinName in mockBalances) {
        //Calculate Variation of existing amounts
        if (!isEmpty(mockBalances[coinName]) && sellPrices[coinName]) {
          mockBalances[coinName].btcValue = sellPrices[coinName].Value * mockBalances[coinName].amount * (1 - 0.0025);
          mockBalances[coinName].variation = Math.round(((mockBalances[coinName].btcValue / mockBalances[coinName].btcUsed) - 1) * 10000) / 100;
          totalBTCValue += mockBalances[coinName].btcValue;
        }
      }

      /*for (const coinName in balances) {
        //Calculate Variation of existing amounts
        if (!isEmpty(balances[coinName]) && sellPrices[coinName]) {
          balances[coinName].btcValue = sellPrices[coinName].Value * balances[coinName].amount * (1 - balances[coinName].fee);
          balances[coinName].variation = Math.round(((balances[coinName].btcValue / balances[coinName].btcUsed) - 1) * 10000) / 100;
          //totalBTCValue += mockBalances[coinName].btcValue;
        }
      }*/

      console.log("ticker balances", balances)

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
      //console.log(estimatedSellBalance, initialValue, profit)
      //window.outputCsv = window.outputCsv + variationBtcMoy+';'+evolution+';'+variationGlobal+';'+profit+'@'
      let evolutionChart;
      if (!state.marketVariation) {
        evolutionChart = [];
      } else {
        evolutionChart = state.marketVariation.evolutionChart;
      }

      evolutionChart.push({ uv: Math.round(Math.random()*10) });

      variationPurchasePrices = Math.round(variationPurchasePrices * 100) / 100;
      variationSellPrices = Math.round(variationSellPrices * 100) / 100;
      const marketVariation = {
        variationBtc,
        variationBtcMoy,
        variationPurchasePrices,
        variationSellPrices,
        evolution,
        evolutionChart,
        variationGlobal,
        mockBalances
      };

      return {
        ...state,
        marketVariation,
        balances,
        sellPrices,
        buyPrices,
        difPrices,
        priceLowHigh24h,
        difPricesTotal,
        totalBTCValue,
        change24h
      };

    case 'RECEIVE_TRADING_HISTORY':
      balances = state.balances;
      for (const coin in balances) {
        if (balances[coin].available > 0 && coin !== 'BTC') {
          //search latest transaction in the trade HISTORY
          for (const tradeCoin in action.trades) {
            const purchasedCoin = tradeCoin.substring(4, 10);
            if (tradeCoin.indexOf('BTC_') >= 0 && purchasedCoin === coin) {
              console.log("Coin: ", purchasedCoin)
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
      console.log("trading balances", balances)
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
