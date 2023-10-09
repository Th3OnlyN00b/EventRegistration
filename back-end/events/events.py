# TODO: (Potentially) rename this file later



###### EVENTS DB RECORD FORMAT
# id (duh)
# Title: string
# Description: string
# Owner: string
# Hosts: list[string]
# form: JSON)

import azure.functions as func
import random
import json
import constants
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceNotFoundError
from utils import validate_contains_required_fields, get_db_container_client
from events.event_utils import update_event

def create_event(req: func.HttpRequest) -> func.HttpResponse:
    """
    Creates an event structure via the JSON in the "event" field and stores it in the database.
    First checks authentication to ensure identity of user creating event.\\
    *Requires authentication*

    Parameters
    ------------ 
    req `func.HttpRequest`: The request needing token validation. Required fields are `["title", "form"]`.
    Will optionally accept `["image", "description"]

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include a
    `'Set-Cookie'` header with the token.
    """

    # First we'll validate the input
    validation = validate_contains_required_fields(req, set(['event']), authenticate=True)
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
    for i in range(constants.MAX_RANDOM_RETRIES_EVENTS):
        try:
            # We need to attempt to make a unique event id. However, there's no good way to do that other than guess.
            events_table.create_item({'id': event_id, 'title': title})
            break
        except CosmosHttpResponseError as e:
            # This event ID already exists. Try again.
            event_id = ''.join(random.choices(constants.ALPHABET, k=10))
    if i == constants.MAX_RANDOM_RETRIES_EVENTS:
        # We must have maxed out retries
        print("Max retries reached. This is unlikely, and probably means something is wrong. Unless you have a ton of customers so if that's the case, well done to you!")
        return func.HttpResponse(json.dumps({'code': 'nocreate', 'message': 'Max retries on attempt to generate unique code reached.'}), status_code=500)
    # Then we need to add this event to the owner's list
    events_by_user_table = get_db_container_client('auth', 'events_by_user') # TODO: Change this out of auth once we leave free tier
    # Try to get the old entry for the user
    try:
        old_item = events_by_user_table.read_item(user_id, user_id)
    except CosmosResourceNotFoundError as e:
        # Generate a dummy old item
        old_item = {'id': user_id, 'own': [], 'host': [], 'attended': []}
    # Add this event to the user's owned list
    old_item['own'].push({'id': event_id, 'public': req_json['event']['public']})
    try:
        events_by_user_table.upsert_item(old_item)
    except CosmosHttpResponseError as e:
        # To avoid conflicts in state, attempt to delete the event from the events table
        events_table.delete_item(event_id, event_id)
        return func.HttpResponse(json.dumps({'code': 'nocreate', 'message': 'Cosmos was unable to create this event'}), status_code=500)
    # Need to update the event with the other data
    description = req_json['description'] if 'description' in req_json else None
    form = req_json['form']
    if type(error := update_event(event_id, title=title, description=description, form=form)) == func.HttpResponse:
        return error
    # At this point we have created the event and assigned it's owner and everything is recorded in the database. We're done.
    return func.HttpResponse(json.dumps({'code': 'success', 'message': 'Event created successfully!', 'event_id': event_id}), status_code=200)

def get_all_events_hosted_by(req: func.HttpRequest) -> func.HttpResponse:
    """
    Displays the most recent 100 events hosted by the user ID passed in.
        - If authenticated will return all public events, as well as private events that the requester has been invited to.
        - If unauthenticated, will show only publicly available events.

    Parameters
    ------------ 
    req `func.HttpRequest`: The request. Required fields are `["user_id"]`

    Returns
    ------------
    A `func.HttpResponse`, containing the list of events in the field `'events'`
    """
    # First we'll validate the input
    validation = validate_contains_required_fields(req, set(['event']), authenticate=True)
    if type(validation) == func.HttpResponse:
        # Check if this is a non-authed call
        validation = validate_contains_required_fields(req, set(['event']), authenticate=False)
        if type(validation) == func.HttpResponse:
            # Nah, it's just completely invalid
            return validation
        # Okay it's valid but unauthed
        authed = False
    else:
        # It's valid and authed
        authed = True
    # For static type checking
    assert type(validation) == tuple
    req_json, user_id = validation # user_id will be `None` if no validation
    # Since we're getting events from a specific user, we can actually just list them here to save us a query call accross all partitions
    events_by_user_table = get_db_container_client('auth', 'events_by_user') # TODO: Change this out of auth once we leave free tier
    try:
        item = events_by_user_table.read_item(req_json['user_id'], req_json['user_id'])
    except CosmosResourceNotFoundError as e:
        # This user does not exist or has no events
        return func.HttpResponse(json.dumps({'code': 'none', 'message': 'User has no events or does not exist!'}), status_code=200) # 200 because this is still correct functioning
    events = item['own'] + item['host'] # the list of event ids
    if not authed:
        events = filter(lambda x: x['public'], events)
    event_ids = [event['id'] for event in events]
    events_table = get_db_container_client('auth', 'events') # TODO: Change this out of auth once we leave free tier
    results = events_table.query_items(f'SELECT * FROM events WHERE id IN ({",".join(event_ids)})')
    # TODO: complete implementation once we have more test data.
    return func.HttpResponse('NYI', status_code=501)