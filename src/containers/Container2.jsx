import { connect } from 'react-redux';
import Component2 from '../components/Component2';


const mapStateToProps = (state) => {
  return {
    data: state.data
  };
};

const Container2 = connect(
  mapStateToProps
)(Component2);

export default Container2;
