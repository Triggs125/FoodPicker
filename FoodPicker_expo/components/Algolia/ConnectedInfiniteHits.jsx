import { Component } from "react";
import { connectInfiniteHits } from "react-instantsearch-native";
import { FlatList } from "react-native-gesture-handler";
import { ScrollView } from "react-native-gesture-handler";

class ConnectedInfiniteHits extends Component {
  onEndReached() {
    if (this.props.hasMore) {
      this.props.refine();
    }
  }
  render() {
    return (
      <FlatList
        renderItem={({ lobby }, i) => {
          return this.props.lobby(lobby.basicData, i);
        }}
        data={this.props.hits}
        onEndReached={this.onEndReached}
        keyExtractor={(lobby) => lobby.objectID}
      />
    )
  }
}

export default connectInfiniteHits(ConnectedInfiniteHits);