import { Component } from "react";
import { Dimensions, Linking, View } from "react-native";
import Constants from 'expo-constants';
import { HeaderHeightContext } from '@react-navigation/elements';
import { Text, Icon, ListItem, Avatar } from "react-native-elements";
import { SliderBox } from 'react-native-image-slider-box';
import { getDistance } from 'geolib';
import LoadingSpinner from "../LoadingSpinner";
import ThemeColors from "../../assets/ThemeColors";
import { ScrollView, TouchableOpacity } from "react-native-gesture-handler";
import { Button } from "react-native-elements/dist/buttons/Button";
import { PLACE_DETAILS_API_KEY } from "../../config";
import { ScreenHeight, ScreenWidth } from "react-native-elements/dist/helpers";
import { TabBar, TabView, SceneMap } from 'react-native-tab-view'

class PlaceDetails extends Component {
  constructor(props) {
    super(props);

    const offset = Constants.platform.android ? 35 : 0;
    const adBannerHeight = 60;
    const screenHeight = Dimensions.get('screen').height - offset;

    const tabRoutes = [
      { key: 'details', title: 'Details' },
      { key: 'reviews', title: 'Reviews' },
      { key: 'hours', title: 'Hours' },
    ]

    this.state = {
      loading: true,
      screenHeight: screenHeight,
      tabIndex: 0,
      tabRoutes,
    };
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
    + '&key=' + PLACE_DETAILS_API_KEY;

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
      stars.push(<Icon name="star" type="font-awesome" color='gold' size={20} />);
    }

    // Adds a half star if the rating decimal is .5 or above
    if (halfStar) {
      stars.push(<Icon name="star-half-full" type="font-awesome" color='gold' size={20} />);
    }

    for (let i = fullStars + halfStar; i < 5; i++) {
      stars.push(<Icon name="star-o" type="font-awesome" color='gold' size={20} />)
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
    Linking.canOpenURL(url)
    .then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        console.error("Don't know how to open URL:" + url);
      }
    });
  }

  callNumber(formatted_phone_number) {
    if (Platform.OS === 'android') {
      Linking.openURL(`tel:${formatted_phone_number}`);
    } else {
      Linking.openURL(`telprompt:${formatted_phone_number}`);
    }
  }

  render() {
    const { screenHeight, place, tabIndex, tabRoutes } = this.state;
    
    const GooglePicBaseUrl = `https://maps.googleapis.com/maps/api/place/photo?key=${PLACE_DETAILS_API_KEY}&maxwidth=400&photo_reference=`;
    const images = place?.photos?.map(photo => GooglePicBaseUrl + photo.photo_reference);
    const coordinate = {
      latitude: place?.geometry.location.lat,
      longitude: place?.geometry.location.lng,
    };

    let dayOfWeek = ((new Date()).getDay()) - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;

    const DetailsTab = () => (
      <ScrollView contentContainerStyle={{
        width: ScreenWidth,
        height: (screenHeight / 3) * 2 - 100,
        justifyContent: 'space-between',
      }}>
        <View>
          <Text h3 h3Style={{ textAlign: 'center', paddingBottom: 5, paddingTop: 10 }}>{place?.name}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 5 }}>
            <Text
              style={{
                fontWeight: 'normal',
                marginRight: 5,
                alignSelf: 'center',
                fontSize: 18
              }}
            >
              {place?.rating}
            </Text>
            <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center' }}>
              {
                this.stars(place?.rating)
              }
            </Text>
            <Text
              style={{
                fontWeight: 'normal',
                alignSelf: 'center',
                marginRight: 5,
                fontSize: 18
              }}
            >
              {this.totalRatings(place?.user_ratings_total)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: 5 }}>
            <Text
              style={{
                flexDirection: 'row',
                marginRight: 5,
                alignSelf: 'center',
                fontSize: 18
              }}
            >
              {
                this.priceLevel(place?.price_level)
              }
            </Text>
            <Icon
              name="circle"
              type="font-awesome"
              size={5}
              color='#333'
              style={{
                marginRight: 5,
                paddingTop: 10,
              }}
            />
            <Text style={{ flexDirection: 'row', marginRight: 5, alignSelf: 'center', fontSize: 18 }}>
              {
                `${this.distanceAway(coordinate)} mi`
              }
            </Text>
          </View>
          <Text
            style={{
              color: place?.opening_hours.open_now ? 'green' : ThemeColors.text,
              fontSize: 22,
              alignSelf: 'center',
              paddingVertical: 5,
            }}
          >
            {
              place?.opening_hours.open_now ? "Open Now" : "Closed Now"
            }
          </Text>
          <Text style={{
            fontSize: 16,
            textAlign: 'center',
            paddingVertical: 5,
          }}>
            {place?.opening_hours?.weekday_text[dayOfWeek]}
          </Text>
          <Text
            style={{
              textAlign: 'center',
              fontSize: 20,
              textTransform: 'capitalize',
              paddingVertical: 5,
            }}
          >
            {this.placeTypes(place?.types)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 30 }}>
          <Button
            title={'Call'}
            type='solid'
            buttonStyle={{
              backgroundColor: ThemeColors.button,
              borderRadius: 10,
              height: 70,
            }}
            titleStyle={{ fontSize: 20, color: 'white'}}
            raised
            containerStyle={{ marginTop: 5, marginBottom: 10, width: 100, borderRadius: 10 }}
            icon={<Icon onPress={() => this.callNumber(place.formatted_phone_number)} name="phone-alt" type="font-awesome-5" color='white' />}
            iconPosition='top'
            onPress={() => this.callNumber(place.formatted_phone_number)}
          />
          <Button
            title={'Directions'}
            type='solid'
            buttonStyle={{
              backgroundColor: ThemeColors.button,
              borderRadius: 10,
              height: 70,
            }}
            raised
            titleStyle={{ fontSize: 20, color: 'white' }}
            containerStyle={{ marginTop: 5, marginBottom: 10, width: 130, borderRadius: 10 }}
            icon={<Icon name="map" type="font-awesome-5" color='white' />}
            iconPosition='top'
            onPress={() => this.clickPlaceLink(place?.url)}
          />
          <Button
            title={'Website'}
            type='solid'
            buttonStyle={{
              backgroundColor: ThemeColors.button,
              borderRadius: 10,
              height: 70,
            }}
            raised
            titleStyle={{ fontSize: 20, color: 'white' }}
            containerStyle={{ marginTop: 5, marginBottom: 10, width: 100, borderRadius: 10 }}
            icon={<Icon name="globe-americas" type="font-awesome-5" color='white' />}
            iconPosition='top'
            onPress={() => this.clickPlaceLink(place?.website)}
          />
        </View>
      </ScrollView>
    );
    
    const ReviewsTab = () => (
      <ScrollView>
        <Text
          style={{
            fontSize: 24,
            textAlign: 'center',
            fontWeight: 'bold',
            marginVertical: 10,
          }}
        >
          Top {place?.reviews?.length || 0} Reviews
        </Text>
        <Text
          style={{
            width: ScreenWidth,
            textAlign: 'center',
            fontSize: 22,
          }}
        >
          Average Review: {place?.rating} {this.totalRatings(place.user_ratings_total)}
        </Text>
        {
          place?.reviews?.map(review => {
            return (
              <>
                <ListItem>
                  <Avatar source={{ uri: review.profile_photo_url }} />
                  <ListItem.Title>{review.author_name}</ListItem.Title>
                </ListItem>
                <ListItem containerStyle={{ marginTop: -10, paddingTop: 5 }}>
                  <View style={{ flexDirection: 'row' }}>
                    <Text>{this.stars(review.rating)}</Text>
                    <Text style={{ alignSelf: 'center' }}>   {review.relative_time_description}</Text>
                  </View>
                </ListItem>
                <ListItem containerStyle={{ marginTop: -10, paddingTop: 5 }}>
                  <ListItem.Title>
                    {review.text}
                  </ListItem.Title>
                </ListItem>
              </>
            );
          })
        }
      </ScrollView>
    );
    
    const HoursTab = () => (
      <View style={{ paddingHorizontal: 10, paddingTop: 10 }}>
        <Text
          style={{
            color: place?.opening_hours.open_now ? 'green' : ThemeColors.text,
            fontSize: 24,
            textAlign: 'center',
            marginBottom: 10,
          }}
        >
          {
            place?.opening_hours.open_now ? "Open Now" : "Closed Now"
          }
        </Text>
        {
          place?.opening_hours?.weekday_text?.map(weekday => {
            return (
              <Text style={{
                fontWeight: 'normal',
                fontSize: 20,
                textAlign: 'center',
              }}>
                {weekday}
              </Text>
            )
          })
        }
      </View>
    );

    const renderScene = SceneMap({
      details: DetailsTab,
      reviews: ReviewsTab,
      hours: HoursTab,
    });

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
                <>
                  <SliderBox
                    images={images}
                    dotColor={ThemeColors.text}
                    imageLoadingColor={ThemeColors.text}
                    circleLoop
                  />
                  <TabView
                    navigationState={{ index: tabIndex, routes: tabRoutes }}
                    renderScene={renderScene}
                    onIndexChange={(index) => this.setState({ tabIndex: index })}
                    renderTabBar={props => (
                      <TabBar
                        {...props}
                        indicatorStyle={{
                          backgroundColor: 'white',
                          borderRadius: 2,
                        }}
                        labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                        style={{ backgroundColor: ThemeColors.button }}
                      />
                    )}
                  />
                </>
              ) : (
                <View
                  style={{
                    height: screenHeight - headerHeight,
                    justifyContent: 'space-between'
                  }}
                >
                  <Text>{''}</Text>
                  <LoadingSpinner />
                  <Text>{''}</Text>
                </View>
              )
            }
          </View>
        )}
      </HeaderHeightContext.Consumer>
    );
  }
}

export default PlaceDetails;
