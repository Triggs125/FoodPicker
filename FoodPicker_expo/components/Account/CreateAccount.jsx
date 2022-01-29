import { Component } from 'react';
import { SafeAreaView } from 'react-native';
import { Input, Text, Icon } from 'react-native-elements';
import { Button } from 'react-native-elements/dist/buttons/Button';
import PasswordValidator from 'password-validator';
import isAlpha from 'validator/lib/isAlpha';
import isEmail from 'validator/lib/isEmail';

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
    }
  }

  createAccount() {
    if (this.formValidation()) {

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
    const { firstNameError, emailAddressError, passwordShowing, passwordFailures } = this.state;
    return (
      <SafeAreaView style={{ paddingTop: 10 }}>
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
          inputStyle={styles.inputStyle}
          containerStyle={{
            marginTop: 15,
            marginBottom: 5
          }}
          errorMessage={firstNameError ? "Please enter a valid first name" : ""}
          onChangeText={(text) => this.setState({ firstNameText: text })}
        />
        <Input
          placeholder="Last Name"
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
          inputStyle={styles.inputStyle}
          containerStyle={{
            marginTop: 5,
            marginBottom: 5
          }}
          onChangeText={(text) => this.setState({ lastNameText: text })}
        />
        <Input
          placeholder="Email Address *"
          textContentType="emailAddress"
          autoCapitalize='none'
          leftIcon={
            <Icon
              name='envelope'
              type='font-awesome'
              iconStyle={styles.inputIcon}
            />
          }
          inputStyle={styles.inputStyle}
          containerStyle={{
            marginTop: 5,
            marginBottom: 5
          }}
          errorMessage={emailAddressError ? "Please enter a valid email address" : ""}
          onChangeText={(text) => this.setState({ emailAddressText: text })}
        />
        <Input
          placeholder="Password *"
          textContentType="password"
          secureTextEntry={!passwordShowing}
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
            marginTop: 5,
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
            marginTop: 20,
            overflow: 'visible'
          }}
          onPress={() => { this.createAccount() }}
        />
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            marginTop: 30,
            marginBottom: 30,
            color: 'grey',
          }}
        >
          OR
        </Text>
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
          onPress={() => { this.props.navigation.navigate('CreateAccount') }}
        />
      </SafeAreaView>
    );
  }
}

const styles = {
  inputIcon: {
    paddingLeft: 10,
    paddingRight: 10,
    color: 'black',
    fontSize: 24,
  },
  inputStyle: {
    fontSize: 20
  }
}

export default CreateAccount;