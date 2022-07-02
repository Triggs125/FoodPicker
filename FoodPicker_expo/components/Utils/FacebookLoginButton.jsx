import * as Facebook from 'expo-facebook';
import { useState } from 'react';
import { Button } from 'react-native-elements';
import * as firebase from 'firebase/auth';
import { AddUserToDB, GetUserFromDB } from './firebase';
import * as Analytics from 'expo-firebase-analytics';
import ErrorOverlay from './ErrorOverlay';

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
              console.log("Logged into Facebook successfully", user);
              const dbUser = await GetUserFromDB(props.db, user.user.uid);
              if (!dbUser) {
                AddUserToDB(props.db, user.user, user.user.displayName, "", user.providerId)
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

  return (
    <>
      <ErrorOverlay
        buttonName="Facebook"
        error={error}
        setError={setError}
        errorMessage={errorMessageShowing}
        setErrorMessage={setErrorMessage}
        errorMessageShowing={errorMessageShowing}
        setErrorMessageShowing={setErrorMessageShowing}
      />
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
        loadingStyle={{
          paddingVertical: 4
        }}
        containerStyle={{
          marginVertical: 5
        }}
        onPress={login}
      />
    </>
  )
}