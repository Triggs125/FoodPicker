import React, { Component } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { AppBar, Avatar, Button, IconButton, Toolbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const propTypes = {

}

class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: "Good evening",
      color: "transparent",
    };
  }

  render() {
    console.log("Props", this.props);
    return (
      <AppBar
        position="fixed"
        color={this.state.color}
      >
        <Toolbar>
          {
            this.state.backButton &&
            <IconButton
              size="large"
              edge="start"
              color="inherit"
              aria-label="back-button"
              sx={{ mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          }
          <Typography variant="h5" component="div" sx={{ flexGrow: 1, textAlign: "left" }}>
            {this.state.title}{this.props.user?.displayName ? `, ${this.props.user?.displayName}` : ''}
          </Typography>
          <Button sx={{ mr: -2}}>
            <Avatar alt={this.props.user?.displayName} src={this.props.user?.photoURL} />
          </Button>
        </Toolbar>
      </AppBar>
    );
  }
}

Header.propTypes = propTypes;

const mapStateToProps = state => ({
  user: state.user,
});

export default connect(mapStateToProps)(Header);
