# Real-Time Messenger Web Application - Frontend

![App Screenshot](https://i.ibb.co/gyngW96/Screenshot-2023-08-30-at-12-44-07.png)

## Project Overview

The Real-Time Messenger Web Application is a user-friendly platform built using React that enables users to exchange text and images seamlessly and instantaneously. It is designed to provide a smooth and real-time messaging experience.

The frontend interface is intuitive and easy to navigate, allowing users to send and receive messages in individual or group chats. The application integrates with a Flask backend that utilizes Flask-SocketIO for real-time communication and SQLAlchemy for data storage.

## Features

- Real-time messaging with instant updates
- Support for exchanging text messages
- Capability to send and receive images and emojis in chats
- User authentication and account management
- User-friendly interface
- Editing and deleting messages
- Instant online status updates

## Installation

To set up the frontend locally, follow these steps:

1. **Prerequisites**: Before you begin, make sure you have the following installed:
   - [Node.js](https://nodejs.org/) (including npm)

2. **Frontend Installation**:
   - **Clone the Repository**: Clone this repository to your local machine using Git:
     ```bash
     git clone git@github.com:DTabidze/chatprojectnew.git
     ```

   - **Navigate to the Directory**: Navigate to the frontend directory:
     ```bash
     cd client/my-app/
     ```

   - **Install Dependencies**: Install the required JavaScript packages by running:
     ```bash
     npm install
     ```
     This command will read the `package.json` file and install all the necessary dependencies.

   - **Update Configuration**: Open the `src/components/config.js` file and update the `SERVER_BASE_URL` according to your backend server's URL.

   - **Start the Development Server**: Start the frontend development server:
     ```bash
     npm start
     ```
     This will start the development server and open the application in your default web browser.

3. **Accessing the Application**:
   Once the development server is up and running, you can access the application by opening your web browser and navigating to [http://localhost:3000](http://localhost:3000).
   If you want to access the application from other devices within your local network, you can start the development server using your local IP address. Run the following command instead:
   ```bash
   npm start --host YOU_LOCAL_IP --port 3000

## Features

- Real-time messaging with instant updates
- Support for exchanging text messages and images
- User authentication and account management
- User-friendly interface
- Editing and deleting messages
- Online status updates
- Sending emojis
  
## Usage

1. Access the application by navigating to [http://localhost:3000](http://localhost:3000) or YOUR_LOCAL_IP after setting up the frontend.
2. Upon loading, the application automatically redirects you to the login page. You can either register for a new account or log in if you already have one.
3. Upon logging in, the application establishes a socket session with the backend server. This session enables seamless real-time communication.
4. You have the ability to search for contacts using their usernames.
5. When you find a contact, you can add them to your contact list. Simultaneously, they will be added to the contact list of the person you added.
6. In your chat interface(ChatPanel.js), you have the flexibility to send text messages, images, and emojis, all of which are exchanged in real time.
7. When initiating a chat with another user, a dedicated chat room is created for both participants to communicate in real time. This includes the ability to edit and delete messages.
8. The application manages online and offline status updates. For instance, if you go offline, the app emits a socket event to notify your contacts, who can then update their contact lists accordingly.

## Real-Time Communication

- When you start a chat session with another user, the application creates a separate socket room for the two participants. This room facilitates instant messaging updates.
- The application rarely relies on database requests post-login. Instead, most data exchange happens in real time.
- Management of contact list statuses, messages, and other data is efficiently handled using React state.
- For instance, if you go offline, a socket event is emitted to your contacts, prompting them to update their contact lists.
- Upon selecting a different person from your contact list, the application retrieves the entire conversation history from the database.
- Subsequent messages you send are emitted via socket to the recipient, who updates their message state accordingly.
- Similar real-time mechanisms are employed for editing and deleting messages.
- Messages sent via socket are also POSTed to the database, ensuring data integrity.
- The application's architecture minimizes database requests, as most information is exchanged through real-time sockets.



