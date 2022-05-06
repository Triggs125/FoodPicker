import { View } from "react-native";
import { Card, Text } from "react-native-elements";
import MobileStoreButton from 'react-mobile-store-button';

export default function Home() {
  const androidUrl = "https://play.google.com/store/apps/details?id=com.driggs.foodpicker";
  const iosUrl = "https://apps.apple.com/us/app/food-picker-deluxe/id1615230626";

  return (
    <View
      style={{
        justifyContent: 'center'
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}
      >
        <View style={{ paddingRight: 5 }}>
          <MobileStoreButton
            store="android"
            height={100}
            url={androidUrl}
            linkProps={{ title: 'Android Play Store Button' }}
          />
        </View>
        <View style={{ paddingTop: 16, paddingLeft: 20, paddingBottom: 24 }}>
          <MobileStoreButton
            store="ios"
            height={60}
            url={iosUrl}
            linkProps={{ title: 'iOS Store Button' }}
          />
        </View>
      </View>
      <Card
        containerStyle={{
          maxWidth: "1000px",
          alignSelf: 'center',
        }}
      >
        <Card.Title style={{ fontSize: 24 }}>Contact Information</Card.Title>
        <Card.Divider />
        <View>
          <Text
            style={{
              fontSize: 18,
              textAlign: 'center',
              flex: 1
            }}
          >
            Email Address: DriggsSoftware+FoodPicker@gmail.com
          </Text>
        </View>
      </Card>
      <Card.Title style={{ fontSize: 24, marginBottom: 8, marginTop: 15 }}>
        <a href="https://www.freeprivacypolicy.com/live/3286ca90-3d6e-493d-ba42-456066b3d592" target="_blank">
          Privacy Policy
        </a>
      </Card.Title>
    </View>
  );
}
