import React, { Component } from "react";
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { pushLastPage, setHeaderTitle, setUser } from '../../actions';
import GoogleIcon from '@mui/icons-material/Google';
import PersonIcon from '@mui/icons-material/Person';

import {
  GoogleAuthProvider,
  // signInWithPopup,
  signInWithRedirect,
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
import { Button, Container, Typography } from "@mui/material";
import withParams from "../utils/withParams";

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

  setHeaderTitle() {
    const title = "Good evening" + this.props.user?.displayName ? `, ${this.props.user?.displayName.split(" ")[0]}` : ''
    this.props.dispatch(setHeaderTitle(title));
  }

  signInWithGoogle = async () => {
    const { googleProvider } = this.state;
    const { db, auth } = this.props;
    this.setState({ loading: true });
    try {
      const res = await signInWithRedirect(auth, googleProvider);
      const user = res.user;
      console.log("RES:", res)
      console.log("User:", user)
      this.props.dispatch(setUser(user));
      this.setHeaderTitle();
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      console.log("Before query")
      const docs = await getDocs(q);
      console.log("After query")
      if (docs.docs.length === 0) {
        console.log("Before collection")
        await addDoc(collection(db, "users"), {
          uid: user.uid,
          name: user.displayName,
          authProvider: "google",
          email: user.email,
        });
        console.log("After collection")
      }
      this.setState({ signInError: false });
    } catch (err) {
      console.error(err);
      this.setState({ signInError: true });
    }
    this.setState({ loading: false })
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
        <Container sx={{ mt: 3 }}>
          <Button
            variant="contained"
            fullWidth
            sx={{ my: 1, height: 50, backgroundColor: "#E54040" }}
            onClick={() => { this.props.dispatch(pushLastPage("/account")); this.props.navigate("/signin"); }}
          >
            <Typography sx={{ fontWeight: "600" }}>Sign in with FoodPicker</Typography>
          </Button>
          <Button
            variant="contained"
            fullWidth
            startIcon={<GoogleIcon />}
            sx={{ my: 1, height: 50, backgroundColor: "white", color: "black" }}
            onClick={this.signInWithGoogle}
          >
            <Typography sx={{ fontWeight: "600" }}>Sign in with Google</Typography>
          </Button>
          <Typography sx={{ m: 3 }}>OR</Typography>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PersonIcon />}
            sx={{ my: 1, height: 50, backgroundColor: "white", color: "black" }}
            onClick={() => { this.props.dispatch(pushLastPage("/account")); this.props.navigate("/create-account");}}
          >
            <Typography sx={{ fontWeight: "600" }}>Create an account</Typography>
          </Button>
        </Container>
      </div>
    );
  }
}

Account.propTypes = propTypes;

const mapStateToProps = state => ({
  user: state.user,
});

export default connect(mapStateToProps)(withParams(Account));
