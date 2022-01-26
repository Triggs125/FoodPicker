import '../css/App.css';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import reducer from '../reducer';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Header from './Header';
import Lobby from './Lobby/Lobby';
import Account from './Account/Account';
import Picker from './Picker/Picker';
import { Component } from 'react';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const store = createStore(reducer);

function setUser(user) {

}

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      user: undefined,
    }

    this.setUser = this.setUser.bind(this);
  }

  setUser(user) {
    console.log("Set User:", user);
    this.setState({ user });
  }

  render() {
    console.log("App state:", this.state)
    return (
      <div className="App">
        <header className="App-header">
          <Provider store={store}>
            <Header key={this.state.user?.uid} db={db} user={{ displayName: "Tanner" }} />
            <BrowserRouter>
              <Routes>
                <Route exact path="/" element={<Lobby db={db} />} />
                <Route
                  exact
                  path="/account"
                  element={
                    <Account db={db} auth={auth} setUser={this.setUser} />
                  }
                />
                <Route exact path="/picker" element={<Picker db={db} />} />
              </Routes>
            </BrowserRouter>
          </Provider>
        </header>
      </div>
    );
  }
}

export default App;
