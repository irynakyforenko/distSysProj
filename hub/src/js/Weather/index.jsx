import React, { Fragment as F } from 'react';
import style from './index.styl';

export default class Weather extends React.Component{
  constructor(p){
    super(p);
    this.state = {
      weatherServiceAlive: true,
      reports: []
    };
  }

  componentDidMount(){
    __socket.on("weatherIsDown", () => {
      this.setState({ weatherServiceAlive: false });
    });

    __socket.on("weatherIsUp", () => {
      this.setState({ weatherServiceAlive: true });
      this.hydrateReports();
    });

    if(this.state.weatherServiceAlive)
      this.hydrateReports();
  }

  hydrateReports = () => {
    __socket.emit("getWeather", reports => {
      this.setState({ reports });
    });
  }

  render(){
    const {
      state: {
        weatherServiceAlive, reports
      }, 
      hydrateReports
    } = this;
    
    
    return <div className={ `weather ${ style.weather }`}>
      {
        !weatherServiceAlive ? "Weather is down" :
        <F>
          <div className="updateBtn">
            <button onClick={ hydrateReports }>Update</button>
          </div>
          <div className="reports">
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Hour</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {
                  reports.map(({ day, hour, desc }) => 
                    <tr>
                      <td>{ day }</td>
                      <td>{ hour }</td>
                      <td>{ desc }</td>
                    </tr>
                  )
                }                
              </tbody>
            </table>
          </div>
        </F>
      }
    </div>
  }
}