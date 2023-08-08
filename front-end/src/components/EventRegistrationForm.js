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
          <p style={{fontSize: 12}}>
            <strong >Another note:</strong> Potentially accepting team requests. Please let me know. 
          </p>
          <p>
            <strong style={{color: 'rgb(255, 108, 243)'}}>Where:</strong> TBD, please check this page the day before for a final location.
          </p>
          <p>
            <strong style={{color: 'rgb(255, 108, 243)'}}>When:</strong> August 26th, starting at 1pm and going until the games are complete (probably around 7pm, but maybe faster)!
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
              It's beer pong. We'll be using <a 
                href='https://ponguniversity.com/beer-pong-rules/'
                target='_blank'
                rel="noreferrer"
              >
                Pong University's ruleset
              </a> with two exceptions: 
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
              We will be using the <a href='https://drive.google.com/file/d/0B6MqRd13ejXWUmwwSjQtajdYWTQ/view?resourcekey=0-pPYDg48adzPjoFSFXbcMLw'
                target='_blank'
                rel="noreferrer"
              >
                American Beer Ball Association's rules</a> with the following changes:
              <ol>
                <li>
                  We will not be using goblets, we will be using <a href='https://www.costco.com/kirkland-signature-chinet-18-oz-plastic-cup%2C-red%2C-240-count.product.100421211.html'
                    target='_blank'
                    rel="noreferrer"
                  >
                    Kirkland Signature Red Cups
                  </a> as with all other challenges
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
            <li id='RageCage'>
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
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                The starting players will take a cup from the center, drink it's contents, place the cup on the table, then attempt to
                bounce their pingpong ball off the table and into the cup in front of them. Once this is complete, they must pass the cup
                (with the ball still in it) to the left. If the player gets the ball in the cup on the first attempt, they may pass the
                cup (with ball) to anyone except the person with the other cup. If they choose to pass left and the person to their left
                already has a cup, the player may "stack" the player to their left by placing their cup (and ball) inside of their cup.
                The stacked player must pass their stack to the left, take a new cup from the center, and drink it. If the stacked player
                is on team non-alcohol, they must pour the contents of the new cup into the aforementioned bitch cup. The stacked player
                must place the empty cup on the table, and attempt to get their ball into their new cup. Using this methodology, only
                two stacks should ever be in play, and there should always be two stacks in play. The bitch cup should be the last cup
                consumed.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                Every time a player stacks another player, their team gets a point. If a player is forced to drink the bitch cup, their
                team is eliminated, their team's score is set to zero, neither player from that team will compete in any more rounds,
                and their team is not eligible for a medal from this game. Due to this, you'll want to try to stack people as much as
                you can, but be wary as the number of cups in the center dwindles. The three teams with the highest scores at the end
                of three rounds will recieve gold, silver, and bronze respectively.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                <ul>
                  <li>
                    If the ball bounces off the table into one of the cups in the center, that player must
                    consume its contents, add it to their stack, and continue play. If they get it into the
                    bitch cup, the round is over, the team's score is set to zero, and the team is eliminated.
                  </li>
                  <li>
                    If your ball bounces into your opponent's cup, the opponent may count that as getting their
                    ball in and pass their stack left. You must still attempt your stack.
                  </li>
                  <li>
                    If a ball falls on the floor, no attempt may be made to block the player from picking it up.
                    However, no attempt to help them is required either. 
                  </li>
                  <li>
                    If a player is stacked while attempting to retrieve their ball, play pauses until they retrieve
                    it and pass their stack left.
                  </li>
                </ul>
              </p>
            </li>
            <li>
              <strong>Slap Cup (2 Players, Group Event)</strong><br/>
              The rules are nearly identical to <a href='#RageCage'>Rage Cage</a>'s rules, but with a few changes:
              <ol>
                <li>
                  Instead of stacking a player, you will slap their cup off the table
                </li>
                <li>
                  Instead of passing your cup to the player on the left (after slapping), you will pass it to anyone in the circle
                </li>
              </ol>
            </li>
            <li id='KingsCup'>
              <strong>Kings (2 Players, Group Event)</strong><br/>
              King's cup is a simple but fun game.
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                Every player must have a cup with their team's beverage in it. It must be filled completely.
                There will be a deck of cards, shuffled and placed face-down in a circle around an unopened can of a
                non-alcoholic beverage. The starting player will be chosen the same way they are in <a href='#RageCage'>
                Rage Cage</a>.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                On their turn, the player will draw a card from the circle. If they break the circle through this action,
                they must drink. They must then announce what the card is, then perform its action. The actions for each
                card are listed below:
                <ul>
                  <li>
                    <strong>Ace: Waterfall</strong><br/>
                    All players start drinking. The player who drew the card may stop at any time. All other players may
                    only stop once the player to their right stops. However, they do not have to stop until their cup is
                    empty. If a player in the middle of a chain runs out of their beverage, the player who would normally stop
                    from them instead stops based on the person to their right. As an example, given the following arrangement:<br/>
                    ←E←D←C←<br/>
                    where person A (not shown) drew the card, if person D runs out of their beverage then person E is now
                    reliant on person C:<br/>
                    ←E←C←<br/>
                    and play continues with player D sitting out the rest of the waterfall round
                  </li>
                  <li>
                    <strong>Two: You</strong><br/>
                    The player who drew the card chooses someone else to drink.
                  </li>
                  <li>
                    <strong>Three: Me</strong><br/>
                    The player who drew the card drinks.
                  </li>
                  <li>
                    <strong>Four: Floor</strong><br/>
                    Everyone points towards the floor. Last one to do so drinks.
                  </li>
                  <li>
                    <strong>Five: Guys</strong><br/>
                    Anyone who identifies as male drinks. Non-binary people may choose to drink on fives or sixes before the game.
                  </li>
                  <li>
                    <strong>Six: Chicks</strong><br/>
                    Anyone who identifies as female drinks. Non-binary people may choose to drink on fives or sixes before the game.
                  </li>
                  <li>
                    <strong>Seven: Heaven</strong><br/>
                    Everyone points towards the sky (up). Last one to do so drinks.
                  </li>
                  <li>
                    <strong>Eight: Mate</strong><br/>
                    The player who drew the card chooses someone to become their mate. For the rest of the game, whenever one of
                    the members of the mate drinks, the other does as well (except Aces). Polyamory is allowed, and all members
                    of the polycule drink if any one of them does.
                  </li>
                  <li>
                    <strong>Nine: Rhyme</strong><br/>
                    The player who drew the card says a word. All players following (going left) must come up with a unique rhyme
                    with that word. Any repeats or failures to come up with a word in five seconds result in a failure. The failure
                    drinks.
                  </li>
                  <li>
                    <strong>Ten: Categories</strong><br/>
                    The player who drew the card says a word. All players following (going left) must come up with a unique item
                    in that category. Any repeats or failures to come up with a word in five seconds result in a failure. The failure
                    drinks.
                  </li>
                  <li>
                    <strong>Jack: Never Have I Ever</strong><br/>
                    All players hold up three or more fingers, starting with three and adding one for each Jack drawn over the course
                    of the game. The player who drew the card goes first, stating something they have not done. Anyone who has done
                    that action puts a finger down. If no one puts a finger down, the asker puts their finger down. Play continues 
                    with the person to the asker's left asking the next question. Once one person runs out of fingers, they drink and
                    the game is over. If multiple people run out of fingers on the same turn, they all drink.
                  </li>
                  <li>
                    <strong>Queen: Question Master</strong><br/>
                    From the time the player reveals they drew a queen until either the end of the game or the revelation of the next
                    queen, the player who drew the queen is the question master. Anyone who answers the question master's questions,
                    no matter how short or small, drinks. There is no fucking the question master, Carl. 
                  </li>
                  <li>
                    <strong>King: Make a Rule</strong><br/>
                    The player who drew the card creates a rule. The rule may not single out any one person or group of people (either 
                    intentionally or otherwise) but may apply to any status in the game (such as mates or question masters). The player
                    may also revoke a rule made by another player instead of making their own rule. This rule lasts until the end of the
                    game. 
                  </li>
                  <li>
                    <strong>Joker: Fuck You, Drink</strong><br/>
                    The player who drew the card points to someone and says "fuck you, drink". That player must drink. 
                  </li>
                </ul>
                After they have performed the action for their card, they must insert the card between the can tab and the
                can. If the can either cracks (loses pressure) or cards fall out, the player loses, their team is ejected
                from the game, and they are ineligible for a medal. The can is replaced and play continues. Once all the
                cards in the circle are gone, the game is over. 
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                With the exception of Aces, every time a player drinks their team gains a point. The team with the least
                number of points at the end of the game wins.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                <ul>
                  <li>
                    With a Joker, you can make non-playing players drink anyways. This does not apply to a two.
                  </li>
                  <li>
                    A King's rule may target things like "players with their legs crossed" or other changable statuses. They
                    may not target unchangable statuses such as gender, race, name, age, etc.
                  </li>
                  <li>
                    If only one player has performed the action called out in the Jack's "Never Have I Ever", they may (but
                    do not have to) share the story.
                  </li>
                  <li>
                    The can may be checked for pressure by gently squeezing. 
                  </li>
                </ul>
              </p>
            </li>
            <li>
              <strong>Pizza box (2 Players, Group Event)</strong><br/>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                There must be either a whiteboard or a titular <em>pizza box</em>, as well as whiteboard markers
                or sharpies respectively. Either way, players will be drawing and writing, so there must be a 
                comfortable amount of writing utensils to go around. There will also be a coin, initially handed
                to the starting player. The starting player will be chosen using the same method described in other
                games here, where two non-participating players from different teams think of a number between zero
                and one thousand, and the player with the closest guess becomes the starting player. All players
                will also need their own drink.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                Players will take turns flipping the coin onto the box (or whiteboard), starting with the player
                initially holding the coin. If the coin goes off the box, the player gets a fault and simply tries
                again. If they fail twice in a row, they drink and try again. This continues until the player either
                gets the coin on the box, or dies trying. If the player dies trying, they are removed from the game
                and play resumes with the next player in clockwise order. If the coin lands on the box, it will be
                either inside of an existing shape, or it will not. There are two types of shapes:
                <ol>
                  <li>
                    <strong>Name Shape:</strong><br/>
                    Name shapes contain the name of a player. If a majority of the coin lands inside of a name shape,
                    the named player must drink. If two players have the same name, they must both drink. 
                  </li>
                  <li>
                    <strong>Rule Shapes:</strong><br/>
                    All other shapes contain a rule. If a majority of the coin lands inside a rule shape, the throwing
                    player must ensure that rule's execution. For example, if the rule dictates that they must dance
                    in the style of a 1920's flapper, then they must do so. If they fail to complete this task, they
                    must drink.
                  </li>
                </ol>
                If a player's coin toss lands inside of an existing shape, they must execute that shape according to
                the rules above. On the other hand, if a player's coin lands outside of an existing shape, they may
                draw their own. Their first drawn shape must be a name shape, and must have a diameter of at least
                two inches if at all possible. Otherwise, their shape must be a rule shape. The throwing player will
                create a <em>unique</em> rule (one that is not already on the board) and draw a shape around the coin.
                The shape may intersect other shapes, but may not overlap them. The rule created must follow the same
                restrictions as in <a href='#KingsCup'>King's</a>, with the exception that they may target a
                relationship status (single or not single). Watching situationships figure out if they should drink is
                always entertaining.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                With the exception of Aces, every time a player drinks their team gains a point. The team with the least
                number of points at the end of the game wins. Ties will be decided by a pushup contest.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                There shouldn't be any. Game is easy, get good.
              </p>
            </li>
            <li>
              <strong>Flip Cup (6 Players)</strong><br/>
              We will be using <a 
                href='https://images.squarespace-cdn.com/content/v1/5a3aa85990bade9f351061ab/1595203200662-FLFSW67TP0HDGHP31T7P/Flip+Cup+Rules.png?format=2500w'
                target='_blank'
                rel="noreferrer"
              >
                Chicken Shit's version of the rules
              </a>, with no changes.
            </li>
            <li>
              <strong>Quarters (2 Players, Group Event)</strong><br/>
              Quarters is another game that plays similar to Rage Cage, but it's also quite a bit different.
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                All players will start standing around a table. The two starting players, opposite each other,
                will each need an empty cup and a single quarter. Players will also need to place a cup in the 
                center of the table, which will be the "Penalty Cup". The Penalty Cup should be filled with
                a single shot.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                If a player has a cup and a quarter in front of them, they must attempt to bounce the quarter 
                flat side down off the table and into the cup. If they fail, they may try again. Once they make
                it in the cup, they may pass the cup and quarter left. If the player to their left has a cup
                already, they may "Screw" the player to their left by placing their cup inside of the left 
                player's cup. The screwed player gets one single attempt for redemption and if they make it,
                they may pass one cup left and the other to any other player. If they fail to make it, they 
                must consume the drink in the Penalty Cup, refill it with the drink of their team, then they are
                ejected from the game. Play resumes with the next player left and the player opposite them.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                The team the last player standing represents wins.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                <ul>
                  <li>
                    When the fourth-to-last person is eliminated, the cups start with the eliminator and the person to 
                    their left. 
                  </li>
                  <li>
                    A redeemer cannot give themselves the other cup, unless there are three or fewer players left.
                  </li>
                  <li>
                    If at any point all the players remaining are on the same team, victory may be claimed then without
                    finishing the game.
                  </li>
                  <li>
                    This game does not involve biting. If you are under the impression that this game involves biting, 
                    please contact the temporal anomalies department. 
                  </li>
                </ul>
              </p>
            </li>
            <li>
              <strong>Marshmallow Tower (3 Players, Group Event)</strong><br/>
              For the architecturally inclined, we have a game for you too.
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                Each team will be given eighty (80) toothpicks, access to mini marshmallows, and twenty (20) minutes. Each
                player may claim a 4'x4' (1.2192 x 1.2192 meters, for our Canadian infiltrators) space on the ground.
                This will be their working area. 
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                A neutral observer will start the timer and announce to all players that their time has begun. At this
                point, each team will begin working on their tower, attempting to reach the highest heights possible
                given the material restriction. Time warnings will be given at 10, 5, and 1 minutes left. At 30 seconds,
                a neutral observer must begin a countdown, ending at zero. When the word zero is said, any player still
                touching their tower is disqualified. If the tower falls over after zero, the player may still compete
                with the tower at it's post-fall height.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                Two players from different teams will measure the heights of each tower using a tape measure. Once the
                measurement is complete, it is locked in. If the tower falls over after the measurement has been recorded,
                the original measurement is still used. We will be using freedom units, a.k.a inches, for this process.
                Once all measurements have been recorded, the tallest structure wins.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                IDK m8, no questions from me dawg.
              </p>
            </li>
            <li>
              <strong>Cheese Ball Toss (2 Players)</strong><br/>
              Have you ever played H.O.R.S.E? This will be very similar.
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                Each team will be given twenty (10) cheese balls. The two teams competing will first get their shoe
                size, as the team with the larger shoe will go first. Teams will need to be in a moderately-sized open 
                area. Each player must start with their own drink as well, but should not hold it during the game.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                The team with the larger shoe size will go first. They will set their players up in specific positions,
                and one will attempt to throw a cheese ball into the mouth of the other. The other player may take any
                action once the cheese ball has left the thrower's hand. The catching player must catch the cheese ball
                in their mouth, without using their hands. If they do this, they get a point and the other team must then
                attempt the same throw with their players in the same starting positions as the original team. After
                this round, the second team will go first. If the first team does not make their attempt, the second team
                may choose a new location. This pattern continues until both teams are out of balls. If at any point a team
                misses their throw, they must take a drink.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                The team with the higher number of points wins. In the event there is a tie, the first team to finish both
                of their drinks wins.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                <ul>
                  <li>
                    Players are allowed to start in one position then run to another as part of their toss. However, the
                    other team must only start in the same position, and does not have to complete the toss the same way.
                  </li>
                  <li>
                    Only one cheese ball may be tossed per turn. No do-overs.
                  </li>
                </ul>
              </p>
            </li>
            <li>
              <strong>Russian Roulette (2 Players)</strong><br/>
              The original Russian Roulette is a simple game. Load a six-barrel gun with a single bullet, spin the chamber,
              hold it to your head, and pull the trigger. If you live, you win! If you die, you don't win. We will be playing
              a less deadly form of the game still involving shots, but not from a gun.
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                For each round, A number of shots will be poured by a non-participant, with nobody watching. At least one,
                but no more than half, will contain Kirkland Signature vodka (as to not support the Russian vodka economy).
                The number of shots should be equivalent to the number of players still left in the game. Another
                non-participant will collect the shots and place them in the center of the circle of players.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                Each round, the player who has most recently donated Ukraine will go first. They will select a shot and,
                if not on team non-alcoholic, drink it in one go. If on team non-alcoholic, they may opt to simply sniff it,
                then give it to a non-participating player of their choosing. All other players will then vote on if they
                believe, based on the drinking player's reaction, that the player drank vodka. All correct guesses will gain
                a point, incorrect will lose. Players do not have to vote. After the votes are in, the player will reveal and
                points will be tallied. If the player's choice glass contained vodka and the majority of teams correctly guess
                that they consumed vodka, the player's team loses two points. Is this fair mathmatically? No. Do I care? No.
                Russian Roulette is a game of luck, be thankful I added skill at all.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                After three rounds, the team with the most points wins. In the event of a tie, play a special round with one
                non-vodka and the rest vodka shots. The starting player is chosen the same way as a normal round. A 
                representitive for each team will take/sniff the shots at the same time. The player who had water wins.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                <ul>
                  <li>
                    Players may vote on their own teammates.
                  </li>
                  <li>
                    All players may take the sniff option if they don't want to drink.
                  </li>
                  <li>
                    At any point, one player may force another player not on team non-alcoholic to play the original 
                    Russian Roulette using a 6-shot nerf gun loaded with two darts. If the challenged player loses,
                    they must take a shot. If they win, the challenging player must take a shot. They do not have to
                    accept the challenge.  
                  </li>
                </ul>
              </p>
            </li>
            <li>
              <strong>Ice luge</strong><br/>
              Coming Soon!
            </li>
            <li>
              <strong>Lipstictionary (6 players)</strong><br/>
              Pictionary is a game where one player must wordlessly draw on a board to describe a specific word or phrase
              so that their team may guess what they are drawing. We will be playing a slightly different version, where
              the player have <s>lipstick</s> (actually, a whiteboard marker due to budget constraints) in their mouth and
              be using that to draw. Good luck!
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Setup</strong><br/>
                Teams will sit in a semi-circle with each team on one half. There will be a whiteboard on the wall, and each
                team will be given a single whiteboard marker of a dark color. Each player will also need a cup with their
                drink of choice.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Play</strong><br/>
                Teams will take turns. During a team's turn, they will nominate one player to be the artist. The artist will
                be given a word by <a href='https://randomwordgenerator.com/pictionary.php'
                  target='_blank'
                  rel="noreferrer"
                >
                  this pictionary word generation website</a>, and 120 seconds to 
                draw. The artist will draw, while their team guesses. For every incorrect guess a player makes, they must 
                drink. A player may not make a new guess until they have finished drinking from the incorrect one. Once they
                make the correct guess, their timer is stopped and their time recorded. Each team will take six turns, with
                each player being the artist at least once. The artist may not speak during their turn, and may not write
                words on the board either. They are allowed to use fingers to point and give thumbs up only.
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Winning</strong><br/>
                After every player has taken their turn, the total times remaining from each team are summed and add
              </p>
              <p style={{paddingLeft: '10px', fontSize: '12px'}}>
                <strong style={{fontSize: 16}}>Answers to Common Questions</strong><br/>
                None yet.
              </p>
            </li>
          </ul>
        </Overlay>
      </div>
    );
  }
}

export default EventRegistrationForm;
