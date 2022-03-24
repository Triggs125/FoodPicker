import { Component } from "react";
import { Dimensions, KeyboardAvoidingViewBase, Keyboard, SafeAreaView, StyleSheet, View } from 'react-native';
import Constants from 'expo-constants';
import { Input, Button, Text, Icon, Overlay } from 'react-native-elements';
import { GetUserFromDB } from '../Utils/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScrollView, TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import isEmail from 'validator/lib/isEmail';
import { HeaderHeightContext } from '@react-navigation/elements';
import ThemeColors from "../../assets/ThemeColors";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import LocationView from "../Lobby/LocationView";
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY, PLACE_DETAILS_API_KEY } from "../../config";
import { random } from "isaac";

class Account extends Component {
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
      randomRestaurantOverlayOpen: false,
      randomRestaurantOverlayLoading: false,
      randomRestaurantOverlayChoiceLoading: false,
      randomRestaurantOverlayError: false,
    }
  }

  componentDidMount() {
    this.props.navigation.addListener('focus', () => {
      this.setState({ randomRestaurantOverlayOpen: false });
    });
    this.props.navigation.addListener('blur', () => {
      this.setState({
        randomRestaurantOverlayOpen: false,
        location: undefined,
        locationGeocodeAddress: undefined,
        locationGeocodeAddress: undefined,
      })
    });
    this.getUserLocation();
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
    const { location, distance } = this.state;

    if (location === undefined 
      || location?.longitude === undefined 
      || location?.latitude === undefined 
      || distance === undefined
    ) {
      this.setState({ randomRestaurantOverlayError: true, randomRestaurantOverlayChoiceLoading: false });
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

    this.setState({ randomRestaurantOverlayChoiceLoading: true });

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
          const secondUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
            + '&pagetoken=' + res.next_page_token
            + '&key=' + GOOGLE_MAPS_API_KEY;
          
          await fetch(secondUrl)
            .then(res2 => {
              return res2.json();
            })
            .then(async (res2) => {
              if (res2.status !== "OK") {
                throw new Error(res.status);
              }

              this.addPlaceDetails(res2.results, places);
              if (res2.next_page_token !== undefined) {
                const secondUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
                  + '&pagetoken=' + res2.next_page_token
                  + '&key=' + GOOGLE_MAPS_API_KEY;
                
                await fetch(secondUrl)
                  .then(res3 => {
                    return res3.json();
                  })
                  .then(res3 => {
                    if (res3.status !== "OK") {
                      throw new Error(res.status);
                    }
      
                    this.addPlaceDetails(res3.results, places);
                  })
                  .catch(error => {
                    console.error("Account::getRandomRestaurant::thirdUrl", error);
                    this.setState({ randomRestaurantOverlayError: true });
                  })
                  .finally(() => {
                    this.setState({ randomRestaurantOverlayChoiceLoading: false });
                  });
              }
            })
            .catch(error => {
              console.error("Account::getRandomRestaurant::secondUrl", error);
              this.setState({ randomRestaurantOverlayError: true });
            })
            .finally(() => {
              this.setState({ randomRestaurantOverlayChoiceLoading: false });
            });
        }

        const randomRestaurantIndex = Math.round((Math.random() * 100)) % places.length;
        const randomFoodChoice = places[randomRestaurantIndex];
        this.props.navigation.navigate('PlaceDetails', { foodChoice: randomFoodChoice });
        this.setState({
          randomRestaurantOverlayChoiceLoading: false,
          randomRestaurantOverlayLoading: false,
          randomRestaurantOverlayError: false,
          randomRestaurantOverlayOpen: false,
        });
      })
      .catch(error => {
        console.error("Account::getRandomRestaurant::firstUrl", error);
        this.setState({ randomRestaurantOverlayError: true });
      });
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
      randomRestaurantOverlayLoading,
      randomRestaurantOverlayChoiceLoading,
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
          loading={randomRestaurantOverlayLoading}
          distance={distance}
          location={location}
          locationGeocodeAddress={locationGeocodeAddress}
        />
        <Button
          title="Random Restaurant"
          loading={randomRestaurantOverlayChoiceLoading}
          loadingStyle={{ marginVertical: 7 }}
          disabled={
            randomRestaurantOverlayLoading
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
          disabled={randomRestaurantOverlayLoading}
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          onPress={() => {
            this.setState({
              randomRestaurantOverlayOpen: false,
            });
          }}
        />
      </Overlay>
    )
  }

  getUserLocation() {
    this.setState({ randomRestaurantOverlayLoading: true });
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') {
          console.log(`User ${this.props.user.uid} did not grant access to their location.`);
          return;
        }
        Location.setGoogleApiKey(GOOGLE_MAPS_API_KEY);
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          .then(location => {
            Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude })
              .then(locationGeocodeAddress => {
                const distance = this.state.distance || this.distances[2];
                const coords = { longitude: location.coords.longitude, latitude: location.coords.latitude };
                this.setState({ location: coords, locationGeocodeAddress, distance });
              })
              .catch(err => {
                console.error("Account::getUsersLocation::reverseGeocodeAsync", err);
              })
              .finally(() => {
                this.setState({ randomRestaurantOverlayLoading: false });
              });
          })
          .catch(err => {
            console.error("Account::getUsersLocation::getCurrentPositionAsync", err);
            this.setState({ randomRestaurantOverlayLoading: false });
          });
      })
      .catch(err => {
        console.error("Account::getUsersLocation::requestForegroundPermissionsAsync", err);
        this.setState({ randomRestaurantOverlayLoading: false });
      });
  }

  clickRandomRestaurantButton() {
    this.setState({ randomRestaurantOverlayOpen: true });
    this.getUserLocation();
  }

  userLoggedIn(headerHeight) {
    return (
      <View style={{ ...styles.container, height: screenHeight - headerHeight }}>
        {this.randomRestaurantOverlay()}
        <View style={{ paddingHorizontal: 10, justifyContent: 'center' }}>
          <Icon name="user-circle" type="font-awesome" iconStyle={{ fontSize: 180 }} />
          <Text
            style={{ textAlign: 'center', fontSize: 30, marginTop: 15, width: ScreenWidth - 50, alignSelf: 'center' }}
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
            titleStyle={{ color: 'white', fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: ThemeColors.button }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, color: 'white', paddingRight: 3 }} />}
            iconRight
            onPress={() => this.props.navigation.navigate('LobbyPicker')}
            containerStyle={{ marginBottom: 20 }}
          />
          <Button
            title="Random Restaurant"
            raised
            titleStyle={{ color: ThemeColors.text, fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'white' }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, color: ThemeColors.text, paddingRight: 3 }} />}
            iconRight
            onPress={() => this.clickRandomRestaurantButton()}
            containerStyle={{ marginBottom: 20 }}
          />
          <Button
            title="Edit Account"
            raised
            titleStyle={{ color: 'black', fontSize: 26, paddingLeft: 3 }}
            buttonStyle={{ justifyContent: 'space-between', backgroundColor: 'lightgray' }}
            icon={<Icon name="angle-right" type="font-awesome" iconStyle={{ fontSize: 30, paddingRight: 3 }} />}
            iconRight
            onPress={() => this.props.navigation.navigate('AccountEdit')}
          />
        </View>
        <Button
          buttonStyle={{ backgroundColor: 'transparent' }}
          title="Sign Out"
          titleStyle={{ color: '#E54040', fontSize: 30, textAlign: 'center', fontWeight: 'normal' }}
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
          <Text style={{ textAlign: 'center', fontSize: 35 }}>Log In</Text>
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
          <Input
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
              title="Sign in with FoodPicker"
              raised={{}}
              icon={{
                name: 'home',
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
                marginTop: 10,
                overflow: 'visible'
              }}
              onPress={() => { this.signIn(); }}
            />
            <Button
              title="Forgot Password"
              type='clear'
              titleStyle={{
                textAlign: 'center',
                fontSize: 20,
                marginTop: 5,
                marginBottom: 5,
                color: ThemeColors.text,
              }}
              containerStyle={{ marginBottom: -10 }}
              onPress={() => this.props.navigation.navigate('ForgotPassword')}
            />
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
              height: 60,
            }}
            containerStyle={{
              width: '100%',
              alignSelf: 'center',
              overflow: 'visible',
              marginBottom: 20,
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
const adBannerHeight = 60;
const screenHeight = Dimensions.get('screen').height - offset;

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

export default Account;