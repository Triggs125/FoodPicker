import React, { Component } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import withParams from "./utils/withParams";
import { AppBar, Avatar, Button, IconButton, Toolbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { pushLastPage, removeLastPage } from "../actions";

const propTypes = {

}

class Header extends Component {
  constructor(props) {
    super(props);

    this.state = {
      title: "Good evening",
    };
  }

  render() {
    return (
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#E54040"
        }}
      >
        <Toolbar>
          <IconButton
            id="header-back-icon"
            size="large"
            edge="start"
            color="inherit"
            aria-label="back-button"
            sx={{ mr: 1 }}
            onClick={() => {
              this.props.dispatch(removeLastPage());
              this.props.navigate(this.props.lastPage ? this.props.lastPage : "/");
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            id="header-title"
            variant="h5"
            component="div"
            sx={{ flexGrow: 1, textAlign: "left", overflow: "hidden" }}
          >
            {this.props.headerTitle}
          </Typography>
          <Avatar
            alt={this.props.user?.displayName}
            src={this.props.user?.photoURL}
            onClick={() => { this.props.dispatch(pushLastPage(document.location.pathname)); this.props.navigate("/account");}}
          />
        </Toolbar>
      </AppBar>
    );
  }
}

Header.defaultProps = {
  backgroundColor: "secondary",
  headerTitle: "Good evening",
};
Header.propTypes = propTypes;

const mapStateToProps = state => {
  return ({
    user: state.user,
    headerTitle: state.headerTitle,
    lastPage: state.lastPage[state.lastPage.length - 1],
  });
};

export default connect(mapStateToProps)(withParams(Header));
