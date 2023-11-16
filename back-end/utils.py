from typing import TYPE_CHECKING
import azure.functions as func
import logging
from datetime import datetime
from dateutil.relativedelta import relativedelta
import base64
from PIL import Image
from azure.storage.blob import BlobServiceClient
if TYPE_CHECKING: # Neat feature. Will evaluate to false during runtime, always, but allows for using these imports for type hints
    from azure.storage.blob import BlobClient
    from typing import Any
    from azure.cosmos import ContainerProxy
from azure.cosmos import CosmosClient
import constants
import os
import io

REJECT_MESSAGE = "Stop fucking with my website, jesus christ we're just launching. Chill."

def get_db_container_client(db_name: str, container_name: str) -> 'ContainerProxy':
    """
    Creates a CosmosDB client from the environment variable connection string, connecting to the
    database and container passed in. 
    
    Parameters
    ------------
    db_name `str`: The name of the database to connect to\\
    container_name `str`: The name of the container to connect to

    Returns
    ------------
    A `azure.cosmos.ContainerProxy` item representing the table.
    """
    client = CosmosClient.from_connection_string(os.environ['COSMOS_CONNECTION_STRING'])
    database = client.get_database_client(db_name)
    table = database.get_container_client(container_name)
    return table

def get_blob_client(container_name: str, blob_name: str) -> 'BlobClient':
    """
    Creates a blob client from the environment variable connection string, connecting to the
    container and blob passed in. This blob does not need to exist. 
    
    Parameters
    ------------
    container_name `str`: The name of the container to connect to\\
    blob_name `str`: The name of the blob to connect to. Does not need to already exist.

    Returns
    ------------
    A `azure.storage.blob.BlobClient` item representing the blob.
    """
    return BlobServiceClient.from_connection_string(os.environ['BLOB_STORAGE_CONNECTION_STRING']).get_container_client(container_name).get_blob_client(blob_name)

def validate_contains_required_fields(req: func.HttpRequest, required_fields: set[str]=set(), optional_fields: set[str]=set(), authenticate=True) -> func.HttpResponse | tuple[dict[str, 'Any'], str | None]:
    """
    Checks to make sure the correct fields are present in the request JSON object, returning an
    error if they are not.

    Parameters
    ------------
    req `func.HttpRequest`: The request to validate.\\
    required_fields `set[str]`: The fields that should be present in `req`.\\
    optional_fields `set[str]`: The fields that may be present in `req`. Checked only for formatting.\\
    authenticate `bool`: A boolean where, if `True`, checks the validity of the 'Authorization' token in the header.

    Returns
    ------------
    The body dict with corrected values if valid or an `azure.functions.HttpResonse` object if invalid. Status code
    401 for auth-related issues, 400 otherwise.
    """
    from auth.auth_utils import verify_token
    if req.method.lower() == "get":
        req_json = dict(req.params)
    else:
        try:
            req_json: dict = req.get_json()
        except ValueError:
            return func.HttpResponse(f"{REJECT_MESSAGE} You didn't include a JSON body.", status_code=400)
    logging.info(req_json)
    # If needing to auth, do that first.
    if(authenticate):
        if('authorization' not in req.headers):
            # Missing token
            return func.HttpResponse(f"{REJECT_MESSAGE} Authorization header is not present (but should be) though", status_code=401)
        try:
            if(not verify_token(req.headers['authorization'])):
                # Unauthorized token
                return func.HttpResponse(f"{REJECT_MESSAGE} You've got an invalid or expired authorization header.", status_code=401)
        except:
            # Invalid token
            return func.HttpResponse(f"{REJECT_MESSAGE} Your authorization header in incorrect format. Should be `number.token`.", status_code=401)
    # First check that they all exist
    for field in required_fields:
        if field not in req_json:
            return func.HttpResponse(f"{REJECT_MESSAGE} You forgot your {field} though.", status_code=400)
    ##### SPECIAL CASES #####
    fields = required_fields.union(optional_fields)
    # Phone numbers should be 10 digits and a phone number. TODO: Support international phone numbers
    if ("phone" in fields) and ("phone" in req_json.keys()):
        # Get final ten digits, ignoring country codes, then add the US country code (1) on the front
        req_json["phone"] = ''.join(list(filter(lambda x: x.isdigit(), str(req_json["phone"]))))[-10:]
        if len(req_json["phone"]) != 10:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a phone number.", status_code=400)
        req_json["phone"] = '+1' + req_json["phone"]
    # Names should be at least a single character
    if ("name" in fields) and ("name" in req_json.keys()):
        if len(req_json["name"]) < 1:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a real name.", status_code=400)
    # public should be a boolean
    if ("public" in fields) and ("public" in req_json.keys()):
        if type(req_json["public"]) == bool:
            return func.HttpResponse(f"{REJECT_MESSAGE} Public has to be a boolean.", status_code=400)
    # Titles need to be reasonable
    if ("title" in fields) and ("title" in req_json.keys()):
        if len(req_json["title"]) < constants.TITLE_MIN_LENGTH:
            return func.HttpResponse(f"{REJECT_MESSAGE} Titles need to be at least {constants.TITLE_MIN_LENGTH} characters long.", status_code=400)
        req_json['title'] = req_json['title'][:constants.TITLE_MAX_LENGTH]
    # Descriptions can't be too long
    if ("description" in fields) and ("description" in req_json.keys()):
        req_json['description'] = req_json['description'][:constants.DESCRIPTION_MAX_LENGTH]
    # Datetimes should be parsable and reasonable
    if ("datetime" in fields) and ("datetime" in req_json.keys()):
        if type(req_json["datetime"]) != int:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a real datetime.", status_code=400)
        if datetime.fromtimestamp(req_json["datetime"]) < datetime.now():
            return func.HttpResponse(f"{REJECT_MESSAGE} You can't have a date in the past.", status_code=400)
        if datetime.fromtimestamp(req_json["datetime"]) > (datetime.now() + relativedelta(years=1)):
            return func.HttpResponse(f"{REJECT_MESSAGE} Currently we do not support dates more than a year in the future.", status_code=400)
    # Images should be in the correct format. The header of a base64 image is `data:[type];[encoding],[base64-encoded data]`
    if ("image" in fields) and ("image" in req_json.keys()):
        try:
            image: str = req_json["image"]
            req_json["image"] = __process_image(image)
        except:
            return func.HttpResponse(f"{REJECT_MESSAGE} That image isn't even in the right format.", status_code=400)
    # Images should be in the correct format. The header of a base64 image is `data:[type];[encoding],[base64-encoded data]`
    if ("images" in fields) and ("images" in req_json.keys()):
        try:
            images: list[str] = req_json["images"]
            req_json["images"] = [__process_image(image) for image in images]
        except:
            return func.HttpResponse(f"{REJECT_MESSAGE} One or more of those images isn't even in the right format.", status_code=400)

    return (req_json, None if not authenticate else req.headers['authorization'].split('.')[0]) # Pass the UUID of the user if authed

def __process_image(image: str) -> dict[str, 'Any']:
    """
    Processes a base64 image passed in and converts it to the PIL image format. Returns that object and it's data
    type in a dictionary.
    """
    # The header of a base64 image is `data:[type];[encoding],[base64-encoded data]`, so we need to split all that out
    metadata, image_data = image[:(comma_index := image.index(','))], image[comma_index+1:] # This is much faster than .split() given the size of this string
    data_type_metadata, encoding = metadata.split(';') # Splitting `data:[type];[encoding]` into `data:[type]` and `[encoding]`
    _, data_type = data_type_metadata.split(':') # Splitting `data:[type]` into the literal string `"data"` and the type
    # Actually open the image in PIL for processing
    img = Image.open(io.BytesIO(base64.b64decode(image_data)))
    return {'img': img, 'type': data_type}