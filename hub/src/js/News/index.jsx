import React, { Fragment as F } from 'react';
import style from './index.styl';

export default class News extends React.Component{
  constructor(p){
    super(p);
    this.state = {
      newsServiceAlive: true,
      news: []
    };
  }

  componentDidMount(){
    __socket.on("newsIsDown", () => {
      this.setState({ newsServiceAlive: false });
    });

    __socket.on("newsIsUp", () => {
      this.setState({ newsServiceAlive: true });
      this.hydrateNews();
    });

    if(this.state.newsServiceAlive)
      this.hydrateNews();
  }

  hydrateNews = () => {
    __socket.emit("getNews", news => {
      this.setState({ news });
    });
  }

  markAsFavourite = ({ currentTarget: { dataset: { index } } }) => {
    if(!this.props.username) return;

    __socket.emit("markSingleNewsAsFavourite", index, () => 
      this.hydrateNews()
    );
  }

  render(){
    const {
      state: {
        newsServiceAlive, news
      }, 
      hydrateNews, markAsFavourite
    } = this;
    
    
    return <div className={ `news ${ style.news }`}>
      {
        !newsServiceAlive ? "News is down" :
        <F>
          <div className="updateBtn">
            <button onClick={ hydrateNews }>Update</button>
          </div>
          <div className="newsHolder">
            {
              news.map(({ id, title, desc, isFavourite }) => 
                <div 
                  className={ "single" + (isFavourite ? " fav" : "") }
                  key={ id }
                  onDoubleClick={ markAsFavourite }
                  data-index={ id }
                >
                  <div className="heading">
                    <span>{ `№. ${ id }`}</span>                    
                  </div>
                  <div className="main">
                    <span>{ `Title: '${ title }'`}</span>

                    <div>{ desc }</div>
                  </div>
                </div>
              )
            }
          </div>
        </F>
      }
    </div>
  }
}