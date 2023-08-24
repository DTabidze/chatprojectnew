import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import sendIcon from "../icons/icons8-send-96.png";
import sendPic from "../icons/icons8-send-image-96.png";
import SERVER_BASE_URL from "./config";
import Picker from "emoji-picker-react";
import UserProfilePage from "./UserProfilePage";

function ChatPanel({
  myContacts,
  setMyContacts,
  selectedContact,
  loggedInUser,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const inputRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showUserProfilePage, setUserShowProfilePage] = useState(false);

  const fetchChatHistory = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/messages?senderId=${loggedInUser.id}&recipientId=${selectedContact.id}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-type": "application/json",
          },
        }
      );

      if (response.ok) {
        const chatHistory = await response.json();
        setMessages(chatHistory);
        console.log(messages);
      } else {
        console.log(`Error fetching chat history: ${response.statusText}`);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // Fetch chat history when selectedContact changes
    fetchChatHistory();
  }, [selectedContact]);

  useEffect(() => {
    // Create the socket connection once when the component mounts
    const newSocket = io("192.168.1.162:8080");
    setSocket(newSocket);

    // Clean up the socket connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.removeAllListeners();
    socket.on("message", (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log(
          `SENDER: ${parsedMessage.sender}`,
          `USER: ${loggedInUser.username}`
        );

        console.log(parsedMessage);
        console.log("LOGGED IN USER: ", loggedInUser.username);
        console.log("SELECTED USER: ", selectedContact.username);
        if (
          parsedMessage.sender !== loggedInUser.username &&
          parsedMessage.recipient === loggedInUser.username &&
          parsedMessage.sender === selectedContact.username
        ) {
          setMessages((prevMessages) => [...prevMessages, parsedMessage]);
        }
        // if (parsedMessage.sender !== loggedInUser.username) {
        //   setMessages((prevMessages) => [...prevMessages, parsedMessage]);
        // }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    });
    socket.on("connect", () => {
      const username = loggedInUser.username;
      console.log("USER LOGGED IN HANDLE: ", username);
      socket.emit("login", { username });
    });

    return () => {
      socket.removeAllListeners("message");
      socket.off("connect");
    };
  }, [socket, loggedInUser, selectedContact]);

  function handleInputText(e) {
    setNewMessage(e.target.value);
  }
  // HANDLE SENDING MESSAGES
  const sendMessage = () => {
    if (newMessage.trim() === "" || selectedContact.username.trim() === "")
      return;
    console.log("MESSAGE TEXT: ", newMessage);
    const messageObject = {
      text: newMessage,
      recipient: selectedContact.username, //Add Reciver information
      sender: loggedInUser.username, // Add sender information
      message_type: "text",
    };
    const dbMessageObject = {
      text: newMessage,
      recipient: selectedContact.id, //Add Reciver information
      sender: loggedInUser.id, // Add sender information
      message_type: "text",
    };
    fetch(`${SERVER_BASE_URL}/messages`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(dbMessageObject),
    })
      .then((res) => {
        if (res.ok) {
          // socket.emit("message", JSON.stringify(messageObject));
          return res.json();
        }
      })
      .then((msg) => {
        messageObject.id = msg.id;
        console.log("MSG: ", msg);
        console.log("MSG OBJ: ", messageObject);
        socket.emit("message", JSON.stringify(messageObject));
        setMessages((prevMessages) => [...prevMessages, msg]); // Append the message as an object
        setNewMessage(""); // Clear the new message input
      })
      .catch((error) => {
        console.log(error);
      });

    // socket.emit("message", JSON.stringify(messageObject)); // Send the message as a JSON string

    console.log(messages);
  };

  // HANDLE IMAGE SENDING
  const sendImage = async () => {
    const input = inputRef.current;

    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(`${SERVER_BASE_URL}/uploadimage`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          const dbMessageObject = {
            text: data.filename, // Set the filename as the image URL
            // timestamp: new Date().getTime(),
            recipient: selectedContact.id,
            sender: loggedInUser.id,
            message_type: "image", // Set the message type as "image"
          };
          const messageObject = {
            text: data.filename, // Set the filename as the image URL
            // timestamp: new Date().getTime(),
            recipient: selectedContact.username,
            sender: loggedInUser.username,
            message_type: "image", // Set the message type as "image"
          };
          fetch(`${SERVER_BASE_URL}/messages`, {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-type": "application/json",
            },
            body: JSON.stringify(dbMessageObject),
          })
            .then((res) => {
              if (res.ok) {
                // socket.emit("message", JSON.stringify(messageObject));
                return res.json();
              }
            })
            .then((msg) => {
              messageObject.id = msg.id;
              console.log("MSG: ", msg);
              console.log("MSG OBJ: ", messageObject);
              socket.emit("message", JSON.stringify(messageObject));
              setMessages((prevMessages) => [...prevMessages, msg]); // Append the message as an object
              setNewMessage(""); // Clear the new message input
            })
            .catch((error) => {
              console.log(error);
            });
        } else {
          console.error("Failed to upload file:", response.statusText);
        }
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };
  // ADD EMOJI IN INPUT
  const onEmojiClick = (emojiObject) => {
    setNewMessage((prevNewMessage) => prevNewMessage + emojiObject.emoji);
    setShowPicker(false);
  };

  function toggleUserProfileModal() {
    setUserShowProfilePage(!showUserProfilePage);
  }

  return (
    <div className="flex flex-col h-full">
      {showUserProfilePage && (
        <UserProfilePage
          // setLoggedInUser={setLoggedInUser}
          selectedContact={selectedContact}
          loggedInUser={loggedInUser}
          myContacts={myContacts}
          setMyContacts={setMyContacts}
          onClose={toggleUserProfileModal}
        />
      )}
      {/* <h1 className="text-lg font-semibold mb-4">
        {selectedContact.fname + " " + selectedContact.lname}
      </h1>
      <button>Delete</button> */}
      <div
        className="flex min-w-0 gap-x-4 p-4 cursor-pointer ml-auto items-center" // Add items-center class
        onClick={toggleUserProfileModal}
      >
        <div className="min-w-0 flex-auto">
          <p className="text-sm font-semibold leading-6 text-gray-900">
            {selectedContact.fname + " " + selectedContact.lname}
          </p>
        </div>
        <img
          className="h-12 w-12 flex-none rounded-full bg-gray-50"
          src={`${SERVER_BASE_URL}/static/${selectedContact.profile_pic}`}
          alt=""
        />
      </div>
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === loggedInUser.username ||
              message.sender === loggedInUser.id
                ? "justify-end"
                : "justify-start"
            } mb-2`}
          >
            <div
              className={`rounded-lg p-2 ${
                message.sender === loggedInUser.username ||
                message.sender === loggedInUser.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {message.message_type === "text" && <p>{message.text}</p>}
              {message.message_type === "image" && (
                <img
                  src={`${SERVER_BASE_URL}/static/${message.text}`}
                  alt={`${message.sender}`}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "300px",
                    alignSelf:
                      message.sender === loggedInUser.username ||
                      message.sender === loggedInUser.id
                        ? "flex-end"
                        : "flex-start",
                  }}
                />
              )}
              <span>{message.sender}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="InputContainer bg-gray-100 p-4 flex">
        <input
          type="text"
          value={newMessage}
          onChange={handleInputText}
          placeholder="Type your message..."
          className="flex-grow px-2 py-1 rounded-lg border border-gray-300"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={sendImage}
        />
        <img
          className="emoji-icon"
          src="https://icons.getbootstrap.com/assets/icons/emoji-smile.svg"
          onClick={() => setShowPicker((val) => !val)}
        />

        {showPicker && (
          <div className="absolute bottom-12 right-0">
            <Picker
              pickerStyle={{ width: "100%" }}
              onEmojiClick={onEmojiClick}
            />
          </div>
        )}
        <button onClick={() => inputRef.current.click()}>
          <img src={sendPic} alt="Choose" className="w-6 h-6" />
        </button>

        <button onClick={sendMessage}>
          <img src={sendIcon} alt="Send Message" className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;
