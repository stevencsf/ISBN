# ISBN Book Lookup Tool

## Description

This script is a command-line tool that allows you to fetch detailed information about a book by providing its ISBN (International Standard Book Number). It queries the Open Library Books API to retrieve data such as title, author(s), publication date, number of pages, and publishers.

## Prerequisites

*   Python 3 (tested with Python 3.8+)
*   The `requests` library for making HTTP requests.

## Setup Instructions

It is highly recommended to use a virtual environment to manage dependencies for this project.

1.  **Create a virtual environment:**
    Open your terminal or command prompt, navigate to the project directory, and run:
    ```bash
    python3 -m venv venv
    ```
    (On Windows, you might use `python -m venv venv`)

2.  **Activate the virtual environment:**
    *   On macOS and Linux:
        ```bash
        source venv/bin/activate
        ```
    *   On Windows (Git Bash or PowerShell):
        ```bash
        source venv/Scripts/activate
        ```
    *   On Windows (Command Prompt):
        ```bash
        venv\Scripts\activate.bat
        ```
    Your prompt should change to indicate that the virtual environment is active.

3.  **Install dependencies:**
    With the virtual environment active, install the required packages using the `requirements.txt` file:
    ```bash
    pip install -r requirements.txt
    ```

## Usage Instructions

Once the setup is complete, you can run the script from the command line:

```bash
python isbn_lookup.py <ISBN_NUMBER>
```

Replace `<ISBN_NUMBER>` with the 10-digit or 13-digit ISBN of the book you want to look up. Hyphens in the ISBN are allowed.

**Example:**

To look up information for "Fantastic Mr. Fox" (ISBN: 9780140328721), you would run:

```bash
python isbn_lookup.py 9780140328721
```

Or with hyphens:

```bash
python isbn_lookup.py 978-0-140-32872-1
```

## Output Description

The script will print the following information for the queried ISBN, if available:

*   **Title:** The title of the book.
*   **Author(s):** The author(s) of the book. Note that the Open Library API might return author keys/IDs (e.g., `/authors/OLXXXXXA`) for ISBN lookups, which means further lookups would be needed to get the full author names. The script will indicate this if applicable.
*   **Publish Date:** The publication date of the book.
*   **Number of Pages:** The total number of pages.
*   **Publishers:** The publisher(s) of the book.

If any piece of information is not available from the API, it will be marked as "Not available".

## Error Handling

The script includes error handling for various situations:

*   **Invalid ISBN Format:** If the provided ISBN is not a valid 10 or 13-digit number.
*   **ISBN Not Found:** If the book corresponding to the ISBN cannot be found in the Open Library database.
*   **API Issues:** If there are problems connecting to the Open Library API (e.g., network errors, timeouts, server errors).
*   **Data Parsing Issues:** If the data received from the API cannot be processed correctly.

In case of an error, the script will print an informative message to the console.
