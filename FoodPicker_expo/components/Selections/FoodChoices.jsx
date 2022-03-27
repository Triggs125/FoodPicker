import { Component } from "react";
import PropType from 'prop-types';
import { View, Dimensions, StatusBar } from "react-native";
import { Tile, Text, Icon } from 'react-native-elements';
import Constants from 'expo-constants';
import { getDistance } from 'geolib';
import ThemeColors from "../../assets/ThemeColors";
import { HeaderHeightContext } from "@react-navigation/elements";
import LoadingSpinner from "../LoadingSpinner";


const propTypes = {
  googleSearchText: PropType.string,
  addFoodChoice: PropType.func,
  removeFoodChoice: PropType.func,
  choicesPageIndex: PropType.number,
}

class FoodChoices extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 35 : 20;
    const adBannerHeight = StatusBar.currentHeight + 60;
    const screenHeight = Dimensions.get('screen').height - offset - adBannerHeight;

    this.state = {
      screenHeight: screenHeight
    }
  }

  isSelected(place) {
    const { selectedFoodChoices } = this.props;
    return selectedFoodChoices.some(choice => choice.id === place.id);
  }

  stars(rating) {
    if (!rating && isNaN(rating)) return [];
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

    for (let i = fullStars + halfStar; i < 5; i++) {
      stars.push(<Icon name="star-o" type="font-awesome" color='gold' size={18} />)
    }
    return stars;
  }

  totalRatings(num) {
    if (!num || isNaN(num)) return "";
    return `(${Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)})`;
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
      if (type.toLowerCase() === "restaurant") {
        typeNames += " " + type.replace('_', ' ') + ",";
        break;
      }
      typeNames += " " + type.replace('_', ' ') + ",";
    }
    return typeNames.substring(1, typeNames.length - 1);
  }

  toggleSelection(place, isSelected) {
    const { addFoodChoice, removeFoodChoice } = this.props;
    if (isSelected) {
      removeFoodChoice(place);
    } else {
      addFoodChoice(place)
    }
  }

  render() {
    const { choicesPageIndex, foodChoices, selectedFoodChoices, maxNumberOfSelections } = this.props;
    const { screenHeight } = this.state;

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View key={'food-choices'} style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginHorizontal: -10, marginVertical: 5 }}>
            {
              foodChoices?.map((place, i) => {
                if (i < choicesPageIndex * 2 || i >= choicesPageIndex * 2 + 2) return;
                const isSelected = this.isSelected(place);
                return (
                  <Tile
                    key={'food-choice-' + i}
                    width={'90%'}
                    disabled={selectedFoodChoices.length >= maxNumberOfSelections && !isSelected}
                    title={place.name}
                    titleStyle={{ textAlign: 'left', fontSize: 18, fontWeight: 'bold', marginTop: -5, color: isSelected ? 'white' : 'black' }}
                    imageSrc={{ uri: place.photos[0] }}
                    imageContainerStyle={{ backgroundColor: 'red' }}
                    containerStyle={{
                      marginBottom: 10,
                      borderRadius: 10,
                      borderWidth: Constants.platform.ios ? 0.5 : 0,
                      borderColor: 'gray',
                      backgroundColor: 'white',
                      overflow: 'hidden',
                      elevation: isSelected || selectedFoodChoices.length >= maxNumberOfSelections ? 0 : 6,
                      height: (screenHeight - headerHeight - 220) / 2,
                      alignSelf: 'center',
                    }}
                    wrapperStyle={{
                      margin: -15,
                    }}
                    contentContainerStyle={{ backgroundColor: isSelected ? ThemeColors.selection : 'white', paddingBottom: 10 }}
                    onPress={() => this.toggleSelection(place, isSelected)}
                    onLongPress={() => this.props.navigation.navigate("PlaceDetails", { foodChoice: place })}
                  >
                    <View key={'food-choice-info'} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ marginRight: 5, alignSelf: 'center', color: isSelected ? 'white' : 'black' }}>{place.rating}</Text>
                      <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                        {
                          this.stars(place.rating)
                        }
                      </View>
                      <Text style={{ alignSelf: 'center', marginRight: 5, color: isSelected ? 'white' : 'black' }}>{this.totalRatings(place.userRatingsTotal)}</Text>
                      {
                        place.priceLevel !== undefined && place.priceLevel > 0 && (
                          <>
                            <Icon
                              name="circle"
                              type="font-awesome"
                              size={5}
                              color={isSelected ? 'white' : 'black'}
                              style={{ alignSelf: 'center', marginRight: 5 }}
                            />
                            <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center', color: isSelected ? 'white' : 'black' }}>
                              {
                                this.priceLevel(place.priceLevel)
                              }
                            </Text>
                          </>
                        )
                      }
                      <Icon
                        name="circle"
                        type="font-awesome"
                        size={5}
                        color={isSelected ? 'white' : 'black'}
                        style={{ alignSelf: 'center', marginRight: 5 }}
                      />
                      <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center', color: isSelected ? 'white' : 'black' }}>
                        {
                          `${this.distanceAway(place.coordinate)} mi`
                        }
                      </Text>
                      <Icon
                        name="circle"
                        type="font-awesome"
                        size={5}
                        color={isSelected ? 'white' : 'black'}
                        style={{ alignSelf: 'center', marginRight: 5 }}
                      />
                      <Text style={{ color: isSelected ? 'white' : place.opennow ? 'green' : ThemeColors.text }}>
                        {
                          place.opennow ? "Open" : "Closed"
                        }
                      </Text>
                    </View>
                    <Text key={'food-choic-types'} style={{ textTransform: 'capitalize', marginRight: 5, color: isSelected ? 'white' : 'black' }}>
                      {this.placeTypes(place.types)}
                    </Text>
                    <Text key={'food-choice-vicinity'} style={{ color: isSelected ? 'white' : 'black' }}>{place.vicinity}</Text>
                  </Tile>
                );
              })
            }
          </View>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

FoodChoices.propTypes = propTypes;

export default FoodChoices;