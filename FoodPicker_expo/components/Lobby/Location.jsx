import { Component } from "react";
import { Button, Text } from "react-native-elements";
import * as Location from 'expo-location';
import { View } from "react-native";
import { setDoc } from "firebase/firestore";
import { googleApiKey } from "../../config";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import ThemeColors from "../../assets/ThemeColors";

class LocationView extends Component {
  constructor(props) {
    super(props);

    this.state = {
      location: undefined,
      locationGeocodeAddress: undefined,
      alreadyRequested: false,
      mapViewOpen: true,
    }
  }

  componentDidMount() {
    if (!this.props.lobbyData?.location) {
      this.getUsersLocation();
    } else {
      this.setState({ location: this.props.lobbyData?.location, locationGeocodeAddress: this.props.lobbyData?.locationGeocodeAddress });
    }
  }

  componentDidUpdate(newProps) {
    if (newProps.isHost && this.state.alreadyRequested === false) {
      if (!newProps.lobbyData?.location) {
        this.getUsersLocation();
      } else {
        this.setState({ location: this.props.lobbyData?.location, locationGeocodeAddress: this.props.lobbyData?.locationGeocodeAddress });
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
                this.setState({ locationGeocodeAddress });
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
  }

  render() {
    const { locationGeocodeAddress, location, mapViewOpen } = this.state;
    const addressName = locationGeocodeAddress &&
      locationGeocodeAddress[0]?.streetNumber + " " + 
      locationGeocodeAddress[0]?.street + ", " + 
      locationGeocodeAddress[0]?.city + ", " + 
      locationGeocodeAddress[0]?.region + " " + 
      locationGeocodeAddress[0].postalCode;
    
    return (
      <View style={{ borderWidth: 1, borderColor: 'black', borderRadius: 15, overflow: 'hidden' }}>
        <Text style={{ fontSize: 20, textAlign: 'center', paddingTop: 10 }}>Lobby Location:</Text>
        {location &&
          <Button
            title={addressName}
            titleStyle={{ textAlign: 'center', color: 'blue' }}
            onPress={() => { this.setState({ mapViewOpen: !this.state.mapViewOpen }) }}
            buttonStyle={{ backgroundColor: 'transparent' }}
          />
        }
        {location && mapViewOpen &&
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ width: '100%', height: 200 }}
            initialRegion={{ latitude: location.coords.latitude, longitude: location.coords.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
          >
            {/* <Marker
              coordinate={location.coords}
              title={addressName}
              description="Currently Selected Location"
            /> */}
            <MapView.Circle
              center={location.coords}
              radius={5000}
              strokeWidth={2}
              strokeColor={ThemeColors.text}
              fillColor={'rgba(30,30,30,0.5)'}
            />
          </MapView>
        }
      </View>
    );
  }
}

export default LocationView;