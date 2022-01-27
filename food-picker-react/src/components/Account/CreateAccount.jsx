import { Container, TextField, Typography } from "@mui/material";
import { Component } from "react";
import withParams from "../utils/withParams";
import {
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  collection,
  addDoc,
} from 'firebase/firestore';
import { connect } from "react-redux";
import { setHeaderTitle } from "../../actions";

class CreateAccount extends Component {

  componentDidMount() {
    this.props.dispatch(setHeaderTitle("Sign Up"));
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

  render() {
    return (
      <div id="signin-page">
        <Container>
          <TextField
            required
            fullWidth
            id="signin-first-name"
            label="First Name"
            variant="outlined"
            type="text"
            sx={{
              mt: 2,
              mb: 0.5,
              backgroundColor: "white",
              borderRadius: '5px'
            }}
            onChange={(event) => this.setState({ firstName: event.target.value })}
          />
          <TextField
            fullWidth
            id="signin-last-name"
            label="Last Name"
            variant="outlined"
            type="text"
            sx={{
              my: 0.5,
              backgroundColor: "white",
              borderRadius: '5px'
            }}
            onChange={(event) => this.setState({ lastName: event.target.value })}
          />
          <TextField
            required
            fullWidth
            id="signin-email"
            label="Email Address"
            variant="outlined"
            type="email"
            sx={{
              my: 0.5,
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
              my: 0.5,
              backgroundColor: "white",
              borderRadius: '5px'
            }}
            onChange={(event) => this.setState({ email: event.target.value })}
          />
          <TextField
            required
            fullWidth
            id="signin-password-validation"
            label="Password Again"
            variant="outlined"
            type="password"
            sx={{
              my: 0.5,
              backgroundColor: "white",
              borderRadius: '5px'
            }}
            onChange={(event) => this.setState({ email: event.target.value })}
          />
        </Container>
      </div>
    );
  }
}

export default connect()(withParams(CreateAccount));