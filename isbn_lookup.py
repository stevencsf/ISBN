import argparse
import requests
import json
import sys

def is_valid_isbn_format(isbn_string):
    """
    Checks if the ISBN string has a basic valid format (10 or 13 digits, optional hyphens).
    """
    normalized_isbn = isbn_string.replace("-", "")
    if not normalized_isbn.isdigit():
        return False
    return len(normalized_isbn) in (10, 13)

def fetch_book_data(isbn):
    """
    Fetches book data from the Open Library API.
    """
    url = f"https://openlibrary.org/isbn/{isbn}.json"
    try:
        response = requests.get(url, timeout=10) # Added timeout
        response.raise_for_status()  # Raise an exception for non-200 status codes
        
        # Check for empty response, which can happen for some invalid ISBNs
        if not response.text:
             print(f"Error: ISBN {isbn} not found or API returned an empty response.")
             return None
        
        data = response.json()
        
        # OpenLibrary sometimes returns an error field for not found ISBNs even with 200 OK
        if isinstance(data, dict) and data.get("error") == "notfound":
            print(f"Error: ISBN {isbn} not found.")
            return None
        # Also handle cases where data might be an empty dict or list for a "found but no data" scenario
        if not data: 
            print(f"Error: ISBN {isbn} not found or no data available.")
            return None
            
        return data
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"Error: ISBN {isbn} not found (404 error).")
        else:
            print(f"Error: API request failed with status {e.response.status_code}: {e}")
        return None
    except requests.exceptions.Timeout:
        print(f"Error: Request to Open Library API timed out accessing {url}")
        return None
    except requests.exceptions.RequestException as e:
        print(f"Error: Could not connect to Open Library API: {e}")
        return None
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON response from {url}. The response might not be valid JSON.")
        return None

def display_book_info(data):
    """
    Displays book information from the parsed JSON data.
    """
    if not data:
        print("No data to display.")
        return

    title = data.get("title", "Not available")
    
    authors_data = data.get("authors")
    if authors_data:
        # The authors field can sometimes be a list of objects with a 'key'
        # or sometimes a list of strings directly if fetched via a different endpoint
        # For /isbn/{isbn}.json, it's usually like [{'key': '/authors/OL...'}], 
        # but the actual author names are not directly in this response.
        # We'd typically need another call to get author names from these keys.
        # For this exercise, we'll assume author names might be in a simpler format if present,
        # or we'll have to state that direct author names are not in this specific ISBN response.
        # A more robust solution would fetch author details using the keys.
        
        # Let's check if 'name' is available directly, which is not typical for this endpoint
        author_names = [author.get("name") for author in authors_data if author.get("name")]
        if not author_names:
            # If names are not directly available, we list their keys or a generic message
            author_keys = [author.get("key") for author in authors_data if author.get("key")]
            if author_keys:
                authors = f"Author keys: {', '.join(author_keys)} (Further lookup needed for names)"
            else:
                authors = "Not available"
        else:
            authors = ", ".join(author_names)
    else:
        authors = "Not available"

    publish_date = data.get("publish_date", "Not available")
    number_of_pages = data.get("number_of_pages", "Not available")
    
    # Sometimes publisher info is more readily available
    publishers = data.get("publishers")
    if publishers:
        publishers_str = ", ".join(publishers)
    else:
        publishers_str = "Not available"

    print(f"Title: {title}")
    print(f"Author(s): {authors}")
    print(f"Publish Date: {publish_date}")
    print(f"Number of Pages: {number_of_pages}")
    print(f"Publishers: {publishers_str}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Look up book information by ISBN.")
    parser.add_argument("isbn", help="The ISBN of the book to look up (10 or 13 digits).")
    args = parser.parse_args()

    if not is_valid_isbn_format(args.isbn):
        print(f"Error: Invalid ISBN format: '{args.isbn}'. Please provide a 10 or 13 digit ISBN, hyphens are allowed.")
        sys.exit(1)

    # Normalize ISBN by removing hyphens for API call
    normalized_isbn_arg = args.isbn.replace("-", "")
    # Pass the original ISBN for display in messages, and normalized for API
    handle_isbn_lookup(normalized_isbn_arg, args.isbn)

def handle_isbn_lookup(normalized_isbn, original_isbn_for_display):
    """
    Handles the fetching and display of book data.
    Returns True on success, False on failure to fetch/display.
    """
    book_data = fetch_book_data(normalized_isbn)

    if book_data:
        if isinstance(book_data, dict) and book_data.get("type") == "/type/redirect" and book_data.get("location"):
            print(f"Information for ISBN {original_isbn_for_display} has been redirected. You may need to look up: {book_data['location']}")
            return True # Or False, depending on if redirect is considered a "success" for this function's contract
        elif isinstance(book_data, dict) and book_data.get("title"):
            display_book_info(book_data)
            return True
        else:
            print(f"No displayable information found for ISBN {original_isbn_for_display}, or the response was not structured as expected book data.")
            return False
    else:
        # Error messages are now primarily handled within fetch_book_data
        print(f"Failed to retrieve book data for ISBN {original_isbn_for_display}.")
        # Removed sys.exit(1) from here to make it testable without exiting tests
        return False
    if not handle_isbn_lookup(normalized_isbn_arg, args.isbn):
        sys.exit(1)
