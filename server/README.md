# Real-Time Messenger App with Flask and Socket.IO

This repository contains a real-time messaging application built using Flask and Socket.IO. The app allows users to send messages, images, and manage their contacts in real-time.

## Features

- User authentication and session management.
- Real-time messaging with support for text and image messages.
- Online user status updates.
- Contact management: add and remove contacts.
- WebSocket-based communication for real-time updates.

## Prerequisites

- Python 3.6 or higher
- Flask
- Flask-SocketIO
- Flask-CORS
- Flask-Bcrypt
- SQLAlchemy (assumed to be included in your `models` module)

## Getting Started

1. Clone the repository:
   ```
   git clone git@github.com:DTabidze/chatprojectnew.git
   cd server
   ```

2. Install the required Python packages:
   ```
   pipenv install -r requirements.txt
   ```

3. Configure the `config.py` file with your database settings, secret key, and other configurations.

4. Run the Flask application:
   ```
   python app.py
   ```

## Socket.IO Logic

The application uses Socket.IO to enable real-time communication between clients and the server. Here's a brief overview of how Socket.IO logic works:

- Upon connecting, the server listens for various events like `connect`, `login`, `user_status_change`, `message`, and `disconnect`.

- The `handle_connect` event is triggered when a client connects to the server.

- The `handle_login` event handles user login and maintains a dictionary of connected users.

- The `handle_user_status_change` event updates the online status of users in real-time.

- The `handle_added_contact` event notifies users when a new contact is added.

- The `handle_message` event handles sending text and image messages to recipients in real-time.

- The `handle_message_updated` event updates edited messages in real-time.

- The `handle_disconnect` event is triggered when a client disconnects, removing the user from the connected users' dictionary.

## Routes Explanation

- `/session`: This route checks the user's session and ensures they are logged in before proceeding. It returns user information if authenticated.

- `/login`: Handles user login by checking credentials and creating a session.

- `/logout`: Handles user logout by deleting their session and removing them from the list of connected sessions.

- `/users/<int:id>`: Retrieves user information by their ID and allows updating user details.

- `/users`: GET returns a list of all users, and POST adds a new user.

- `/messages`: GET retrieves messages between two users, and POST adds a new message.

- `/messages/<int:id>`: Handles editing and deleting messages.

- `/contacts`: GET retrieves all contacts, and POST adds a new contact.

- `/contacts/<int:id>`: Handles deleting contacts.

- `/uploadimage`: POST route for uploading image files.

## Usage

1. Register or log in to the application.
2. Add contacts by their username.
3. Start real-time conversations with contacts.
4. Send text or image messages.
5. Observe the online status of your contacts.
6. Log out to end your session.
