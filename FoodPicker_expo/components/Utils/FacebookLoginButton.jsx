import * as Facebook from 'expo-facebook';
import { useState } from 'react';
import { Button, Overlay, Text } from 'react-native-elements';
import * as firebase from 'firebase/auth';
import { AddUserToDB, GetUserFromDB } from './firebase';
import * as Analytics from 'expo-firebase-analytics';
import { ScreenWidth } from 'react-native-elements/dist/helpers';
import ThemeColors from '../../assets/ThemeColors';

export default function FacebookLoginButton(props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessageShowing, setErrorMessageShowing] = useState(false);

  function login() {
    setLoading(true);

    Analytics.logEvent("event", {
      description: "FacebookLoginButton::login"
    });

    Facebook.initializeAsync({
      appId: '1300932740403155'
    })
    .then(() => {
      Facebook.logInWithReadPermissionsAsync({
        permissions: ['public_profile', 'email'],
      })
      .then(userObject => {
        if (userObject.type === 'success') {
          const credential = firebase.FacebookAuthProvider.credential(userObject.token);
          firebase.signInWithCredential(props.auth, credential)
            .then(async user => {
              console.log("Logged in successfully", user);
              const dbUser = await GetUserFromDB(props.db, user.user.uid);
              if (!dbUser) {
                AddUserToDB(props.db, user.user, "", "", user.user.displayName, user.providerId)
                  .then(() => {
                    setLoading(false);
                  })
                  .catch(err => {
                    Analytics.logEvent("exception", {
                      description: "FacebookLoginButton::login::AddUserToDB"
                    });
                    console.error("FacebookLoginButton::login::AddUserToDB", err);
                    setLoading(false);
                    setError(true);
                    setErrorMessage(err.message);
                  });
              } else {
                setLoading(false);
              }
            })
            .catch(err => {
              Analytics.logEvent("exception", {
                description: "FacebookLoginButton::login::signInWithCredential"
              });
              console.error("FacebookLoginButton::login::signInWithCredential", err);
              setLoading(false);
              setError(true);
              setErrorMessage(err.message);
            });
        } else {
          setLoading(false);
        }
      })
      .catch(err => {
        Analytics.logEvent("exception", {
          description: "FacebookLoginButton::login::logInWithReadPermissionsAsync"
        });
        console.error("FacebookLoginButton::login::logInWithReadPermissionsAsync", err);
        setLoading(false);
        setError(true);
        setErrorMessage(err.message);
      });
    })
    .catch(err => {
      Analytics.logEvent("exception", {
        description: "FacebookLoginButton::login::initializeAsync"
      });
      console.error("FacebookLoginButton::login::initializeAsync", err);
      setLoading(false);
      setError(true);
      setErrorMessage(err.message);
    });
  }

  function errorOverlay() {
    return (
      <Overlay
        isVisible={error}
        overlayStyle={{ width: ScreenWidth - 20, borderRadius: 10 }}
        onBackdropPress={() => {
          setError(false);
          setErrorMessage("");
          setErrorMessageShowing(false);
        }}
      >
        <Button
          type='clear'
          title="Error logging in with Facebook. Please try again or contact support."
          titleStyle={{
            color: 'black'
          }}
          icon={{
            name: errorMessageShowing ? "caret-up" : "caret-down",
            type: "font-awesome",
            color: 'black',
            fontSize: 18
          }}
          iconRight
          onPress={() => setErrorMessageShowing(!errorMessageShowing)}
        />
        {
          errorMessageShowing && (
            <Text>{errorMessage}</Text>
          )
        }
        <Button
          title="Continue"
          type="clear"
          titleStyle={{ color: ThemeColors.text, fontSize: 24 }}
          onPress={() => {
            setError(false);
            setErrorMessage("");
            setErrorMessageShowing(false);
          }}
        />
      </Overlay>
    )
  }

  return (
    <>
      {errorOverlay()}
      <Button
        raised
        loading={loading}
        title="Continue with Facebook"
        titleStyle={{ color: 'white', fontWeight: '500', fontSize: 22 }}
        icon={{
          name: "facebook-square",
          type: "ant-design",
          color: "white",
          marginRight: 8
        }}
        buttonStyle={{
          backgroundColor: '#4267B2',
          paddingVertical: 10
        }}
        containerStyle={{
          marginVertical: 5
        }}
        onPress={login}
      />
    </>
  )
}