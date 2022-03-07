import { Component } from "react";
import { Dimensions, Linking, View } from "react-native";
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import { Text, Icon } from "react-native-elements";
import { SliderBox } from 'react-native-image-slider-box';
import { getDistance } from 'geolib';
import LoadingSpinner from "../LoadingSpinner";
import ThemeColors from "../../assets/ThemeColors";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Button } from "react-native-elements/dist/buttons/Button";
import { PLACE_DETAILS_API_KEY } from "../../config";

class PlaceDetails extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 35 : 0;
    const adBannerHeight = 60;
    const screenHeight = Dimensions.get('screen').height - offset;

    this.state = {
      loading: true,
      screenHeight: screenHeight
    }
  }

  componentDidMount() {
    this.componentFocusUnsub = this.props.navigation.addListener('focus', () => {
      this.componentDidAppear();
    });
    if (this.props.route?.params?.foodChoice) {
      this.componentDidAppear();
    }
  }

  componentWillUnmount() {
    this.componentFocusUnsub && this.componentFocusUnsub();
  }

  componentDidAppear() {
    const foodChoice = this.props.route?.params?.foodChoice;
    const url = "https://maps.googleapis.com/maps/api/place/details/json?place_id=" + foodChoice.id 
    + '&key=' + 'AIzaSyABLEWTpgnHhloYv_JH301853XGEhVDpMc';;

    this.setState({ loading: true });
    fetch(url)
      .then(res => {
        return res.json();
      })
      .then(res => {        
        this.setState({ place: res.result });
      })
      .catch(error => {
        console.error("FoodChoices::fetchNearestPlacesFromGoogle", error);
      })
      .finally(() => {
        this.setState({ loading: false })
      });
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
    if (!num || isNaN(num)) return;
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

  hexToRgbA(hex, opacity = 1) {
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if(c.length == 3){
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c>>16)&255, (c>>8)&255, c&255].join(',') + ',' + opacity + ')';
    }
    return hex;
  }

  clickPlaceLink(url) {
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.info("Don't know how to open URL:", url);
      }
    });
  }

  render() {
    const { screenHeight, place } = this.state;
    const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=${PLACE_DETAILS_API_KEY}&maxwidth=400&photo_reference=`;

    const images = place?.photos?.map(photo => GooglePicBaseUrl + photo.photo_reference);
    const coordinate = {
      latitude: place?.geometry.location.lat,
      longitude: place?.geometry.location.lng,
    };

    return (
      <HeaderHeightContext.Consumer>
        {headerHeight => (
          <View
            style={{
              height: screenHeight - headerHeight,
            }}
          >
            {
              place ? (
                <View>
                  <SliderBox
                    images={images}
                    dotColor={ThemeColors.text}
                    imageLoadingColor={ThemeColors.text}
                    circleLoop
                  />
                  <View
                    style={{
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                      backgroundColor: 'white',
                      borderRadius: 10,
                      margin: 10,
                      elevation: 2,
                      borderWidth: 1.5,
                      borderColor: 'lightgray'
                    }}
                  >
                    <Text h4 style={{ textAlign: 'center', marginBottom: 5 }}>{place?.name}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ marginRight: 5, alignSelf: 'center' }}>{place.rating}</Text>
                      <View style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                        {
                          this.stars(place.rating).map(star => star)
                        }
                      </View>
                      <Text style={{ alignSelf: 'center', marginRight: 5 }}>{this.totalRatings(place.userRatingsTotal)}</Text>
                      <Icon
                        name="circle"
                        type="font-awesome"
                        size={5}
                        color='#333'
                        style={{ alignSelf: 'center', marginRight: 5 }}
                      />
                      <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
                        {
                          this.priceLevel(place.price_level)
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
                          `${this.distanceAway(coordinate)} mi`
                        }
                      </Text>
                    </View>
                    <Text 
                      style={{
                        textAlign: 'center',
                        fontSize: 18, 
                        textTransform: 'capitalize', 
                        marginRight: 5 
                      }}
                    >
                      {this.placeTypes(place.types)}
                    </Text>
                    <Text style={{ fontSize: 18, textAlign: 'center' }}>{place.vicinity}</Text>
                    <Button
                      title="Google Page"
                      titleStyle={{ fontSize: 20, color: 'blue' }}
                      onPress={() => this.clickPlaceLink(place.url)}
                    />
                  </View>
                </View>
              ) : (
                <LoadingSpinner />
              )
            }
            
          </View>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

export default PlaceDetails;