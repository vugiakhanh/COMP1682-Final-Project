import './App.css';
import React from "react";
import {  AmplifyTheme, Authenticator } from "aws-amplify-react";
import '@aws-amplify/ui/dist/style.css';
import { API, graphqlOperation, Auth, Hub } from "aws-amplify";
import { getUser } from "./graphql/queries";
import { registerUser } from "./graphql/mutations";
import Navbar from './components/Navbar';
import createBrowserHistory from "history/createBrowserHistory";
import { Router, Route } from "react-router-dom";
import HomePage from './pages/Home';
import MarketPage from './pages/MarketPage';
import ProfilePage from './pages/ProfilePage';
// import { Loading, Tabs, Icon } from "element-react";

export const history = createBrowserHistory();

export const UserContext = React.createContext();


class App extends React.Component {
  state = {
    user: null,
    userAttributes: null
  };

  componentDidMount() {
    this.getUserData();
    Hub.listen("auth", this, "onHubCapsule");
  }

  getUserData = async () => {
    const user = await Auth.currentAuthenticatedUser();
    user
      ? this.setState({ user }, () => this.getUserAttributes(this.state.user))
      : this.setState({ user: null });
  };

  getUserAttributes = async authUserData => {
    const attributesArr = await Auth.userAttributes(authUserData);
    const attributesObj = Auth.attributesToObject(attributesArr);
    this.setState({ userAttributes: attributesObj });
  };

  onHubCapsule = capsule => {
    switch (capsule.payload.event) {
      case "signIn":
        console.log("signed in");
        this.getUserData();
        this.registerNewUser(capsule.payload.data);
        break;
      case "signUp":
        console.log("signed up");
        break;
      case "signOut":
        console.log("signed out");
        this.setState({ user: null });
        break;
      default:
        return;
    }
  };

  registerNewUser = async signInData => {
    const getUserInput = {
      id: signInData.signInUserSession.idToken.payload.sub
    };
    const { data } = await API.graphql(graphqlOperation(getUser, getUserInput));
    if (!data.getUser) {
      try {
        const registerUserInput = {
          ...getUserInput,
          username: signInData.username,
          email: signInData.signInUserSession.idToken.payload.email,
          registered: true
        };
        const newUser = await API.graphql(
          graphqlOperation(registerUser, { input: registerUserInput })
        );
        console.log({ newUser });
      } catch (err) {
        console.error("Error registering new user", err);
      }
    }
  };

  handleSignout = async () => {
    try {
      await Auth.signOut();
    } catch (err) {
      console.error("Error ", err);
    }
  };

render() {
  const { user, userAttributes } = this.state;
  return !user ? (
    <Authenticator theme={theme} />
  )  : (
    <UserContext.Provider value={{ user }}>
      <Router history={history}>
        <>
          {/* Navbar */}
            <Navbar user={user} handleSignout={this.handleSignout}/>
          {/* Route */}
          <div className="app-container">
            <Route exact path="/" component={HomePage}/>
            <Route
                path="/profile"
                component={() => (
                  <ProfilePage user={user} userAttributes={userAttributes} />
                )}
              />
            <Route path="/markets/:marketId" component={
              ({ match }) => <MarketPage user={user} marketId={match.params.marketId}/>} />
          </div>
        </>
      </Router>
      </UserContext.Provider>
  );
} 
  
}

const theme = {
  ...AmplifyTheme,
  navBar: {
    ...AmplifyTheme.navBar,
    backgroundColor: "#ffc0cb"
  },
  button: {
    ...AmplifyTheme.button,
    backgroundColor: "var(--amazonOrange)"
  },
  sectionBody: {
    ...AmplifyTheme.sectionBody,
    padding: "5px"
  },
  sectionHeader: {
    ...AmplifyTheme.sectionHeader,
    backgroundColor: "var(--squidInk)"
  }
}

export default App;
