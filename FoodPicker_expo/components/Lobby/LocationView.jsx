import { Component } from "react";
import { Button, Icon, Input, ListItem, SearchBar, Text } from "react-native-elements";
import * as Location from 'expo-location';
import { View } from "react-native";
import { setDoc } from "firebase/firestore";
import { googleApiKey } from "../../config";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import ThemeColors from "../../assets/ThemeColors";
import Constants from 'expo-constants';
import { BottomSheet } from "react-native-elements/dist/bottomSheet/BottomSheet";

class LocationView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      location: props.lobbyData.location,
      locationGeocodeAddress: !Constants.platform.web && props.lobbyData.locationGeocodeAddress,
      alreadyRequested: false,
      mapViewOpen: props.isHost === true,
      distanceChoicesOpen: false,
      distance: props.lobbyData.distance,
      locationSearchText: undefined,
    }

    this.searchGooglePlaces = this.searchGooglePlaces.bind(this);
    this.changeDistance = this.changeDistance.bind(this);
  }

  componentDidMount() {
    if (this.props.isHost && !this.props.lobbyData?.location) {
      this.getUsersLocation();
      this.setState({ distance: this.props.lobbyData?.distance })
    }
  }

  componentDidUpdate(newProps) {
    if (newProps.isHost && this.state.alreadyRequested === false && newProps.lobbyData?.location !== this.props.lobbyData?.location) {
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
                setDoc(this.props.lobbyData.ref, { locationGeocodeAddress: locationGeocodeAddress }, { merge: true });
                this.setState({ locationGeocodeAddress, alreadyRequested: true });
              })
              .catch(err => {
                console.error("Error::Location::reverseGeocodeAsync", err);
              });
            setDoc(this.props.lobbyData.ref, { location: location }, { merge: true });
            this.setState({ location, alreadyRequested: true });
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

  searchGooglePlaces() {

  }

  distances = [2, 5, 10, 20, 50]

  render() {
    // return null;
    const { locationGeocodeAddress, location, mapViewOpen, distanceChoicesOpen, distance } = this.state;
    const { isHost } = this.props;
    const addressName = locationGeocodeAddress &&
      // locationGeocodeAddress[0]?.streetNumber + " " + 
      // locationGeocodeAddress[0]?.street + ", " + 
      locationGeocodeAddress[0]?.city + ", " + 
      locationGeocodeAddress[0]?.region;
      // locationGeocodeAddress[0]?.postalCode;
    
    return (
      <View style={{ borderWidth: 1.5, borderColor: 'lightgray', borderRadius: 10, overflow: 'hidden' }}>
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
              onPress={() => { this.setState({ mapViewOpen: !mapViewOpen }) }}
              buttonStyle={{ backgroundColor: 'transparent' }}
              icon={location && <Icon name={mapViewOpen ? "angle-up" : "angle-down"} type="font-awesome" />}
              iconRight
              containerStyle={{ alignSelf: 'center' }}
            />
          </View>
          {
            mapViewOpen && isHost &&
            <SearchBar
              lightTheme
              platform={Constants.platform.ios ? 'ios' : Constants.platform.android ? 'android' : 'default'}
              placeholder='Search Location'
              onChangeText={(locationSearchText) => this.setState({ locationSearchText })}
              rightIcon={<Icon name="search" type="font-awesome" onPress={this.searchGooglePlaces} />}
              inputStyle={{ paddingBottom: 0 }}
            />
          }
        </View>
        {(!Constants.platform.web && mapViewOpen && location) ?
          (
            <View>
              <MapView
                // provider={PROVIDER_GOOGLE}
                style={{ width: '100%', height: 200 }}
                initialRegion={{ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
                region={{ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: distance ? distance * 0.04 : 0.1, longitudeDelta: distance ? distance * 0.04 : 0.1 }}
              >
                {/* <Marker
                  coordinate={location.coords}
                  title={addressName}
                  description="Currently Selected Location"
                /> */}
                <Circle
                  center={{ latitude: location.coords.latitude, longitude: location.coords.longitude}}
                  radius={distance ? Math.round(distance * 1609.344) : 5000}
                  strokeWidth={2}
                  strokeColor={'transparent'}
                  fillColor={'rgba(229,64,64,0.25)'}
                />
              </MapView>
            </View>
          ) : (
            <View>
              
            </View>
          )
        }
      </View>
    );
  }
}

export default LocationView;