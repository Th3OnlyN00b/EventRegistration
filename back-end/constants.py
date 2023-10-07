import os
import string
# What is our product named (display name)
PLATFORM_NAME = "Untitled Event Planner"
# What alphabet should url-safe random values be pulled from
ALPHABET = string.ascii_lowercase + string.digits
# How many times should we try to regenerate a random ID if it has a collision
MAX_RANDOM_RETRIES_EVENTS = 5
# Some information for the texting API (currently Twilio)
TEXTING_API = {
    'account_sid': "ACe5273252a62a877177ef449eeed79d20", # Twilio API account ID
    'auth_token': os.environ["TWILIO_AUTH_TOKEN"], # Twilio's API token. Stored as a env variable
    'outgoing_number': '+18444201362' # The number from which all outgoing texts are sent from
}