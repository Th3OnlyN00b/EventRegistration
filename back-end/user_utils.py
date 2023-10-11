from utils import get_db_container_client
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from typing import Literal

def remove_event_from_user(user_id: str, event_id: str, role: Literal["own", "host", "attend"]) -> dict[str, str|bool]:
    """
    Removes an event from a user's profile from the role put in
    """
    events_by_user_table = get_db_container_client('auth', 'events_by_user') # TODO: Change this out of auth once we leave free tier
    old_owner_user_record = events_by_user_table.read_item(user_id, user_id)
    # Add this event to the user's owned list
    i = 0
    while i < len(old_owner_user_record[role]):
        if old_owner_user_record[role][i]['id'] == event_id:
            break
        i += 1
    if i == len(old_owner_user_record[role]):
        # This means someone is trying to access a profile they have no right to access.
        raise Exception("This should absolutely never happen and means that we're having a big breach of security. There is no breach at this time, but fix the damn code!")
    # We now know the index of the item in the old user's list. Time to patch the two of them!
    record = old_owner_user_record[role][i]
    old_owner_user_record[role].remove(i)
    events_by_user_table.upsert_item(old_owner_user_record)
    return record

def add_event_to_user(user_id: str, event_id: str, role: Literal["own", "host", "attend"]):
    pass