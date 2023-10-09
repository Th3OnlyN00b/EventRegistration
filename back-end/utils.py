from typing import TYPE_CHECKING
import azure.functions as func
from azure.storage.blob import BlobServiceClient
if TYPE_CHECKING: # Neat feature. Will evaluate to false during runtime, always, but allows for using these imports for type hints
    from azure.storage.blob import BlobClient
    from typing import Any
from azure.cosmos import CosmosClient, ContainerProxy
import os

REJECT_MESSAGE = "Stop fucking with my website, jesus christ we're just launching. Chill."

def get_db_container_client(db_name: str, container_name: str) -> ContainerProxy:
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

def validate_contains_required_fields(req: func.HttpRequest, fields: set[str], authenticate=True) -> func.HttpResponse | tuple[dict[str, 'Any'], str | None]:
    """
    Checks to make sure the correct fields are present in the request JSON object, returning an
    error if they are not.

    Parameters
    ------------
    req `func.HttpRequest`: The request to validate\\
    fields `list[str]`: The fields that should be present in `req`\\
    authenticate `bool`: A boolean where, if `True`, checks the validity of the 'Authorization' token in the header.

    Returns
    ------------
    The body dict with corrected values if valid or an `azure.functions.HttpResonse` object if invalid. Status code
    401 for auth-related issues, 400 otherwise.
    """
    from auth.auth_utils import verify_token
    if req.method.lower() == "get":
        print("this is a get method")
        req_json = dict(req.params)
    else:
        req_json: dict = req.get_json()
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
    for field in fields:
        if field not in req_json:
            return func.HttpResponse(f"{REJECT_MESSAGE} You forgot your {field} though.", status_code=400)
    ##### SPECIAL CASES #####
    # Phone numbers should be 10 digits and a phone number. TODO: Support international phone numbers
    if "phone" in fields:
        # Get final ten digits, ignoring country codes, then add the US country code (1) on the front
        req_json["phone"] = ''.join(list(filter(lambda x: x.isdigit(), str(req_json["phone"]))))[-10:]
        if len(req_json["phone"]) != 10:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a phone number.", status_code=400)
        req_json["phone"] = '+1' + req_json["phone"]
    # Names should be at least a single character
    if "name" in fields:
        if len(req_json["name"]) < 1:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a real name.", status_code=400)
    return (req_json, None if not authenticate else req.headers['authorization'].split('.')[0]) # Pass the UUID of the user if authed