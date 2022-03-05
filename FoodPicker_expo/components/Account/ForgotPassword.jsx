import { confirmPasswordReset, sendPasswordResetEmail } from "firebase/auth";
import { Component } from "react";
import { View } from "react-native";
import { Button, Input, Text, Icon } from "react-native-elements";
import PasswordValidator from 'password-validator';
import isEmail from "validator/lib/isEmail";
import ThemeColors from "../../assets/ThemeColors";

class ForgotPassword extends Component {
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
      emailAddressText: "",
      emailAddressError: false,
      resetPasswordLoading: false,
      inputNewPassword: false,
      passwordShowing: false,
      passwordFailures: [],
      passwordText: "",
      emailCode: "",
      updatePasswordLoading: false,
      passwordSchema,
    };
  }

  sendResetPasswordEmail() {
    const { emailAddressText } = this.state;

    if (!isEmail(emailAddressText)) {
      this.setState({ emailAddressError: true });
      return;
    }

    this.setState({ resetPasswordLoading: true });
    sendPasswordResetEmail(this.props.auth, emailAddressText)
    .then(() => {
      this.setState({ resetPasswordLoading: false, inputNewPassword: true });
    })
    .catch(err => {
      this.setState({ resetPasswordLoading: false, emailAddressError: true });
      console.error("ForgotPassword::sendResetPasswordEmail", err);
    })
  }

  updatePassword() {
    const { emailCode, passwordText, passwordSchema } = this.state;

    this.setState({ updatePasswordLoading: true });

    if (emailCode.trim() === "") {
      this.setState({ emailCodeError: true, updatePasswordLoading: false });
      return;
    }
    this.setState({ emailCodeError: false });

    // Password Validation
    const passwordFailures = passwordSchema.validate(passwordText, { list: true, details: true });
    this.setState({ passwordFailures });
    if (passwordFailures.length > 0) {
      this.setState({ updatePasswordLoading: false });
      return;
    }

    confirmPasswordReset(this.props.auth, emailCode, passwordText)
    .then(() => {
      this.setState({ emailCode: "", passwordText: "", updatePasswordLoading: false, updatePasswordError: false });
      this.props.navigation.navigate("Account");
    })
    .catch(err => {
      this.setState({ updatePasswordLoading: false, updatePasswordError: true });
      console.error("ForgotPassword::updatePassword", err);
    });
  }

  render() {
    const {
      emailAddressText, emailAddressError, resetPasswordLoading,
      passwordText, passwordShowing, passwordFailures,
      updatePasswordLoading, updatePasswordError,
      emailCode, emailCodeError,
    } = this.state;
    return (
      <View
        style={{
          marginTop: 10,
        }}
      >
        <Input
          placeholder="Email Address"
          textContentType="emailAddress"
          autoCapitalize='none'
          label="Email Address *"
          labelStyle={{ color: ThemeColors.text }}
          value={emailAddressText}
          leftIcon={
            <Icon
              name='envelope'
              type='font-awesome'
              iconStyle={{ fontSize: 18 }}
            />
          }
          inputContainerStyle={{
            paddingLeft: 5
          }}
          inputStyle={{
            paddingLeft: 5
          }}
          errorMessage={emailAddressError ? "Please enter a valid email address" : ""}
          onChangeText={(text) => this.setState({ emailAddressText: text, emailAddressError: false })}
        />
        <View style={{ paddingHorizontal: 10 }}>
          <Button
            title="Send Password Reset Email"
            loading={resetPasswordLoading}
            titleStyle={{ fontSize: 24 }}
            buttonStyle={{ backgroundColor: ThemeColors.button, borderRadius: 5 }}
            onPress={() => {
              this.sendResetPasswordEmail();
            }}
          />
        </View>
        {/**<View>
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
        </View>
        <View>
          <Input
            placeholder="Code from Email"
            textContentType="emailAddress"
            autoCapitalize='characters'
            label="Reset Code"
            labelStyle={{ color: ThemeColors.text }}
            value={emailCode}
            leftIcon={
              <Icon
                name='envelope'
                type='font-awesome'
                iconStyle={{ fontSize: 18 }}
              />
            }
            inputContainerStyle={{
              paddingLeft: 5
            }}
            inputStyle={{
              paddingLeft: 5
            }}
            onChangeText={(text) => this.setState({ emailCode: text })}
            errorMessage={emailCodeError ? "Email code is not valid" : ""}
          />
          <Input
            placeholder="New Password"
            textContentType="password"
            label="New Password"
            labelStyle={{ color: ThemeColors.text }}
            autoCapitalize="none"
            secureTextEntry={!passwordShowing}
            value={passwordText}
            leftIcon={
              <Icon
                name='key'
                type='font-awesome-5'
                iconStyle={{ fontSize: 18 }}
              />
            }
            rightIcon={
              <Icon
                name={passwordShowing ? 'eye-slash' : 'eye'}
                type='font-awesome'
                onPress={() => this.setState({ passwordShowing: !passwordShowing })}
              />
            }
            containerStyle={{
              marginBottom: 5
            }}
            inputContainerStyle={{
              paddingLeft: 5
            }}
            inputStyle={{
              paddingLeft: 5
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
          <View style={{ paddingHorizontal: 10 }}>
            {
              updatePasswordError && (
              <Text style={{ textAlign: 'center', color: ThemeColors.text, paddingBottom: 10, fontWeight: 'bold' }}>
                Error updating the password. Please try again or contact support.
              </Text>)
            }
            <Button
              title="Update Password"
              loading={updatePasswordLoading}
              titleStyle={{ fontSize: 24 }}
              buttonStyle={{ backgroundColor: ThemeColors.button, borderRadius: 5 }}
              onPress={() => {
                this.updatePassword();
              }}
            />
          </View>
        </View> */}
      </View>
    )
  }
}

export default ForgotPassword;