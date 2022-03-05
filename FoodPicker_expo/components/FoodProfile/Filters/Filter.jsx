import { Component } from "react";
// import DropDownPicker from "react-native-dropdown-picker";
import { View } from 'react-native';
import { Icon } from "react-native-elements";
import RNPickerSelect from 'react-native-picker-select';

class Filter extends Component {
  render() {
    const { addFilter, items, name } = this.props;

    return (
      <View style={{ marginVertical: 5 }}>
        <RNPickerSelect
          items={items}
          value={{}}
          placeholder={{ label: name + "..." }}
          onValueChange={(value) => addFilter(value)}
          useNativeAndroidPickerStyle={false}
          style={{
            placeholder: { color: 'black' },
            chevronContainer: { display: 'none' },
            inputIOS: {
              textAlign: 'center',
              fontSize: 22,
              paddingVertical: 10,
              paddingHorizontal: 10,
              marginVertical: 5,
              minWidth: 150,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: 'black',
              borderRadius: 8,
              color: 'black',
            },
            inputAndroid: {
              textAlign: 'center',
              fontSize: 22,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginVertical: 5,
              minWidth: 150,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: 'black',
              borderRadius: 8,
              color: 'black',
            },
            inputWeb: {
              textAlign: 'center',
              fontSize: 22,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginVertical: 5,
              width: 150,
              backgroundColor: 'white',
              borderWidth: 0.8,
              borderColor: 'black',
              borderRadius: 8,
              color: 'black',
            }
          }}
        />
      </View>
    );
  }
}

export default Filter;