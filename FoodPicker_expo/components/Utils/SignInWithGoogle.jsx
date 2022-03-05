import { Component } from "react";
import PropType from 'prop-types';
import { Button } from "react-native-elements";
import { GoogleSignIn, statusCodes } from '@react-native-google-signin/google-signin';
import { webClientId } from "../../config";

const propTypes = {
  auth: PropType.any,
  db: PropType.any,
}

class SignInWithGoogle extends Component {
  constructor(props) {
    super(props);
    GoogleSignIn.configure({
      webClientId: webClientId,
    })
    this.signInWithGoogle = this.signInWithGoogle.bind(this);
  }

  async useGoogleAuthentication() {
    return GoogleSignIn.hasPlayServices().then((hasPlayServices) => {
      if (hasPlayServices) {
        const signInSubscription = GoogleSignIn.signIn().then((userInfo) => {
          console.log(JSON.stringify(userInfo));
          return userInfo;
        }).catch((err) => {
          console.error(err);
        });
        this.setState({ signInSubscription });
      }
    }).catch((err) => {
      console.error(err);
    });
  }

  async signInWithGoogle() {
    try {
      const res = await useGoogleAuthentication();
      return;
      const user = await AddUserToDB(this.props.db, res.user, this.state.firstNameText, this.state.lastNameText);
      AsyncStorage.setItem("@user_foodpicker", JSON.stringify(res.user.uid));
      this.setState({ firstNameText: "", lastNameText: "", emailAddressText: "", passwordText: "" });
      this.props.navigation.navigate('Lobby', { user: user });
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  }
  
  render() {
    return (
      <Button
        title="Sign Up with Google"
        raised
        icon={{
          name: 'google',
          type: 'font-awesome',
          color: 'white',
          marginRight: 8
        }}
        titleStyle={{ fontWeight: '500', fontSize: 22 }}
        buttonStyle={{
          backgroundColor: '#4285F4',
          borderColor: 'transparent',
          borderWidth: 0,
          height: 60
        }}
        containerStyle={{
          width: 330,
          alignSelf: 'center',
          overflow: 'visible'
        }}
        // onPress={this.signInWithGoogle}
      />
    );
  }
}

SignInWithGoogle.protoTypes = propTypes;

export default SignInWithGoogle;