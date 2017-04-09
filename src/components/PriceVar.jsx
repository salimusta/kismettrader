import React, { PropTypes, Component } from 'react';

class PriceVar extends Component {
  render() {
    const { amount } = this.props;
    const greenStyle = {
      color: 'green'
    };
    const redStyle = {
      color: 'red'
    };
    return (
      <span style={ amount > 0 ? greenStyle : redStyle }>
          ({ amount }%)
      </span>
    );
  }
}

PriceVar.propTypes = {
  amount: PropTypes.number
};

export default PriceVar;
