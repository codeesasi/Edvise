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
   # Set up PostgreSQL database (required for current functionality)
   # The application uses PostgreSQL to store URL data
   
   ```

4. Run the application
   ```sh
   python app.py
   ```

<!-- USAGE EXAMPLES -->
## Usage

Edvise currently offers the following functionality:

1. **URL Monitoring**: Automatically captures URLs copied to clipboard
2. **Metadata Extraction**: Extracts title and thumbnail information from web pages
3. **URL Management**: View, delete, and update saved URLs through a web interface

The application works by:
- Running a background thread that monitors your clipboard for valid URLs
- When a URL is detected, it extracts metadata using BeautifulSoup
- URLs and their metadata are stored in a PostgreSQL database
- A Flask web interface allows you to view and manage your saved URLs

See the [open issues](https://github.com/codeesasi/issues) for a list of proposed features and known issues.

<!-- CONTRIBUTING -->
## Contributing

We welcome contributions to improve Edvise! Please follow these simple steps:

1. Fork the project
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.