import { Component } from "react";
import { Button, Icon, ListItem, Text, BottomSheet } from "react-native-elements";
import * as Location from 'expo-location';
import { View } from "react-native";
import { setDoc } from "firebase/firestore";
import { googleApiKey } from "../../config";
import MapView, { Circle } from 'react-native-maps';
import ThemeColors from "../../assets/ThemeColors";
import Constants from 'expo-constants';
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

class LocationView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      location: props.lobbyData.location,
      locationGeocodeAddress: props.lobbyData.locationGeocodeAddress,
      alreadyRequested: false,
      mapViewOpen: props.isHost === true && !props.lobbyData.locationGeocodeAddress,
      distanceChoicesOpen: false,
      distance: props.lobbyData.distance,
      locationSearchText: undefined,
    }

    this.setPlaceData = this.setPlaceData.bind(this);
    this.changeDistance = this.changeDistance.bind(this);
    this.getUsersLocation = this.getUsersLocation.bind(this);
  }

  componentDidMount() {
    if (this.props.isHost && !this.props.lobbyData?.location) {
      this.getUsersLocation();
      this.setState({ distance: this.props.lobbyData?.distance });
    }
  }

  componentDidUpdate(newProps) {
    if (
      newProps.isHost
      && this.state.alreadyRequested === false
      && newProps.lobbyData?.location !== this.props.lobbyData?.location
    ) {
      if (!newProps.lobbyData?.location) {
        this.getUsersLocation();
      }
    }
  }

  getUsersLocation() {
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') {
          this.setState({ alreadyRequested: true });
          return;
        }
        Location.setGoogleApiKey(googleApiKey);
        Location.getCurrentPositionAsync({})
          .then(location => {
            Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude })
              .then(locationGeocodeAddress => {
                const coords = { longitude: location.coords.longitude, latitude: location.coords.latitude };
                setDoc(this.props.lobbyData.ref, { location: coords, locationGeocodeAddress: locationGeocodeAddress }, { merge: true });
                this.setState({ location: coords, locationGeocodeAddress, alreadyRequested: true });
              })
              .catch(err => {
                console.error("Error::Location::reverseGeocodeAsync", err);
              });
          })
          .catch(err => {
            console.error("Error::Location:getCurrentPositionAsync", err);
          });
      })
      .catch(err => {
        console.error("Error::Location::requestForegroundPermissionsAsync", err);
      });
    this.setState({ alreadyRequested: true });
  }

  async changeDistance(newDistance) {
    const { lobbyData } = this.props;
    this.setState({ distanceChoicesOpen: false, distance: newDistance });
    try {
      await setDoc(lobbyData.ref, { distance: newDistance }, { merge: true });
    } catch (err) {
      console.error("LocationView::changeDistance", err);
    }
  }

  setPlaceData(data, details) {
    const newCoords = { longitude: details?.geometry.location.lng, latitude: details?.geometry.location.lat };
    Location.reverseGeocodeAsync(newCoords)
      .then(locationGeocodeAddress => {
        setDoc(this.props.lobbyData.ref, { locationGeocodeAddress: locationGeocodeAddress, location: newCoords }, { merge: true });
        this.setState({ locationGeocodeAddress, alreadyRequested: true });
      })
      .catch(err => {
        console.error("Error::Location::reverseGeocodeAsync", err);
      });
  }

  distances = [0.5, 1, 2, 5, 10, 20]

  render() {
    const { locationGeocodeAddress, location, mapViewOpen, distanceChoicesOpen, distance } = this.state;
    const { isHost } = this.props;

    const addressName = locationGeocodeAddress &&
      locationGeocodeAddress[0]?.city + ", " + 
      locationGeocodeAddress[0]?.region;
    
    return (
      <View style={{ borderWidth: 1.5, borderColor: 'lightgray', borderRadius: 10, overflow: 'hidden', backgroundColor: 'white' }}>
        <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 10 }}>
            <Text style={{ fontSize: 20, paddingBottom: 2, textAlign: 'center', alignSelf: 'center' }}>
              Distance:
            </Text>
            <Button
              title={distance ? `${distance} miles` : isHost ? 'Select a Distance' : 'No Distance Selected'}
              titleStyle={{ textAlign: 'left', fontSize: 18, color: ThemeColors.text, marginRight: 10, overflow: 'scroll' }}
              buttonStyle={{ backgroundColor: 'transparent' }}
              containerStyle={{ alignSelf: 'center' }}
              onPress={() => this.setState({ distanceChoicesOpen: !distanceChoicesOpen })}
            />
            <BottomSheet isVisible={distanceChoicesOpen}>
              {
                this.distances.map((distance, i) => {
                  return (
                    <ListItem key={i} onPress={() => this.changeDistance(distance)}>
                      <ListItem.Content>
                        <ListItem.Title style={{ textAlign: 'center' }}>{`${distance} miles`}</ListItem.Title>
                      </ListItem.Content>
                    </ListItem>
                  )
                })
              }
              <ListItem
                containerStyle={{ backgroundColor: ThemeColors.text }}
                onPress={() => this.setState({ distanceChoicesOpen: false })}
              >
                <ListItem.Content>
                  <ListItem.Title style={{ color: 'white' }}>
                    Cancel
                  </ListItem.Title>
                </ListItem.Content>
              </ListItem>
            </BottomSheet>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 10 }}>
            <Text style={{ fontSize: 20, paddingBottom: 2, textAlign: 'center', alignSelf: 'center' }}>
              Location:
            </Text>
            <Button
              title={location ? addressName : isHost ? 'Select a Location' : 'No Location Selected'}
              titleStyle={{ textAlign: 'left', fontSize: 18, color: ThemeColors.text, marginRight: 10, overflow: 'scroll' }}
              onPress={() => { !Constants.platform.web && this.setState({ mapViewOpen: !mapViewOpen }) }}
              buttonStyle={{ backgroundColor: 'transparent' }}
              icon={!Constants.platform.web && location && <Icon name={mapViewOpen ? "angle-up" : "map-o"} type="font-awesome" />}
              iconRight
              containerStyle={{ alignSelf: 'center' }}
            />
          </View>
          {
            (mapViewOpen && isHost) && // Location search for host only
              (!Constants.platform.web ? // Mobile
                (<View style={{ flexDirection: "row", alignSelf: 'stretch' }}>
                  <Button
                    icon={<Icon name="my-location" type="MaterialIcons" />}
                    buttonStyle={{ backgroundColor: 'transparent' }}
                    onPress={this.getUsersLocation}
                  />
                  <GooglePlacesAutocomplete
                    placeholder="Search Location"
                    onPress={(data, details = null) => this.setPlaceData(data, details)}
                    query={{ key: "AIzaSyABLEWTpgnHhloYv_JH301853XGEhVDpMc", language: 'en' }}
                    fetchDetails={true}
                    // requestUrl={{
                    //   useOnPlatform: 'web',
                    //   url: 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
                    // }}
                  />
                </View>
              ) : ( // Web View
                <View>
                </View>
              )
            )
          }
        </View>
        {(mapViewOpen && location) && // Location Map for everyone
          (!Constants.platform.web ? // Mobile
            (
              <View>
                <MapView
                  style={{ width: '100%', height: 200 }}
                  initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
                  region={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: distance ? distance * 0.04 : 0.1, longitudeDelta: distance ? distance * 0.04 : 0.1 }}
                >
                  <Circle
                    center={{ latitude: location.latitude, longitude: location.longitude}}
                    radius={distance ? Math.round(distance * 1609.344) : 5000}
                    strokeWidth={2}
                    strokeColor={'transparent'}
                    fillColor={'rgba(229,64,64,0.25)'}
                  />
                </MapView>
              </View>
            ) : ( // Web View
              <View>
                
              </View>
            )
          )
        }
      </View>
    );
  }
}

export default LocationView;