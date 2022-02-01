import { doc, getDoc, getDocs, query } from "firebase/firestore";
import { Component } from "react";
import { connectInfiniteHits } from "react-instantsearch-native";

class ConnectedInfiniteHits extends Component {
  render() {
    return (
      this.props.hits?.map((lobbyRef, i) => {
        return this.props.lobbyComponent(lobbyRef, i);
      })
    );
  }
}

export default connectInfiniteHits(ConnectedInfiniteHits);