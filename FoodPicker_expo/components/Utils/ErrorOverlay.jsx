import { Button, Overlay, Text } from 'react-native-elements';
import { ScreenWidth } from 'react-native-elements/dist/helpers';
import ThemeColors from '../../assets/ThemeColors';

export default function ErrorOverlay({
  buttonName,
  error, setError,
  errorMessage, setErrorMessage,
  errorMessageShowing, setErrorMessageShowing,
}) {
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
        title={`Error logging in with ${buttonName}. Please try again or contact support.`}
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
  );
}