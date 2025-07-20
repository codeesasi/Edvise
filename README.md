<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/codeesasi/Edvise">
    <img src="static/logo.jpg" alt="Logo" width="300" height="300">
  </a>

  <h1 align="center">Edvise</h1>

  <p align="center">
    A smart educational advisory platform that connects students with personalized learning resources
    <br />
    <a href="documentation.html"><strong>View Documentation »</strong></a>
    <br />
    <br />
    <a href="https://github.com/codeesasi/Edvise/issues">Report Bug</a>
    ·
    <a href="https://github.com/codeesasi/Edvise/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#Documetation">Documentation</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->
## About The Project

Edvise is an innovative educational advisory platform designed to bridge the gap between students and quality educational resources. Using advanced algorithms and personalized recommendations, Edvise helps students:

* Find learning materials tailored to their specific learning style and pace
* Connect with tutors and educators who match their educational needs
* Track progress and receive adaptive learning paths based on performance
* Access a curated library of resources from trusted educational sources

Our mission is to democratize quality education by making personalized learning accessible to everyone, regardless of their location or background.

### Built-With

* [React.js](https://reactjs.org/) - Frontend UI library
* [Python](https://www.python.org/) - Backend programming language
* [Flask](https://flask.palletsprojects.com/) - Python web framework
* [PostgreSQL](https://www.postgresql.org/) - Relational database
* [MongoDB](https://www.mongodb.com/docs/manual/installation/) - Unstructured database

<!-- GETTING STARTED -->
## Getting Started

To get Edvise running locally, follow these simple steps.

### Prerequisites

* Python 3.8+ and pip
  ```sh
  python -m pip install --upgrade pip
  ```
* MongoDB database
* PostgreSQL database

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/codeesasi/Edvise.git

2. Set up backend (Flask)
   ```sh
   cd Edvise/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Initialize the database
   ```sh
   Download MangoDB : https://www.mongodb.com/docs/manual/installation/
   Download PostgreSQL : https://www.postgresql.org/download/
   ```

<!-- USAGE EXAMPLES -->
## Usage

Edvise offers a variety of features to enhance the educational experience:

See the [open issues](https://github.com/codeesasi/issues) for a list of proposed features and known issues.

<!-- CONTRIBUTING -->
## Contributing

We welcome contributions to improve Edvise! Please follow these simple steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request


<!-- Documentation -->
## Documentation

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edvise - Documentation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .header {
            background-color: #0d6efd;
            color: white;
            padding: 2rem 0;
            margin-bottom: 2rem;
        }
        pre {
            background-color: #f8f9fa;
            padding: 1rem;
            border-radius: 4px;
            overflow: auto;
        }
        .section {
            margin-bottom: 3rem;
        }
        .subsection {
            margin-top: 2rem;
            margin-bottom: 1rem;
        }
        .code-tag {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            background-color: #e9ecef;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9rem;
        }
        .diagram {
            max-width: 100%;
            margin: 2rem 0;
            border: 1px solid #dee2e6;
            border-radius: 4px;
        }
        .footer {
            margin-top: 4rem;
            padding: 2rem 0;
            background-color: #f8f9fa;
            text-align: center;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>Edvise - Project Documentation</h1>
            <p class="lead">A comprehensive guide to the Edvise URL Manager application</p>
        </div>
    </header>

    <div class="container">
        <nav class="mb-4">
            <div class="nav nav-tabs" id="nav-tab" role="tablist">
                <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#overview" type="button">Overview</button>
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#architecture" type="button">Architecture</button>
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#components" type="button">Components</button>
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#api" type="button">API Reference</button>
                <button class="nav-link" data-bs-toggle="tab" data-bs-target="#deployment" type="button">Deployment</button>
            </div>
        </nav>

        <div class="tab-content" id="nav-tabContent">
            <!-- Overview Tab -->
            <div class="tab-pane fade show active" id="overview">
                <section class="section">
                    <h2>Project Overview</h2>
                    <p>
                        Edvise is a URL manager application that automatically captures and organizes links copied to your clipboard.
                        The application monitors your clipboard for valid URLs, extracts metadata like title and thumbnail,
                        and provides a clean interface to browse, search, filter, and manage your saved URLs.
                    </p>

                    <div class="subsection">
                        <h3>Key Features</h3>
                        <ul>
                            <li><strong>Automatic URL Capture:</strong> Detects when you copy a URL to your clipboard and saves it automatically</li>
                            <li><strong>Metadata Extraction:</strong> Pulls title and thumbnail information from web pages</li>
                            <li><strong>Filtering & Sorting:</strong> Find URLs by search term, date range, or sort by various criteria</li>
                            <li><strong>Edit & Delete:</strong> Modify URL titles and thumbnails or remove unwanted entries</li>
                            <li><strong>Responsive Design:</strong> Works on desktop and mobile devices</li>
                        </ul>
                    </div>
                </section>
            </div>

            <!-- Architecture Tab -->
            <div class="tab-pane fade" id="architecture">
                <section class="section">
                    <h2>System Architecture</h2>
                    <p>
                        Edvise follows a classic client-server architecture with a Python Flask backend and
                        a JavaScript frontend. The application uses PostgreSQL for data storage.
                    </p>

                    <div class="subsection">
                        <h3>High-Level Architecture</h3>
                        <pre>
+---------------------+      +--------------------+      +-------------------+
|                     |      |                    |      |                   |
|  Client (Browser)   |<---->|  Flask Server      |<---->|  PostgreSQL DB    |
|  - HTML/CSS/JS      |      |  - Python          |      |  - URL Data       |
|                     |      |  - REST API        |      |                   |
+---------------------+      +--------------------+      +-------------------+
         ^                           ^
         |                           |
         v                           v
+---------------------+      +--------------------+
|                     |      |                    |
|  Clipboard Monitor  |<---->|  URL Metadata      |
|  - Python Thread    |      |  Extraction        |
|                     |      |  - BeautifulSoup   |
+---------------------+      +--------------------+
</pre>
                    </div>

                    <div class="subsection">
                        <h3>Component Interactions</h3>
                        <ol>
                            <li>The <strong>Clipboard Monitor</strong> runs as a background thread, watching for URLs being copied</li>
                            <li>When a URL is detected, the system extracts metadata using <strong>BeautifulSoup</strong></li>
                            <li>The URL and its metadata are stored in the <strong>PostgreSQL database</strong></li>
                            <li>The <strong>Flask server</strong> provides a REST API to access and manage URLs</li>
                            <li>The <strong>Browser Client</strong> displays the interface and allows user interaction</li>
                        </ol>
                    </div>
                </section>
            </div>

            <!-- Components Tab -->
            <div class="tab-pane fade" id="components">
                <section class="section">
                    <h2>Component Details</h2>

                    <div class="subsection">
                        <h3>Backend Components</h3>
                        <ul>
                            <li>
                                <strong>app.py:</strong> The main Flask application that handles HTTP requests and serves the web interface
                                <pre><code>Flask routes:
- GET / -> Renders index.html
- GET /api/urls -> Returns all saved URLs as JSON
- DELETE /api/urls -> Deletes a URL
- PUT /api/urls -> Updates a URL's metadata</code></pre>
                            </li>
                            <li>
                                <strong>models.py:</strong> Contains the URL class with database operations
                                <pre><code>URL class methods:
- create_table(): Creates the URL table in the database
- add(): Adds a new URL to the database
- get_all(): Retrieves all URLs
- find_by_url(): Finds a URL by its address
- delete(): Removes a URL from the database
- update(): Updates a URL's metadata</code></pre>
                            </li>
                            <li>
                                <strong>clipboard_monitor.py:</strong> Monitors the clipboard for URLs
                                <pre><code>Key functions:
- is_valid_url(): Validates if a string is a proper URL
- get_url_metadata(): Extracts title and thumbnail from a URL
- clip_monitor(): Main monitoring loop</code></pre>
                            </li>
                            <li>
                                <strong>config.py:</strong> Database connection configuration
                                <pre><code>Settings:
- DB_USER: PostgreSQL username
- DB_PASSWORD: PostgreSQL password
- DB_HOST: Database host address
- DB_NAME: Database name</code></pre>
                            </li>
                        </ul>
                    </div>

                    <div class="subsection">
                        <h3>Frontend Components</h3>
                        <ul>
                            <li>
                                <strong>templates/index.html:</strong> Main HTML template
                                <pre><code>Key elements:
- Navigation bar
- URL table display
- Filter modal
- Edit URL modal</code></pre>
                            </li>
                            <li>
                                <strong>static/js/app.js:</strong> JavaScript functionality
                                <pre><code>UrlManager class:
- initialize(): Sets up event handlers
- fetchUrls(): Gets URLs from the server
- filterUrls(): Applies filtering and sorting
- createUrlCard(): Generates HTML for each URL
- editUrl(), deleteUrl(): URL management functions</code></pre>
                            </li>
                            <li>
                                <strong>static/css/style.css:</strong> Styling definitions
                                <pre><code>Key styles:
- Table formatting
- Loader animation
- Filter controls
- Modal styles</code></pre>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>

            <!-- API Reference Tab -->
            <div class="tab-pane fade" id="api">
                <section class="section">
                    <h2>API Reference</h2>
                    <p>Edvise provides a simple REST API for interacting with the URL database:</p>

                    <div class="subsection">
                        <h3>Endpoints</h3>
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th>Endpoint</th>
                                    <th>Method</th>
                                    <th>Description</th>
                                    <th>Request Format</th>
                                    <th>Response Format</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>/api/urls</td>
                                    <td>GET</td>
                                    <td>Retrieve all saved URLs</td>
                                    <td>N/A</td>
                                    <td>JSON array of URL objects</td>
                                </tr>
                                <tr>
                                    <td>/api/urls</td>
                                    <td>PUT</td>
                                    <td>Update URL metadata</td>
                                    <td><code>{"url": "...", "title": "...", "thumbnail": "..."}</code></td>
                                    <td><code>{"status": "success"}</code></td>
                                </tr>
                                <tr>
                                    <td>/api/urls</td>
                                    <td>DELETE</td>
                                    <td>Delete a URL</td>
                                    <td><code>{"url": "..."}</code></td>
                                    <td><code>{"success": true}</code></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="subsection">
                        <h3>Data Models</h3>
                        <pre><code>URL Object:
{
  "id": integer,
  "url": string,
  "title": string,
  "thumbnail": string,
  "created_date": datetime
}</code></pre>
                    </div>
                </section>
            </div>

            <!-- Deployment Tab -->
            <div class="tab-pane fade" id="deployment">
                <section class="section">
                    <h2>Deployment Guide</h2>

                    <div class="subsection">
                        <h3>Requirements</h3>
                        <ul>
                            <li>Python 3.8 or higher</li>
                            <li>PostgreSQL database</li>
                            <li>pyperclip (requires system dependencies for clipboard access)</li>
                        </ul>
                    </div>

                    <div class="subsection">
                        <h3>Installation Steps</h3>
                        <ol>
                            <li>Clone the repository</li>
                            <li>Install Python dependencies:
                                <pre><code>pip install -r requirements.txt</code></pre>
                            </li>
                            <li>Create a PostgreSQL database</li>
                            <li>Configure environment variables (or create a .env file):
                                <pre><code>DB_USER=your_username
DB_PASSWORD=your_password
DB_HOST=localhost
DB_NAME=edvise</code></pre>
                            </li>
                            <li>Run the application:
                                <pre><code>python app.py</code></pre>
                            </li>
                        </ol>
                    </div>

                    <div class="subsection">
                        <h3>Production Deployment</h3>
                        <p>For production deployment, consider using:</p>
                        <ul>
                            <li>Gunicorn as a WSGI server</li>
                            <li>Nginx as a reverse proxy</li>
                            <li>Systemd service for the clipboard monitor</li>
                        </ul>
                        <pre><code># Example systemd service file
[Unit]
Description=Edvise URL Manager
After=network.target

[Service]
User=yourusername
WorkingDirectory=/path/to/edvise
ExecStart=/path/to/venv/bin/gunicorn -w 4 -b 127.0.0.1:8000 app:app
Restart=always

[Install]
WantedBy=multi-user.target</code></pre>
                    </div>
                </section>
            </div>
        </div>
    </div>

    <footer class="footer">
        <div class="container">
            <p>Edvise Project Documentation &copy; 2023</p>
            <p><small>Generated on: <span id="generated-date"></span></small></p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.getElementById('generated-date').textContent = new Date().toLocaleDateString();
    </script>
</body>
</html>


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.