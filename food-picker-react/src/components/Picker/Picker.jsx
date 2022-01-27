import { Component } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { pages } from '../../pages';

const propTypes = {

}

class Picker extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div></div>
    );
  }
}

Picker.propTypes = propTypes;

const mapStateToProps = state => ({

});

export default connect(mapStateToProps)(Picker);
