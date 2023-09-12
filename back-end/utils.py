from typing import Any
import azure.functions as func
from azure.cosmos import CosmosClient, ContainerProxy
import os
from auth.auth_utils import verify_token

REJECT_MESSAGE = "Stop fucking with my website, jesus christ we're just launching. Chill."

def get_db_container_client(db_name: str, container_name: str) -> ContainerProxy:
    client = CosmosClient.from_connection_string(os.environ['COSMOS_CONNECTION_STRING'])
    database = client.get_database_client(db_name)
    table = database.get_container_client(container_name)
    return table


def validate_contains_required_fields(req: func.HttpRequest, fields: list[str], authenticate=True) -> func.HttpResponse | dict[str, Any]:
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
    The body dict with corrected values if valid or an `azure.functions.HttpResonse` object if invalid.
    """
    fields = set(fields)
    req_json = req.get_json()
    # If needing to auth, do that first.
    if(authenticate):
        if(not verify_token(req.headers['authorization'])):
            # Invalid token
            return func.HttpResponse(None, status_code=401)
    # First check that they all exist
    for field in fields:
        if field not in req_json:
            return func.HttpResponse(f"{REJECT_MESSAGE} You forgot your {field} though.", status_code=400)
    ##### SPECIAL CASES #####
    # Phone numbers should be 10 digits and a phone number. TODO: Support international phone numbers
    if "phone" in fields:
        # Get final ten digits, ignoring country codes.
        req_json["phone"] = ''.join(list(filter(lambda x: x.isdigit(), str(req_json["phone"]))))[-10:]
        if len(req_json["phone"]) != 10:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a phone number.", status_code=400)
    # Names should be at least a single character
    if "name" in fields:
        if len(req_json["name"]) < 1:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a real name.", status_code=400)
    return req_json