import { Component } from "react";
import { SafeAreaView, StyleSheet, View, Linking } from 'react-native';
import Constants from 'expo-constants';
import { Input, Button, Text, Icon, Overlay, Avatar } from 'react-native-elements';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { TouchableOpacity } from 'react-native-gesture-handler';
import isEmail from 'validator/lib/isEmail';
import ThemeColors from "../assets/ThemeColors";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY, PLACE_DETAILS_API_KEY } from "../config";
import * as Analytics from 'expo-firebase-analytics';
import FacebookLoginButton from "./Utils/FacebookLoginButton";
import LocationView from "./Lobby/LocationView";
import AppleLoginButton from "./Utils/AppleLoginButton";

class Home extends Component {
  constructor(props) {
    super(props);

    this.distances = [0.5, 1, 2, 5, 10, 20];

    this.state = {
      loading_signin: false,
      loginError: false,
      generalError: false,
      emailAddressText: "",
      passwordText: "",
      passwordShowing: false,
      emailAddressError: false,
      randomRestaurantError: false,
      randomRestaurantErrorDetails: '',
      randomRestaurantErrorDetailsOpen: true,
      randomRestaurantLoading: false,
      randomRestaurantOverlayOpen: false,
      randomRestaurantOverlayLoading: false,
      randomRestaurantOverlayError: false,
      distance: 3,
      locationGeocodeAddress: undefined,
      location: undefined,
    }

    this.setLocationData = this.setLocationData.bind(this);
    this.signIn = this.signIn.bind(this);
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
        randomRestaurantOverlayOpen: false,
      });
    });
  }

  signIn() {
    const { emailAddressText, passwordText } = this.state;
    if (isEmail(emailAddressText) && passwordText.length > 0) {
      this.setState({ loading_signin: true });
      signInWithEmailAndPassword(this.props.auth, emailAddressText, passwordText)
        .catch(err => {
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
        })
        .finally(() => {
          this.setState({ loading_signin: false });
        });
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

  //This function takes in latitude and longitude of two locations
  // and returns the distance between them as the crow flies (in meters)
  calcCrow(coords1, coords2) {
    // var R = 6.371; // km
    var R = 6371000; // m
    console.log("coords1", coords1)
    console.log("coords2", coords2)
    var dLat = this.toRad(coords2.latitude - coords1.latitude);
    var dLon = this.toRad(coords2.longitude - coords1.longitude);
    var lat1 = this.toRad(coords1.latitude);
    var lat2 = this.toRad(coords2.longitude);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2); 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    var d = R * c;
    return d;
  }

  // Converts numeric degrees to radians
  toRad(Value) {
      return Value * Math.PI / 180;
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
        
        // TODO: check if the location has changed enough to get the restaurants again. Otherwise, get a random restaurant from the previous list
        const { lastLocation } = this.state;
        const { randomRestaurantList, setRandomRestaurantList } = this.props;
        const locationDif = lastLocation && this.calcCrow(location, lastLocation);
        if (randomRestaurantList.length > 0 && locationDif < 200) {
          const randomRestaurantIndex = Math.round((Math.random() * 100)) % randomRestaurantList.length;
          const randomFoodChoice = randomRestaurantList[randomRestaurantIndex];
          this.props.navigation.navigate('PlaceDetails', { foodChoice: randomFoodChoice, finalDecision: true });
          this.setState({
            randomRestaurantError: false,
            randomRestaurantErrorDetails: '',
            randomRestaurantLoading: false
          });
          return;
        }

        this.setState({ lastLocation: location });

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
                    randomRestaurantLoading: false
                  });
                  setRandomRestaurantList(places);
                });
            }
    
            const randomRestaurantIndex = Math.round((Math.random() * 100)) % places.length;
            const randomFoodChoice = places[randomRestaurantIndex];
            this.props.navigation.navigate('PlaceDetails', { foodChoice: randomFoodChoice, finalDecision: true });
            this.setState({
              randomRestaurantError: false,
              randomRestaurantErrorDetails: '',
              randomRestaurantLoading: false
            });
            setRandomRestaurantList(places);
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
              randomRestaurantLoading: false
            });
            setRandomRestaurantList(places);
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
          randomRestaurantLoading: false
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

  randomRestaurantOverlay() {
    const {
      randomRestaurantOverlayOpen,
      randomRestaurantLoading,
      randomRestaurantOverlayError,
      distance,
      locationGeocodeAddress,
      location,
    } = this.state;
    return (
      <Overlay
        isVisible={randomRestaurantOverlayOpen}
        overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
        onBackdropPress={() => {
          this.setState({
            randomRestaurantOverlayOpen: false,
          });
        }}
      >
        <Text
          style={{ fontSize: 24, textAlign: 'center', marginVertical: 10 }}
        >
          Random Restaurant
        </Text>
        {
          randomRestaurantOverlayError && (
            <Text style={{ textAlign: 'center' }}>Error choosing a random restaurant. Please try again or contact support.</Text>
          )
        }
        <LocationView
          setLocationData={this.setLocationData}
          isHost={true}
          distance={distance}
          location={location}
          locationGeocodeAddress={locationGeocodeAddress}
          locationError={!location}
          distanceError={!distance}
        />
        <Button
          title="Random Restaurant"
          loading={randomRestaurantLoading}
          loadingStyle={{ marginVertical: 7 }}
          disabled={
            randomRestaurantLoading
            || !location || !distance
          }
          titleStyle={{ fontSize: 24 }}
          buttonStyle={{ backgroundColor: ThemeColors.button }}
          containerStyle={{ marginTop: 20 }}
          onPress={() => {
            this.props.setLobbyData({ location });
            this.getRandomRestaurant();
          }}
        />
        <Button
          title="Cancel"
          type="clear"
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          onPress={() => {
            this.setState({
              randomRestaurantOverlayOpen: false,
            });
          }}
        />
      </Overlay>
    );
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
          return {
            error: `This feature requires access to your location. Please enable location permissions in your phone's settings.`
          };
        }
        Location.setGoogleApiKey(GOOGLE_MAPS_API_KEY);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
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

  userLoggedIn() {
    const { randomRestaurantLoading } = this.state;
    return (
      <View style={{ ...styles.container, flex: 1 }}>
        {this.randomRestaurantOverlay()}
        {this.randomRestaurantErrorOverlay()}
        <View style={{ paddingHorizontal: 10, marginTop: 10, justifyContent: 'center' }}>
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
          <Button
            type="clear"
            title={
              <>
                <Icon
                  name="edit"
                  size={25}
                  style={{
                    marginRight: 10,
                    marginLeft: 5,
                    alignSelf: 'center'
                  }}
                />
                <Text
                  style={{ fontSize: 30, alignSelf: 'center', maxWidth: '90%' }}
                  ellipsizeMode='tail'
                  numberOfLines={1}
                >
                  {
                    this.props.user?.firstName || this.props.user?.lastName ?
                      this.props.user?.firstName + " " + this.props.user?.lastName
                      : this.props.user?.displayName
                  }
                </Text>
                <Icon
                  name="edit"
                  size={25}
                  color="transparent"
                  style={{
                    marginRight: 0,
                    marginLeft: 5,
                    alignSelf: 'center'
                  }}
                />
              </>
            }
            raised
            disabled={randomRestaurantLoading}
            titleStyle={{ color: 'black', fontSize: 26 }}
            buttonStyle={{ justifyContent: 'center' }}
            // icon={{
            //   name: "edit",
            //   size: 25,
            //   style: {
            //     marginRight: 10,
            //     marginLeft: 5,
            //     alignSelf: 'center'
            //   }
            // }}
            onPress={() => this.props.navigation.navigate('AccountEdit')}
            containerStyle={{ marginTop: 10 }}
          />
        </View>
        <View style={{ paddingHorizontal: 10 }}>
          <Button
            title="Lobbies"
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
            buttonStyle={{
              justifyContent: 'space-between', backgroundColor: 'white', borderWidth: 1, borderColor: 'lightgray'
            }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, color: ThemeColors.text, paddingRight: 3 }} />}
            iconRight
            onPress={() => {
              this.getRandomRestaurant();
            }}
            containerStyle={{ marginVertical: 5 }}
          />
          {/* <Button
            title="Account"
            raised
            disabled={randomRestaurantLoading}
            titleStyle={{ color: 'black', fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'lightgray' }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, paddingRight: 3 }} />}
            iconRight
            onPress={() => this.props.navigation.navigate('AccountEdit')}
            containerStyle={{ marginVertical: 5 }}
          /> */}
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

  userNotLoggedIn() {
    const {
      emailAddressText, passwordText,
      emailAddressError,
      passwordShowing,
      loginError, generalError,
      loading_signin
    } = this.state;

    return (
      <View style={{ ...styles.container, flex: 1 }}>
        <View>
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
            onChangeText={(text) => this.setState({ emailAddressText: text.replace(/\s/g, ''), emailAddressError: false, })}
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
            onChangeText={(text) => this.setState({ passwordText: text.replace(/\s/g, '') })}
          />
          <View style={{ paddingHorizontal: 10 }}>
            <Button
              title="Sign in with FoodPicker"
              raised
              loading={loading_signin}
              icon={{
                name: 'home',
                type: 'font-awesome',
                color: 'white',
                marginRight: 5
              }}
              titleStyle={{ fontWeight: '500', fontSize: 19 }}
              buttonStyle={{
                backgroundColor: '#E54040',
                paddingVertical: 10
              }}
              containerStyle={{
                marginVertical: 5,
              }}
              onPress={this.signIn}
            />
            <Button
              title="Forgot Password"
              type='clear'
              titleStyle={{
                textAlign: 'center',
                fontSize: 20,
                marginVertical: 0,
                color: 'gray',
                fontWeight: 'normal'
              }}
              onPress={() => this.props.navigation.navigate('ForgotPassword')}
            />
          </View>
        </View>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 20,
            color: 'grey',
          }}
        >
          - OR -
        </Text>
        <View style={{ paddingHorizontal: 10, paddingBottom: 5 }}>
          <Button
            title="Create an Account"
            raised
            icon={{
              name: 'user-plus',
              type: 'font-awesome',
              color: 'black',
              marginRight: 5,
              size: 20
            }}
            titleStyle={{ fontWeight: '500', fontSize: 19, color: 'black' }}
            buttonStyle={{
              backgroundColor: '#fff',
              paddingVertical: 10,
              borderWidth: 1,
              borderColor: 'lightgray'
            }}
            onPress={() => { this.props.navigation.navigate('CreateAccount') }}
          />
          {<FacebookLoginButton db={this.props.db} auth={this.props.auth} />}
          {/* <SignInWithGoogle /> */}
          {
            Constants.platform.ios && (
              <AppleLoginButton db={this.props.db} auth={this.props.auth} />
            )
          }
        </View>
      </View>
    );
  }

  render() {
    return (
      this.props.user ? (
        this.userLoggedIn()
      ) : (
        this.userNotLoggedIn()
      )
    )
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: 15,
    paddingBottom: 0,
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