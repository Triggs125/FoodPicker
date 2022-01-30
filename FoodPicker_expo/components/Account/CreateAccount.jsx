import { Component } from 'react';
import { SafeAreaView } from 'react-native';
import { Input, Text, Icon } from 'react-native-elements';
import { Button } from 'react-native-elements/dist/buttons/Button';
import PasswordValidator from 'password-validator';
import isAlpha from 'validator/lib/isAlpha';
import isEmail from 'validator/lib/isEmail';
// import SignInWithGoogle from '../Utils/SignInWithGoogle';
import { AddUserToDB } from '../Utils/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView } from 'react-native-gesture-handler';

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
        const user = await AddUserToDB(this.props.db, res.user, this.state.firstNameText, this.state.lastNameText);
        AsyncStorage.setItem("@user_foodpicker", JSON.stringify(res.user.uid));
        this.setState({ firstNameText: "", lastNameText: "", emailAddressText: "", passwordText: "" });
        this.props.navigation.navigate('Lobby', { user: user });
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
    const { firstNameText, emailAddressText, passwordText, passwordValidator } = this.state;

    // First Name Validation
    const validFirstName = isAlpha(firstNameText);

    // Email Validation
    const validEmailAddress = isEmail(emailAddressText);
    
    // Password Validation
    const passwordFailures = passwordValidator.validate(passwordText, { list: true, details: true });

    this.setState({ passwordFailures: passwordFailures, firstNameError: !validFirstName, emailAddressError: !validEmailAddress });

    return passwordFailures.length === 0 && validFirstName && validEmailAddress;
  }

  render() {
    const {
      firstNameError, 
      firstNameText,
      lastNameText,
      emailAddressError,
      emailAddressText,
      passwordText,
      passwordShowing,
      passwordFailures,
      emailExistsError
    } = this.state;

    return (
      <SafeAreaView style={{ paddingTop: 10 }}>
        <ScrollView>
          <Input
            placeholder="First Name *"
            textContentType="name"
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
            placeholder="Email Address *"
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
            onChangeText={(text) => this.setState({ emailAddressText: text })}
          />
          <Input
            placeholder="Password *"
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
          <Button
            title="Create Account"
            raised={{}}
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
              width: 330,
              alignSelf: 'center',
              marginTop: 0,
              overflow: 'visible'
            }}
            onPress={this.createAccount}
          />
          <Button
            title="Sign In"
            titleStyle={{
              textAlign: 'center',
              fontSize: 20,
              marginTop: 10,
              marginBottom: 10,
              color: '#0645AD',
            }}
            onPress={() => this.props.navigation.navigate('Account')}
          />
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