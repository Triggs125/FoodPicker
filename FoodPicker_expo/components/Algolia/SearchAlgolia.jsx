import { Component } from "react";
import { connectRefinementList, InstantSearch } from "react-instantsearch-native";
import ConnectedInfiniteHits from "./ConnectedInfiniteHits";
import ConnectedSearchBox from "./ConnectedSearchBox";
import { View } from "react-native";
import algoliasearch from "algoliasearch";
import { ALGOLIA_SECRET } from "../../config";

const VirtualRefinementList = connectRefinementList(() => null);

class SearchAlgolia extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchState: {},
      searchClient: algoliasearch('281QB5GMK9', ALGOLIA_SECRET)
    }

    this.onSearchStateChange = this.onSearchStateChange.bind(this);
  }

  onSearchStateChange(searchState) {
    this.setState({ searchState });
  }

  render() {
    const { searchState } = this.state;
    const { refreshHits, refresh, db, lobbyComponent } = this.props;
    return (
      <View
        style={{ borderWidth: 0, borderColor: 'lightgrey' }}
      >
        <InstantSearch
          searchClient={this.state.searchClient}
          indexName="lobbies"
          searchState={searchState}
          onSearchStateChange={this.onSearchStateChange}
          refresh={refresh}
        >
          <VirtualRefinementList attribute="brand" />
          <ConnectedSearchBox delay={1000} refreshHits={refreshHits} />
          <ConnectedInfiniteHits db={db} lobbyComponent={lobbyComponent} />
        </InstantSearch>
      </View>
    );
  }
}

export default SearchAlgolia;