import { Component } from "react";
import { Dimensions, StatusBar, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text, Button, Switch, Overlay } from 'react-native-elements';
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import LocationView from "./LocationView";
import ThemeColors from "../../assets/ThemeColors";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import PasswordValidator from 'password-validator';
import Password from '../Utils/Password';
import { addDoc, collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import * as Analytics from 'expo-firebase-analytics';

class LobbyCreator extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 48 : 0;
    const adBannerHeight = StatusBar.currentHeight + 60;
    const screenHeight = Dimensions.get('screen').height - offset - adBannerHeight;

    var passwordSchema = new PasswordValidator();
    passwordSchema
      .is().min(4, " minimum of 4 characters")
      .is().max(50, " maximum of 50 characters")
      .has().not().spaces(0, " no spaces");

    const lobby = props.route?.params?.lobbyData;

    this.state = {
      screenHeight,
      lobbyPath: lobby?.path,
      lobbyName: lobby?.name || "",
      lobbyNameError: false,
      passwordFailures: [],
      passwordSchema,
      passwordProtected: lobby?.passwordProtected !== undefined ? lobby?.passwordProtected : true,
      passwordText: "",
      passwordShowing: false,
      passwordInLobby: lobby?.passwordProtected || false,
      location: lobby?.location,
      locationGeocodeAddress: lobby?.locationGeocodeAddress,
      locationError: false,
      distance: lobby?.distance,
      distanceError: false,
      loading: false,
      newLobby: lobby === undefined,
      removeLobbyOverlay: false,
      removeLobbyOverlayLoading: false,
      removeLobbyOverlayError: false,
    }

    this.setLocationData = this.setLocationData.bind(this);
    this.createLobby = this.createLobby.bind(this);
    this.validateForm = this.validateForm.bind(this);
  }

  async createLobby() {
    if (!this.validateForm()) {
      console.log("Form not valid")
      return;
    }

    const {
      passwordProtected, passwordText, lobbyName, location, locationGeocodeAddress, distance
    } = this.state;

    this.setState({ loading: true });
    let data = {
      active: true,
      host: this.props.user.uid,
      users: [this.props.user.uid],
      name: lobbyName.trim(),
      location,
      locationGeocodeAddress,
      distance,
      passwordProtected,
    };
    try {
      if (passwordProtected) {
        const hashedPassword = this.props.hashPassword(passwordText);
        addDoc(collection(this.props.db, 'lobbies'), data) // create lobbies doc
          .then((docRef) => {
            addDoc(collection(this.props.db, 'lobby_passwords'), { // create passwords doc
              passwordHash: hashedPassword,
              lobbyId: docRef.id,
              lobbyPath: docRef.path,
            })
              .then(() => {
                this.setState({ loading: false });
                this.props.navigation.goBack();
                this.props.navigation.navigate('LobbyView', { lobbyRef: docRef });
                Analytics.logEvent("event", {
                  description: "LobbyCreator::createLobby::LobbyCreated::PasswordProtected"
                });
              });
          })
          .catch(err => {
            Analytics.logEvent("exception", {
              description: "LobbyCreator::createLobby::passwordHash"
            });
            this.setState({ loading: false });
            console.error("LobbyCreator::createLobby::passwordHash", err);
          });
      } else {
        addDoc(collection(this.props.db, 'lobbies'), data)
          .then((docRef) => {
            this.setState({ loading: false })
            this.props.navigation.goBack();
            this.props.navigation.navigate('LobbyView', { lobbyRef: docRef });
            Analytics.logEvent("event", {
              description: "LobbyCreator::createLobby::LobbyCreated::NoPassword"
            });
          });
      }
    } catch(err) {
      Analytics.logEvent("exception", {
        description: "LobbyCreator::createLobby"
      });
      console.error("LobbyCreator::createLobby", err);
    }
  }

  updateLobby() {
    if (!this.validateForm()) {
      console.log("Form not valid")
      return;
    }
    
    const { lobbyData } = this.props.route?.params;
    const { lobbyName, location, locationGeocodeAddress, distance, passwordProtected, passwordInLobby, passwordText } = this.state;
    this.setState({ loading: true })
    let data = {
      active: true,
      name: lobbyName.trim(),
      location,
      locationGeocodeAddress,
      distance,
      passwordProtected,
    };
    
    setDoc(lobbyData.ref, data, { merge: true })
      .then(async () => {
        if (passwordProtected && !passwordInLobby) {
          const hashedPassword = this.props.hashPassword(passwordText);
          const passwordDoc = (await getDocs(query(collection(this.props.db, 'lobby_passwords'), where('lobbyId', '==', lobbyData.ref.id)))).docs[0];
          if (passwordDoc?.ref) {
            await setDoc(passwordDoc.ref, {
              passwordHash: hashedPassword,
              lobbyId: lobbyData.ref.id,
              lobbyPath: lobbyData.ref.path,
            });
          } else {
            await addDoc(collection(this.props.db, 'lobby_passwords'), {
              passwordHash: hashedPassword,
              lobbyId: lobbyData.ref.id,
              lobbyPath: lobbyData.ref.path,
              creator: this.props.user.uid,
            });
          }
        }
        this.setState({ loading: false });
        this.props.navigation.goBack();
        Analytics.logEvent("event", {
          description: `LobbyCreator::updateLobby::${passwordProtected ? 'PasswordProtected' : 'NoPassword'}`
        });
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "LobbyCreator::updateLobby"
        });
        console.error("LobbyCreator::updateLobby", err);
        this.setState({ loading: false });
      })
  }

  validateForm() {
    const {
      lobbyName, 
      passwordSchema, passwordProtected, passwordText, 
      distance, 
      location, locationGeocodeAddress
    } = this.state;

    const validLobbyName = lobbyName.length > 0;
    const passwordFailures =
      passwordProtected
        ? passwordSchema.validate(passwordText, { list: true, details: true })
        : [];
    const validLocation = location && locationGeocodeAddress;

    this.setState({
      passwordFailures,
      lobbyNameError: !validLobbyName,
      distanceError: !distance,
      locationError: !validLocation
    });

    return passwordFailures.length === 0 && validLobbyName && distance && validLocation;
  }

  setLocationData(location, locationGeocodeAddress, distance) {
    const data = {};
    if (location) {
      data.location = location;
    }
    if (locationGeocodeAddress) {
      data.locationGeocodeAddress = locationGeocodeAddress;
    }
    if (distance) {
      data.distance = distance;
    }
    this.setState(data);
  }

  removeLobbyOverlay() {
    const {
      removeLobbyOverlay, removeLobbyOverlayLoading, removeLobbyOverlayError
    } = this.state;
    const lobbyData = this.props.route?.params?.lobbyData;
    return (
      <Overlay
        isVisible={removeLobbyOverlay}
        overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
        onBackdropPress={() => {
          this.setState({
            removeLobbyOverlay: false,
            removeLobbyOverlayUser: null,
            removeLobbyOverlayLoading: false,
          });
        }}
      >
        <Text
          style={{ fontSize: 24, textAlign: 'center', marginTop: 10, marginBottom: 20 }}
        >
          {`${lobbyData?.name}`}
        </Text>
        {
          removeLobbyOverlayError && (
            <Text style={{ textAlign: 'center' }}>Error removing the user. Please try again or contact support.</Text>
          )
        }
        <Button
          title="Remove Lobby"
          loading={removeLobbyOverlayLoading}
          titleStyle={{ fontSize: 24 }}
          buttonStyle={{ backgroundColor: ThemeColors.button }}
          onPress={() => {
            this.setState({ removeLobbyOverlayLoading: true });
            this.removeLobby()
              .then(() => {
                this.setState({
                  removeLobbyOverlay: false,
                  removeLobbyOverlayLobby: null,
                  removeLobbyOverlayLoading: false,
                });
                this.props.navigation.navigate("LobbyPicker");
                Analytics.logEvent("event", {
                  description: "LobbyCreator::removeLobbyOverlay::LobbyRemoved"
                });
              })
              .catch(err => {
                Analytics.logEvent("exception", {
                  description: "LobbyCreator::RemoveLobbyOverlay"
                });
                console.error("LobbyCreator::RemoveLobbyOverlay", err);
                this.setState({
                  removeLobbyOverlayLoading: false,
                  removeLobbyOverlayError: true,
                });
              });
          }}
        />
        <Button
          title="Cancel"
          type="clear"
          disabled={removeLobbyOverlayLoading}
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          onPress={() => {
            this.setState({
              removeLobbyOverlay: false,
              removeLobbyOverlayLobby: null,
            });
          }}
        />
      </Overlay>
    );
  }

  async removeLobby() {
    const lobbyData = this.props.route?.params?.lobbyData;
    return setDoc(doc(this.props.db, lobbyData.ref.path), { active: false }, { merge: true });
  }

  render() {
    const {
      screenHeight,
      lobbyName, lobbyNameError,
      passwordFailures, passwordProtected, passwordShowing, passwordText, passwordInLobby,
      distanceError,
      locationError, location, locationGeocodeAddress, distance,
      loading,
      newLobby,
    } = this.state;
    const lobbyData = this.props.route?.params?.lobbyData;
    const ownsLobby = lobbyData?.host === this.props.user.uid;
    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            key={'lobby-creator-view'}
            style={{
              height: screenHeight - headerHeight,
              justifyContent: 'space-between',
              paddingHorizontal: 10,
            }}
          >
            {this.removeLobbyOverlay()}
            <ScrollView>
              <Input
                placeholder="Lobby Name"
                textContentType="name"
                inputStyle={{ fontSize: 24, paddingLeft: 5 }}
                disabled={loading}
                leftIcon={
                  <Icon
                    name='solution1'
                    type='ant-design'
                    iconStyle={{
                      marginLeft: 2,
                      marginRight: 3,
                      alignSelf: 'flex-start',
                    }}
                  />
                }
                value={lobbyName}
                containerStyle={{
                  marginTop: 15,
                  backgroundColor: 'white',
                  borderColor: 'lightgray',
                  borderWidth: 1.5,
                  borderRadius: 10,
                  marginBottom: 10
                }}
                errorMessage={lobbyNameError ? "Please enter a valid lobby name" : ""}
                onChangeText={(text) => this.setState({ lobbyName: text })}
              />
              <View style={{
                marginVertical: 10,
                backgroundColor: 'white',
                padding: 10,
                borderWidth: 1.5,
                borderColor: 'lightgray',
                borderRadius: 10,
              }}>
                <View
                  style={{
                    flexDirection: 'row',
                    marginHorizontal: 10,
                  }}
                >
                  <Switch
                    value={passwordProtected}
                    color={ThemeColors.button}
                    onValueChange={(value) => this.setState({ passwordProtected: value })}
                  />
                  <Text style={{ marginLeft: 10, alignSelf: 'center', fontSize: 24 }}>Password Protected?</Text>
                </View>
                {
                  passwordProtected && (
                    !passwordInLobby ? (
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
                            size={18}
                          />
                        }
                        rightIcon={
                          <TouchableOpacity onPress={() => this.setState({ passwordShowing: !passwordShowing })}>
                            <Text style={{ color: 'gray' }}>{passwordShowing ? 'hide' : 'show'}</Text>
                          </TouchableOpacity>
                        }
                        onChangeText={(text) => this.setState({ passwordText: text })}
                        inputStyle={{ fontSize: 24, paddingLeft: 5 }}
                        containerStyle={{ marginTop: 10 }}
                        errorMessage={passwordFailures.length > 0 ?
                          "Password requirements:" +
                          passwordFailures.flatMap((failure) => {
                            return failure.message;
                          }) + "."
                          : ""
                        }
                      />
                    ) : (
                      <Button
                        title="Change Password"
                        raised
                        titleStyle={{ fontSize: 24, color: 'white' }}
                        buttonStyle={{ backgroundColor: ThemeColors.button }}
                        containerStyle={{ marginVertical: 10, marginHorizontal: 5 }}
                        onPress={() => this.setState({ passwordInLobby: false })}
                      />
                    )
                  )
                }
              </View>
              <LocationView
                {...this.props}
                location={location}
                locationGeocodeAddress={locationGeocodeAddress}
                distance={distance}
                setLocationData={this.setLocationData}
                isHost={true}
                loading={false}
                locationError={locationError}
                distanceError={distanceError}
              />
              {
                !newLobby && ownsLobby && (
                  <Button
                    title="Delete Lobby"
                    titleStyle={{
                      color: ThemeColors.text,
                      fontSize: 20,
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
                      if (ownsLobby) {
                        this.setState({ removeLobbyOverlay: true });
                      }
                    }}
                  />
                )
              }
            </ScrollView>
            <View style={{ marginTop: 5 }}>
              <Button
                title={lobbyData ? "Update Lobby" : "Create Lobby"}
                titleStyle={{ fontSize: 24 }}
                loading={loading}
                loadingStyle={{ paddingVertical: 7 }}
                containerStyle={{ marginBottom: 10 }}
                buttonStyle={{ backgroundColor: ThemeColors.button }}
                raised
                onPress={() => lobbyData ? this.updateLobby() : this.createLobby()}
              />
              <Button
                title="Cancel"
                type="clear"
                raised
                disabled={loading}
                titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
                containerStyle={{ marginBottom: 10 }}
                onPress={() => this.props.navigation.goBack()}
              />
            </View>
          </View>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

export default Password(LobbyCreator);