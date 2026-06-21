# Django views for dealership app

from django.contrib.auth.models import User
from django.contrib.auth import logout, login, authenticate
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import logging
import json

from .models import CarMake, CarModel
from .populate import initiate
from .restapis import get_request, analyze_review_sentiments, post_review


logger = logging.getLogger(__name__)


def get_cars(request):
    count = CarMake.objects.filter().count()

    if count == 0:
        initiate()

    car_models = CarModel.objects.select_related('car_make')

    cars = []
    for car_model in car_models:
        cars.append({
            "CarModel": car_model.name,
            "CarMake": car_model.car_make.name
        })

    return JsonResponse({"CarModels": cars})


@csrf_exempt
def login_user(request):
    data = json.loads(request.body)

    username = data['userName']
    password = data['password']

    user = authenticate(username=username, password=password)

    response_data = {"userName": username}

    if user is not None:
        login(request, user)
        response_data = {
            "userName": username,
            "status": "Authenticated"
        }

    return JsonResponse(response_data)


def logout_request(request):
    logout(request)
    return JsonResponse({"userName": ""})


@csrf_exempt
def registration(request):
    data = json.loads(request.body)

    username = data['userName']
    password = data['password']
    first_name = data['firstName']
    last_name = data['lastName']
    email = data['email']

    username_exist = False

    try:
        User.objects.get(username=username)
        username_exist = True
    except Exception:
        logger.debug(f"{username} is a new user")

    if not username_exist:
        user = User.objects.create_user(
            username=username,
            first_name=first_name,
            last_name=last_name,
            password=password,
            email=email
        )

        login(request, user)

        return JsonResponse({
            "userName": username,
            "status": "Authenticated"
        })

    return JsonResponse({
        "userName": username,
        "error": "Already Registered"
    })


def get_dealerships(request, state="All"):
    if state == "All":
        endpoint = "/fetchDealers"
    else:
        endpoint = "/fetchDealers/" + state

    dealerships = get_request(endpoint)

    return JsonResponse({
        "status": 200,
        "dealers": dealerships
    })


def get_dealer_reviews(request, dealer_id):
    if not dealer_id:
        return JsonResponse({
            "status": 400,
            "message": "Bad Request: Missing dealer_id"
        })

    try:
        endpoint = "/fetchReviews/dealer/" + str(dealer_id)
        reviews = get_request(endpoint)

        if not isinstance(reviews, list):
            reviews = []

        for review_detail in reviews:
            review_detail['sentiment'] = 'neutral'
            review_text = review_detail.get('review', '')

            if review_text:
                try:
                    response = analyze_review_sentiments(review_text)

                    if response and isinstance(response, dict):
                        review_detail['sentiment'] = response.get(
                            'sentiment',
                            'neutral'
                        )

                except Exception as e:
                    print(f"Sentiment error: {e}")
                    review_detail['sentiment'] = 'neutral'

        return JsonResponse({
            "status": 200,
            "reviews": reviews
        })

    except Exception as e:
        print(f"Dealer reviews error: {e}")
        return JsonResponse({
            "status": 500,
            "message": "Internal Server Error",
            "reviews": []
        })


def get_dealer_details(request, dealer_id):
    if dealer_id:
        endpoint = "/fetchDealer/" + str(dealer_id)
        dealership = get_request(endpoint)

        return JsonResponse({
            "status": 200,
            "dealer": dealership
        })

    return JsonResponse({
        "status": 400,
        "message": "Bad Request"
    })


def add_review(request):
    if not request.user.is_anonymous:
        data = json.loads(request.body)

        try:
            response = post_review(data)

            if isinstance(response, dict) and response.get("status") == 500:
                print(f"post_review failed: {response}")
                return JsonResponse({
                    "status": 401,
                    "message": "Error in posting review"
                })

            return JsonResponse({"status": 200})

        except Exception as e:
            print(f"add_review exception: {e}")
            return JsonResponse({
                "status": 401,
                "message": "Error in posting review"
            })

    return JsonResponse({
        "status": 403,
        "message": "Unauthorized"
    })
