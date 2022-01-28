import { Button, Container, TextField, Typography } from "@mui/material";
import GoogleIcon from '@mui/icons-material/Google';
import { Component } from "react";
import { connect } from "react-redux";
import withParams from "../utils/withParams";
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  sendPasswordResetEmail,
} from 'firebase/auth';
import {
  query,
  getDocs,
  collection,
  where,
  addDoc,
} from 'firebase/firestore';
import { pushLastPage, setHeaderTitle, setUser } from "../../actions";

import '../../css/SignIn.css';

class SignIn extends Component {
  componentDidMount() {
    this.props.dispatch(setHeaderTitle("Welcome! Sign In."));
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

  signInWithGoogle = async () => {
    const { googleProvider } = this.state;
    const { db, auth } = this.props;
    this.setState({ loading: true });
    try {
      const res = await signInWithRedirect(auth, googleProvider);
      const user = res.user;
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

  render() {
    return (
      <div id="signin-page">
        <Container>
          <Typography variant="h5" sx={{ my: 3 }}>Sign In with FoodPicker</Typography>
          <TextField
            required
            fullWidth
            id="signin-email"
            label="Email Address"
            variant="outlined"
            type="email"
            sx={{
              my: 1,
              backgroundColor: "white",
              borderRadius: '5px',
              fontWeight: 400,
            }}
            onChange={(event) => this.setState({ email: event.target.value })}
          />
          <TextField
            required
            fullWidth
            id="signin-password"
            label="Password"
            variant="outlined"
            type="password"
            sx={{
              my: 1,
              backgroundColor: "white",
              borderRadius: '5px'
            }}
            onChange={(event) => this.setState({ email: event.target.value })}
          />
          <Typography sx={{ textAlign: "left", color: "blue"}}
            onClick={() => { this.props.dispatch(pushLastPage("/signin")); this.props.navigate("/reset-password"); }}
          >
            Forgot Password
          </Typography>
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 4, mb: 1, height: 50, backgroundColor: "#E54040"}}
          >
            <Typography sx={{ fontWeight: "600" }}>Sign In</Typography>
          </Button>
          <Typography sx={{ my: 5, color: "gray" }}>- OR -</Typography>
          <Button
            variant="contained"
            fullWidth
            startIcon={<GoogleIcon />}
            sx={{ my: 1, height: 50 }}
            onClick={this.signInWithGoogle}
          >
            <Typography>Sign in with Google</Typography>
          </Button>
        </Container>
      </div>
    );
  }
}

export default connect()(withParams(SignIn));
