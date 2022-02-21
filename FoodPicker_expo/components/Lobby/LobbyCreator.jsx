import { Component } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text, Button, Switch } from 'react-native-elements';
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import LocationView from "./LocationView";
import ThemeColors from "../../assets/ThemeColors";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import PasswordValidator from 'password-validator';
import Password from '../Utils/Password';
import { addDoc, collection, doc } from "firebase/firestore";

class LobbyCreator extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 48 : 0;
    const screenHeight = Dimensions.get('screen').height - offset;

    var passwordSchema = new PasswordValidator();
    passwordSchema
      .is().min(4, " minimum of 4 characters")
      .is().max(50, " maximum of 50 characters")
      .has().not().spaces(0, " no spaces");

    this.state = {
      screenHeight,
      lobbyName: "",
      lobbyNameError: false,
      passwordFailures: [],
      passwordSchema,
      passwordProtected: true,
      passwordText: "",
      passwordShowing: false,
      location: undefined,
      locationGeocodeAddress: undefined,
      locationError: false,
      distance: undefined,
      distanceError: false,
    }

    this.setLocationData = this.setLocationData.bind(this);
    this.createLobby = this.createLobby.bind(this);
    this.validateForm = this.validateForm.bind(this);
  }

  componentDidMount() {
    
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
      name: 'Default Lobby',
      users: [this.props.user.uid],
      name: lobbyName,
      location,
      locationGeocodeAddress,
      distance,
      passwordProtected,
    };
    if (passwordProtected && passwordText.length > 0) {
      const hashedPassword = this.props.hashPassword(passwordText)
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
        });
      })
      .catch(err => {
        this.setState({ loading: false });
        console.error("LobbyCreator::createLobby::passwordHash", err);
      });
    } else {
      addDoc(collection(this.props.db, 'lobbies'), data)
        .then((docRef) => {
          this.setState({ loading: false })
          this.props.navigation.goBack();
          this.props.navigation.navigate('LobbyView', { lobbyRef: docRef });
        });
    }
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

    console.log("Distance", distance)
    console.log("Distance error", !distance)
    console.log("Location error", !validLocation)

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

  render() {
    const {
      screenHeight,
      lobbyName, lobbyNameError,
      passwordFailures, passwordProtected, passwordShowing, passwordText,
      distanceError,
      locationError,
    } = this.state;
    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            style={{
              height: screenHeight - headerHeight,
              justifyContent: 'space-between',
              paddingHorizontal: 10,
            }}
          >
            <ScrollView>
              <Input
                placeholder="Lobby Name"
                textContentType="name"
                inputStyle={{ fontSize: 24, paddingLeft: 5 }}
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
                  )
                }
              </View>
              <LocationView
                {...this.props}
                setLocationData={this.setLocationData}
                isHost={true}
                loading={false}
                locationError={locationError}
                distanceError={distanceError}
              />
            </ScrollView>
            <View>
              <Button
                title="Create Lobby"
                titleStyle={{ fontSize: 24 }}
                containerStyle={{ marginBottom: 10 }}
                buttonStyle={{ backgroundColor: ThemeColors.button }}
                raised
                onPress={this.createLobby}
              />
              <Button
                title="Cancel"
                type="clear"
                raised
                titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
                containerStyle={{ marginBottom: 20 }}
                onPress={() => this.props.navigation.navigate("LobbyPicker")}
              />
            </View>
          </View>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

export default Password(LobbyCreator);
