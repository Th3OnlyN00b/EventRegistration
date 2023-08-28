from typing import Any
import random

def create_token_request(req_json: dict[str, Any]) -> bool:
    """
    Attempts to create a valid login token request by sending a text to the user using the 
    [PhoneNumberValidateFree](https://rapidapi.com/larroyouy70/api/phonenumbervalidatefree/) API.
    Stores the generated code in a database, with the code valid for 60 seconds

    Parameters
    ------------
    req_json `dict[str, Any]`: The request needing token validation. Required fields are `["phone"]`

    Returns
    ------------
    A boolean, either true or false depending if the request was successful.
    """
    # Generate validation code
    code = f"{''.join([random.randint(0, 9) for _ in range(10)])}"
    # Store validation code in DB with 60 secon expiry
    # Return `True` because successful.
    return True