import requests
import os
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

backend_url = os.getenv('backend_url', default="http://localhost:3030")
sentiment_analyzer_url = os.getenv(
    'sentiment_analyzer_url',
    default="http://localhost:5050/"
)

# =========================
# GET REQUEST (SAFE)
# =========================
def get_request(endpoint, **kwargs):
    params = ""

    if kwargs:
        for key, value in kwargs.items():
            params += f"{key}={value}&"

    request_url = backend_url + endpoint + "?" + params

    print(f"GET from {request_url}")

    try:
        response = requests.get(request_url, timeout=10)
        return response.json()

    except Exception as e:
        print(f"GET request failed: {e}")
        return []   # ALWAYS return safe list


# =========================
# SENTIMENT ANALYSIS (SAFE)
# =========================
def analyze_review_sentiments(text):
    if not text:
        return {"sentiment": "neutral"}

    encoded_text = urllib.parse.quote(str(text))
    request_url = sentiment_analyzer_url + "analyze/" + encoded_text

    try:
        response = requests.get(request_url, timeout=10)
        data = response.json()

        if isinstance(data, dict) and "sentiment" in data:
            return data

        return {"sentiment": "neutral"}

    except Exception as e:
        print(f"Sentiment API error: {e}")
        return {"sentiment": "neutral"}


# =========================
# POST REVIEW (SAFE)
# =========================
def post_review(data_dict):
    request_url = backend_url + "/insert_review"

    try:
        response = requests.post(request_url, json=data_dict, timeout=10)
        return response.json()

    except Exception as e:
        print(f"POST request failed: {e}")
        return {"status": 500, "message": "Request failed"}
# add_review in views.py to actually check the result
def add_review(request):
    if(request.user.is_anonymous == False):
        data = json.loads(request.body)
        try:
            response = post_review(data)
            if isinstance(response, dict) and response.get("status") == 500:
                print(f"post_review failed: {response}")
                return JsonResponse({"status": 401, "message": "Error in posting review"})
            return JsonResponse({"status": 200})
        except Exception as e:
            print(f"add_review exception: {e}")
            return JsonResponse({"status": 401, "message": "Error in posting review"})
    else:
        return JsonResponse({"status": 403, "message": "Unauthorized"})