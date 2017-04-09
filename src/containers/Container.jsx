import { connect } from 'react-redux';
import Component1 from '../components/Component1';

const mapStateToProps = (state) => {
  return {
    rates: state.rates,
    errors: state.errors
  };
};

const Container = connect(
  mapStateToProps
)(Component1);

export default Container;
