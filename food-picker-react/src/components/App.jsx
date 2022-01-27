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
import SignIn from './Account/SignIn';
import ResetPassword from './Account/ResetPassword';
import CreateAccount from './Account/CreateAccount';

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

const store = createStore(reducer);

class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <Provider store={store}>
            <BrowserRouter>
              <Header db={db} />
              <Routes>
                <Route exact path="/" element={<Lobby db={db} />} />
                <Route exact path="/picker" element={<Picker db={db} />} />
                <Route
                  exact
                  path="/account"
                  element={
                    <Account db={db} auth={auth} setUser={this.setUser} />
                  }
                />
                <Route exact path="/signin" element={<SignIn db={db} auth={auth} />} />
                <Route exact path="/create-account" element={<CreateAccount db={db} auth={auth} />} />
                <Route exact path="/reset-password" element={<ResetPassword db={db} auth={auth} />} />
              </Routes>
            </BrowserRouter>
          </Provider>
        </header>
      </div>
    );
  }
}

export default App;
