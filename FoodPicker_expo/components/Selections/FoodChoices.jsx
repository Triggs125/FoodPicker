import { Component } from "react";
import PropType from 'prop-types';
import { View, FlatList } from "react-native";
import { Tile, Text, Icon, Button } from 'react-native-elements';
import Constants from 'expo-constants';
import { getDistance } from 'geolib';
import ThemeColors from "../../assets/ThemeColors";
import { ScrollView } from "react-native-gesture-handler";

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
      scroll: false
    }

    this.scrollToTop = this.scrollToTop.bind(this);
  }

  isSelected(place) {
    const { selectedFoodChoices } = this.props;
    return selectedFoodChoices.some(choice => choice.id === place.id);
  }

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

  headerComponent() {
    return (
      <View style={{ marginTop: 0 }}>
        <Button
          title="Scroll to the Bottom"
          onPress={() => this.flatlistRef && this.flatlistRef.scrollToEnd()}
          titleStyle={{ fontSize: 20, color: ThemeColors.text }}
          type="clear"
          containerStyle={{
            alignSelf: 'center'
          }}
          iconRight
          icon={{
            name: 'angle-down',
            type: 'font-awesome',
            color: ThemeColors.text
          }}
        />
      </View>
    )
  }

  scrollToTop(animated = false) {
    this.flatlistRef && this.flatlistRef.scrollToIndex({ index: 0, viewOffset: 50, animated });
  }

  footerComponent() {
    const {
      lastChoicesPage, nextChoicesPage,
      foodChoices, choicesPageIndex
    } = this.props;
    let totalLength = 0;
    foodChoices.forEach(choices => totalLength += choices.length);
    return (
      <View
        style={{
          flexDirection: 'row', flex: 1, justifyContent: 'space-between',
          paddingHorizontal: 10, marginTop: -10
        }}
      >
        <Button
          title={"Last Page"}
          disabled={choicesPageIndex === 0}
          onPress={() => lastChoicesPage()}
          titleStyle={{ fontSize: 20, color: ThemeColors.text }}
          buttonStyle={{
            backgroundColor: 'white',
            paddingLeft: 20,
            paddingRight: 12,
            borderRadius: 10,
            borderTopLeftRadius: 25,
            borderBottomLeftRadius: 25,
          }}
          raised
          containerStyle={{
            borderRadius: 10,
            borderTopLeftRadius: 25,
            borderBottomLeftRadius: 25,
            marginVertical: 10,
            marginLeft: 5,
          }}
        />
        <Button
          title="Top"
          onPress={() => this.scrollToTop(true)}
          titleStyle={{ fontSize: 20, color: ThemeColors.text }}
          type="clear"
          containerStyle={{
            alignSelf: 'center'
          }}
          iconRight
          icon={{
            name: 'angle-up',
            type: 'font-awesome',
            color: ThemeColors.text
          }}
        />
        <Button
          title={
            choicesPageIndex == 3 || foodChoices[choicesPageIndex]?.length % 20 != 0
              ? "First Page"
              : "Next Page"
          }
          onPress={() => nextChoicesPage()}
          disabled={choicesPageIndex == 0 && foodChoices[choicesPageIndex]?.length % 20 != 0}
          titleStyle={{ fontSize: 20, color: 'white' }}
          buttonStyle={{ 
            backgroundColor: ThemeColors.text,
            paddingRight: 20,
            paddingLeft: 12,
            borderRadius: 10,
            borderTopRightRadius: 25,
            borderBottomRightRadius: 25,
          }}
          raised
          containerStyle={{
            borderRadius: 10,
            borderTopRightRadius: 25,
            borderBottomRightRadius: 25,
            marginVertical: 10,
            marginRight: 5,
          }}
        />
      </View>
    );
  }

  render() {
    const {
      foodChoices, choicesPageIndex
    } = this.props;
    const item = ({ item }) => {
      const place = item;
      const { selectedFoodChoices, maxNumberOfSelections } = this.props
      const isSelected = this.isSelected(place);
      this.scrollToTop();
      return (
        <Tile
          width={'90%'}
          disabled={selectedFoodChoices.length >= maxNumberOfSelections && !isSelected}
          title={place.name}
          titleStyle={{ textAlign: 'left', fontSize: 18, fontWeight: 'bold', marginTop: -5, color: isSelected ? 'white' : 'black' }}
          imageSrc={{ uri: place.photos[0] }}
          imageContainerStyle={{ backgroundColor: 'red', minHeight: 100 }}
          containerStyle={{
            marginBottom: 10,
            borderRadius: 10,
            borderWidth: Constants.platform.ios ? 0.5 : 0,
            borderColor: 'gray',
            backgroundColor: 'white',
            overflow: 'hidden',
            elevation: isSelected || selectedFoodChoices.length >= maxNumberOfSelections ? 0 : 6,
            height: 250,
            alignSelf: 'center',
          }}
          contentContainerStyle={{
            backgroundColor: isSelected ? ThemeColors.selection : 'white',
            paddingBottom: 10
          }}
          onPress={() => this.toggleSelection(place, isSelected)}
          onLongPress={() => this.props.navigation.navigate("PlaceDetails", { foodChoice: place, finalDecision: false })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
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
    };

    return (
      <>
        <FlatList
          ref={ref => this.flatlistRef = ref}
          data={foodChoices[choicesPageIndex]}
          extraData={choicesPageIndex}
          renderItem={item}
          initialNumToRender={4}
          keyExtractor={(item) => { return item.id.toString() }}
          style={{ marginHorizontal: -10 }}
          ListHeaderComponent={this.headerComponent()}
          ListFooterComponent={this.footerComponent()}
        />
      </>
    )
  }
}

FoodChoices.propTypes = propTypes;

export default FoodChoices;