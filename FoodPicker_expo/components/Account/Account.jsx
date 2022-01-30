import { Component } from "react";
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Input, Button, Text, Icon } from 'react-native-elements';
import LoadingSpinner from '../LoadingSpinner';
import { GetUserFromDB } from '../Utils/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';
import isEmail from 'validator/lib/isEmail';

class Account extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      loginError: false,
      emailAddressText: "",
      passwordText: "",
      passwordShowing: false,
      emailAddressError: false,
    }
  }

  componentDidMount() {
    if (this.props.firstTime) {
      AsyncStorage.getItem('@user_foodpicker')
        .then((uid) => {
          const new_uid = uid.replace(/['"]+/g, '');
          if (new_uid && new_uid.length > 0) {
            GetUserFromDB(this.props.db, new_uid)
              .then((user) => {
                if (user) {
                  this.setState({ loading: false });
                  this.props.navigation.navigate('Lobby', { user });
                } else {
                  this.setState({ loading: false });
                }
              })
              .catch((err) => {
                this.setState({ loading: false });
              });
          }
        })
        .catch((err) => {
          this.setState({ loading: false });
        });
    } else {
      this.setState({ loading: false });
    }
  }

  async signIn() {
    const { emailAddressText, passwordText } = this.state;
    if (isEmail(emailAddressText) && passwordText.length > 0) {
      try {
        const res = await signInWithEmailAndPassword(this.props.auth, emailAddressText, passwordText);
        const user = await GetUserFromDB(this.props.db, res.user.uid);
        AsyncStorage.setItem("@user_foodpicker", JSON.stringify(res.user.uid));
        this.setState({ emailAddressText: "", passwordText: "" });
        this.props.navigation.navigate('Lobby', { user: user });
      } catch (err) {
        console.error(err);
        this.setState({ loginError: true });
      }
    } else {
      this.setState({ emailAddressError: true });
    }
  }

  render() {
    const { loading, emailAddressText, passwordText, emailAddressError, passwordShowing, loginError } = this.state;
    return (
      <SafeAreaView>
        <ScrollView>
          {
            loading ? (
              <LoadingSpinner spinning={true} />
            ) :
            (
              <View style={styles.container}>
                <Input
                  placeholder="Email Address"
                  textContentType="emailAddress"
                  autoCapitalize='none'
                  value={emailAddressText}
                  leftIcon={
                    <Icon
                      name='envelope'
                      type='font-awesome'
                      iconStyle={styles.inputIcon}
                    />
                  }
                  inputStyle={styles.inputStyle}
                  errorMessage={emailAddressError ? "Please enter a valid email address" : ""}
                  onChangeText={(text) => this.setState({ emailAddressText: text, emailAddressError: false, })}
                />
                <Input
                  placeholder="Password"
                  textContentType="password"
                  secureTextEntry={!passwordShowing}
                  value={passwordText}
                  leftIcon={
                    <Icon
                      name='key'
                      type='font-awesome'
                      iconStyle={styles.inputIcon}
                    />
                  }
                  rightIcon={
                    <Icon
                      name={passwordShowing ? 'eye-slash' : 'eye'}
                      type='font-awesome'
                      iconStyle={styles.inputIcon}
                      onPress={() => this.setState({ passwordShowing: !passwordShowing })}
                    />
                  }
                  inputStyle={styles.inputStyle}
                  onChangeText={(text) => this.setState({ passwordText: text })}
                />
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 16,
                    color: 'red',
                    marginBottom: 10,
                    height: 20,
                  }}
                >
                  {
                    loginError &&
                    "Email or Password Incorrect."
                  }
                </Text>
                <Button
                  title="Sign in with FoodPicker"
                  raised={{}}
                  icon={{
                    name: 'home',
                    type: 'font-awesome',
                    color: 'white',
                    marginRight: 8
                  }}
                  titleStyle={{ fontWeight: '500', fontSize: 22 }}
                  buttonStyle={{
                    backgroundColor: '#E54040',
                    borderColor: 'transparent',
                    borderWidth: 0,
                    height: 60,
                  }}
                  containerStyle={{
                    width: '100%',
                    alignSelf: 'center',
                    marginTop: 10,
                    overflow: 'visible'
                  }}
                  onPress={() => { this.signIn(); }}
                />
                <Button
                  title="Forgot Password"
                  titleStyle={{
                    textAlign: 'center',
                    fontSize: 20,
                    marginTop: 10,
                    marginBottom: 10,
                    color: '#0645AD',
                  }}
                  buttonStyle={{
                    backgroundColor: 'transparent'
                  }}
                  onPress={() => this.props.navigation.navigate('Account')}
                />
                {/* <SignInWithGoogle /> */}
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 20,
                    marginTop: 30,
                    marginBottom: 50,
                    color: 'grey',
                  }}
                >
                  - OR -
                </Text>
                <Button
                  title="Create an Account"
                  raised
                  icon={{
                    name: 'user',
                    type: 'font-awesome',
                    color: 'black',
                    marginRight: 8
                  }}
                  titleStyle={{ fontWeight: '500', fontSize: 22, color: 'black' }}
                  buttonStyle={{
                    backgroundColor: '#fff',
                    height: 60,
                  }}
                  containerStyle={{
                    width: '100%',
                    alignSelf: 'center',
                    overflow: 'visible',
                  }}
                  onPress={() => { this.props.navigation.navigate('CreateAccount') }}
                />
              </View>
            )
          }
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: Constants.statusBarHeight,
    display: 'flex',
    justifyContent: 'flex-start',
    paddingLeft: 20,
    paddingRight: 20,
    height: '100%',
  },
  inputIcon: {
    paddingLeft: 10,
    color: 'black',
    fontSize: 24,
  },
  inputStyle: {
    fontSize: 20,
    paddingLeft: 10,
  }
});

export default Account;