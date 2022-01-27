import React, { Component } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { pages } from '../../pages';

const propTypes = {

}

class Lobby extends Component {
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

Lobby.propTypes = propTypes;

const mapStateToProps = state => ({

});

export default connect(mapStateToProps)(Lobby);
