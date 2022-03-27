import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { Component } from "react";
import { View, Dimensions, StatusBar } from "react-native";
import { Input, Icon, Button, Text, Overlay } from 'react-native-elements';
import ThemeColors from "../../assets/ThemeColors";
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import isAlpha from 'validator/lib/isAlpha';
import { updateProfile } from 'firebase/auth';
import { ScreenWidth } from "react-native-elements/dist/helpers";

class AccountEdit extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 50 : 20;
    const adBannerHeight = StatusBar.currentHeight + 60;
    const screenHeight = Dimensions.get('screen').height - offset - adBannerHeight;

    this.state = {
      loadingData: true,
      updatingData: false,
      screenHeight: screenHeight,
      firstNameText: "",
      lastNameText: "",
      firstNameError: false,
      lastNameText: false,
      removeAccountOverlayShowing: false,
      removeAccountOverlayLoading: false,
      removeAccountOverlayError: false,
    };

    this.componentDidAppear = this.componentDidAppear.bind(this);
    this.updateAccount = this.updateAccount.bind(this);
    this.validForm = this.validForm.bind(this);
  }

  componentDidMount() {
    this.props.navigation.addListener('focus', () => {
      this.componentDidAppear();
    });
    if (this.unsubscribe === undefined) {
      this.componentDidAppear();
    }
  }

  componentDidAppear() {
    getDocs(query(collection(this.props.db, 'users'), where('uid', '==', this.props.user.uid)))
    .then(docs => {
      const user = docs.docs[0];
      this.setState({
        firstNameText: user.data().firstName,
        lastNameText: user.data().lastName,
        emailAddressText: user.data().email,
        loadingData: false,
        error: false,
        userRef: user.ref,
      });
    })
    .catch(err => {
      console.error("AccountEdit::componentDidAppear", err);
      this.setState({ loadingData: false, error: true });
    });
  }

  updateAccount() {
    const { firstNameText, lastNameText, userRef } = this.state;
    if (this.validForm()) {
      console.log("Updating data")
      this.setState({ updatingData: true });
      const displayName = `${this.state.firstNameText}${this.state.lastNameText !== "" ? " " + this.state.lastNameText : ""}`;
      setDoc(userRef, { firstName: firstNameText, lastName: lastNameText }, { merge: true })
      .then(() => {
        updateProfile(this.props.user, { displayName: displayName })
        .then(() => {
          this.setState({ updatingData: false, loading: false, error: false });
          const updatedUser = { ...this.props.user, firstName: firstNameText, lastName: lastNameText };
          console.log("Setting user", updatedUser)
          this.props.setUser(updatedUser);
          this.props.navigation.navigate("Account");
        });
      })
      .catch(err => {
        this.setState({ error: true, loading: false });
        console.error("AccountEdit::updateAccount", err);
      })
    }
  }

  validForm() {
    const { firstNameText, lastNameText } = this.state;

    // First Name Validation
    const validFirstName = isAlpha(firstNameText);

    // Last Name Validation
    let validLastName = true;
    if (lastNameText && lastNameText.trim() !== "") {
      if (!isAlpha(lastNameText)) {
        validLastName = false;
      }
    }

    this.setState({ firstNameError: !validFirstName, lastNameError: !validLastName });

    return validFirstName && validLastName;
  }

  removeAccount() {
    deleteDoc(this.state.userRef)
      .then(() => {
        deleteUser(this.props.user)
          .then(() => {
            this.setState({
              removeAccountOverlayShowing: false,
              removeAccountOverlayLoading: false,
              removeAccountOverlayError: false,
            });
            this.props.navigation.navigate("Account");
          })
          .catch(err => {
            console.error("LobbyCreator::removeAccount::deleteUser", err);
            this.setState({
              removeAccountOverlayLoading: false,
              removeAccountOverlayError: true,
            });
          });
      })
      .catch(err => {
        console.error("LobbyCreator::removeAccount::deleteDoc", err);
        this.setState({
          removeAccountOverlayError: true,
          removeAccountOverlayLoading: false,
        });
      });
  }

  removeAccountOverlay() {
    const {
      removeAccountOverlayShowing, removeAccountOverlayLoading, removeAccountOverlayError,
      firstNameText, lastNameText
    } = this.state;
    return (
      <Overlay
        isVisible={removeAccountOverlayShowing}
        overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
        onBackdropPress={() => {
          this.setState({
            removeAccountOverlayShowing: false,
            removeAccountOverlayLoading: false,
          });
        }}
      >
        <Text
          style={{ fontSize: 24, textAlign: 'center', marginTop: 10, marginBottom: 20 }}
        >
          {`${firstNameText}${lastNameText && ' ' + lastNameText}`}
        </Text>
        {
          removeAccountOverlayError && (
            <Text style={{ textAlign: 'center' }}>Error removing the user. Please try again or contact support.</Text>
          )
        }
        <Button
          title="Delete Account"
          loading={removeAccountOverlayLoading}
          titleStyle={{ fontSize: 24 }}
          buttonStyle={{ backgroundColor: ThemeColors.button }}
          onPress={() => {
            this.setState({ removeAccountOverlayLoading: true });
            this.removeAccount();
          }}
        />
        <Button
          title="Cancel"
          type="clear"
          disabled={removeAccountOverlayLoading}
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          onPress={() => {
            this.setState({
              removeAccountOverlayShowing: false,
            });
          }}
        />
      </Overlay>
    );
  }

  render() {
    const {
      firstNameText, lastNameText,
      firstNameError, lastNameError,
      emailAddressText,
      screenHeight,
      loadingData,
      updatingData,
      error,
    } = this.state;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View style={{ height: screenHeight - headerHeight, justifyContent: 'space-between' }}>
            {this.removeAccountOverlay()}
            <View>
              <Text style={{ textAlign: 'center', color: ThemeColors.text }}>
                { error && "Error loading or updating data. Please try again or contact support." }
              </Text>
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
                      fontSize: 18,
                      marginLeft: 2,
                      marginRight: 3,
                    }}
                  />
                }
                value={firstNameText}
                inputStyle={{ fontSize: 20 }}
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
                      fontSize: 18,
                      marginLeft: 2,
                      marginRight: 3,
                    }}
                  />
                }
                inputStyle={{ fontSize: 20 }}
                errorMessage={lastNameError ? "Please enter a valid last name" : ""}
                onChangeText={(text) => this.setState({ lastNameText: text })}
              />
              <Input
                placeholder="Email Address"
                disabled
                textContentType="name"
                label="Email Address"
                labelStyle={{ color: ThemeColors.text }}
                value={emailAddressText}
                leftIcon={
                  <Icon
                    name='envelope'
                    type='font-awesome'
                    iconStyle={{
                      fontSize: 18,
                      marginLeft: 2,
                      marginRight: 3,
                    }}
                  />
                }
                inputStyle={{ fontSize: 20 }}
              />
              <Button
                title="Delete Account"
                titleStyle={{
                  color: ThemeColors.text,
                  fontSize: 16,
                }}
                type="clear"
                icon={
                  <Icon
                    name="warning"
                    type="font-awesome"
                    color={ThemeColors.text}
                    style={{
                      paddingRight: 10,
                    }}
                    size={20}
                  />
                }
                containerStyle={{ marginTop: 20 }}
                onPress={() => {
                  this.setState({ removeAccountOverlayShowing: true });
                }}
              />
            </View>
            <View style={{ marginBottom: 15, marginHorizontal: 10 }}>
              <Button
                title="Update Account"
                raised
                disabled={loadingData}
                loading={updatingData}
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
                  overflow: 'visible',
                }}
                onPress={this.updateAccount}
              />
            </View>
          </View>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

export default AccountEdit;