import { Component } from "react";
import { Text, Icon, Button, Card, Image } from 'react-native-elements';
import { View, TouchableOpacity } from "react-native";
import { getDistance } from 'geolib';
import ThemeColors from "../../assets/ThemeColors";

class FoodChoiceCard extends Component {
  stars(rating) {
    if (!rating && isNaN(rating)) return [];
    const rounded_rating = Math.round(rating);
    const fullStars = Math.floor(rounded_rating);
    const halfStar = rounded_rating % 2 !== 0;
    const stars = [];

    // Gets the number of full stars to display
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Icon name="star" type="font-awesome" color='gold' size={18} />);
    }

    // Adds a half star if the rating decimal is .5 or above
    if (halfStar) {
      stars.push(<Icon name="star-half-full" type="font-awesome" color='gold' size={18} />);
    }

    for (let i = fullStars + halfStar; i < 5; i++) {
      stars.push(<Icon name="star-o" type="font-awesome" color='gold' size={18} />)
    }

    return stars;
  }

  totalRatings(num) {
    if (!num || isNaN(num)) return;
    return `(${Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)})`;
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
    if (types.length === 0) return typeNames;
    for (let i = 0; i < types.length; i++) {
      const type = types[i];
      if (i >= 4) break;
      if (type.toLowerCase() === "restaurant") {
        typeNames += " " + type.replace('_', ' ') + ",";
        break;
      }
      typeNames += " " + type.replace('_', ' ') + ",";
    }
    return typeNames.substring(1, typeNames.length - 1);
  }

  render() {
    const {
      foodChoice, navigation, i, border = true, deleteFunction, finalDecision = false, lobbyData
    } = this.props;
    return (
      <Card
        key={'food-choice-' + i}
        containerStyle={{
          elevation: border ? 6 : 0,
          minHeight: 80,
          marginBottom: 5,
          marginTop: 5,
          marginHorizontal: 5,
          paddingHorizontal: 0,
          paddingVertical: 5,
          justifyContent: 'center',
          borderRadius: 10,
          borderWidth: border ? 1 : 0,
          shadowColor: '#444',
          shadowOpacity: 0.5, 
          shadowRadius: 1,
          shadowOffset: {width: 1, height: 1}
        }}
      >
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("PlaceDetails", { foodChoice, finalDecision: finalDecision, utcOffset: lobbyData.utcOffset })
            }}
            style={{ flexDirection: 'row', maxWidth: '70%' }}
          >
            <Image
              source={{ uri: foodChoice.photos[0] }}
              style={{
                width: 65,
                marginHorizontal: 10,
                borderRadius: 5,
                marginVertical: 3,
                minHeight: 40
              }}
            />
            <View style={{ alignSelf: 'center' }}>
              <Card.Title
                style={{
                  fontSize: 18,
                  textAlign: 'left',
                  marginBottom: 0
                }}
                ellipsizeMode='tail'
                numberOfLines={1}
              >
                {foodChoice.name}
              </Card.Title>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginVertical: 2 }}>
                <Text style={{ marginRight: 5, alignSelf: 'center' }}>{foodChoice.rating}</Text>
                <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                  {
                    this.stars(foodChoice?.rating)
                  }
                </View>
                <Text style={{ alignSelf: 'center', marginRight: 5 }}>{this.totalRatings(foodChoice.userRatingsTotal)}</Text>
                <Icon
                  name="circle"
                  type="font-awesome"
                  size={5}
                  color='#333'
                  style={{ alignSelf: 'center', marginRight: 5 }}
                />
                <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                  {
                    this.priceLevel(foodChoice.priceLevel)
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
                    `${this.distanceAway(foodChoice.coordinate)} mi`
                  }
                </Text>
              </View>
              <Text
                style={{ textTransform: 'capitalize', marginRight: 5, marginVertical: 2 }}
                ellipsizeMode='tail'
                numberOfLines={1}
              >
                {this.placeTypes(foodChoice.types)}
              </Text>
            </View>
          </TouchableOpacity>
          <Button
            onPress={deleteFunction}
            icon={{
              name: 'trash',
              type: 'font-awesome',
              color: ThemeColors.textSecondary
            }}
            buttonStyle={{
              paddingHorizontal: 3,
              backgroundColor: 'transparent'
            }}
            containerStyle={{
              alignSelf: 'center',
              padding: 0
            }}
          />
        </View>
      </Card>
    )
  }
}

export default FoodChoiceCard;
