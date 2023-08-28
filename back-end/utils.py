from typing import Any
import azure.functions as func

REJECT_MESSAGE = "Stop fucking with my website, jesus christ we're just launching. Chill."


def validate_contains_required_fields(req_json: dict[str, Any], fields: list[str]) -> func.HttpResponse | dict[str, Any]:
    """
    Checks to make sure the correct fields are present in the request JSON object, returning an
    error if they are not.

    Parameters
    ------------
    req_json `dict[str, Any]`: The request to validate
    fields `list[str]`: The fields that should be present in `req_json`

    Returns
    ------------
    The original dict with corrected values if valid or an `azure.functions.HttpResonse` object if invalid.
    """
    fields = set(fields)
    # First check that they all exist
    for field in fields:
        if field not in req_json:
            return func.HttpResponse(f"{REJECT_MESSAGE} You forgot your {field} though.", status_code=403)
    ##### SPECIAL CASES #####
    # Phone numbers should be 10 digits and a phone number. TODO: Support international phone numbers
    if "phone" in fields:
        # Get final ten digits, ignoring country codes.
        req_json["phone"] = ''.join(list(filter(lambda x: x.isdigit(), str(req_json["phone"]))))[-10:]
        if len(req_json["phone"]) != 10:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a phone number.", status_code=403)
    # Names should be at least a single character
    if "name" in fields:
        if len(req_json["name"]) < 1:
            return func.HttpResponse(f"{REJECT_MESSAGE} That's not even a real name.", status_code=403)