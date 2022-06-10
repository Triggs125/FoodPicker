import * as Location from 'expo-location';

const LocationHook = Component => props => {
  const [foregroundLocation, requestForeground] = Location.useForegroundPermissions();

  return <Component {...props} foregroundLocation={foregroundLocation} requestLocation={requestForeground} />
}

export default LocationHook;