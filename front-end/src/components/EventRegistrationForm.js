import React, { Component } from 'react';
import './EventRegistrationForm.css';
import DataTable from 'react-data-table-component'
import { StyleSheetManager } from 'styled-components'
import isPropValid from '@emotion/is-prop-valid'
import Overlay from './Overlay';

class EventRegistrationForm extends Component {
  constructor(props) {
    super(props);
    this.teamNames = []
    // It's a regex, yes the escape is needed. Dumb ESlint
    // eslint-disable-next-line 
    this.phonePattern = '^((\\+)?1)?[0-9][0-9][0-9](-)?[0-9][0-9][0-9](-)?[0-9][0-9][0-9][0-9]$'
    this.state = {
      name: '',
      phoneNumber: '',
      rsvp: false,
      isOpen: false,
      teams: [],
      team: '',
      note: '',
      attendees: [],
      disabled: true
    };
  }

  componentDidMount() {
    this.getTeams();
  }

  toggleOverlay = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  handleSubmit = (event) => {
    event.preventDefault();

    async function get() {
      // Make DB call to get all teams
      let req = await fetch("https://drinkingolympics.azurewebsites.net/api/addOrUpdate", {
        method: 'POST',
        body: JSON.stringify({
          name: this.state.name,
          phone: this.state.phoneNumber,
          team: this.state.team,
          note: this.state.note
        }),
        headers: {
          'Content-type': 'application/json; charset=UTF-8',
        }
      })
      let res = await req.json()
      console.log(res)
      if (req.status === 200) {
        alert("Success!")
      }
      this.getAttendees(true)
    }
    // eslint-disable-next-line
    get = get.bind(this)
    get()
    // Perform form submission logic here
    // You can access the form values in the state variables (this.state.name, this.state.phoneNumber, this.state.rsvp, this.state.team, this.state.note)
  };

  handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const newValue = type === 'checkbox' ? checked : value;

    function checkEnable() {
      if (
        this.state.name.length > 0 &&
        this.state.team !== '' &&
        this.state.phoneNumber.match(this.phonePattern)
      ) {
        this.setState({ disabled: false })
      } else {
        this.setState({ disabled: true })
      }
    }
    this.setState({ [name]: newValue }, checkEnable);
  };

  getTeams = () => {
    if (this.state.teams.length === 0) {
      async function get() {
        // Make DB call to get all teams
        let req = new Request("https://drinkingolympics.azurewebsites.net/api/getTeams")
        let res = await fetch(req)
        let resTeams = await res.json()
        let teamsItems = []
        for (let resTeam of resTeams) {
          this.teamNames.push(resTeam.name)
          if (resTeam.members.length < 6) {
            teamsItems.push(<option key={resTeam.id} value={resTeam.id} >{resTeam.name}</option>)
          } else{
            teamsItems.push(<option key={resTeam.id} value={resTeam.id} disabled>{resTeam.name}</option>)
          }
        }
        return teamsItems
      }
      // eslint-disable-next-line
      get = get.bind(this);
      get().then((teamsItems) => { this.setState({ teams: teamsItems }); this.getAttendees(); })
    }
  }

  getAttendees = (invoke) => {
    if (this.state.attendees.length === 0 || invoke) {
      async function get() {
        // Make DB call to get all teams
        let req = new Request("https://drinkingolympics.azurewebsites.net/api/getAttendees")
        let res = await fetch(req)
        let resTeams = await res.json()
        let teamsItems = resTeams
        return teamsItems
      }
      get().then((teamsItems) => this.setState({ attendees: teamsItems.map((a) => { return { ...a, team: this.teamNames[a.team].split(' ')[0] } }) }))
    }
  }

  render() {
    const { name, phoneNumber, rsvp, team, note } = this.state;

    return (
      <div className="base" style={{ top: "30px", bottom: "0px", left: "0", right: "0", position: "absolute", overflowY: "scroll", alignItems: "center", verticalAlign: "middle"}}>
        <div className='form-container-container'>
          <div className="form-container"> {/* Assign the class name */}
            <span>
              <h2 style={{ marginTop: "0px" }}>Drinking Game Olympics Signups</h2>
              <button className="help-button" onClick={this.toggleOverlay}>What is this?</button>
            </span>
            <form onSubmit={this.handleSubmit} >
              <label>
                Name:
                <br />
                <input
                  type="text"
                  name="name"
                  value={name}
                  placeholder='Satya'
                  onChange={this.handleChange}
                  className="input-field"
                  required
                />
              </label>
              <br />
              <label>
                Phone Number:
                <br />
                <input
                  type="tel"
                  name="phoneNumber"
                  placeholder='012-345-6789'
                  value={phoneNumber}
                  onChange={this.handleChange}
                  className="input-field"
                  required pattern={this.phonePattern}
                />
              </label>
              <br />
              <label>
                RSVP:
                <br />
                <div style={{ display: "table", paddingTop: "10px" }}>
                  <input
                    type="checkbox"
                    name="rsvp"
                    checked={rsvp}
                    onChange={this.handleChange}
                    className="plus-minus"
                    style={{ display: "table-cell", verticalAlign: "middle" }}
                  />
                  <span style={{ display: "table-cell", verticalAlign: "middle", paddingLeft: "20px" }}>I {this.state.rsvp ? "am" : "am not"} going</span>
                </div>
              </label>
              <br />
              <label>
                Team:
                <br />
                <select
                  name="team"
                  value={team}
                  onChange={this.handleChange}
                  className="select-field"
                  placeholder='Satya'
                  disabled={!this.state.rsvp}
                  required
                >
                  <option key="" value="" disabled>-- Select Team --</option>
                  {
                    this.state.teams
                  }
                </select>
              </label>
              <br />
              <label>
                Note (this will be public):
                <br />
                <textarea
                  name="note"
                  value={note}
                  onChange={this.handleChange}
                  className='textarea-field'
                ></textarea>
              </label>
              <br />
              <button type="submit" className="submit-button" disabled={this.state.disabled}>Register</button>
            </form>
          </div>
          <div className="form-container" style={{ marginTop: "30px", verticalAlign: "middle", marginBottom: "30px" }}>
            <StyleSheetManager shouldForwardProp={isPropValid}>
              <DataTable className="data-table"
                columns={[
                  {
                    name: 'Name',
                    wrap: true,
                    selector: row => row.name,
                    width: "20%"
                  },
                  {
                    name: 'Team',
                    wrap: true,
                    selector: row => row.team,
                    width: "20%"
                  },
                  {
                    name: 'Note',
                    selector: row => row.note,
                    wrap: true,
                    grow: 3,
                    maxWidth: "300px"
                  }
                ]}
                data={this.state.attendees}
                theme="dark"
                fixedHeader
                fixedHeaderScrollHeight='280px'
              />
            </StyleSheetManager>
          </div>
        </div>
        <Overlay isOpen={this.state.isOpen} onClose={this.toggleOverlay}>
          <h1>Welcome to the Drinking Game Olympics!</h1>
          <p>
            We have no less than <em style={{color: 'rgb(255, 108, 243)'}}>fourteen</em> different events planned, structured like the Olympics! Grab
            your friends, join a team, and nominate each other to compete in our events to earn bronze,
            silver, and gold medals to prove once and for all what the best brand is!
          </p>
          <p style={{fontSize: 12}}>
            <strong>Note:</strong> we do have a non-alcoholic team for those not drinking or designated 
            drivers. If that team fills up, I'll add another one. 
          </p>
          <p>
            Teams consist of up to 6 players who will compete in some of the 14 events. Each player is
            required to compete in at least 2 events. Please remember this is for fun and not super competitive. 
            Each event will be bracket-style (like the Olympics), and the top three teams will recieve medals 
            commemorating their accomplishments. At the end of the games, the teams will be scored using
            Olympic scoring, and the top teams will recieve a little plastic trophy.
          </p>
          <h2>The events:</h2>
          <ul>
            <li>
              <strong>Example Event 1</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 2</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 3</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 4</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 5</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 6</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 7</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 8</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 9</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 10</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 11</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 12</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 13</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
            <li>
              <strong>Example Event 14</strong><br/>
              This is an example event. It has rules and things that can be found <a href='google.com'>here</a>
            </li>
          </ul>
        </Overlay>
      </div>
    );
  }
}

export default EventRegistrationForm;
