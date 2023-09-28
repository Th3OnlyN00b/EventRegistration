# TODO: (Potentially) rename this file later

import azure.functions as func
import uuid
import json
from utils import validate_contains_required_fields

def create_event(req: func.HttpRequest) -> func.HttpResponse:
    """
    Creates an event structure via the JSON in the "event" field and stores it in the database.
    First checks authentication to ensure identity of user creating event.\\
    *Requires authentication*

    Parameters
    ------------ 
    req `func.HttpRequest`: The request needing token validation. Required fields are `["event"]`

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
    return func.HttpResponse(json.dumps({'code': 'NYI', 'message': "Not yet implemented"}), status_code=501)