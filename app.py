from flask import Flask, render_template, jsonify, request, url_for
from models import URL
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
    urls = URL.get_all(conn)
    return render_template('index.html', urls=urls)

@app.route('/api/urls', methods=['GET'])
def get_urls():
    urls = URL.get_all(conn)
    return jsonify(urls)

@app.route('/api/urls', methods=['DELETE'])
def delete_url():
    url = request.json.get('url')
    if url:
        URL.delete(conn, url)
        return jsonify({'success': True})
    return jsonify({'success': False}), 400

@app.route('/api/urls', methods=['PUT'])
def update_url():
    data = request.json
    URL.update(conn, data['url'], data['title'], data['thumbnail'])
    return jsonify({'status': 'success'})

def run_clip_monitor():
    clip_monitor()

if __name__ == '__main__':
    monitor_thread = threading.Thread(target=run_clip_monitor, daemon=True)
    monitor_thread.start()
    app.run(debug=True)
