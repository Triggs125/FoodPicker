import { View } from "react-native";
import { Button, Icon, Image, Text, Tile } from "react-native-elements";
import Constants from 'expo-constants';
import { getDistance } from 'geolib';
import ThemeColors from "../../assets/ThemeColors";
import { useState } from "react";

export const FoodChoiceItem = ({
  lobbyData, place,
  selectedFoodChoices, maxNumberOfSelections,
  addFoodChoice, removeFoodChoice,
  navigation
}) => {
  const selected = selectedFoodChoices.some(choice => choice.id === place.id);
  const [isSelected, setIsSelected] = useState(selected);

  function stars(rating) {
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

  function totalRatings(num) {
    if (!num || isNaN(num)) return "";
    return `(${Math.abs(num) > 999 ? Math.sign(num) * ((Math.abs(num) / 1000).toFixed(1)) + 'k' : Math.sign(num) * Math.abs(num)})`;
  }

  function priceLevel(priceLevel) {
    let price = "";
    for (let i = 0; i < priceLevel; i++) {
      price += '$';
    }
    return price;
  }

  function distanceAway(coords) {
    const lobbyCoords = { latitude: lobbyData.location.latitude, longitude: lobbyData.location.longitude };
    return Math.round((getDistance(lobbyCoords, coords) / 1609.344) * 10) / 10;
  }

  function placeTypes(types) {
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

  function toggleSelection(place, isSelected) {
    if (isSelected) {
      removeFoodChoice(place);
      setIsSelected(false);
    } else {
      addFoodChoice(place);
      setIsSelected(true);
    }
  }

  return (
    <Button
      raised={selectedFoodChoices.length < maxNumberOfSelections}
      disabled={selectedFoodChoices.length >= maxNumberOfSelections && !isSelected}
      onPress={() => toggleSelection(place, isSelected)}
      onLongPress={() => navigation.navigate("PlaceDetails", { foodChoice: place, finalDecision: false })}
      containerStyle={{
        backgroundColor: 'transparent',
        padding: 0,
        marginHorizontal: 20,
        marginBottom: 10,
        height: 250,
        borderRadius: 10
      }}
      buttonStyle={{
        backgroundColor: 'transparent',
        padding: 0,
        marginBottom: 10,
        borderRadius: 10,
      }}
      title={
        <View
          style={{
            borderWidth: 1,
            borderColor: 'lightgray',
            borderRadius: 10,
            overflow: 'hidden',
            elevation: isSelected || selectedFoodChoices.length >= maxNumberOfSelections ? 0 : 6,
            height: 250,
            width: '100%',
            alignSelf: 'center',
            backgroundColor: (
              isSelected
                ? ThemeColors.selection
                : selectedFoodChoices.length >= maxNumberOfSelections && !isSelected
                  ? ThemeColors.disabledCard
                  : 'white'
            ),
          }}
        >
          <Image
            source={{ uri: place.photos[0] }}
            containerStyle={{
              backgroundColor: 'red',
              minHeight: 130,
            }}
            placeholderStyle={{
              backgroundColor: ThemeColors.disabledCard
            }}
          />
          <View style={{ padding: 10 }}>
            <Text
              style={{
                textAlign: 'left',
                fontSize: 18,
                fontWeight: 'bold',
                color: isSelected ? 'white' : 'black',
                marginBottom: 5
              }}
              numberOfLines={1}
            >
              {place.name}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', marginVertical: 2 }}>
              <Text style={{ marginRight: 5, alignSelf: 'center', color: isSelected ? 'white' : 'black' }}>{place.rating}</Text>
              <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                {
                  stars(place.rating)
                }
              </View>
              <Text style={{ alignSelf: 'center', marginRight: 5, color: isSelected ? 'white' : 'black' }}>{totalRatings(place.userRatingsTotal)}</Text>
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
                        priceLevel(place.priceLevel)
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
                  `${distanceAway(place.coordinate)} mi`
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
            <Text
              key={'food-choic-types'}
              style={{
                textTransform: 'capitalize',
                marginRight: 5,
                color: isSelected ? 'white' : 'black',
                marginVertical: 5
              }}
              numberOfLines={1}
            >
              {placeTypes(place.types)}
            </Text>
            <Text
              key={'food-choice-vicinity'}
              style={{ color: isSelected ? 'white' : 'black', marginVertical: 2 }}
              numberOfLines={1}
            >
              {place.vicinity}
            </Text>
          </View>
        </View>
      }
    />
  )

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
        borderWidth: 1,
        borderColor: 'lightgray',
        backgroundColor: selectedFoodChoices.length >= maxNumberOfSelections && !isSelected ? ThemeColors.disabledCard : 'white',
        overflow: 'hidden',
        elevation: isSelected || selectedFoodChoices.length >= maxNumberOfSelections ? 0 : 6,
        height: 250,
        alignSelf: 'center',
      }}
      contentContainerStyle={{
        backgroundColor: (
          isSelected
            ? ThemeColors.selection
            : selectedFoodChoices.length >= maxNumberOfSelections && !isSelected
              ? ThemeColors.disabledCard
              : 'white'
        ),
        paddingBottom: 10
      }}
      onPress={() => toggleSelection(place, isSelected)}
      onLongPress={() => navigation.navigate("PlaceDetails", { foodChoice: place, finalDecision: false })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 2 }}>
        <Text style={{ marginRight: 5, alignSelf: 'center', color: isSelected ? 'white' : 'black' }}>{place.rating}</Text>
        <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
          {
            stars(place.rating)
          }
        </View>
        <Text style={{ alignSelf: 'center', marginRight: 5, color: isSelected ? 'white' : 'black' }}>{totalRatings(place.userRatingsTotal)}</Text>
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
                  priceLevel(place.priceLevel)
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
            `${distanceAway(place.coordinate)} mi`
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
        {placeTypes(place.types)}
      </Text>
      <Text key={'food-choice-vicinity'} style={{ color: isSelected ? 'white' : 'black', marginVertical: 2 }}>{place.vicinity}</Text>
    </Tile>
  );
}