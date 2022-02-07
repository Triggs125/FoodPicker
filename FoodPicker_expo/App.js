import 'react-native-gesture-handler';
import React, { useState } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { Button, Icon, Text } from 'react-native-elements';
import { NavigationContainer, ThemeProvider } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import * as SplashScreen from 'expo-splash-screen';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import ThemeColors from './assets/ThemeColors';
import { UserColors } from './ColorContext';
import { onAuthStateChanged } from "firebase/auth";

import Settings from './components/Settings';
import Account from './components/Account/Account';
import CreateAccount from './components/Account/CreateAccount';
import LobbyPicker from './components/Lobby/LobbyPicker';
import CreateLobby from './components/Lobby/LobbyView';
import LoadingSpinner from './components/LoadingSpinner';
import LobbyView from './components/Lobby/LobbyView';
import MakeSelections from './components/Selections/MakeSelections';
import EditFoodProfile from './components/FoodProfile/EditFoodProfile';

const Stack = createStackNavigator();

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [userColors, setUserColors] = useState({}); 
  const [user, setUser] = useState(undefined);

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
  SplashScreen.hideAsync();
  const navigationRef = React.useRef();
  // LogBox.ignoreLogs(['Non-serializable values were found in the navigation state.',
  //   'Error: Native splash screen is already hidden.']); // Ignore log notification by message

  onAuthStateChanged(auth, (authUser) => {
    setUser(authUser);
  });

  return (
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
                headerTitleAlign: 'center'
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
              options={{ headerTitle: 'Create an Account' }}
            > 
              {props => <CreateAccount {...props} user={user} auth={auth} db={db} />}
            </Stack.Screen>
            {
              // Cannot see these screens until the user is logged in
              user && (
                <>
                  <Stack.Screen
                    name="Settings"
                    options={{ headerTitle: "Settings" }}
                  >
                    {props => <Settings {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="LobbyPicker"
                    options={{ headerTitle: "Join or Start a Lobby" }}
                  >
                    {props => <LobbyPicker {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="CreateLobby"
                    options={{ headerTitle: "Join or Start a Lobby" }}
                  >
                    {props => <CreateLobby {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="LobbyView"
                    options={{ headerTitle: "Lobby" }}
                  >
                    {props => <LobbyView {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="MakeSelections"
                    options={{
                      headerTitle: "Make Selections",
                      headerTitleAlign: 'center'
                    }}
                  >
                    {props => <MakeSelections {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                  <Stack.Screen
                    name="EditFoodProfile"
                    options={{ headerTitle: "Edit Food Profile" }}
                  >
                    {props => <EditFoodProfile {...props} user={user} auth={auth} db={db} />}
                  </Stack.Screen>
                </>
              )
            }
          </Stack.Navigator>
        </NavigationContainer>
      </UserColors.Provider>
    </ThemeProvider>
  )
}
