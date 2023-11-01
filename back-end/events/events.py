# TODO: (Potentially) rename this file later



###### EVENTS DB RECORD FORMAT
# id (duh)
# Title: string
# Description: string
# Owner: string
# Hosts: list[string]
# form: JSON)
from typing import Any
import azure.functions as func
import logging
import random
import json
import constants
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceNotFoundError
from utils import validate_contains_required_fields, get_db_container_client
from user_utils import Role
import events.event_utils

def create_event(req: func.HttpRequest) -> func.HttpResponse:
    """
    Creates an event structure via the JSON in the "form" field and stores it in the database.
    First checks authentication to ensure identity of user creating event.\\
    *Requires authentication*

    Parameters
    ------------ 
    req `func.HttpRequest`: The request needing token validation. Required fields are `["title", "form", "public", "datetime"]`.
    Will optionally accept `["image", "description"]`.

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include a
    `'Set-Cookie'` header with the token.
    """

    # First we'll validate the input
    validation = validate_contains_required_fields(req, set(['title', 'form', 'public', 'datetime']), authenticate=True)
    if type(validation) == func.HttpResponse:
        return validation
    # For static type checking
    assert type(validation) == tuple
    req_json, user_id = validation
    assert type(user_id) == str
    # Get the events table and add the event
    events_table = get_db_container_client('auth', 'events') # TODO: Change this out of auth once we leave free tier
    i = 0 # Stupid type checking in python can't figure out that i has to at least exist as zero because the loop is running a constant number of times. This fixes "Possibly Unbound" warning.
    event_id = ''.join(random.choices(constants.ALPHABET, k=10))
    title = req_json['title']
    datetime = req_json['datetime']
    for i in range(constants.MAX_RANDOM_RETRIES_EVENTS):
        try:
            # We need to attempt to make a unique event id. However, there's no good way to do that other than guess.
            events_table.create_item({'id': event_id, 'title': title, 'datetime': datetime})
            break
        except CosmosHttpResponseError as e:
            # This event ID already exists. Try again.
            event_id = ''.join(random.choices(constants.ALPHABET, k=10))
    if i == constants.MAX_RANDOM_RETRIES_EVENTS:
        # We must have maxed out retries
        logging.error("Max retries reached. This is unlikely, and probably means something is wrong. Unless you have a ton of customers so if that's the case, well done to you!")
        return func.HttpResponse(json.dumps({'code': 'nocreate', 'message': 'Max retries on attempt to generate unique code reached.'}), status_code=500)
    # Need to update the event with the other data
    description = req_json['description'] if 'description' in req_json else None
    form = req_json['form']
    public = req_json['public']
    image = req_json['image'] if 'image' in req_json else None
    if type(error := events.event_utils.update_event(event_id, title=title, description=description, new_owner=user_id, form=form, image=image, public=public, current_owner=None)) == func.HttpResponse:
        return error
    # At this point we have created the event and assigned it's owner and everything is recorded in the database. We're done.
    return func.HttpResponse(json.dumps({'code': 'success', 'message': 'Event created successfully!', 'event_id': event_id}), status_code=200)

def update_event(req: func.HttpRequest) -> func.HttpResponse:
    """
    Updates an event. First checks authentication to ensure identity of user creating event.\\
    *Requires authentication*

    Parameters
    ------------ 
    req `func.HttpRequest`: The request needing token validation. Required fields are `["event_id"]`.
    Will optionally accept `["title", "public", "form", "image", "description", "hosts", "new_owner"]`.

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation.
    """
    # First we'll validate the input
    validation = validate_contains_required_fields(req, set(['event_id']), authenticate=True)
    if type(validation) == func.HttpResponse:
        return validation
    # For static type checking
    assert type(validation) == tuple
    req_json, user_id = validation
    assert type(user_id) == str
    # extract fields from the query
    event_id = req_json['event_id'] # This one is required, the rest are optional
    title = req_json['title'] if 'title' in req_json else None
    description = req_json['description'] if 'description' in req_json else None
    datetime = req_json['datetime'] if 'datetime' in req_json else None
    new_owner = req_json['new_owner'] if 'new_owner' in req_json else None
    form = req_json['form'] if 'form' in req_json else None
    public = req_json['public'] if 'public' in req_json else None
    image = req_json['image'] if 'image' in req_json else None
    # Attempt to update the event. If it works, dope. If not, return the error.
    if type(error := events.event_utils.update_event(event_id, title=title, description=description, datetime=datetime, image=image, public=public, new_owner=new_owner, form=form, current_owner=user_id)) == func.HttpResponse:
        return error

    return func.HttpResponse(json.dumps({'code': 'success', 'message': 'Event updated successfully!'}), status_code=200)

def get_all_events_by(req: func.HttpRequest, role: Role) -> func.HttpResponse:
    """
    Displays the most recent 100 events hosted by the user ID passed in.
        - If same user, will return all public events, as well as private events that the requester has the given role or higher in.
        - If not same user or unauthed, will show only publicly available events.

    Parameters
    ------------ 
    req `func.HttpRequest`: The request. Required fields are `["user_id"]`

    Returns
    ------------
    A `func.HttpResponse`, containing the list of events in the field `'events'`
    """
    # First we'll validate the input
    validation = validate_contains_required_fields(req, set(['user_id']), authenticate=False)
    # Check if it's an authed call
    if type(v := validate_contains_required_fields(req, set(['user_id']), authenticate=True)) == func.HttpResponse:
        # Nah, it's just completely invalid
        return v
    else:
        # It's valid and authed
        validation = v
    # For static type checking
    assert type(validation) == tuple
    req_json, user_id = validation # user_id will be `None` if no validation
    user_connections_table = get_db_container_client('auth', 'user_connections') # TODO: Change this out of auth once we leave free tier
    try:
        # Have to make a cross partition query, but only within one subpartition. This is still quite efficient.
        items = user_connections_table.query_items(f'SELECT * FROM ec', partition_key=[req_json['user_id']])
    except CosmosResourceNotFoundError as e:
        # This user does not exist or has no events
        return func.HttpResponse(json.dumps({'code': 'none', 'message': 'User has no events or does not exist!'}), status_code=200) # 200 because this is still correct functioning
    # Get only events with the roles we care about
    events_with_role = filter(lambda item: Role[item['role']] in Role.roles_above_and_including(role), items)
    # Get a list of IDs so we can get the event details
    event_ids = [event['event_id'] for event in events_with_role]
    self_request = (req_json['user_id'] == user_id) # Is this user looking to view their own events
    event_details = events.event_utils.get_top_events(event_ids, public_only=(not self_request))
    # Get only the highlight details for each event here-- not the full event details.
    event_details_trimmed = [{k: e[k] for k in ['title', 'description', 'datetime', 'id', 'public']} for e in event_details]
    return func.HttpResponse(json.dumps(event_details_trimmed), status_code=200)