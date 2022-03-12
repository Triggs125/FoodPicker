import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { View, LogBox } from 'react-native';
import { Button } from 'react-native-elements';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';
import { firebaseConfig } from './config';
import ThemeColors from './assets/ThemeColors';
import { UserColors } from './ColorContext';
import { onAuthStateChanged } from "firebase/auth";
import Constants from 'expo-constants';

import Settings from './components/Settings';
import Account from './components/Account/Account';
import CreateAccount from './components/Account/CreateAccount';
import LobbyPicker from './components/Lobby/LobbyPicker';
import LobbyView from './components/Lobby/LobbyView';
import MakeSelections from './components/Selections/MakeSelections';
import EditFoodProfile from './components/FoodProfile/EditFoodProfile';
import UserSelections from './components/Selections/UserSelections';
import PlaceDetails from './components/Selections/PlaceDetails';
import LobbyCreator from './components/Lobby/LobbyCreator';
import LoadingSpinner from './components/LoadingSpinner';
import AccountEdit from './components/Account/AccountEdit';
import ForgotPassword from './components/Account/ForgotPassword';

// import {
//   AdMobBanner,
//   setTestDeviceIDAsync,
// } from 'expo-ads-admob';

const Stack = createStackNavigator();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [userColors, setUserColors] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState();
  const [lobbyData, setLobbyData] = useState();
  const [userLobbies, setUserLobbies] = useState();
  const [kickedFromLobby, setKickedFromLobby] = useState(false);

  const navColors = {
    colors: {
      primary: ThemeColors.textTitle, // selected nav tab
      background: ThemeColors.background,
      card: ThemeColors.card,
      text: ThemeColors.text,
      border: ThemeColors.border,
      notification: ThemeColors.button,
    }
  }
  const themeProviderColors = {
    Button: {
      buttonStyle: {
        backgroundColor: ThemeColors.button
      },
      disabledStyle: {
        backgroundColor: ThemeColors.disabledButton
      },
      disabledTitleStyle: {
        color: '#fff',
      }
    },
    Input: {
      inputContainerStyle: {
        borderColor: ThemeColors.border
      },
      inputStyle: {
        color: ThemeColors.border
      }
    },
    Overlay: {
      overlayStyle: {
        backgroundColor: ThemeColors.background,
      }
    },
    Text: {
      style: {
        color: ThemeColors.button,
      }
    },
    ListItem: {
      containerStyle: {
        backgroundColor: ThemeColors.card,
        borderColor: ThemeColors.border,
      }
    }
  }

  SplashScreen.preventAutoHideAsync();
  setTimeout(SplashScreen.hideAsync, 2000);
  const navigationRef = React.useRef();
  
  // Ignore log notification by message
  LogBox.ignoreLogs([
    'AsyncStorage has been',
    'Setting a timer for a long period of time',
    'Using Math.random'
  ]);

  // const adUnitId = !Constants.platform.web && __DEV__
  //   ? "ca-app-pub-3940256099942544/6300978111"
  //   : Constants.platform.android
  //     ? "ca-app-pub-1885494348989912/3971948721"
  //     : "ca-app-pub-1885494348989912/2737353131";

  // const adUnitId = "ca-app-pub-1885494348989912/3971948721";

  // console.log("Ad Unit", adUnitId);

  // __DEV__
  // ? setTestDeviceIDAsync('EMULATOR')
  //   .then(() => {
  //     console.log("Test Device ID set");
  //     setLoading(false);
  //   })
  // : setLoading(false);

  onAuthStateChanged(auth, (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }
    getDocs(query(collection(db, 'users'), where('uid', '==', authUser.uid)))
    .then(docs => {
      const user = docs?.docs[0]?.data();
      if (!user) {
        setUser(authUser);
        return;
      }
      authUser.firstName = user?.firstName;
      authUser.lastName = user?.lastName;
      setUser(authUser);
    })
    .catch(err => {
      console.error("App:onAuthStateChanged", err);
      setUser(authUser)
    })
  });

  return loading === true ? (
    <View>
      <LoadingSpinner />
    </View>
  ) : (
    <ThemeProvider theme={themeProviderColors}>
      <UserColors.Provider value={{ userColors, setUserColors }}>
        <NavigationContainer
          ref={navigationRef}
          theme={navColors}
        >
          <Stack.Navigator
            initialRouteName="Account"
            screenOptions={(props) => {
              return {
                headerRight: () => (
                  <Button
                    icon={{
                      name: 'user-circle',
                      type: 'font-awesome',
                      color: 'black',
                      marginRight: 8
                    }}
                    style={{ fontSize: 24 }}
                    buttonStyle={{ backgroundColor: 'transparent' }}
                    onPress={() => props.navigation.navigate('Account')}
                  />
                ),
                headerTitleAlign: 'center',
              }
            }}
          >
            <Stack.Screen
              name="Account"
              options={{ headerTitle: 'Account', headerRight: () => {<></>} }}
            >
              {props => <Account {...props} user={user} auth={auth} db={db} />}
            </Stack.Screen>
            <Stack.Screen
              name="CreateAccount"
              options={{ headerTitle: 'Create an Account', headerRight: () => {<></>} }}
            > 
              {props => <CreateAccount {...props} user={user} auth={auth} db={db} />}
            </Stack.Screen>
            <Stack.Screen
              name="ForgotPassword"
              options={{ headerTitle: 'Reset Password', headerRight: () => {<></>} }}
            >
              {props => <ForgotPassword {...props} user={user} auth={auth} db={db} />}
            </Stack.Screen>
            {
              // Cannot see these screens until the user is logged in
              user && (
                <>
                  <Stack.Screen
                    name="AccountEdit"
                    options={{ headerTitle: 'Edit Account' }}
                  > 
                    {props => <AccountEdit {...props} setUser={setUser} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="Settings"
                    options={{ headerTitle: "Settings" }}
                  >
                    {props => <Settings {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="LobbyPicker"
                    options={{ headerTitle: "Join or Create a Lobby" }}
                  >
                    {props => <LobbyPicker {...props} userLobbies={userLobbies} user={user} auth={auth} db={db} kickedFromLobby={kickedFromLobby} setKickedFromLobby={setKickedFromLobby} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="LobbyCreator"
                    options={{ headerTitle: "Create a Lobby" }}
                  >
                    {props => <LobbyCreator {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="LobbyView"
                    options={{ headerTitle: "Lobby" }}
                  >
                    {props => <LobbyView {...props} user={user} auth={auth} db={db} setLobbyData={setLobbyData} setKickedFromLobby={setKickedFromLobby} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="MakeSelections"
                    options={{
                      headerTitle: "Make Selections",
                      headerTitleAlign: 'center'
                    }}
                  >
                    {props => <MakeSelections {...props} user={user} auth={auth} db={db} lobbyData={lobbyData} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="UserSelections"
                    options={{
                      headerTitle: "Selections",
                      headerTitleAlign: 'center'
                    }}
                  >
                    {props => <UserSelections {...props} user={user} auth={auth} db={db} lobbyData={lobbyData} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="EditFoodProfile"
                    options={{ headerTitle: "Edit Food Profile" }}
                  >
                    {props => <EditFoodProfile {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="PlaceDetails"
                    options={{ headerTitle: "Place Details", cardStyle: { backgroundColor: 'white' } }}
                  >
                    {props => <PlaceDetails {...props} user={user} auth={auth} db={db} lobbyData={lobbyData} />}
                  </Stack.Screen>
                </>
              )
            }
          </Stack.Navigator>
        </NavigationContainer>
        {/* <View>
          <AdMobBanner
            adUnitId={adUnitId}
            bannerSize={'fullBanner'}
            servePersonalizedAds={false}
            onAdViewDidReceiveAd={() => {
              console.log('Advert loaded');
            }}
            onDidFailToReceiveAdWithError={(error) => {
              console.error('Advert failed to load: ', error);
            }}
          />
        </View> */}
      </UserColors.Provider>
    </ThemeProvider>
  )
}