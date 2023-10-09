from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Any
import json
import base64
from constants import EVENT_IMAGES_BLOB_CONTAINER_NAME
from utils import get_db_container_client, get_blob_client
from azure.cosmos.exceptions import CosmosHttpResponseError
import azure.functions as func


def update_event(id: str, title: str|None = None, description: str|None = None, image: bytes|None = None, 
                 owner: str|None = None, hosts: list[str]|None=None, form: list|None=None) -> func.HttpResponse|None:
    events_table = get_db_container_client('auth', 'events') # TODO: Change this out of auth once we leave free tier
    update: dict[str, Any] = {
        'id': id,
    }
    # Update the fields if they're not None
    if title is not None:
        update['title'] = title
    if description is not None:
        update['description'] = description
    if owner is not None:
        update['owner'] = owner
    if hosts is not None:
        update['hosts'] = hosts
    if form is not None:
        update['form'] = form
    if image is not None: # Images are a little more work
        try:
            blob_client = get_blob_client(EVENT_IMAGES_BLOB_CONTAINER_NAME, id) # Just gonna name the image the event ID
            blob_client.upload_blob(base64.decodebytes(image))
        except:
            return func.HttpResponse(json.dumps({'code': 'nodetails', 'message': 'Image failed to update.'}), status_code=500)
    try:
        events_table.upsert_item(update)
    except CosmosHttpResponseError as e:
        # Something went wrong with cosmos
        return func.HttpResponse(json.dumps({'code': 'nodetails', 'message': 'Event update failed due to cosmos.'}), status_code=500)
    return None