from typing import Any
import logging
import azure.functions as func
from utils import validate_contains_required_fields, get_db_container_client
from user_utils import Role
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
from user_utils import get_or_create_user
import time
import hashlib
import secrets
import json
from azure.cosmos.exceptions import CosmosHttpResponseError, CosmosResourceNotFoundError

def create_token_request(req: func.HttpRequest) -> func.HttpResponse:
    """
    Attempts to create a valid login token request by sending a text to the user using the 
    [Twilio](https://github.com/TwilioDevEd/api-snippets/blob/master/quickstart/python/sms/example-1/send_notifications.8.x.py)
    API. Stores the generated code in a database, with the code valid for 90 seconds

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
    # code = str(secrets.randbelow(1000000)).zfill(6) # TODO: Uncomment this once it becomes time to really use SMS
    code = "123456" # TODO: delete this once it becomes time to really use SMS
    phone = req_json["phone"]
    # Store validation code in DB with 90 second expiry
    code_table = get_db_container_client("auth", "phone_code")
    # Time to live has already been set to 90 seconds, so we are good on that.
    try:
        # Note that we're hashing the code using the phone number as an interloped salt. This is to prevent any issues if this database is compromised.
        code_table.create_item({'id': phone, 'code': __hash(code, phone)})
    except CosmosHttpResponseError:
        # This may happen in a 1 in (literally) a million chance
        return func.HttpResponse(json.dumps({'code': 'duplicate', 'message': "Code already exists for this number! Please try again."}), status_code=500)
    # try: # TODO: Uncomment this once it becomes time to really use SMS
    #     twilio_client = Client(constants.TEXTING_API['account_sid'], constants.TEXTING_API['auth_token'])
    #     message = twilio_client.messages.create(
    #         body=f'{code} is your one-time verification code from {constants.PLATFORM_NAME}',
    #         to=phone,
    #         from_=constants.TEXTING_API['outgoing_number']
    #     )
    #     logging.info(f"Text message sent to {req_json['phone']}")
    # except TwilioRestException as e:
    #     logging.info("Failed to send Twilio error. If you're seeing a lot of this message, it's likely that Twilio has gone down.")
    #     return func.HttpResponse(json.dumps({'code': 'twilio', 'message': "Twilio has experienced a failure. Please try again."}), status_code=500)
    # # Return `200` because successful.
    return func.HttpResponse(json.dumps({'code': 'success', 'message': "Code sent successfully"}), status_code=200)

# create_token({'phone': "7816368946", 'code': '123456'})
def create_token(req: func.HttpRequest) -> func.HttpResponse:
    """
    Attempts to create a valid login token verifying a code sent in a text to the user using the 
    [Twilio](https://github.com/TwilioDevEd/api-snippets/blob/master/quickstart/python/sms/example-1/send_notifications.8.x.py)
    API. Checks the stored code in a database, and if correct will send back a session token.

    Parameters
    ------------
    req `func.HttpRequest`: The request needing token validation. Required body fields are `["phone", "code"]`

    Returns
    ------------
    A `func.HttpResponse`, denoting the success or failure of this token creation. If successful, will include
    `'Set-Cookie'` headers with the token and user id.
    """
    # Check validation code
    validation = validate_contains_required_fields(req, set(['phone', 'code']), authenticate=False)
    if type(validation) == func.HttpResponse:
        return validation
    # For static type checking
    assert type(validation) == tuple
    req_json, _ = validation
    uuid = get_or_create_user(req_json["phone"])
    # Connect to DB
    phone_code_table = get_db_container_client("auth", "phone_code")
    # Read validation code stored in DB
    try:
        # Given that the phone is the id and the code is the partition key, this will only work if the code is correct
        phone_code_table.read_item(req_json['phone'], __hash(req_json['code'], req_json['phone']))
    except CosmosHttpResponseError:
        # If the id is invalid, the code was deleted.
        return func.HttpResponse(json.dumps({'code': 'wrong', 'message': "Code timed out or is incorrect"}), status_code=403)
    # At this point the code is right. We have to generate a token and store it in the database.
    session_tokens_table = get_db_container_client("auth", "session_tokens")
    token = secrets.token_hex(128)
    try:
        session_tokens_table.create_item({'id': uuid, 'token': token, 'last_used': time.time()})
    except CosmosHttpResponseError:
        # This is a 1 in ~1.08928894*(10^308) chance that the randomly genrated tokens are identical. This would be simply insane.
        return func.HttpResponse(json.dumps({'code': 'holyshit', 'message': "Go buy a lottery ticket."}), status_code=500)
    # The code is valid and a token has been inserted. Return the token to the user
    response = func.HttpResponse(json.dumps({'code': 'success', 'message': "User logged in"}), status_code=200)
    # Headers have to be added by this method as the default is a dict, which doesn't work because dict keys are unique
    response.headers.add("Set-Cookie", f"token={token}")
    response.headers.add("Set-Cookie", f"id={uuid}")
    return response

def verify_token(token_str: str) -> bool:
    # Fist extract the phone and token from the token string.
    try: # TODO remove after bugfix
        uuid, token = token_str.split('.')
        # Next, get the client for the token table
        session_tokens_table = get_db_container_client("auth", "session_tokens")
    except Exception as e:
        logging.info(token_str)
        logging.info(e)
        raise
    # Check to ensure validity
    try:
        # Try to update the 'last_used' field. Allows atomic database usage, and a single (cheap) operation.
        session_tokens_table.patch_item(item=uuid, partition_key=token, patch_operations=[{'op': 'replace', 'path': '/last_used', 'value': time.time()}])
        # If this succeeds, the token is vailid
        return True
    except CosmosResourceNotFoundError:
        # If this fails, the token is invalid
        return False


########### HELPER FUNCITONS BELOW ##############
def __hash(code: str, phone: str) -> str:
    """
    Creates a secure sha256 hash from the code and phone number passed in. This prevents us from
    storing specific codes in raw form, and makes it much harder for an attacker to use any information
    obtained from a database leak.

    Parameters
    -----------
    code `str`: The numeric code to be hashed, in string format.\\
    phone `str`: The phone number this code is associated with, in string format.

    Returns
    -----------
    A string representing the hex-code version of the sha256 hash. 
    """
    return hashlib.sha256(bytes(phone[:4] + code + phone[2:-1], encoding='utf-8')).hexdigest()

########### HELPER EXCEPTIONS BELOW #############
class NoPermissionException(Exception):
    """
    Raised when a requested action requires permissions the user does not have.

    Attributes
    -----------
    requires `Role`: The minimum role required
    """

    def __init__(self, requires: Role, has: Role) -> None:
        self.requires = requires
        self.message = f"The requested action requires one of the following roles: {Role.roles_above_and_including(requires)} but has {has.name}"
        super().__init__()

class PrivateEventException(Exception):
    """
    Raised when information about a private event the user was not invited to is requested
    """

    def __init__(self) -> None:
        self.message = "This event is private and requires an invite."
        super().__init__()