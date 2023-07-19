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
                  <option key="" value="" disabled>{!this.state.rsvp ? "Please RSVP before selecting your team" : "-- Select Team --"}</option>
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
              <strong>Beer Pong (2 Players)</strong><br/>
              It's beer pong. We'll be using <a href='https://ponguniversity.com/beer-pong-rules/'>Pong University's
              ruleset</a> with two exceptions: 
              <ol style={{marginBottom: '5px'}}>
                <li>Anyone may chose both the fingering and blowing technique regardless of gender.</li>
                <li>Each team will get 1 (one) reconfiguration of the opponent's cups, allowing for the following formations:
                  <ul>
                    <li>Zipper: Five cups in a zig-zag formation front-to-back</li>
                    <li>Diamond: Four cups in a diamond formation front-to-back</li>
                    <li>Stoplight: Three cups in a line front-to-back</li>
                    <li>Triangle: Three cups in a triangle formation with the nose pointing to the center of the table</li>
                    <li>Side-by-side: Two cups in a line side-to-side</li>
                    <li>Line: Two cups in a line front-to-back</li>
                  </ul>
                </li>
              </ol>
              Some items not covered in the ruleset:
              <ul>
                <li>If both team members get their balls in a cup, they may go again</li>
                <li>If both team members get their balls in the same cup, they may choose a second cup to remove</li>
                <li>Teammate shot order is not important and may be done at the same time</li>
                <li>Despite my favorite house rule, we are using a more official ruleset. No recovering of balls</li>
                <li>If you drop a ball off roof or lose it and cannot recover it, you lose a cup</li>
              </ul>
            </li>
            <li>
              <strong>Beer Ball (2 Players)</strong><br/>
              We will be using the <a href='https://drive.google.com/file/d/0B6MqRd13ejXWUmwwSjQtajdYWTQ/view?resourcekey=0-pPYDg48adzPjoFSFXbcMLw'>
              American Beer Ball Association's rules</a> with the following changes:
              <ol>
                <li>
                  We will not be using goblets, we will be using <a href='https://www.costco.com/kirkland-signature-chinet-18-oz-plastic-cup%2C-red%2C-240-count.product.100421211.html'>
                  Kirkland Signature Red Cups</a> as with all other challenges
                </li>
                <li>
                  We will be swapping the phrase "Ein Schuß" to "One Shot" as this is<span> </span>
                  <span style={{fontFamily: 'monospace'}}>
                    <span style={{color: 'red', backgroundColor: 'blue'}}>A</span>
                    <span style={{color: 'white', backgroundColor: 'red'}}>M</span>
                    <span style={{color: 'blue', backgroundColor: 'white'}}>E</span>
                    <span style={{color: 'red', backgroundColor: 'blue'}}>R</span>
                    <span style={{color: 'white', backgroundColor: 'red'}}>I</span>
                    <span style={{color: 'blue', backgroundColor: 'white'}}>C</span>
                    <span style={{color: 'red', backgroundColor: 'blue'}}>A</span>
                  </span>
                </li>
              </ol>
            </li>
            <li>
              <strong>Rage Cage (2 Players, Group Event)</strong><br/>
              This is a group event. This means that all teams will play simultaniously. There will be three rounds, 
              the rules for which are as follows:
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                Take an approximately random number of cups, at least 25 but no more than 50. Place them in the center of a
                standard table, and fill each with about 0.3-0.5 inches of one of alcohol. Choose one cup in the center of the cluster, 
                and add a shot or more of hard alcohol to it. Ensure it does not get any additional soft alcohol. This cup will be the
                "bitch cup". All players (2 from each team) will stand around the table, where all teammates must have at least two other
                people between them. A non-player chooses a number between 0 and 1000, and shares that number with a non-player of a different
                team. All players guess at the number, the closest player and the person directly across from them will begin play.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}><strong style={{fontSize: 16}}>Setup</strong><br/>
              Take an approximately random number of cups, at least 25 but no more than 50. Place them in the center of a
              standard table, and fill each with about 0.3-0.5 inches of one of alcohol. Choose one cup in the center of the cluster, 
              and add a shot or more of hard alcohol to it. Ensure it does not get any additional soft alcohol. This cup will be the
              "bitch cup". All players (2 from each team) will stand around the table, where all teammates must have at least two other
              people between them. A non-player chooses a number between 0 and 1000, and shares that number with a non-player of a different
              team. All players guess at the number, the closest player and the person directly across from them will begin play.</p>

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
