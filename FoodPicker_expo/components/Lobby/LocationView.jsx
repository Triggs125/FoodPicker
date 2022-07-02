import { Component } from "react";
import { Button, Icon, ListItem, Text, BottomSheet, Overlay } from "react-native-elements";
import * as Location from 'expo-location';
import { View, Linking, Platform } from "react-native";
import { GOOGLE_MAPS_API_KEY } from "../../config";
import MapView, { Circle } from 'react-native-maps';
import ThemeColors from "../../assets/ThemeColors";
import Constants from 'expo-constants';
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { ScrollView } from "react-native-gesture-handler";
import LoadingSpinner from "../LoadingSpinner";
import { ScreenWidth } from "react-native-elements/dist/helpers";
import * as Analytics from 'expo-firebase-analytics';

class LocationView extends Component {
  constructor(props) {
    super(props);

    this.distances = [0.5, 1, 3, 5, 10, 20];

    this.state = {
      location: props.location,
      locationGeocodeAddress: props.locationGeocodeAddress,
      distance: props.distance,
      mapViewOpen: props.isHost === true && !props.locationGeocodeAddress,
      distanceChoicesOpen: false,
      locationSearchText: undefined,
      loading: false,
      error: undefined,
      errorDetailsOpen: true,
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
    this.setState({ loading: true, error: undefined });
    Location.requestForegroundPermissionsAsync()
      .then(async ({ status }) => {
        if (status !== 'granted') {
          console.log(`This feature requires access to your location.`);
          this.setState({ loading: false, error: "This feature requires access to your location. Please enable location permissions in your phone's settings." })
          return;
        }
        Location.setGoogleApiKey(GOOGLE_MAPS_API_KEY);
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          .then(location => {
            Location.reverseGeocodeAsync({ latitude: location.coords.latitude, longitude: location.coords.longitude })
              .then(locationGeocodeAddress => {
                const distance = this.props.distance || this.distances[1];
                const coords = { longitude: location.coords.longitude, latitude: location.coords.latitude };
                this.props.setLocationData(coords, locationGeocodeAddress, distance);
                this.setState({ location: coords, locationGeocodeAddress, distance });
                Analytics.logEvent("event", {
                  description: "LocationView::getUsersLocation::locationGeocodeAddress::UserLocationRetrieved"
                });
              })
              .catch(err => {
                Analytics.logEvent("exception", {
                  description: "LocationView::getUsersLocation::reverseGeocodeAsync"
                });
                console.error("LocationView::getUsersLocation::reverseGeocodeAsync", err);
              })
              .finally(() => {
                this.setState({ loading: false });
              });
          })
          .catch(err => {
            Analytics.logEvent("exception", {
              description: "LocationView::getUsersLocation::getCurrentPositionAsync"
            });
            console.error("LocationView::getUsersLocation::getCurrentPositionAsync", err);
            this.setState({ loading: false });
          });
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "LocationView::getUsersLocation::requestForegroundPermissionsAsync"
        });
        console.error("LocationView::getUsersLocation::requestForegroundPermissionsAsync", err);
        this.setState({ loading: false });
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
        this.props.setLocationData(newCoords, locationGeocodeAddress, undefined, details.utc_offset);
        this.setState({ locationGeocodeAddress });
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "LocationView::setPlaceData::reverseGeocodeAsync"
        });
        console.error("LocationView::setPlaceData::reverseGeocodeAsync", err);
      });
  }

  errorOverlay() {
    const { error, errorDetailsOpen } = this.state;
    return (
      <Overlay
        isVisible={error != undefined}
        overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
        onBackdropPress={() => {
          this.setState({ error: undefined });
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
            Error setting the location
          </Text>
        </View>
        <Button
          type="clear"
          title={<Text style={{ color: 'black' }}>Details: {!errorDetailsOpen && '...'}</Text>}
          titleStyle={{ color: ThemeColors.button }}
          iconRight
          icon={
            <Icon
              name={errorDetailsOpen ? "caret-up" : "caret-down"}
              type="font-awesome"
              size={16}
              style={{ marginLeft: 5 }}
            />
          }
          onPress={() => this.setState({ errorDetailsOpen: !errorDetailsOpen })}
        />
        {
          errorDetailsOpen && (
            <Text style={{ textAlign: 'center' }}>{error}</Text>
          )
        }
        <Button
          title="Close"
          type="clear"
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          containerStyle={{ marginTop: 10 }}
          onPress={() => {
            this.setState({ error: undefined });
          }}
        />
      </Overlay>
    )
  }

  render() {
    const { 
      locationGeocodeAddress, location,
      mapViewOpen,
      distanceChoicesOpen, distance,
      loading
    } = this.state;
    const { isHost, distanceError, locationError } = this.props;

    const isLoading = loading || this.props.loading;

    const addressName = locationGeocodeAddress &&
      locationGeocodeAddress[0]?.city + ", " + 
      locationGeocodeAddress[0]?.region;
    
    return (
      <View style={{ borderWidth: 1.5, borderColor: 'lightgray', borderRadius: 10, overflow: 'hidden', backgroundColor: 'white', marginVertical: 10 }}>
        {this.errorOverlay()}
        <View style={{ flexDirection: 'column', justifyContent: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start', paddingLeft: 10 }}>
              <Text style={{ fontSize: 20, paddingBottom: 2, textAlign: 'center', alignSelf: 'center' }}>
                Distance:
              </Text>
              {
                isLoading ? (
                  <View style={{ marginLeft: 10, alignContent: 'center', marginTop: 5, marginBottom: 10 }}>
                    <LoadingSpinner size="small" />
                  </View>
                ) : (
                  <Button
                    title={
                      <Text
                        ellipsizeMode='tail'
                        numberOfLines={1}
                        style={{
                          textAlign: 'left',
                          fontSize: 18,
                          fontWeight: 'normal',
                          color: 'black',
                          marginRight: 5,
                        }}
                      >
                        {distance ? `${distance} mile${distance === 1 ? '' : 's'}` : isHost ? 'Select a Distance' : 'No Distance Selected'}
                      </Text>
                    }
                    titleStyle={{ textAlign: 'left', fontSize: 18, color: ThemeColors.text, marginRight: 10 }}
                    buttonStyle={{ backgroundColor: 'transparent' }}
                    containerStyle={{ alignSelf: 'center' }}
                    icon={!Constants.platform.web && distance && isHost && <Icon name={distanceChoicesOpen ? "angle-up" : "angle-down"} type="font-awesome" size={16} />}
                    iconRight
                    onPress={() => isHost && this.setState({ distanceChoicesOpen: !distanceChoicesOpen })}
                  />
                )
              }
              
              <BottomSheet isVisible={distanceChoicesOpen}>
                {
                  this.distances.map((distance, i) => {
                    return (
                      <ListItem key={i} onPress={() => this.changeDistance(distance)}>
                        <ListItem.Content>
                          <ListItem.Title style={{ textAlign: 'center' }}>{`${distance} mile${distance === 1 ? '' : 's'}`}</ListItem.Title>
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
                  *Please select a distance
                </Text>
              )
            }
          </View>
          <View>
            <View
              style={{
                flexDirection: 'row', 
                justifyContent: 'flex-start', 
                paddingLeft: 10, 
                marginBottom: isLoading ? 5 : 0
              }}
            >
              <Text style={{ color: 'black', fontSize: 20, paddingBottom: 2, textAlign: 'center', alignSelf: 'center' }}>
                Location:
              </Text>
              {
                !isLoading ? (
                  <Button
                    title={
                      <Text 
                        ellipsizeMode='tail'
                        numberOfLines={1}
                        style={{
                          textAlign: 'left',
                          fontSize: 18,
                          fontWeight: 'normal',
                          color: 'black',
                          marginRight: 5,
                          maxWidth: ScreenWidth - 175
                        }}
                      >
                        {location ? addressName : isHost ? 'Select a Location' : 'No Location Selected'}
                      </Text>
                    }
                    onPress={() => { !Constants.platform.web && this.setState({ mapViewOpen: !mapViewOpen }) }}
                    buttonStyle={{ backgroundColor: 'transparent' }}
                    icon={
                      !Constants.platform.web && location && (
                        <Icon
                          name={mapViewOpen ? "angle-up" : "map-o"}
                          type="font-awesome"
                          size={16}
                          containerStyle={{ paddingLeft: 5 }}
                        />
                      )
                    }
                    iconRight
                    containerStyle={{ alignSelf: 'center' }}
                  />
                ) : (
                  <View style={{ marginLeft: 10, alignContent: 'center', marginTop: 10, marginBottom: 5 }}>
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
                  *Please select a location
                </Text>
              )
            }
          </View>
          {
            (mapViewOpen && isHost && !Constants.platform.web) && // Location search for host only
            (
              <View style={{ flexDirection: "row", alignSelf: 'stretch' }}>
                {
                  <Button
                    icon={<Icon name="my-location" type="MaterialIcons" />}
                    buttonStyle={{ backgroundColor: 'transparent' }}
                    onPress={this.getUsersLocation}
                  />
                }
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
                    GooglePlacesSearchQuery={{
                      rankby: 'distance',
                    }}
                    debounce={200}
                    
                    // requestUrl={{
                    //   useOnPlatform: 'web',
                    //   url: 'https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api',
                    // }}
                  />
                </ScrollView>
              </View>
            )
          }
        </View>
        {(mapViewOpen && location) && // Location Map for everyone
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
          )
        }
      </View>
    );
  }
}

export default LocationView;