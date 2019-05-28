import React, { Fragment as F } from 'react';
import style from './index.styl';

function getDefaultState(){
  return {
    usernameError: null,
    chatServiceAlive: true,
    messages: []
  };
}

class UsernameInput extends React.PureComponent {
  render(){
    const { value, onChange, registerUsername, usernameError } = this.props;
    
    return <div className="usernameInput">
      <label htmlFor="">Your username</label><br/>
      <input value={ value } type="text" onChange={ onChange }/>
      { usernameError && <p style={{color: "red"}}>{ usernameError }</p>}
      <button onClick={ registerUsername }>Enter chat</button>
    </div>
  }
}

export default class Chat extends React.Component {
  constructor(p){
    super(p);
    this.state = getDefaultState();
  }

  async componentDidMount(){
    __socket.on("chatIsDown", () => {
      this.setState({ 
        ...getDefaultState(), 
        chatServiceAlive: false, 
      });
    });

    __socket.on("chatIsUp", () => {
      this.setState({ chatServiceAlive: true });
    });

    __socket.on("usernameTaken", () => {
      this.setState({ usernameError: "Name is already taken" });
    });

    __socket.on("usernameFree", () => {
      this.setState({ usernameError: null });
      __socket.emit("getMessages", messages => {
        this.hydrateMessages(messages);
      });
    });

    __socket.on("updateMessages", messages => {
      this.hydrateMessages(messages);
    });



    if(this.state.chatServiceAlive)
      __socket.emit("getMessages", messages => {
        this.hydrateMessages(messages);
      });
  }

  hydrateMessages = msgs => {
    const messages = JSON.parse(msgs);
    this.setState({ messages });
    const div = document.querySelector(`.${ style.chat } .messages`);
    if(!div) return;

    div.scrollTop = div.scrollHeight - div.clientHeight;
  }

  

  registerUsername = () => {
    if(!this.props.usernameInput.trim()) return;
    __socket.emit("username", this.props.usernameInput);
  }

  sendMessage = () => {
    const msg = document.getElementById("messageTextarea").value;
    document.getElementById("messageTextarea").value = "";

    __socket.emit("sendMessage", msg);
  }

  textareaKeyDown = e => {
    if(e.keyCode !== 13) return;
    if(e.shiftKey) return;
    
    this.sendMessage();
  }

  render(){
    const { 
      state: { 
        chatServiceAlive,
        usernameError, messages
      },
      props: {
        username, usernameInput, inputUsername 
      },
      registerUsername, sendMessage, textareaKeyDown
    } = this;

    if(!chatServiceAlive)
      return <div className={ `chat ${ style.chat }` }>
        Chat is Down.
      </div>
      
    return <div className={ `chat ${ style.chat }` }>
      {
        username == null ?
        <UsernameInput 
          value={ usernameInput }
          onChange={ inputUsername }
          registerUsername={ registerUsername }
          usernameError={ usernameError }
        /> :
        <F>
          <div className="messages">
            <div>
              {
                messages.map(message => { 
                  const { name, msg, time } = JSON.parse(message);

                  return <div key={ name + msg + time } className="message">
                    <span className="name">{ `'${ name }' wrote:` }</span>
                    <div>{msg }</div>
                    <span>{ time }</span>
                  </div>
                })
              }
            </div>
          </div>
          <div className="sendMessage">
            <textarea onKeyDown={ textareaKeyDown } name="" id="messageTextarea"></textarea>
            <button onClick={ sendMessage }>Send</button>
        </div>
        </F>
      }      
    </div>
  }
}