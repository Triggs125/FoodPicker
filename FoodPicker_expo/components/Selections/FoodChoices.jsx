import { Component } from "react";
import PropType from 'prop-types';
import { View, Dimensions, StatusBar, SafeAreaView, FlatList } from "react-native";
import { Tile, Text, Icon } from 'react-native-elements';
import Constants from 'expo-constants';
import { getDistance } from 'geolib';
import ThemeColors from "../../assets/ThemeColors";
import { HeaderHeightContext } from "@react-navigation/elements";
import { ScreenHeight } from "react-native-elements/dist/helpers";
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

const propTypes = {
  googleSearchText: PropType.string,
  addFoodChoice: PropType.func,
  removeFoodChoice: PropType.func,
  choicesPageIndex: PropType.number,
}

class FoodChoices extends Component {
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
    const {
      foodChoices, selectedFoodChoices, maxNumberOfSelections, nextChoicesPage, i = 0, choicesPageIndex
    } = this.props;
    const item = ({ item }) => {
      const place = item;
      return (
        <SafeAreaInsetsContext.Consumer>
          {
            insets => (
              <HeaderHeightContext.Consumer>
                {
                  headerHeight => {
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
                          height: (
                            ScreenHeight - insets.bottom
                            - insets.top - headerHeight
                            - StatusBar.currentHeight - 220) / 2,
                          alignSelf: 'center',
                        }}
                        wrapperStyle={{
                          margin: -15,
                        }}
                        contentContainerStyle={{ backgroundColor: isSelected ? ThemeColors.selection : 'white', paddingBottom: 10 }}
                        onPress={() => this.toggleSelection(place, isSelected)}
                        onLongPress={() => this.props.navigation.navigate("PlaceDetails", { foodChoice: place, finalDecision: false })}
                      >
                        <View key={'food-choice-info'} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
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
                        <Text key={'food-choic-types'} style={{ textTransform: 'capitalize', marginRight: 5, color: isSelected ? 'white' : 'black', marginVertical: 5 }}>
                          {this.placeTypes(place.types)}
                        </Text>
                        <Text key={'food-choice-vicinity'} style={{ color: isSelected ? 'white' : 'black', marginVertical: 2 }}>{place.vicinity}</Text>
                      </Tile>
                    );
                  }
                }
              </HeaderHeightContext.Consumer>
            )
          }
        </SafeAreaInsetsContext.Consumer>
      );
    };

    return (
      <FlatList
        data={foodChoices}
        renderItem={item}
        onEndReached={nextChoicesPage}
        onEndReachedThreshold={0.3}
        initialNumToRender={4}
        keyExtractor={item => item.id}
      />
    )
  }
}

FoodChoices.propTypes = propTypes;

export default FoodChoices;