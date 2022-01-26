import React, { Component } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { setUser } from '../../actions';
import GoogleIcon from '@mui/icons-material/Google';
import PersonIcon from '@mui/icons-material/Person';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import {
  query,
  getDocs,
  collection,
  where,
  addDoc,
} from 'firebase/firestore';
import { Button, Typography } from "@mui/material";

const propTypes = {

}

class Account extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loginError: false,
      registerError: false,
    };
  }

  componentDidMount() {
    this.setState({
      googleProvider: new GoogleAuthProvider(),
    });
  }

  signInWithGoogle = async () => {
    const { googleProvider } = this.state;
    const { db, auth } = this.props;
    console.log("props:", this.props);
    this.setState({ loading: true });
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      // console.log("Response:", res)
      // console.log("User:", user)
      this.props.setUser(user);
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const docs = await getDocs(q);
      if (docs.docs.length === 0) {
        await addDoc(collection(db, "users"), {
          uid: user.uid,
          name: user.displayName,
          authProvider: "google",
          email: user.email,
        });
      }
      this.setState({ signInError: false });
    } catch (err) {
      console.error(err);
      this.setState({ signInError: true });
    }
    this.setState({ loading: false })
  }

  signInWithEmailAndPassword = async (email, password) => {
    this.setState({ loading: true });
    try {
      const res = await signInWithEmailAndPassword(this.props.auth, email, password);
      this.props.setUser(res.user);
      this.setState({ signInError: false });
    } catch (err) {
      console.error(err);
      this.setState({ signInError: true });
    }
    this.setState({ loading: false });
  }

  registerWithEmailAndPassword = async (name, email, password) => {
    this.setState({ loading: true });
    try {
      const res = await createUserWithEmailAndPassword(this.props.auth, email, password);
      const user = res.user;
      this.props.setUser(user);
      await addDoc(collection(this.props.db, "users"), {
        uid: user.uid,
        name,
        authProvider: "local",
        email,
      });
      this.setState({ registerError: false });
    } catch (err) {
      console.error(err);
      this.setState({ registerError: true });
    }
  }

  sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(this.props.auth, email);
    } catch (err) {
      console.error(err);
    }
  }

  signOut = () => {
    signOut(this.props.auth);
  }

  render() {
    return (
      <div id="account-page">
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          sx={{ m: 1, width: 300, height: 50 }}
        >
          <Typography>Sign in with FoodPicker</Typography>
        </Button>
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          sx={{ m: 1, width: 300, height: 50 }}
          onClick={this.signInWithGoogle}
        >
          <Typography>Sign in with Google</Typography>
        </Button>
        <Typography sx={{ m: 3 }}>OR</Typography>
        <Button
          variant="contained"
          startIcon={<PersonIcon />}
          sx={{ m: 1, width: 300, height: 50 }}
        >
          <Typography>Create an account</Typography>
        </Button>
      </div>
    );
  }
}

Account.propTypes = propTypes;

const mapStateToProps = state => ({
  pageShowing: state.pageShowing,
});

export default connect(mapStateToProps)(Account);
