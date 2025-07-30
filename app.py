from flask import Flask, render_template, jsonify, request, url_for
from models import URL, Settings
from config import get_db_connection
from clipboard_monitor import clip_monitor
import threading

app = Flask(__name__, static_url_path='/static', static_folder='static')
conn = get_db_connection()

_is_tables_created = False

@app.before_request
def create_tables():
    global _is_tables_created
    if not _is_tables_created:
        URL.create_table(conn)
        _is_tables_created = True

@app.route('/')
def index():
    # Don't fetch URLs here as they'll be loaded via AJAX
    return render_template('index.html')

@app.after_request
def add_cors_headers(response):
    """Add CORS headers to all responses"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'GET, PUT, POST, DELETE'
    # Prevent caching of API responses
    if request.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
    return response

@app.route('/api/urls', methods=['GET'])
def get_urls():
    try:
        app.logger.info("Fetching URLs from database")
        urls = URL.get_all(conn)
        app.logger.info(f"Successfully fetched {len(urls)} URLs")
        # Add proper content type header and ensure serializable response
        return jsonify(urls), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        app.logger.error(f"Error fetching URLs: {str(e)}")
        return jsonify({'error': 'Failed to fetch URLs', 'details': str(e)}), 500

@app.route('/api/urls', methods=['DELETE'])
def delete_url():
    id = request.json.get('id')
    if id:
        success = URL.delete(conn, id)
        return jsonify({'success': success})
    return jsonify({'success': False}), 400

@app.route('/api/urls', methods=['PUT'])
def update_url():
    data = request.json
    URL.update(conn, data['id'], data['title'], data['thumbnail'])
    return jsonify({'status': 'success'})

@app.route('/api/updateVisit', methods=['POST'])
def update_visit():
    data = request.json
    URL.update_visit(conn, data['id'])
    return jsonify({'status': 'success'})

@app.route('/api/settings', methods=['GET'])
def get_settings():
    try:
        settings = Settings.get_all(conn)
        return jsonify(settings), 200, {'Content-Type': 'application/json'}
    except Exception as e:
        app.logger.error(f"Error fetching settings: {str(e)}")
        return jsonify({'error': 'Failed to fetch settings', 'details': str(e)}), 500

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    try:
        data = request.json
        for key, value in data.items():
            Settings.update(conn, key, str(value))
        return jsonify({'status': 'success'})
    except Exception as e:
        app.logger.error(f"Error updating settings: {str(e)}")
        return jsonify({'error': 'Failed to update settings', 'details': str(e)}), 500

def run_clip_monitor():
    clip_monitor()

if __name__ == '__main__':
    monitor_thread = threading.Thread(target=run_clip_monitor, daemon=True)
    monitor_thread.start()
    app.run(debug=True)
