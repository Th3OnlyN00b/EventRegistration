from typing import Any
import azure.functions as func
from utils import validate_contains_required_fields, get_db_container_client
import random
import time
import uuid as uuid_package
import secrets
import json
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceNotFoundError
from azure.cosmos.partition_key import NonePartitionKeyValue

def create_token_request(req: func.HttpRequest) -> func.HttpResponse:
    """
    Attempts to create a valid login token request by sending a text to the user using the 
    [PhoneNumberValidateFree](https://rapidapi.com/larroyouy70/api/phonenumbervalidatefree/) API.
    Stores the generated code in a database, with the code valid for 90 seconds

    Parameters
    ------------
    req `func.HttpRequest`: The request needing token validation. Required fields are `["phone"]`

    Returns
    ------------
    An `func.HttpResponse`, denoting the success or failure of this code creation.
    """
    # Validate req_json using utils
    validation = validate_contains_required_fields(req, set(['phone']), authenticate=False)
    if type(validation) == func.HttpResponse:
        return validation
    # For static type checking
    assert type(validation) == tuple
    req_json, _ = validation
    # Generate validation code
    code = str(secrets.randbelow(1000000)).zfill(6)
    # Store validation code in DB with 90 second expiry
    code_table = get_db_container_client("auth", "phone_code")
    # Time to live has already been set to 90 seconds, so we are good on that.
    try:
        code_table.create_item({'id': req_json["phone"], 'code': code})
    except CosmosHttpResponseError:
        # This may happen in a 1 in a million chance
        return func.HttpResponse(json.dumps({'code': 'Code already exists for this number!', 'message': "Please try again."}), status_code=500)
    # Return `True` because successful.
    return func.HttpResponse("hello", status_code=200)

# create_token({'phone': "7816368946", 'code': '123456'})
def create_token(req: func.HttpRequest) -> func.HttpResponse:
    """
    Attempts to create a valid login token verifying a code sent in a text to the user using the 
    [PhoneNumberValidateFree](https://rapidapi.com/larroyouy70/api/phonenumbervalidatefree/) API.
    Checks the stored code in a database, and if correct will send back a session token.

    Parameters
    ------------
    req `func.HttpRequest`: The request needing token validation. Required body fields are `["phone", "code"]`

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include a
    `'Set-Cookie'` header with the token.
    """
    # Check validation code
    validation = validate_contains_required_fields(req, set(['phone', 'code']), authenticate=False)
    if type(validation) == func.HttpResponse:
        return validation
    # For static type checking
    assert type(validation) == tuple
    req_json, _ = validation
    # Get the user ID so we're storing the IDs instead of the phone #
    id_table = get_db_container_client("auth", "ids") # TODO: Change this from the 'auth' database once we leave Azure free tier
    try:
        uuid = id_table.read_item(req_json['phone'], NonePartitionKeyValue)['uuid']
    except CosmosHttpResponseError:
        # If it doesn't exist yet, make it.
        uuid = str(uuid_package.uuid4())
        id_table.create_item({'id': req_json['phone'], 'uuid': uuid})
    # Connect to DB
    phone_code_table = get_db_container_client("auth", "phone_code")
    # Read validation code stored in DB
    try:
        phone_code_table.read_item(req_json['phone'], req_json['code'])
    except CosmosHttpResponseError:
        # If the id is invalid, the code was deleted.
        return func.HttpResponse(json.dumps({'code': 'wrong', 'message': "Code timed out or is incorrect"}), status_code=403)
    # At this point the code is right. We have to generate a token and store it in the database.
    session_tokens_table = get_db_container_client("auth", "session_tokens")
    token = secrets.token_bytes(128).decode('UTF-8')
    try:
        session_tokens_table.create_item({'id': uuid, 'token': token, 'last_used': time.time()})
    except CosmosHttpResponseError:
        # This is a 1 in ~1.08928894*(10^308) chance that the randomly genrated tokens are identical. This would be simply insane.
        return func.HttpResponse(json.dumps({'code': 'holyshit', 'message': "Go buy a lottery ticket."}), status_code=500)
    # The code is valid and a token has been inserted. Return the token to the user
    return func.HttpResponse(json.dumps({'code': 'success', 'message': "User logged in"}), status_code=200, headers={
        'Set-Cookie': f"token={token}",
        'Set-Cookie': f"id={uuid}"
    })

def verify_token(token_str: str) -> bool:
    # Fist extract the phone and token from the token string.
    uuid, token = token_str.split('.')
    # Next, get the client for the token table
    session_tokens_table = get_db_container_client("auth", "session_tokens")
    try:
        # Try to update the 'last_used' field. Allows atomic database usage, and a single (cheap) operation.
        session_tokens_table.patch_item(item=uuid, partition_key=token, patch_operations=[{'op': 'replace', 'path': '/last_used', 'value': time.time()}])
        # If this succeeds, the token is vailid
        return True
    except CosmosResourceNotFoundError:
        # If this fails, the token is invalid
        return False