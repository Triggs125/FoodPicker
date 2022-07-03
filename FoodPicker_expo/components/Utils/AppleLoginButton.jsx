import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import * as firebaseAuth from 'firebase/auth';
import { AddUserToDB, GetUserFromDB } from './firebase';
import * as Analytics from 'expo-firebase-analytics';
import ErrorOverlay from './ErrorOverlay';
import { ScreenWidth } from 'react-native-elements/dist/helpers';

export default function AppleLoginButton({ auth, db }) {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errorMessageShowing, setErrorMessageShowing] = useState(false);

  function login() {
    setLoading(true);

    AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ]
    }).then(appleCredentials => {
      let credential;
      const AppleAuthProvider = new firebaseAuth.OAuthProvider('apple.com');
      try {
        credential = AppleAuthProvider.credential({
          idToken: appleCredentials.identityToken
        });
      } catch(err) {
        Analytics.logEvent("exception", {
          description: "AppleLoginButton::login::provider"
        });
        console.error("AppleLoginButton::login::provider", err);
        setLoading(false);
        setError(true);
        setErrorMessage(err.message);
        return;
      }
      firebaseAuth.signInWithCredential(auth, credential)
        .then(async user => {
          const dbUser = await GetUserFromDB(db, user.user.uid);
          if (!dbUser) {
            AddUserToDB(db, user.user, credential.fullName || user.user.displayName || "", "", user.providerId)
              .then(() => {
                setLoading(false);
              })
              .catch(err => {
                Analytics.logEvent("exception", {
                  description: "AppleLoginButton::login::AddUserToDB"
                });
                console.error("AppleLoginButton::login::AddUserToDB", err);
                setLoading(false);
                setError(true);
                setErrorMessage(err.message);
              });
          } else {
            setLoading(false);
          }
        }).catch(err => {
          Analytics.logEvent("exception", {
            description: "AppleLoginButton::login::signInWithCredential"
          });
          console.error("AppleLoginButton::login::signInWithCredential", err);
          setLoading(false);
          setError(true);
          setErrorMessage(err.message);
        })
    }).catch(err => {
      Analytics.logEvent("exception", {
        description: "AppleLoginButton::login::signInAsync"
      });
      console.log("AppleLoginButton::login::signInAsync", err);
      setLoading(false);
      setError(true);
      setErrorMessage(err.message);
    });
  }

  AppleAuthentication.isAvailableAsync()
    .then(ready => setIsReady(ready))
    .catch(err => {
      Analytics.logEvent("exception", {
        description: "AppleLoginButton::Authentication Is Not Ready"
      });
      console.error("AppleLoginButton::Authentication Is Not Ready", err.message);
    })
  
  return isReady ? (
    <>
      <ErrorOverlay
        buttonName="Apple"
        error={error}
        setError={setError}
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
        errorMessageShowing={errorMessageShowing}
        setErrorMessageShowing={setErrorMessageShowing}
      />
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={2}
        style={{
          width: ScreenWidth - 20,
          height: 48,
          shadowColor: '#444',
          shadowOpacity: 0.5,
          shadowRadius: 1,
          shadowOffset: {width: 1, height: 1}
        }}
        onPress={login}
      />
    </>
  ) : (
    <></>
  )
}