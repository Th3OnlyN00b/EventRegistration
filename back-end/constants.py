import os
TEXTING_API = {
    'url': "https://phonenumbervalidatefree.p.rapidapi.com/ts_PhoneNumberValidateTest.jsp",
    'headers': {
        "X-RapidAPI-Key": os.environ['TEXTING_API_KEY'],
        "X-RapidAPI-Host": "phonenumbervalidatefree.p.rapidapi.com"
    },
    'querystring': {"number":"+59894887799","country":"UY"}

}