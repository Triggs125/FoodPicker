// import { Component } from "react";
// import { Button } from "react-native-elements";
// import {
//   GoogleSignin,
//   GoogleSigninButton,
// } from '@react-native-google-signin/google-signin';
// import { AddUserToDB } from "./firebase";

// GoogleSignin.configure();

// class SignInWithGoogle extends Component {
//   constructor(props) {
//     super(props);

//     this.state = {
//       loading: false,
//     }

//     this.signInWithGoogle = this.signInWithGoogle.bind(this);
//   }

//   signInWithGoogle() {
//     this.setState({ loading: true });
//     GoogleSignin.hasPlayServices()
//       .then(hasPlayServices => {
//         if (hasPlayServices) {
//           GoogleSignin.signIn()
//             .then(async user => {
//               await AddUserToDB(this.props.db, user, user.firstName, user.lastName, "google");
//             });
//         } else {
//           this.setState({ playServicesError: true });
//         }
//       });
//   }
  
//   render() {
//     return (
//       <GoogleSigninButton
//         color={GoogleSigninButton.Color.Dark}
//       />
//       // <Button
//       //   title="Sign Up with Google"
//       //   loading={this.state.loading}
//       //   raised
//       //   icon={{
//       //     name: 'google',
//       //     type: 'font-awesome',
//       //     color: 'white',
//       //     marginRight: 8
//       //   }}
//       //   titleStyle={{ fontWeight: '500', fontSize: 22 }}
//       //   buttonStyle={{
//       //     backgroundColor: '#4285F4',
//       //     paddingVertical: 10
//       //   }}
//       //   containerStyle={{
//       //     marginVertical: 5
//       //   }}
//       //   loadingStyle={{
//       //     paddingVertical: 4
//       //   }}
//       //   onPress={this.signInWithGoogle}
//       // />
//     );
//   }
// }

// export default SignInWithGoogle;