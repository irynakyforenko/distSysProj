import "@babel/polyfill";
import React from "react";
import ReactDOM from "react-dom";


window.__socket = io.connect('http://192.168.1.148:8080');


import Chat from './Chat/index.jsx';
import News from './News/index.jsx';
import Weather from './Weather/index.jsx';
import style from './index.styl';

class App extends React.Component {
  constructor(p){
    super(p);

    this.state = {
      username: null,
      usernameInput: ''
    }
  }

  componentDidMount(){
    __socket.on("usernameTaken", () => {
      this.setState({ username: null });
    });

    __socket.on("usernameFree", () => {
      this.setState({ username: true });
    });

    __socket.on("chatIsDown", () => {
      this.setState({  
        username: null,
        usernameInput: '',
      });
    });
  }

  inputUsername = ({ target: { value: usernameInput }} ) => {
    this.setState({ usernameInput });
  }
  
  render(){
    const { 
      state: {
        username, usernameInput,          
      },
      inputUsername
    } = this;

    return <div className={ style.app }>
      <Chat
        { ...{ 
          username, usernameInput,
          inputUsername,
        }}
      />
      <div className="newsAndWeather">
        <News { ...{ username } } />
        <Weather/>
      </div>
    </div>
  }
}

ReactDOM.render(
    <App />,
  document.getElementById("app")
);
