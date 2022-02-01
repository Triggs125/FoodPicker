import { Component } from "react";
import { connectRefinementList, InstantSearch } from "react-instantsearch-native";
import ConnectedInfiniteHits from "./ConnectedInfiniteHits";
import ConnectedSearchBox from "./ConnectedSearchBox";
import { View } from "react-native";
import algoliasearch from "algoliasearch";

const VirtualRefinementList = connectRefinementList(() => null);

class SearchAlgolia extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchState: {},
      searchClient: algoliasearch('281QB5GMK9', 'c34ee83f45934b56d0e2d8155e65d54c')
    }

    this.onSearchStateChange = this.onSearchStateChange.bind(this);
  }

  onSearchStateChange(searchState) {
    this.setState({ searchState });
  }

  render() {
    const { searchState } = this.state;
    return (
      <View>
        <InstantSearch
          searchClient={this.state.searchClient}
          indexName="lobbies"
          searchState={searchState}
          onSearchStateChange={this.onSearchStateChange}
        >
          <VirtualRefinementList attribute="brand" />
          <ConnectedSearchBox />
          <ConnectedInfiniteHits db={this.props.db} lobbyComponent={this.props.lobbyComponent} />
        </InstantSearch>
      </View>
    );
  }
}

export default SearchAlgolia;