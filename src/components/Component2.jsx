import React, { PropTypes } from 'react';
import { Button } from 'react-bootstrap';
import { action1 } from '../actions';

const Component2 = ({ dispatch, data }) => {
  function _onClick() {
    dispatch(action1(data + 1));
  }

  const buttonProps = {
    onClick: _onClick
  };
  return (
    <div>
      PAGE 2
      <div>
        <Button { ...buttonProps } > Button </Button>
      </div>
      <div>
        Data: { data }
      </div>


    </div>
  );
};


Component2.propTypes = {
  data: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired
};

export default Component2;
