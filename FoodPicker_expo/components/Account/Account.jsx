import { Component } from "react";
import { Dimensions, KeyboardAvoidingViewBase, Keyboard, SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Input, Button, Text, Icon, Overlay } from 'react-native-elements';
import { GetUserFromDB } from '../Utils/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import isEmail from 'validator/lib/isEmail';
import { HeaderHeightContext } from '@react-navigation/elements';
import ThemeColors from "../../assets/ThemeColors";

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
        <View style={{ paddingHorizontal: 10 }}>
          <Icon name="user-circle" type="font-awesome" iconStyle={{ fontSize: 180 }} />
          <Text
            style={{ textAlign: 'center', fontSize: 30, marginTop: 15 }}
            ellipsizeMode='tail'
            numberOfLines={1}
          >
            {this.props.user?.displayName}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 10 }}>
          <Button
            title="Join or Create a Lobby"
            raised
            titleStyle={{ color: 'white', fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: '#E54040' }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, color: 'white', paddingRight: 3 }} />}
            iconRight
            onPress={() => this.props.navigation.navigate('LobbyPicker')}
            containerStyle={{ marginBottom: 20 }}
          />
          <Button
            title="Edit Account"
            raised
            titleStyle={{ color: 'black', fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'lightgray' }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, paddingRight: 3 }} />}
            iconRight
            onPress={() => this.props.navigation.navigate('AccountEdit')}
          />
        </View>
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

  userNotLoggedIn(headerHeight) {
    const {
      emailAddressText, passwordText, emailAddressError, passwordShowing, loginError, generalError
    } = this.state;

    return (
      <View style={{ ...styles.container, height: screenHeight - headerHeight }}>
        <View>
          <Text style={{ textAlign: 'center', fontSize: 35 }}>Log In</Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 16,
              color: ThemeColors.text,
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
          </Text>
          <Input
            placeholder="Email Address"
            textContentType="emailAddress"
            autoCapitalize='none'
            label="Email Address"
            labelStyle={{ color: ThemeColors.text }}
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
            label="Password"
            labelStyle={{ color: ThemeColors.text }}
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
          <View style={{ paddingHorizontal: 10 }}>
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
              type='clear'
              titleStyle={{
                textAlign: 'center',
                fontSize: 20,
                marginTop: 5,
                marginBottom: 5,
                color: ThemeColors.text,
              }}
              containerStyle={{ marginBottom: -10 }}
              onPress={() => this.props.navigation.navigate('ForgotPassword')}
            />
          </View>
        </View>
        {/* <SignInWithGoogle /> */}
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            // marginTop: 40,
            // marginBottom: 40,
            color: 'grey',
          }}
        >
          - OR -
        </Text>
        <View style={{ paddingHorizontal: 10 }}>
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
      </View>
    );
  }

  render() {
    return (
      <SafeAreaView>
        <HeaderHeightContext.Consumer>
          {headerHeight => (
            this.props.user ? (
              this.userLoggedIn(headerHeight)
            ) : (
              this.userNotLoggedIn(headerHeight)
            )
          )}
        </HeaderHeightContext.Consumer>
      </SafeAreaView>
    );
  }
}

const offset = Constants.platform.android ? 35 : 0;
const adBannerHeight = 60;
const screenHeight = Dimensions.get('screen').height - offset;

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 15,
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