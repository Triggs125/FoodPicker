import { Component } from "react";
import { InstantSearch } from "react-instantsearch-native";
import ConnectedInfiniteHits from "./ConnectedInfiniteHits";
import ConnectedSearchBox from "./ConnectedSearchBox";
import { View } from "react-native";
import algoliasearch from "algoliasearch";

class SearchAlgolia extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchClient: algoliasearch('281QB5GMK9', 'c34ee83f45934b56d0e2d8155e65d54c')
    }
  }
  render() {
    return (
      <View>
        <InstantSearch searchClient={this.state.searchClient}>
          <ConnectedSearchBox />
          <ConnectedInfiniteHits lobbyComponent={this.props.lobby} />
        </InstantSearch>
      </View>
    )
  }
}

export default SearchAlgolia;