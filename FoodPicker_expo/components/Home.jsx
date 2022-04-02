import { Component } from "react";
import { Dimensions, SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Input, Button, Text, Icon, Overlay, Avatar } from 'react-native-elements';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { TouchableOpacity } from 'react-native-gesture-handler';
import isEmail from 'validator/lib/isEmail';
import { HeaderHeightContext } from '@react-navigation/elements';
import ThemeColors from "../assets/ThemeColors";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY, PLACE_DETAILS_API_KEY } from "../config";
import { StatusBar } from "react-native";
import * as Analytics from 'expo-firebase-analytics';
import FacebookLoginButton from "./Utils/FacebookLoginButton";

class Home extends Component {
  constructor(props) {
    super(props);

    this.distances = [0.5, 1, 2, 5, 10, 20];

    this.state = {
      loading: true,
      loginError: false,
      generalError: false,
      emailAddressText: "",
      passwordText: "",
      passwordShowing: false,
      emailAddressError: false,
      randomRestaurantError: false,
      randomRestaurantErrorDetails: '',
      randomRestaurantErrorDetailsOpen: false,
      randomRestaurantLoading: false,
    }
  }

  componentDidMount() {
    this.props.navigation.addListener('focus', () => {
      this.setState({
        generalError: false,
        loginError: false,
        emailAddressError: false,
      });
    });
    this.props.navigation.addListener('blur', () => {
      this.setState({
        randomRestaurantError: false,
        randomRestaurantErrorDetails: '',
        randomRestaurantLoading: false,
      });
    });
  }

  async signIn() {
    const { emailAddressText, passwordText } = this.state;
    if (isEmail(emailAddressText) && passwordText.length > 0) {
      try {
        const res = await signInWithEmailAndPassword(this.props.auth, emailAddressText, passwordText);
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

  getRandomRestaurant() {
    Analytics.logEvent("button_click", {
      name: "Get Random Restaurant"
    });

    this.setState({ randomRestaurantLoading: true });

    this.getUserLocation()
      .then(({ location, distance, error }) => {
        if (error) {
          this.setState({
            randomRestaurantError: true,
            randomRestaurantErrorDetails: error
          });
          return;
        }
        
        const latitude = location.latitude;
        const longitude = location.longitude;
        const radius = Math.round(distance * 1609.344);
        const types = 'restaurant';
        let url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
          + 'location=' + latitude + ',' + longitude
          + '&radius=' + radius
          + '&type=' + types
          + '&opennow=true'
          + '&key=' + GOOGLE_MAPS_API_KEY;
    
        const places = [];
    
        fetch(url)
          .then(res => {
            return res.json();
          })
          .then(async (res) => {
            if (res.status !== "OK") {
              throw new Error(res.status);
            }
    
            this.addPlaceDetails(res.results, places);
            if (res.next_page_token !== undefined) {
              const secondUrl = url + '&pagetoken=' + res.next_page_token;

              // Sleep for 2 seconds
              // Must happen to get the second page of results as per: https://developers.google.com/maps/documentation/javascript/places#place_search_responses
              await new Promise(r => setTimeout(r, 2000));
              
              await fetch(secondUrl)
                .then(res2 => {
                  return res2.json();
                })
                .then(async (res2) => {
                  if (res2.status !== "OK") {
                    throw new Error(res2.status);
                  }
    
                  this.addPlaceDetails(res2.results, places);
                })
                .catch(err => {
                  console.error("Home::getRandomRestaurant::secondUrl", err);
                  Analytics.logEvent("exception", {
                    description: "Home::getRandomRestaurant::secondUrl"
                  });
                  this.setState({
                    randomRestaurantError: true,
                    randomRestaurantErrorDetails: err.message,
                    randomRestaurantLoading: false,
                  });
                });
            }
    
            const randomRestaurantIndex = Math.round((Math.random() * 100)) % places.length;
            const randomFoodChoice = places[randomRestaurantIndex];
            this.props.navigation.navigate('PlaceDetails', { foodChoice: randomFoodChoice, finalDecision: true });
            this.setState({
              randomRestaurantError: false,
              randomRestaurantErrorDetails: '',
              randomRestaurantLoading: false,
            });
          })
          .catch(err => {
            Analytics.logEvent("exception", {
              description: "Home::getRandomRestaurant::firstUrl"
            });
            console.error("Home::getRandomRestaurant::firstUrl", err);
            console.log(err.message);
            this.setState({
              randomRestaurantError: true,
              randomRestaurantErrorDetails: err.message,
              randomRestaurantLoading: false,
            });
          });
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "Home::getRandomRestaurant::getUserLocation"
        });
        console.error("Home::getRandomRestaurant::getUserLocation", err);
        this.setState({
          randomRestaurantError: true,
          randomRestaurantErrorDetails: err.message,
          randomRestaurantLoading: false,
        });
      })
  }

  addPlaceDetails(results, places) {
    const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=${PLACE_DETAILS_API_KEY}&maxwidth=400&photo_reference=`;
    for(let googlePlace of results) {
      var place = {};
      const coordinate = {
        latitude: googlePlace.geometry.location.lat,
        longitude: googlePlace.geometry.location.lng,
      };

      var gallery = [];
      if (googlePlace.photos) {
        for(let photo of googlePlace.photos) { 
          var photoUrl = GooglePicBaseUrl + photo.photo_reference;
          gallery.push(photoUrl);
        }
      }

      place['types'] = googlePlace.types;
      place['coordinate'] = coordinate;
      place['id'] = googlePlace.place_id;
      place['name'] = googlePlace.name;
      place['rating'] = googlePlace.rating ?? 0;
      place['priceLevel'] = googlePlace.price_level ?? 0;
      place['vicinity'] = googlePlace.vicinity;
      place['userRatingsTotal'] = googlePlace.user_ratings_total ?? 0;
      place['photos'] = gallery;
      place['opennow'] = googlePlace.opening_hours?.open_now ?? false;

      places.push(place);
    }
  }

  randomRestaurantErrorOverlay() {
    const {
      randomRestaurantError,
      randomRestaurantErrorDetails,
      randomRestaurantErrorDetailsOpen,
    } = this.state;
    return (
      <Overlay
        isVisible={randomRestaurantError}
        overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
        onBackdropPress={() => {
          this.setState({
            randomRestaurantError: false,
            randomRestaurantErrorDetails: '',
            randomRestaurantLoading: false,
          });
        }}
      >
        <View
          style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}
        >
          <Icon
            name="warning"
            type="font-awesome"
            size={30}
            color={ThemeColors.text}
            style={{ flex: 1, justifyContent: 'center' }}
          />
          <Text
            style={{ fontSize: 24, color: ThemeColors.text, marginLeft: 10 }}
          >
            Error Choosing a Random Restaurant
          </Text>
        </View>
        <Button
          type="clear"
          title={<Text style={{ color: 'black' }}>Details: {!randomRestaurantErrorDetailsOpen && '...'}</Text>}
          titleStyle={{ color: ThemeColors.button }}
          iconRight
          icon={
            <Icon
              name={randomRestaurantErrorDetailsOpen ? "caret-up" : "caret-down"}
              type="font-awesome"
              size={16}
              style={{ marginLeft: 5 }}
            />
          }
          onPress={() => this.setState({ randomRestaurantErrorDetailsOpen: !randomRestaurantErrorDetailsOpen })}
        />
        {
          randomRestaurantErrorDetailsOpen && (
            <Text style={{ textAlign: 'center' }}>{randomRestaurantErrorDetails}</Text>
          )
        }
        <Button
          title="Close"
          type="clear"
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          containerStyle={{ marginTop: 10 }}
          onPress={() => {
            this.setState({
              randomRestaurantError: false,
              randomRestaurantErrorDetails: '',
              randomRestaurantLoading: false,
            });
          }}
        />
      </Overlay>
    )
  }

  getUserLocation() {
    return Location.requestForegroundPermissionsAsync()
      .then(async ({ status }) => {
        if (status !== 'granted') {
          console.log(`User ${this.props.user.uid} did not grant access to their location.`);
          return { error: 'This feature requires access to your location.' };
        }
        Location.setGoogleApiKey(GOOGLE_MAPS_API_KEY);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          .then(loc => {
            const distance = this.state.distance || this.distances[2];
            const location = { longitude: loc.coords.longitude, latitude: loc.coords.latitude };
            this.props.setLobbyData({ location });
            return { distance, location };
          })
          .catch(err => {
            Analytics.logEvent("exception", {
              description: "Home::getUsersLocation::getCurrentPositionAsync"
            });
            console.error("Home::getUsersLocation::getCurrentPositionAsync", err);
            return { error: 'There was an issue retrieving your location.' };
          });
        return loc;
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "Home::getUsersLocation::requestForegroundPermissionsAsync"
        });
        console.error("Home::getUsersLocation::requestForegroundPermissionsAsync", err);
        return { error: 'There was an issue retrieving your location permissions.' };
      });
  }

  userLoggedIn(headerHeight) {
    const { randomRestaurantLoading } = this.state;
    return (
      <View style={{ ...styles.container, height: screenHeight - headerHeight }}>
        {this.randomRestaurantErrorOverlay()}
        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
          {
            this.props.user.photoURL ? (
              <Avatar
                rounded
                size="xlarge"
                source={{
                  uri: this.props.user.photoURL + "?type=large",
                }}
                containerStyle={{
                  alignSelf: 'center',
                  padding: 1,
                  backgroundColor: 'gray'
                }}
              />
            ) : (
              <Icon name="user-circle" type="font-awesome" iconStyle={{ fontSize: 130 }} />
            )
          }
          <Text
            style={{ textAlign: 'center', fontSize: 30, marginTop: 10, width: ScreenWidth - 50, alignSelf: 'center' }}
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
            disabled={randomRestaurantLoading}
            titleStyle={{ color: 'white', fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: ThemeColors.button }}
            icon={<Icon name="angle-right" type="font-awesome" color={randomRestaurantLoading ? 'black' : 'white'} iconStyle={{ fontSize: 30, paddingRight: 3 }} />}
            iconRight
            onPress={() => this.props.navigation.navigate('LobbyPicker')}
            containerStyle={{ marginVertical: 5 }}
          />
          <Button
            title="Random Restaurant"
            titleStyle={{ color: ThemeColors.text, fontSize: 26, paddingLeft: 3 }}
            raised
            loading={randomRestaurantLoading}
            loadingStyle={{ marginVertical: 7, flex: 1, justifyContent: 'center' }}
            loadingProps={{ color: ThemeColors.text }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'white' }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, color: ThemeColors.text, paddingRight: 3 }} />}
            iconRight
            onPress={() => this.getRandomRestaurant()}
            containerStyle={{ marginVertical: 5 }}
          />
          <Button
            title="Account"
            raised
            disabled={randomRestaurantLoading}
            titleStyle={{ color: 'black', fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'lightgray' }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, paddingRight: 3 }} />}
            iconRight
            onPress={() => this.props.navigation.navigate('AccountEdit')}
            containerStyle={{ marginVertical: 5 }}
          />
        </View>
        <Button
          title="Sign Out"
          type="clear"
          titleStyle={{ color: ThemeColors.text, fontSize: 30, textAlign: 'center', fontWeight: 'normal' }}
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
          {/* <Text style={{ textAlign: 'center', fontSize: 35 }}>Log In</Text> */}
          {
            (loginError || generalError) && (
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
            )
          }
          <Input
            testID="accountLoginEmailAddress"
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
            testID="accountLoginPassword"
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
              title="Forgot Password"
              type='clear'
              titleStyle={{
                textAlign: 'center',
                fontSize: 20,
                marginVertical: 0,
                color: 'black',
                fontWeight: 'normal'
              }}
              onPress={() => this.props.navigation.navigate('ForgotPassword')}
            />
            <Button
              title="Sign in with FoodPicker"
              raised
              icon={{
                name: 'home',
                type: 'font-awesome',
                color: 'white',
                marginRight: 8
              }}
              titleStyle={{ fontWeight: '500', fontSize: 22 }}
              buttonStyle={{
                backgroundColor: '#E54040',
                paddingVertical: 10
              }}
              containerStyle={{
                marginVertical: 5,
              }}
              onPress={() => { this.signIn(); }}
            />
            {/* {<SignInWithGoogle />} */}
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
          {<FacebookLoginButton db={this.props.db} auth={this.props.auth} />}
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
              paddingVertical: 10
            }}
            containerStyle={{
              width: '100%',
              alignSelf: 'center',
              overflow: 'visible',
              marginBottom: 20,
              marginTop: 5,
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
const adBannerHeight = StatusBar.currentHeight + 60;
const screenHeight = Dimensions.get('screen').height - offset - adBannerHeight;

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
    fontSize: 20,
  },
  inputStyle: {
    fontSize: 20,
    paddingLeft: 10,
  }
});

export default Home;