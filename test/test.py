import os
import requests
from dotenv import load_dotenv

load_dotenv() # Load .env file if you're using one

SERPAPI_KEY = "e07f47762b7619935d3430ec0f773293594d492e6bee123b6267bc13f88d7dde"

print(f"Using SerpAPI Key: {SERPAPI_KEY}")

if not SERPAPI_KEY:
    print("Error: SERPAPI_KEY environment variable not set.")
else:
    query = "python programming"
    params = {
        "q": query,
        "api_key": SERPAPI_KEY,
        "engine": "google",
    }
    try:
        print(f"Making request to SerpAPI with query: {query}")
        response = requests.get("https://serpapi.com/search", params=params, timeout=10) # Added timeout
        response.raise_for_status() # Will raise an HTTPError for bad responses (4XX or 5XX)
        print("SerpAPI Request Successful!")
        print("Status Code:", response.status_code)
        data = response.json()
        if "organic_results" in data and data["organic_results"]:
            print("First result title:", data["organic_results"][0].get("title"))
        else:
            print("No organic results found or unexpected response structure.")
            print("Full response data:", data)

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        print(f"Response content: {response.content}")
    except requests.exceptions.ConnectionError as conn_err:
        print(f"Connection error occurred: {conn_err}")
    except requests.exceptions.Timeout as timeout_err:
        print(f"Timeout error occurred: {timeout_err}")
    except requests.exceptions.RequestException as req_err:
        print(f"An error occurred with the request: {req_err}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
