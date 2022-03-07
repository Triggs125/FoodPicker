import { Component } from "react";
import { Button, Icon, ListItem, Text, BottomSheet } from "react-native-elements";
import * as Location from 'expo-location';
import { View } from "react-native";
import { GOOGLE_MAPS_API_KEY, PLACE_DETAILS_API_KEY } from "../../config";
import MapView, { Circle } from 'react-native-maps';
import ThemeColors from "../../assets/ThemeColors";
import Constants from 'expo-constants';
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { ScrollView } from "react-native-gesture-handler";
import LoadingSpinner from "../LoadingSpinner";

class LocationView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      location: props.location,
      locationGeocodeAddress: props.locationGeocodeAddress,
      distance: props.distance,
      mapViewOpen: props.isHost === true && !props.locationGeocodeAddress,
      distanceChoicesOpen: false,
      locationSearchText: undefined,
      loading: false,
    }

    this.setPlaceData = this.setPlaceData.bind(this);
    this.changeDistance = this.changeDistance.bind(this);
    this.getUsersLocation = this.getUsersLocation.bind(this);
  }

  componentDidMount() {
    if (
      this.props.location ||
      this.props.distance ||
      this.props.locationGeocodeAddress
    ) {
      this.setState({
        location: this.props.location,
        distance: this.props.distance,
        locationGeocodeAddress: this.props.locationGeocodeAddress,
        loading: false,
      });
    }
  }

  componentDidUpdate(newProps) {
    const { loading, isHost, location } = this.state;
    if (
      newProps.location !== this.props.location ||
      newProps.distance !== this.props.distance ||
      newProps.locationGeocodeAddress !== this.props.locationGeocodeAddress
    ) {
      this.setState({
        location: this.props.location,
        distance: this.props.distance,
        locationGeocodeAddress: this.props.locationGeocodeAddress,
        loading: false,
      });
    }

    if (!loading && isHost && !location && !this.props.location) {
      this.getUsersLocation();
      this.setState({ distance: this.props.distance });
    }
  }

  getUsersLocation() {
    this.setState({ loading: true });
    Location.requestForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== 'granted') {
          console.log(`User ${this.props.user.uid} did not grant access to their location.`);
          return;
        }
        Location.setGoogleApiKey(googleApiKey);
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
          .then(location => {
            Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude })
              .then(locationGeocodeAddress => {
                const distance = this.props.distance || this.props.distance || this.distances[1];
                const coords = { longitude: location.coords.longitude, latitude: location.coords.latitude };
                this.props.setLocationData(coords, locationGeocodeAddress, distance);
                this.setState({ location: coords, locationGeocodeAddress, distance });
              })
              .catch(err => {
                console.error("LocationView::getUsersLocation::reverseGeocodeAsync", err);
              })
              .finally(() => {
                this.setState({ loading: false });
              });
          })
          .catch(err => {
            console.error("LocationView::getUsersLocation::getCurrentPositionAsync", err);
          });
      })
      .catch(err => {
        console.error("LocationView::getUsersLocation::requestForegroundPermissionsAsync", err);
      });
  }

  changeDistance(newDistance) {
    this.setState({ distanceChoicesOpen: false, distance: newDistance });
    this.props.setLocationData(undefined, undefined, newDistance);
  }

  setPlaceData(data, details) {
    const newCoords = { longitude: details?.geometry.location.lng, latitude: details?.geometry.location.lat };
    Location.reverseGeocodeAsync(newCoords)
      .then(locationGeocodeAddress => {
        this.props.setLocationData(newCoords, locationGeocodeAddress);
        this.setState({ locationGeocodeAddress });
      })
      .catch(err => {
        console.error("LocationView::setPlaceData::reverseGeocodeAsync", err);
      });
  }

  distances = [0.5, 1, 2, 5, 10, 20]

  render() {
    const { 
      locationGeocodeAddress, location,
      mapViewOpen,
      distanceChoicesOpen, distance,
      loading
    } = this.state;
    const { isHost, distanceError, locationError } = this.props;

    const addressName = locationGeocodeAddress &&
      locationGeocodeAddress[0]?.city + ", " + 
      locationGeocodeAddress[0]?.region;
    
    return (
      <View style={{ borderWidth: 1.5, borderColor: 'lightgray', borderRadius: 10, overflow: 'hidden', backgroundColor: 'white', marginVertical: 10 }}>
        <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 10 }}>
              <Text style={{ fontSize: 20, paddingBottom: 2, textAlign: 'center', alignSelf: 'center' }}>
                Distance:
              </Text>
              <Button
                title={distance ? `${distance} miles` : isHost ? 'Select a Distance' : 'No Distance Selected'}
                titleStyle={{ textAlign: 'left', fontSize: 18, color: ThemeColors.text, marginRight: 10, overflow: 'scroll' }}
                buttonStyle={{ backgroundColor: 'transparent' }}
                containerStyle={{ alignSelf: 'center' }}
                icon={!Constants.platform.web && distance && isHost && <Icon name={distanceChoicesOpen ? "angle-up" : "angle-down"} type="font-awesome" />}
                iconRight
                onPress={() => isHost && this.setState({ distanceChoicesOpen: !distanceChoicesOpen })}
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
                    );
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
            {
              distanceError && (
                <Text
                  style={{
                    color: 'red',
                    marginLeft: 10,
                    marginTop: -10,
                    fontSize: 12,
                    fontWeight: '300'
                  }}
                >
                  Please select a valid distance
                </Text>
              )
            }
          </View>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 10 }}>
              <Text style={{ fontSize: 20, paddingBottom: 2, textAlign: 'center', alignSelf: 'center' }}>
                Location:
              </Text>
              {
                !loading ? (
                  <Button
                    title={location ? addressName : isHost ? 'Select a Location' : 'No Location Selected'}
                    titleStyle={{ textAlign: 'left', fontSize: 18, color: ThemeColors.text, marginRight: 10, overflow: 'scroll' }}
                    onPress={() => { !Constants.platform.web && this.setState({ mapViewOpen: !mapViewOpen }) }}
                    buttonStyle={{ backgroundColor: 'transparent' }}
                    icon={!Constants.platform.web && location && <Icon name={mapViewOpen ? "angle-up" : "map-o"} type="font-awesome" />}
                    iconRight
                    containerStyle={{ alignSelf: 'center' }}
                  />
                ) : (
                  <View style={{ marginLeft: 10, alignContent: 'center' }}>
                    <LoadingSpinner size="small" />
                  </View>
                )
              }
            </View>
            {
              locationError && (
                <Text
                  style={{
                    color: 'red',
                    marginLeft: 10,
                    marginTop: -10,
                    fontSize: 12,
                    fontWeight: '300'
                  }}
                >
                  Please select a valid location
                </Text>
              )
            }
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
                  <ScrollView
                    keyboardShouldPersistTaps='always'
                  >
                    <GooglePlacesAutocomplete
                      placeholder="Search Location"
                      onPress={(data, details = null) => this.setPlaceData(data, details)}
                      query={{ key: GOOGLE_MAPS_API_KEY, language: 'en' }}
                      fetchDetails={true}
                      listViewDisplayed={false}
                      keepResultsAfterBlur={true}
                      // requestUrl={{
                      //   useOnPlatform: 'web',
                      //   url: 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
                      // }}
                    />
                  </ScrollView>
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