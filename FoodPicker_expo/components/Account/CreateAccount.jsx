import { Component } from 'react';
import { View, Dimensions, KeyboardAvoidingView, StatusBar } from 'react-native';
import { Input, Text, Icon, Button, Switch } from 'react-native-elements';
import PasswordValidator from 'password-validator';
import isAlpha from 'validator/lib/isAlpha';
import isEmail from 'validator/lib/isEmail';
// import SignInWithGoogle from '../Utils/SignInWithGoogle';
import { AddUserToDB } from '../Utils/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import ThemeColors from '../../assets/ThemeColors';
import * as Analytics from 'expo-firebase-analytics';

class CreateAccount extends Component {
  constructor(props) {
    super(props);

    var passwordSchema = new PasswordValidator();
    passwordSchema
      .is().min(8, " minimum of 8 characters")
      .is().max(100, " maximum of 100 characters")
      .has().uppercase(1, " at least 1 uppercase letter")
      .has().lowercase(1, " at least 1 lowercase letter")
      .has().digits(1, " at least 1 number")
      .has().not().spaces(0, " no spaces");

    const offset = Constants.platform.android ? 48 : 10;
    const adBannerHeight = StatusBar.currentHeight + 60;
    const screenHeight = Dimensions.get('screen').height - offset - adBannerHeight;

    this.state = {
      screenHeight,
      firstNameError: false,
      firstNameText: "",
      lastNameText: "",
      emailAddressText: "",
      emailAddressError: false,
      passwordText: "",
      passwordFailures: [],
      passwordShowing: false,
      passwordValidator: passwordSchema,
      emailExistsError: false,
      loading: false,
    }

    this.createAccount = this.createAccount.bind(this);
  }

  async createAccount() {
    if (this.formValidation()) {
      this.setState({ loading: true });
      createUserWithEmailAndPassword(this.props.auth, this.state.emailAddressText, this.state.passwordText)
        .then(async (res) => {
          const displayName = `${this.state.firstNameText}${this.state.lastNameText !== "" ? " " + this.state.lastNameText : ""}`;
          await updateProfile(this.props.auth.currentUser, {
            displayName: displayName
          });
          await AddUserToDB(this.props.db, res.user, this.state.firstNameText, this.state.lastNameText, displayName);
          this.setState({
            firstNameText: "",
            lastNameText: "",
            emailAddressText: "",
            passwordText: "",
            passwordShowing: false,
            loading: false,
          });
          this.props.navigation.navigate('LobbyPicker');
          Analytics.logEvent("event", {
            description: "CreateAccount::createUserWithEmailAndPassword::UserCreated"
          });
        }).catch(err => {
          Analytics.logEvent("exception", {
            description: "CreateAccount::createUserWithEmailAndPassword"
          });
          console.error("CreateAccount::createUserWithEmailAndPassword", err);
          if (err.code === "auth/email-already-in-use") {
            this.setState({ emailExistsError: true });
          }
          this.setState({ loading: false });
        });
    } else {
      console.log("Invalid Form");
    }
  }

  /**
   * Validates the form inputs
   * @returns {Boolean} If there were validation errors
   */
  formValidation() {
    const { firstNameText, emailAddressText, passwordText, passwordValidator, oldEnoughValue } = this.state;

    // First Name Validation
    const validFirstName = isAlpha(firstNameText);

    // Email Validation
    const validEmailAddress = isEmail(emailAddressText);
    
    // Password Validation
    const passwordFailures = passwordValidator.validate(passwordText, { list: true, details: true });

    this.setState({ 
      passwordFailures: passwordFailures,
      firstNameError: !validFirstName,
      emailAddressError: !validEmailAddress,
      oldEnoughError: !oldEnoughValue,
    });

    return passwordFailures.length === 0 && validFirstName && validEmailAddress && oldEnoughValue;
  }

  render() {
    const {
      screenHeight,
      firstNameError, 
      firstNameText,
      lastNameText,
      emailAddressError,
      emailAddressText,
      passwordText,
      passwordShowing,
      passwordFailures,
      emailExistsError,
      oldEnoughValue,
      oldEnoughError,
      loading,
    } = this.state;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <KeyboardAvoidingView style={{ height: screenHeight - headerHeight, justifyContent: 'space-between' }}>
            <View>
              <Input
                placeholder="First Name"
                textContentType="name"
                label="First Name *"
                labelStyle={{ color: ThemeColors.text }}
                leftIcon={
                  <Icon
                    name='user'
                    type='font-awesome'
                    iconStyle={{
                      ...styles.inputIcon,
                      marginLeft: 2,
                      marginRight: 3,
                    }}
                  />
                }
                value={firstNameText}
                inputStyle={styles.inputStyle}
                containerStyle={{
                  marginTop: 15
                }}
                errorMessage={firstNameError ? "Please enter a valid first name" : ""}
                onChangeText={(text) => this.setState({ firstNameText: text })}
              />
              <Input
                placeholder="Last Name"
                textContentType="name"
                label="Last Name"
                labelStyle={{ color: ThemeColors.text }}
                value={lastNameText}
                leftIcon={
                  <Icon
                    name='user'
                    type='font-awesome'
                    iconStyle={{
                      ...styles.inputIcon,
                      marginLeft: 2,
                      marginRight: 3,
                    }}
                  />
                }
                inputStyle={styles.inputStyle}
                onChangeText={(text) => this.setState({ lastNameText: text })}
              />
              <Input
                placeholder="Email Address"
                textContentType="emailAddress"
                label="Email Address *"
                labelStyle={{ color: ThemeColors.text }}
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
                errorMessage={emailAddressError ? "Please enter a valid email address" : emailExistsError ? "Email address already in use" : ""}
                onChangeText={(text) => this.setState({ emailAddressText: text })}
              />
              <Input
                placeholder="Password"
                textContentType="password"
                label="Password *"
                labelStyle={{ color: ThemeColors.text }}
                autoCapitalize="none"
                secureTextEntry={!passwordShowing}
                value={passwordText}
                leftIcon={
                  <Icon
                    name='key'
                    type='font-awesome-5'
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
                containerStyle={{
                  marginBottom: 5
                }}
                errorMessage={passwordFailures.length > 0 ?
                    "Password requirements:" +
                    passwordFailures.flatMap((failure) => {
                      return failure.message;
                    }) + "."
                    : ""
                }
                onChangeText={(text) => this.setState({ passwordText: text })}
              />
              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    marginHorizontal: 10,
                  }}
                >
                  <Switch
                    value={oldEnoughValue}
                    color={ThemeColors.button}
                    onValueChange={(value) => this.setState({ oldEnoughValue: value, oldEnoughError: false })}
                  />
                  <Text style={{ marginLeft: 10, alignSelf: 'center', fontSize: 22 }}>Are you 13 or older?</Text>
                </View>
                <Text
                  style={{ color: 'red', marginLeft: 15, fontSize: 12 }}
                >
                  {oldEnoughError && "You must be 13 years old or older to create an account."}
                </Text>
              </View>
              {
                (emailAddressError || emailExistsError || passwordFailures.length > 0 || firstNameError || oldEnoughError) && (
                  <Text
                    style={{
                      color: "red",
                      fontSize: 18,
                      textAlign: 'center',
                      marginTop: 10,
                    }}
                  >
                    There are errors above. Please fix them before trying again.
                  </Text>
                )
              }
            </View>
            <View style={{ marginHorizontal: 10 }}>
              <Button
                title="Create Account"
                raised
                loading={loading}
                loadingStyle={{ paddingVertical: 10 }}
                icon={{
                  name: 'user-plus',
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
                  marginTop: 0,
                  overflow: 'visible'
                }}
                onPress={this.createAccount}
              />
              <Button
                title="Sign In"
                type='clear'
                titleStyle={{
                  textAlign: 'center',
                  fontSize: 20,
                  marginTop: 10,
                  marginBottom: 10,
                  color: ThemeColors.text,
                }}
                onPress={() => this.props.navigation.navigate('Home')}
              />
            </View>
            {/* <Text
              style={{
                textAlign: 'center',
                fontSize: 20,
                marginTop: 30,
                marginBottom: 40,
                color: 'grey',
              }}
            >
              - OR -
            </Text>
            <SignInWithGoogle auth={this.props.auth} /> */}
          </KeyboardAvoidingView>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

const styles = {
  inputIcon: {
    paddingLeft: 10,
    color: 'black',
    fontSize: 20,
  },
  inputStyle: {
    fontSize: 20,
    paddingLeft: 10,
  }
}

export default CreateAccount;