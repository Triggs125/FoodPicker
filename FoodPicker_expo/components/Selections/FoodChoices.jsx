import { Component } from "react";
import PropType from 'prop-types';
import { Dimensions, StyleSheet, View } from "react-native";
import { Card, Icon, Input, Text, Tile } from 'react-native-elements';
import { getNearbyRestaurants } from '../../services/service';
import Constants from 'expo-constants';
import { SliderBox } from "react-native-image-slider-box";

const propTypes = {
  googleSearchText: PropType.string,
  addFoodChoice: PropType.func,
  removeFoodChoice: PropType.func,
  choicesPageIndex: PropType.number,
}

class FoodChoices extends Component {
  constructor(props) {
    super(props);

    this.state = {
      foodChoices: [],
    }

    this.fetchNearestPlacesFromGoogle = this.fetchNearestPlacesFromGoogle.bind(this);
  }

  componentDidMount() {
    this.fetchNearestPlacesFromGoogle();
  }

  fetchNearestPlacesFromGoogle() {
    const { lobbyData } = this.props.route.params;
    
    const latitude = lobbyData.location.latitude;
    const longitude = lobbyData.location.longitude;
    const radius = Math.round(lobbyData.distance * 1609.344);
    const types = 'establishments';
    const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'
      + 'location=' + latitude + ',' + longitude
      + '&radius=' + radius
      + '&types=' + types
      + '&keyword=restaurant'
      + '&key=' + 'AIzaSyABLEWTpgnHhloYv_JH301853XGEhVDpMc'

    fetch(url)
      .then(res => {
        return res.json()
      })
      .then(res => {

        var places = []
        const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=AIzaSyB1q8bz0Sr14VhwhwKaUiinzUHZmwtj9oo&maxwidth=400&photo_reference=`
        for(let googlePlace of res.results) {
          var place = {}
          var lat = googlePlace.geometry.location.lat;
          var lng = googlePlace.geometry.location.lng;
          var coordinate = {
            latitude: lat,
            longitude: lng,
          }

          var gallery = []
          if (googlePlace.photos) {
            console.log("Photo Length:", googlePlace.photos.length)
            for(let photo of googlePlace.photos) {
              var photoUrl = GooglePicBaseUrl + photo.photo_reference;
              gallery.push(photoUrl);
            }
          }

          place['types'] = googlePlace.types
          place['coordinate'] = coordinate
          place['id'] = googlePlace.place_id
          place['name'] = googlePlace.name
          place['photos'] = gallery

          places.push(place);
        }

        this.setState({ places });
      })
      .catch(error => {
        console.error("FoodChoices::fetchNearestPlacesFromGoogle", error);
      });
  }

  render() {
    const { places } = this.state;

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
        {
          places?.map((place, i) => {
            if (i >= 2) return;
            return (
              <Card
                key={i}
                containerStyle={{ borderRadius: 10 }}
              >
                <View style={{ marginTop: -15 }}>
                  <SliderBox images={place.photos} />
                </View>
                <Card.Title>{place.name}</Card.Title>
              </Card>
              
              // <Tile
              //   key={i}
              //   // imageSrc={{ uri: place.photos[0] }}
              //   imageContainerStyle={{ height: 0 }}
              //   height={200}
              //   width={'90%'}
              //   // title={place.name}
              //   // titleStyle={{ textAlign: 'left', fontSize: 16, fontWeight: 'bold' }}
              //   containerStyle={{
              //     margin: 10,
              //     borderRadius: 10,
              //     borderWidth: Constants.platform.ios && '0.5',
              //     borderColor: 'gray',
              //     backgroundColor: 'white',
              //     overflow: 'hidden',
              //     elevation: 5
              //   }}
              // >
              //   <View style={{ marginLeft: -15 }}>
              //     <SliderBox images={place.photos} />
              //   </View>
              //   <Text style={{ textAlign: 'left', fontSize: 16, fontWeight: 'bold' }}>{place.name}</Text>
              // </Tile>
            );
          })
        }
      </View>
    );
  }
}

FoodChoices.propTypes = propTypes;

export default FoodChoices;