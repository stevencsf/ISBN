export const runtime = 'edge';

import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { isbn } = params;

  // Basic ISBN validation (string of digits, length 10 or 13)
  if (!/^\d{10}$|^\d{13}$/.test(isbn)) {
    return NextResponse.json({ error: 'Invalid ISBN format. Must be 10 or 13 digits.' }, { status: 400 });
  }

  const apiUrl = `https://openlibrary.org/isbn/${isbn}.json`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: `ISBN ${isbn} not found on Open Library.` }, { status: 404 });
      }
      return NextResponse.json({ error: `Open Library API error: ${response.statusText}` }, { status: response.status });
    }

    // Check if the response is empty
    const responseText = await response.text();
    if (!responseText) {
      return NextResponse.json({ error: 'Empty response from Open Library API.' }, { status: 500 });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse JSON response from Open Library API.' }, { status: 500 });
    }

    // Check for Open Library specific error format (though usually caught by 404)
    if (data && data.error && data.error === "notfound") {
      return NextResponse.json({ error: `ISBN ${isbn} not found on Open Library (API specific error).` }, { status: 404 });
    }
    
    // If the API returns an empty object for a non-existent ISBN (which it sometimes does instead of 404)
    if (Object.keys(data).length === 0 && !data.type && !data.see_also) { // Ensure it's not a redirect object
        return NextResponse.json({ error: `ISBN ${isbn} not found or no data available.` }, { status: 404 });
    }

    // Handle Open Library redirect responses
    // Example: {"type": {"key": "/type/redirect"}, "location": "/books/OL12345M"}
    // Example: {"see_also": ["/books/OL12345M"]} (less common for direct ISBN queries)
    if (data.type && data.type.key === "/type/redirect" && data.location) {
      return NextResponse.json({ 
        error: "ISBN Redirected",
        message: `The ISBN ${isbn} has been redirected. Try looking up the new location.`,
        location: data.location 
      }, { status: 404 }); // 404 because the original ISBN isn't directly found
    }
    // A more generic see_also check, usually for works/authors, but could appear
    if (data.see_also && Array.isArray(data.see_also) && data.see_also.length > 0) {
      return NextResponse.json({
        error: "Resource Moved or Merged",
        message: `The resource related to ISBN ${isbn} has been moved or merged. See 'location' for details.`,
        location: data.see_also[0]
      }, { status: 404 });
    }

    // If it's not a known error, not empty, and not a redirect, assume it's book data
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    // Network errors or other fetch-related issues
    console.error('Fetch error:', error); // console.error is available in Edge Runtime
    return NextResponse.json({ error: 'Failed to fetch data from Open Library API. Check network connectivity.' }, { status: 500 });
  }
}
