import { Component } from 'react';
import { SafeAreaView, View } from 'react-native';
import { Input, Text, Icon, Button } from 'react-native-elements';
import PasswordValidator from 'password-validator';
import isAlpha from 'validator/lib/isAlpha';
import isEmail from 'validator/lib/isEmail';
// import SignInWithGoogle from '../Utils/SignInWithGoogle';
import { AddUserToDB } from '../Utils/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';
import ThemeColors from '../../assets/ThemeColors';

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

    this.state = {
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
    }

    this.createAccount = this.createAccount.bind(this);
  }

  async createAccount() {
    if (this.formValidation()) {
      console.log("Valid Form");
      try {
        const res = await createUserWithEmailAndPassword(this.props.auth, this.state.emailAddressText, this.state.passwordText);
        const displayName = `${this.state.firstNameText}${this.state.lastNameText !== "" ? " " + this.state.lastNameText : ""}`;
        await updateProfile(this.props.auth.currentUser, {
          displayName: displayName
        });
        await AddUserToDB(this.props.db, res.user, this.state.firstNameText, this.state.lastNameText, displayName);
        this.setState({ firstNameText: "", lastNameText: "", emailAddressText: "", passwordText: "", passwordShowing: false });
        this.props.navigation.goBack();
        this.props.navigation.navigate('LobbyPicker');
      } catch (err) {
        console.error("Account Creation Error:", err);
        if (err.code === "auth/email-already-in-use") {
          this.setState({ emailExistsError: true });
        }
      }
    } else {
      console.log("Invalid Form");
    }
  }

  /**
   * Validates the form inputs
   * @returns {Boolean} If there were validation errors
   */
  formValidation() {
    const { firstNameText, lastNameText, emailAddressText, passwordText, passwordValidator } = this.state;

    // First Name Validation
    const validFirstName = isAlpha(firstNameText);

    // Last Name Validation
    const validLastName = true;
    if (lastNameText && lastNameText.trim() !== "") {
      if (!isAlpha(lastNameText)) {
        validLastName = false;
      }
    }

    // Email Validation
    const validEmailAddress = isEmail(emailAddressText);
    
    // Password Validation
    const passwordFailures = passwordValidator.validate(passwordText, { list: true, details: true });

    this.setState({ passwordFailures: passwordFailures, firstNameError: !validFirstName, lastNameError: !validLastName, emailAddressError: !validEmailAddress });

    return passwordFailures.length === 0 && validFirstName && validEmailAddress;
  }

  render() {
    const {
      firstNameError, 
      firstNameText,
      lastNameText,
      lastNameError,
      emailAddressError,
      emailAddressText,
      passwordText,
      passwordShowing,
      passwordFailures,
      emailExistsError
    } = this.state;

    return (
      <SafeAreaView style={{ paddingTop: 10 }}>
        <ScrollView style={styles.container}>
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
            errorMessage={lastNameError ? "Please enter a valid last name" : ""}
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
            errorMessage={emailAddressError ? "Please enter a valid email address" : ""}
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
          {
            emailExistsError &&
            <Text
              style={{
                textAlign: 'center',
                fontSize: 16,
                marginBottom: 10,
                color: 'red',
              }}
            >
              Email address already in use.
            </Text>
          }
          <View style={{ paddingHorizontal: 10 }}>
            <Button
              title="Create Account"
              raised
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
          </View>
          <View style={{ paddingHorizontal: 10 }}>
            <Button
              title="Sign In"
              type='clear'
              buttonStyle={{
                backgroundColor: ThemeColors.background
              }}
              titleStyle={{
                textAlign: 'center',
                fontSize: 20,
                marginTop: 10,
                marginBottom: 10,
                color: ThemeColors.text,
              }}
              onPress={() => this.props.navigation.navigate('Account')}
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
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = {
  container: {
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
}

export default CreateAccount;