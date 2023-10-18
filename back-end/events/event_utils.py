from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any
from PIL import Image
import io
import json
import logging
import base64
from constants import EVENT_IMAGES_BLOB_CONTAINER_NAME
from utils import get_db_container_client, get_blob_client
from user_utils import remove_event_from_user, add_event_to_user, create_user_event_record
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceNotFoundError
from azure.storage.blob import ContentSettings
import azure.functions as func


def update_event(event_id: str, title: str|None = None, description: str|None = None, image: str|None = None, public: bool|None = None, # type: ignore
                 new_owner: str|None = None, hosts: list[str]|None=None, form: list|None=None, current_owner: str|None=None) -> func.HttpResponse|None:
    """
    Updates or creates an event in the `events` database, and modifies the `events_by_user` table and the `event-images` blob storage as needed.

    Parameters
    -----------
    id `str`: The id of the event to update or create.\\
    title `str`: The title for the event.\\
    description `str`: The description for the event.\\
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
    # Update the fields if they're not None
    if public is not None:
        update['public'] = public
    if title is not None:
        update['title'] = title
    if description is not None:
        update['description'] = description
    if new_owner is not None:
        # Add the event to the new owner
        update['owner'] = new_owner
        # Identify if we need to remove from an old user
        if current_owner is None:
            # Then we're creating an event
            assert type(public) == bool # Which means `public` cannot be None
            record = create_user_event_record(event_id, public)
        else:
            # Try to get the entry for the old user
            record = remove_event_from_user(current_owner, event_id, 'own')
        # Add the event record to the new user
        add_event_to_user(new_owner, record, 'own')
    if hosts is not None:
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
            add_event_to_user(host, create_user_event_record(event_id, public), 'host')
        # Remove the event from the removed hosts
        for host in removed_hosts:
            remove_event_from_user(host, event_id, 'host')
    if form is not None:
        update['form'] = form
    if image is not None: # Images are a little more work
        # The header of a base64 image is `data:[type];[encoding],[base64-encoded data]`, so we need to split all that out
        metadata, image_data = image[:(comma_index := image.index(','))], image[comma_index+1:] # This is much faster than .split() given the size of this string
        data_type_metadata, encoding = metadata.split(';') # Splitting `data:[type];[encoding]` into `data:[type]` and `[encoding]`
        _, data_type = data_type_metadata.split(':') # Splitting `data:[type]` into the literal string `"data"` and the type
        # Actually open the image in PIL for processing
        img = Image.open(io.BytesIO(base64.b64decode(image_data)))
        # TODO: Add image processing to crop, resize, etc. Probably move this into an image processing suite
        # Creates the output buffer to write the bytes to, then saves the bytes there for upload
        output_buffer = io.BytesIO()
        image_format = ("gif" if "gif" in data_type else "jpeg")
        img.save(output_buffer, format=image_format, save_all=(True if image_format == "gif" else False))
        try:
            blob_client = get_blob_client(EVENT_IMAGES_BLOB_CONTAINER_NAME, f"{event_id}.{image_format}") # Just gonna name the image the event ID
            blob_client.upload_blob(output_buffer.getvalue(), content_settings=ContentSettings(content_type=f"image/{image_format}"))
            # Add the image URL to the update dict
            update['image'] = f"https://untitledeventplanner.blob.core.windows.net/event-images/{event_id}.{image_format}"
        except Exception as e:
            logging.error(e)
            return func.HttpResponse(json.dumps({'code': 'nodetails', 'message': 'Image failed to update.'}), status_code=500)
    try:
        events_table.upsert_item(update)
    except CosmosHttpResponseError as e:
        # Something went wrong with cosmos
        return func.HttpResponse(json.dumps({'code': 'nodetails', 'message': 'Event update failed due to cosmos.'}), status_code=500)
    return None