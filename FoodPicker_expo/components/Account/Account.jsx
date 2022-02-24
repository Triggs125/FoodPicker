import { Component } from "react";
import { Dimensions, SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Input, Button, Text, Icon } from 'react-native-elements';
import { GetUserFromDB } from '../Utils/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import isEmail from 'validator/lib/isEmail';
import { HeaderHeightContext } from '@react-navigation/elements';

class Account extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: true,
      loginError: false,
      generalError: false,
      emailAddressText: "",
      passwordText: "",
      passwordShowing: false,
      emailAddressError: false,
    }
  }

  async signIn() {
    const { emailAddressText, passwordText } = this.state;
    if (isEmail(emailAddressText) && passwordText.length > 0) {
      try {
        const res = await signInWithEmailAndPassword(this.props.auth, emailAddressText, passwordText);
        const user = await GetUserFromDB(this.props.db, res.user.uid);
        this.setState({ emailAddressText: "", passwordText: "", passwordShowing: false });
        this.props.navigation.navigate('LobbyPicker');
      } catch (err) {
        console.error("Sign In Error:", err);
        if (
          err.code === "auth/email-already-in-use" ||
          err.code === "auth/wrong-password" ||
          err.code === "auth/user-not-found"
        ) {
          this.setState({ loginError: true, generalError: false });
        } else {
          this.setState({ loginError: false, generalError: true });
        }
      }
    } else {
      this.setState({ emailAddressError: true });
    }
  }

  userLoggedIn(headerHeight) {
    return (
      <View style={{ ...styles.container, height: screenHeight - headerHeight }}>
        <View>
          <Icon name="user-circle" type="font-awesome" iconStyle={{ fontSize: 200 }} />
          <Text
            style={{ textAlign: 'center', fontSize: 30 }}
          >
            {this.props.user?.displayName}
          </Text>
        </View>
        <Button
          title="Join or Create a Lobby"
          raised
          titleStyle={{ color: 'white', fontSize: 26, paddingLeft: 3 }}
          buttonStyle={{ justifyContent: 'space-between', backgroundColor: '#E54040' }}
          icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, color: 'white', paddingRight: 3 }} />}
          iconRight
          onPress={() => this.props.navigation.navigate('LobbyPicker')}
        />
        <Button
          title="Settings"
          raised
          titleStyle={{ color: 'black', fontSize: 26, paddingLeft: 3 }}
          buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'lightgray' }}
          icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, paddingRight: 3 }} />}
          iconRight
          onPress={() => this.props.navigation.navigate('Settings')}
        />
        <Button
          buttonStyle={{ backgroundColor: 'transparent' }}
          title="Sign Out"
          titleStyle={{ color: '#E54040', fontSize: 30, textAlign: 'center', fontWeight: 'normal' }}
          onPress={() => { signOut(this.props.auth) }}
          containerStyle={{ marginBottom: 10 }}
        />
      </View>
    );
  }

  render() {
    const { loading, emailAddressText, passwordText, emailAddressError, passwordShowing, loginError, generalError } = this.state;
    return (
      <SafeAreaView>
        <ScrollView>
          <HeaderHeightContext.Consumer>
            {headerHeight => (
              this.props.user ? (
                this.userLoggedIn(headerHeight)
              ) :
                (
                  <View style={{ ...styles.container, height: screenHeight - headerHeight }}>
                    <Text style={{ textAlign: 'center', fontSize: 35 }}>Log In</Text>
                    <View>
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
                        autoCapitalize='none'
                        value={passwordText}
                        leftIcon={
                          <Icon
                            name='key'
                            type='font-awesome-5'
                            iconStyle={styles.inputIcon}
                          />
                        }
                        rightIcon={
                          <TouchableOpacity onPress={() => this.setState({ passwordShowing: !passwordShowing })}>
                            <Text style={{ color: 'gray' }}>{passwordShowing ? 'hide' : 'show'}</Text>
                          </TouchableOpacity>
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
                          flexWrap: 'wrap'
                        }}
                      >
                        {
                          loginError &&
                          "Email or Password Incorrect."
                        }
                        {
                          generalError &&
                          "Error logging in. Please try again or contact support."
                        }
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
                      </Text>
                    </View>
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
                        marginBottom: 20,
                      }}
                      onPress={() => { this.props.navigation.navigate('CreateAccount') }}
                    />
                  </View>
                )
              )
            }
          </HeaderHeightContext.Consumer>
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const offset = Constants.platform.android ? 35 : 0;
const adBannerHeight = 60;
const screenHeight = Dimensions.get('screen').height - offset - adBannerHeight;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 20,
    paddingRight: 20,
  },
  inputIcon: {
    paddingLeft: 10,
    color: 'black',
    fontSize: 18,
  },
  inputStyle: {
    fontSize: 20,
    paddingLeft: 10,
  }
});

export default Account;