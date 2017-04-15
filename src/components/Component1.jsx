import React, { PropTypes, Component } from 'react';
import { Button, Table, Modal, Panel } from 'react-bootstrap';
import { returnTicker, sellCoin, buyCoin, buyAll, sellAll, accountBalances, tradingHistory, buyForReal, sellForReal, resetErrors } from '../actions';
import { isEmpty } from 'lodash';

import RTChart from 'react-rt-chart';
import PriceVar from './PriceVar';
import AccountBalances from './AccountBalances';

class Component1 extends Component {

  constructor (props) {
    super(props);
    this.state = {
      showModal: false,
      openedPanel: {}
    };
  }

  closeModal() {
    this.props.dispatch(resetErrors());
    this.setState({ showModal: false });
  }

  openModal(modalContent) {
    this.setState({ showModal: true, modalContent });
  }

  openPanel(coin) {
    const openedPanel = this.state.openedPanel;
    openedPanel[coin] = !openedPanel[coin];
    this.setState({ openedPanel });
  }


  componentWillMount() {
    this.props.dispatch(returnTicker());
    if (window.REAL) {
      this.props.dispatch(accountBalances());
      this.mainInterval = setInterval(() => { this.props.dispatch(returnTicker()); }, 5000);
    }
  }

  onBuyAll() {
    this.props.dispatch(buyAll());
  }

  onSellAll() {
    this.props.dispatch(sellAll());
  }

  onBuy(coin) {
    this.props.dispatch(buyCoin(coin));
  }

  onBuyReal(coin, rate) {
    const amount = 0.003 / rate;
    this.props.dispatch(buyForReal(coin, rate, amount));
  }

  onSellReal(coin, rate, amount) {
    this.props.dispatch(sellForReal(coin, rate, amount));
  }

  onSell(coin) {
    this.props.dispatch(sellCoin(coin));
  }

  start() {
    this.mainInterval = setInterval(() => { this.props.dispatch(returnTicker()); }, 5000);
  }

  componentWillUpdate(nextProps) {
    const { sellError, buyErrors } = nextProps.errors;
    if (!isEmpty(sellError) && !this.state.showModal) {
      this.openModal(sellError);
    }
    if (!isEmpty(buyErrors) && !this.state.showModal) {
      this.openModal(buyErrors);
    }
  }

  render() {
    const { marketVariation, sellPrices, buyPrices, change24h, difPrices, priceLowHigh24h, mockBalances, difPricesTotal, balances, totalBTCValue, totalMockBTCValues, nbTrades } = this.props.rates;

    let nbCoin = 0;

    const moneyVariation = ((totalBTCValue / Number(window.initialMoney)) - 1) * 100;
    if (!totalMockBTCValues) return null
    const moneyMockVariation = [];


    const mockBalancesTab = [];
    const mockBTCValueTab = [];
    const chartDataTab = [];
    const chartDataTab2 = [];

    for(const i in totalMockBTCValues) {
      moneyMockVariation[i] = ((totalMockBTCValues[i] / Number(window.initialMoney)) - 1) * 100;
      mockBTCValueTab.push(
        <tr>
          <th>
            { i }
          </th>
          <th>
            { totalMockBTCValues[i] }
          </th>
          <th>
            <PriceVar amount={ moneyMockVariation[i] } />
          </th>
          <th>
            { mockBalances[i].BTC.amount }
          </th>
          <th>
            { nbTrades[i] }
          </th>
        </tr>

      );
    }


    for (const coin in buyPrices) {
      nbCoin++;

      const sellEvolution = sellPrices[coin].Evolution;
      const buyEvolution = buyPrices[coin].Evolution;
      const coinEvolution = change24h[coin];

      const haveAnyCoins = !isEmpty(mockBalances[0][coin]);
      const amountVariation = haveAnyCoins ? mockBalances[0][coin].variation : '';
      const redBack = {
        backgroundColor: '#FFDDDD'
      };


      mockBalancesTab.push(
        <tr onClick={ () => this.openPanel(coin)} key={ coin + 'balance' } style={ buyPrices[coin].wasCrashinghard ? redBack : null }>
          <th>
            { coin }
            <PriceVar amount={ coinEvolution } />
          </th>
          <th>
            { buyPrices[coin].Value }
            <PriceVar amount={ buyEvolution } />
          </th>
          <th>
            { sellPrices[coin].Value }
            <PriceVar amount={ sellEvolution } />
          </th>
          <th>
            <PriceVar amount={ difPrices[coin].Value } />
          </th>
          <th>
            { buyPrices[coin].SmoothEvolution } | { sellPrices[coin].SmoothEvolution } [ { sellPrices[coin].SmoothEvolutionMax } ]
          </th>
          <th>
            <PriceVar amount={ priceLowHigh24h[coin].Value } />
          </th>
          <th>
            { haveAnyCoins ? mockBalances[0][coin].amount : 0 }
            -/-
            { balances && balances[coin] ? balances[coin].available : ''}
          </th>
          <th>
            {
              haveAnyCoins ? <PriceVar amount={ amountVariation || 0 } /> : null
            }
            -/-
            {
              balances && balances[coin] && balances[coin].available > 0 ? <PriceVar amount={ balances[coin].variation || 0 } /> : null
            }
          </th>
          <th>
            { haveAnyCoins ? mockBalances[0][coin].initialPrice : null }
            -/-
            { balances && balances[coin] ? balances[coin].initialPrice : ''}
          </th>
          <th>
            <Button bsStyle="primary" onClick={ () => this.onBuy(coin) }>BUY</Button>
            <Button disabled={ !window.REAL } bsStyle="danger" onClick={ () => this.onBuyReal(coin, buyPrices[coin].Value) }>BUY REAL</Button>
            <Button bsStyle="primary" onClick={ () => this.onSell(coin) }>SELL</Button>
            <Button disabled={ !window.REAL } bsStyle="danger" onClick={ () => this.onSellReal(coin, sellPrices[coin].Value, balances[coin].available) }>SELL REAL</Button>
          </th>
        </tr>
      );

      chartDataTab[coin] = {
        date: new Date(),
        sellPrice: sellPrices[coin] ? sellPrices[coin].Value : 0,
        buyPrice: buyPrices[coin] ? buyPrices[coin].Value : 0
      }
      chartDataTab2[coin] = {
        date: new Date(),
        smoothSell: sellPrices[coin] ? sellPrices[coin].SmoothEvolution : 0,
        smoothBuy: buyPrices[coin] ? buyPrices[coin].SmoothEvolution : 0
      }

      mockBalancesTab.push(
        <tr>
          <td colSpan="10" style={{height:'0px', padding: "0 0 0 0"}}>
            <Panel collapsible expanded={this.state.openedPanel[coin]} style={{marging: "0 0 0 0"}}>

            </Panel>
          </td>
        </tr>
      );



    }

    const dataEvolution = {
      date: new Date(),
      Evolution: marketVariation ? marketVariation.evolution : 0,
      Base: 0
    };

    const dataBTCMoy = {
      date: new Date(),
      BTCMoy: marketVariation ? Math.round(marketVariation.variationBtcMoy) : 0
    };

    const dataPriceVar = {
      date: new Date(),
      buy: marketVariation ? marketVariation.variationPurchasePrices : 0,
      sell: marketVariation ? marketVariation.variationSellPrices : 0,
      dif : difPricesTotal
    };

    const dataBTCValue = {
      date: new Date(),
      btcValue: totalBTCValue
    };


    return (
      <div>
        <div>
          <Modal show={ this.state.showModal } onHide={ this.closeModal }>
          <Modal.Header closeButton>
            <Modal.Title>Modal heading</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h4>{ this.state.modalContent }</h4>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={ this.closeModal.bind(this) }>Close</Button>
          </Modal.Footer>
        </Modal>
        </div>
        {
          window.DISPLAYGRAPH ?
          <div>
          <RTChart maxValues={ 100 } fields={ ['Evolution', 'Base'] } data={ dataEvolution } />
          <RTChart maxValues={ 100 } fields={ ['BTCMoy'] } data={ dataBTCMoy } />
          <RTChart maxValues={ 100 } fields={ ['buy', 'sell', 'dif'] } data={ dataPriceVar } />
          <RTChart maxValues={ 100 } fields={ ['btcValue'] } data={ dataBTCValue } />
          </div>
          : null
        }


        { balances ? <AccountBalances balances={ balances } /> : null }
        <div>
          MARKET VARIATION <br />
          BTC: { marketVariation ? (marketVariation.variationBtc || 0) : 0} % <br />
          BTC MOY: { marketVariation ? (marketVariation.variationBtcMoy || 0) : 0} % <br />
          EVOLUTION: { marketVariation ? (marketVariation.evolution || 0) : 0} % <br />
        </div>

        <div>
          Nb Coin: { nbCoin } <br />

        </div>
        <h1>
          BTC Value: { totalBTCValue }
        </h1>
        <h2>
          Money Variation: <PriceVar amount={ moneyVariation } />
        </h2>
        Remaining BTC:{ balances && balances['BTC'] ? balances['BTC'].available : ''}

        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>
                Account
              </th>
              <th>
                Mock BTC Value
              </th>
              <th>
                Mock Money Variation
              </th>
              <th>
                Mock remaining BTC
              </th>
              <th>
                Trades
              </th>
            </tr>
          </thead>
          <tbody>
            { mockBTCValueTab }
          </tbody>
        </Table>



        <h3>
          Params: REAL: { window.REAL }, SELLAT: { window.SELLAT }, SELLLIMIT: { window.SELLLIMIT }<br />
          BUYAT: { window.BUYAT }, BUYWHEN: { window.BUYWHEN }, AMOUNT: { window.AMOUNT }, LOWHIGH: { window.LOWHIGH }<br />
          DISPLAYGRAPH: { window.DISPLAYGRAPH }
        </h3>

        <div>

          <Button bsStyle="primary" onClick={ this.start.bind(this) }>START</Button>

          <Button bsStyle="primary" onClick={ this.onBuyAll.bind(this) }>BUY ALL</Button>

          <Button bsStyle="primary" onClick={ this.onSellAll.bind(this) }>SELL ALL</Button>
        </div>

        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>Coin</th>
              <th>
                Actual Purchase Price
                <PriceVar amount={ marketVariation ? marketVariation.variationPurchasePrices : 0 } />
              </th>
              <th>
                Actual selling price
                <PriceVar amount={ marketVariation ? marketVariation.variationSellPrices : 0 } />
              </th>
              <th>
                Price Dif
                <PriceVar amount={ difPricesTotal } />
              </th>
              <th>
                Smooth
              </th>
              <th>
                Low/High 24h
              </th>
              <th>Amount</th>
              <th>Variation</th>
              <th>Purchase Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            { mockBalancesTab }
          </tbody>
        </Table>
      </div>
    );
  }
}

Component1.propTypes = {
  rates: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default Component1;
