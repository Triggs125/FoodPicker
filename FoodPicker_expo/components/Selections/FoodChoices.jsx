import { Component } from "react";
import PropType from 'prop-types';
import { View } from "react-native";
import { Tile, AirbnbRating, Text } from 'react-native-elements';
import Constants from 'expo-constants';
import { Icon } from "react-native-elements/dist/icons/Icon";
import { getDistance } from 'geolib';

const propTypes = {
  googleSearchText: PropType.string,
  addFoodChoice: PropType.func,
  removeFoodChoice: PropType.func,
  choicesPageIndex: PropType.number,
}

class FoodChoices extends Component {
  stars(rating) {
    const _rating = Math.round(rating * 2);
    const fullStars = Math.floor(_rating / 2);
    const halfStar = _rating % 2 !== 0;
    const stars = [];

    // Gets the number of full stars to display
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Icon name="star" type="font-awesome" color='gold' size={18} />);
    }

    // Adds a half star if the rating decimal is .5 or above
    if (halfStar) {
      stars.push(<Icon name="star-half-full" type="font-awesome" color='gold' size={18} />);
    }
    
    return stars;
  }

  totalRatings(num) {
    return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
  }

  priceLevel(priceLevel) {
    let price = "";
    for (let i = 0; i < priceLevel; i++) {
      price += '$';
    }
    return price;
  }

  distanceAway(coords) {
    const { lobbyData } = this.props;
    const lobbyCoords = { latitude: lobbyData.location.latitude, longitude: lobbyData.location.longitude };
    return Math.round((getDistance(lobbyCoords, coords) / 1609.344) * 10) / 10;
  }

  placeTypes(types) {
    let typeNames = "";
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (type.toLowerCase() === "restaurant") {
        if (i === 0) return type;
        return typeNames;
      }
      typeNames += type.replace('_', ' ') + " ";
    }
    return typeNames;
  }

  render() {
    const { choicesPageIndex, foodChoices } = this.props;

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginHorizontal: -10 }}>
        {
          foodChoices?.map((place, i) => {
            if (i < choicesPageIndex * 2 || i >= choicesPageIndex * 2 + 2) return;
            return (
              <Tile
                key={i}
                imageSrc={{ uri: place.photos[0] }}
                imageContainerStyle={{ height: 0 }}
                height={200}
                width={'90%'}
                title={place.name}
                titleStyle={{ textAlign: 'left', fontSize: 16, fontWeight: 'bold' }}
                containerStyle={{
                  margin: 10,
                  borderRadius: 10,
                  borderWidth: Constants.platform.ios && '0.5',
                  borderColor: 'gray',
                  backgroundColor: 'white',
                  overflow: 'hidden',
                  elevation: 5,
                }}
                onPress={() => this.props.addFoodChoice(place)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ marginRight: 5, alignSelf: 'center' }}>{place.rating}</Text>
                  <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                    {
                      this.stars(place.rating).map(star => star)
                    }
                  </View>
                  <Text style={{ alignSelf: 'center', marginRight: 5 }}>({this.totalRatings(place.userRatingsTotal)})</Text>
                  <Icon
                    name="circle"
                    type="font-awesome"
                    size={5}
                    color='#333'
                    style={{ alignSelf: 'center', marginRight: 5 }}
                  />
                  <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                    {
                      this.priceLevel(place.priceLevel)
                    }
                  </Text>
                  <Icon
                    name="circle"
                    type="font-awesome"
                    size={5}
                    color='#333'
                    style={{ alignSelf: 'center', marginRight: 5 }}
                  />
                  <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                    {
                      `${this.distanceAway(place.coordinate)} mi`
                    }
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ textTransform: 'capitalize', marginRight: 5 }}>{this.placeTypes(place.types)}</Text>
                  <Icon
                    name="circle"
                    type="font-awesome"
                    size={5}
                    color='#333'
                    style={{ alignSelf: 'center', marginRight: 5 }}
                  />
                  <Text>{place.vicinity}</Text>
                </View>
              </Tile>
            );
          })
        }
      </View>
    );
  }
}

FoodChoices.propTypes = propTypes;

export default FoodChoices;