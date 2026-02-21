from flask import Blueprint, request, jsonify
from middleware import token_required
import urllib.request
import urllib.parse
import json
import ssl
import os

google_books_bp = Blueprint('google_books', __name__)

GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'


@google_books_bp.route('/search', methods=['GET'])
@token_required
def search_books(current_user):
    query = request.args.get('q', '').strip()

    if not query:
        return jsonify({
            'status': 'success',
            'data': []
        }), 200

    if len(query) < 2:
        return jsonify({
            'status': 'success',
            'data': []
        }), 200

    try:
        # Build URL with query parameters
                # Build params
        param_dict = {
            'q': query,
            'maxResults': 10,
            'printType': 'books',
            'orderBy': 'relevance',
        }

        # Add API key if available
        api_key = os.environ.get('GOOGLE_BOOKS_API_KEY', '')
        if api_key:
            param_dict['key'] = api_key

        params = urllib.parse.urlencode(param_dict)
        url = f'{GOOGLE_BOOKS_API}?{params}'

        print(f"🔍 Searching Google Books: {url}")

        # Create SSL context (fixes macOS SSL issues)
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE

        # Make request
        req = urllib.request.Request(
            url,
            headers={'User-Agent': 'Mozilla/5.0'}
        )
        response = urllib.request.urlopen(req, context=ssl_context, timeout=10)
        raw_data = response.read().decode('utf-8')
        data = json.loads(raw_data)

        print(f"✅ Google Books returned {data.get('totalItems', 0)} results")

        books = []
        items = data.get('items', [])

        for item in items:
            volume_info = item.get('volumeInfo', {})

            # Get title
            title = volume_info.get('title', '')
            if not title:
                continue

            # Get authors
            authors = volume_info.get('authors', [])
            author = ', '.join(authors) if authors else 'Unknown Author'

            # Get cover image
            image_links = volume_info.get('imageLinks', {})
            cover_image = (
                image_links.get('thumbnail', '') or
                image_links.get('smallThumbnail', '')
            )

            # Convert http to https
            if cover_image and cover_image.startswith('http://'):
                cover_image = cover_image.replace('http://', 'https://')

            # Get genre/categories
            categories = volume_info.get('categories', [])
            genre = categories[0] if categories else 'General'

            # Get published date
            published_date = volume_info.get('publishedDate', '')

            # Get ISBN
            identifiers = volume_info.get('industryIdentifiers', [])
            isbn = ''
            for identifier in identifiers:
                if identifier.get('type') == 'ISBN_13':
                    isbn = identifier.get('identifier', '')
                    break
                elif identifier.get('type') == 'ISBN_10':
                    isbn = identifier.get('identifier', '')

            books.append({
                'google_id': item.get('id', ''),
                'title': title,
                'author': author,
                'cover_image': cover_image,
                'genre': genre,
                'published_date': published_date,
                'isbn': isbn,
            })

        return jsonify({
            'status': 'success',
            'data': books,
            'total': len(books)
        }), 200

    except urllib.error.HTTPError as e:
        print(f"❌ HTTP Error: {e.code} - {e.reason}")
        return jsonify({
            'status': 'error',
            'error': f'Google Books API error: {e.code}',
            'data': []
        }), 200

    except urllib.error.URLError as e:
        print(f"❌ URL Error: {e.reason}")
        return jsonify({
            'status': 'error',
            'error': f'Connection error: {e.reason}',
            'data': []
        }), 200

    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'data': []
        }), 200