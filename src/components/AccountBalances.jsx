import React, { PropTypes, Component } from 'react';
import { Table } from 'react-bootstrap';

class AccountBalances extends Component {

  render() {
    const { balances } = this.props;
    const balancesTab = [];

    let totalBtcValue = 0;
    let totalOrders = 0;
    for (const coin in balances) {
      totalBtcValue += Number(balances[coin].btcValue);
      totalOrders += Number(balances[coin].onOrders);
      balancesTab.push(
        <tr key={ 'coinBalance' + coin }>
          <th>{ coin }</th>
          <th>{ balances[coin].available }</th>
          <th>{ balances[coin].btcValue }</th>
          <th>{ balances[coin].onOrders }</th>
        </tr>
      );
    }
    balancesTab.push(
      <tr key={ 'totalBalance' }>
        <th>TOTAL</th>
        <th></th>
        <th>{ totalBtcValue }</th>
        <th>{ totalOrders }</th>
      </tr>
    );
    return (
      <div>
        <Table striped bordered condensed hover>
          <thead>
            <tr>
              <th>Coin</th>
              <th>Available</th>
              <th>BTC Value</th>
              <th>onOrders</th>
            </tr>
          </thead>
          <tbody>
            { balancesTab }
          </tbody>
        </Table>
      </div>
    );
  }
}

AccountBalances.propTypes = {
  balances: PropTypes.object.isRequired
};

export default AccountBalances;
