from typing import Any
import io
from PIL import Image
from user_utils import Role
import json
import logging
import constants
from utils import get_db_container_client, get_blob_client, validate_contains_required_fields
from user_utils import remove_user_event, upsert_user_event, get_user_event_role
from auth.auth_utils import NoPermissionException, PrivateEventException
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceNotFoundError
from azure.storage.blob import ContentSettings
import azure.functions as func

def update_event(event_id: str, title: str|None = None, description: str|None = None, datetime: int|None = None, image: dict[str, Any]|None = None, public: bool|None = None, # type: ignore
                 new_owner: str|None = None, hosts: list[str]|None=None, form: list|None=None, current_owner: str|None=None) -> func.HttpResponse|None:
    """
    Updates or creates an event in the `events` database, and modifies the `event_connections` table and the `event-images` blob storage as needed.

    Parameters
    -----------
    id `str`: The id of the event to update or create.\\
    title `str`: The title for the event.\\
    description `str`: The description for the event.\\
    datetime `int`: The date the event will take place.\\
    image `str`: The base64-encoded string representing the event image. Must contain the URI header.\\
    public `bool`: If this event is public. Required if creating a new event.\\
    new_owner `str`: Who should own this event. Should contain the user's id from the `ids` table.\\
    hosts `list[str]`: Who the hosts of this event should be. Should contain the users' ids from the `ids` table.\\
    form `list`: The json-style representation for the form for this event.\\
    current_owner `str`: The id of the current owner of this event. If this is blank, must be creating a new event and 
        the `public` param is required.\\
        
    Returns
    -----------
    `None` if successful, a `func.HttpResponse` with error information if unsuccessful
    """
    events_table = get_db_container_client('auth', 'events') # TODO: Change this out of auth once we leave free tier
    update: dict[str, Any] = {
        'id': event_id,
    }
    try:
        if current_owner is not None:
            updater_role = get_user_event_role(current_owner, event_id)
        else:
            updater_role = Role.OWNER
        # Update the fields if they're not None
        if public is not None:
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.HOST):
                raise NoPermissionException(requires=Role.HOST, has=updater_role)
            update['public'] = public
        if title is not None:
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.HOST):
                raise NoPermissionException(requires=Role.HOST, has=updater_role)
            update['title'] = title
        if description is not None:
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.HOST):
                raise NoPermissionException(requires=Role.HOST, has=updater_role)
            update['description'] = description
        if datetime is not None:
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.HOST):
                raise NoPermissionException(requires=Role.HOST, has=updater_role)
            update['datetime'] = datetime
        if form is not None:
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.HOST):
                raise NoPermissionException(requires=Role.HOST, has=updater_role)
            update['form'] = form
        if image is not None: # Images are a little more work
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.HOST):
                raise NoPermissionException(requires=Role.HOST, has=updater_role)
            img: Image.Image = image['img']
            data_type: str = image['type']
            # TODO: Add image processing to crop, resize, etc. Probably move this into an image processing suite
            # Creates the output buffer to write the bytes to, then saves the bytes there for upload
            output_buffer = io.BytesIO()
            image_format = ("gif" if "gif" in data_type else "jpeg")
            img.save(output_buffer, format=image_format, save_all=(True if image_format == "gif" else False))
            try:
                blob_client = get_blob_client(constants.EVENT_IMAGES_BLOB_CONTAINER_NAME, f"{event_id}.{image_format}") # Just gonna name the image the event ID
                blob_client.upload_blob(output_buffer.getvalue(), content_settings=ContentSettings(content_type=f"image/{image_format}"))
                # Add the image URL to the update dict
                update['image'] = f"https://untitledeventplanner.blob.core.windows.net/event-images/{event_id}.{image_format}"
            except Exception as e:
                logging.error(e)
                return func.HttpResponse(json.dumps({'code': 'nodetails', 'message': 'Image failed to update.'}), status_code=500)
        if new_owner is not None:
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.OWNER):
                raise NoPermissionException(requires=Role.OWNER, has=updater_role)
            # Add the event to the new owner
            update['owner'] = new_owner
            # Remove from a old user if necessary
            if current_owner is not None:
                remove_user_event(current_owner, event_id)
            # Add the event record to the new user
            upsert_user_event(new_owner, event_id, Role.OWNER)
        if hosts is not None:
            # Check role perms first
            if updater_role not in Role.roles_above_and_including(Role.OWNER):
                raise NoPermissionException(requires=Role.OWNER, has=updater_role)
            # Need to check if any of the hosts have changed and, if so, remove the old ones and add the new ones
            update['hosts'] = hosts
            new_hosts = set(hosts)
            try:
                event = events_table.read_item(event_id, event_id)
                old_hosts: set[str] = set(event['hosts'])
                public: bool = event['public']
            except CosmosResourceNotFoundError:
                # Must be creating a new event
                assert type(public) == bool
                old_hosts: set[str] = set()
            # Figure out who has been added and who has been removed
            added_hosts = new_hosts.difference(old_hosts)
            removed_hosts = old_hosts.difference(new_hosts)
            # Add the event to the added hosts
            for host in added_hosts:
                upsert_user_event(host, event_id, Role.HOST)
            # Remove the event from the removed hosts
            for host in removed_hosts:
                remove_user_event(host, event_id)
    except NoPermissionException as e:
        return func.HttpResponse(json.dumps({'code': 'no_perms', 'message': e.message}))
    try:
        events_table.upsert_item(update)
    except CosmosHttpResponseError as e:
        # Something went wrong with cosmos
        return func.HttpResponse(json.dumps({'code': 'no_details', 'message': 'Event update failed due to cosmos.'}), status_code=500)
    return None

def get_all_events_by(requested_user: str, current_user: str|None, role: Role) -> func.HttpResponse|list[dict[str, Any]]:
    """
    Displays the most recent 100 events hosted by the user ID passed in.
        - If same user, will return all public events, as well as private events that the requester has the given role or higher in.
        - If not same user or unauthed, will show only publicly available events.

    Parameters
    ------------ 
    requested_user `str`: The user whose events we want.\\
    current_user `str|None`: The user requesting these events.\\
    role `Role`: The role to get all events above. For example, if `Role.HOST` then all hosted and owned events will be returned.

    Returns
    ------------
    A list of events in the field `'events'`
    """
    user_connections_table = get_db_container_client('auth', 'user_connections') # TODO: Change this out of auth once we leave free tier
    try:
        # Have to make a cross partition query, but only within one subpartition. This is still quite efficient.
        items = user_connections_table.query_items(f'SELECT * FROM ec', partition_key=[requested_user])
    except CosmosResourceNotFoundError:
        # This user does not exist or has no events
        return func.HttpResponse(json.dumps({'code': 'none', 'message': 'User has no events or does not exist!'}), status_code=200) # 200 because this is still correct functioning
    # Get only events with the roles we care about
    events_with_role = filter(lambda item: Role[item['role']] in Role.roles_above_and_including(role), items)
    # Get a list of IDs so we can get the event details
    event_ids = [event['event_id'] for event in events_with_role]
    self_request = (requested_user == current_user) # Is this user looking to view their own events
    event_details = get_top_events(event_ids, public_only=(not self_request))
    # Get only the highlight details for each event here-- not the full event details.
    event_details_trimmed = [{k: e[k] for k in constants.EVENT_THUMBNAIL_FIELDS} for e in event_details]
    return event_details_trimmed

def get_event(event_id: str, user_id: str|None) -> dict[str, Any]:
    """
    Gets the event details from CosmosDB.

    Parameters
    -----------
    event_id `str`: The id for the event to get information about.
    user_id `str`: The id for the user to get information about, or none if looking for public info only.

    Returns
    -----------
    The event details
    """
    events_table = get_db_container_client('auth', 'events') # TODO: Change this out of auth once we leave free tier
    event = events_table.read_item(event_id, event_id)
    role = get_user_event_role(user_id, event_id)
    if (role == Role.NONE):
        # User is not invited-- check if public
        if event['public']:
            # Only return public fields actually present (for example, description is not required but is public)
            event = {k: event[k] for k in constants.EVENT_PUBLICLY_VISIBLE_FIELDS.union(event.keys())}
        else:
            # Need to return a 404 event1 not found.
            raise PrivateEventException()
        
    return {'event': event, 'user_role': role.value}

def get_events(event_ids: list[str]) -> list[dict[str, Any]]:
    """
    Gets the event details from CosmosDB.

    Parameters
    -----------
    event_ids `list[str]`: The ids for the events to get information about.

    Returns
    -----------
    The event details
    """
    events_table = get_db_container_client('auth', 'events') # TODO: Change this out of auth once we leave free tier
    # Yes we have to enable cross-partition query because the id *is* the partition, but it will only search the partitions we request so no worries.
    return list(events_table.query_items(f"SELECT * FROM et WHERE ARRAY_CONTAINS({json.dumps(event_ids)}, et.id)", enable_cross_partition_query=True))

def get_top_events(event_ids: list[str], n: int=100, public_only: bool=False) -> list[dict[str, Any]]:
    """
    Gets the event details from CosmosDB.

    Parameters
    -----------
    event_ids `list[str]`: The id for the event to get information about.\\
    n `int`: The number of events to get, default value 100.\\
    public_only `bool`: If true, returns only public events from the list passed in.

    Returns
    -----------
    The event details.
    """
    events_table = get_db_container_client('auth', 'events') # TODO: Change this out of auth once we leave free tier
    query = f"SELECT * FROM et WHERE ARRAY_CONTAINS({json.dumps(event_ids)}, et.id)"\
        + (" AND et.public = true" if public_only else "")\
        + (f" ORDER BY et.datetime DESC OFFSET 0 LIMIT {n}")
    # Yes we have to enable cross-partition query because the id *is* the partition, but it will only search the partitions we request so no worries.
    return list(events_table.query_items(query, enable_cross_partition_query=True))