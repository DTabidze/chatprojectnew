import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import sendIcon from "../icons/icons8-send-96.png";
import sendPic from "../icons/icons8-send-image-96.png";

function ChatPanel({ selectedContact, loggedInUser, socket }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const inputRef = useRef(null);

  const handleLogin = () => {
    // Emit the login event to the server
    const username = loggedInUser.username;
    // console.log("USER LOGGED IN: ", username);
    socket.emit("login", { username });
  };

  useEffect(() => {
    socket.removeAllListeners();
    socket.on("message", (message) => {
      try {
        const parsedMessage = JSON.parse(message);
        console.log(
          `SENDER: ${parsedMessage.sender}`,
          `USER: ${loggedInUser.username}`
        );

        // Only add the received message to state if the sender is not the same as the logged-in user
        if (parsedMessage.sender !== loggedInUser.username) {
          setMessages((prevMessages) => [...prevMessages, parsedMessage]);
        }
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    });
    socket.on("connect", handleLogin);
  }, [loggedInUser.username]);

  const sendMessage = () => {
    if (newMessage.trim() === "" || selectedContact.username.trim() === "")
      return;

    const messageObject = {
      text: newMessage,
      recipient: selectedContact.username, //Add Reciver information
      sender: loggedInUser.username, // Add sender information
    };

    socket.emit("message", JSON.stringify(messageObject)); // Send the message as a JSON string
    // console.log(messages);
    setMessages((prevMessages) => [...prevMessages, messageObject]); // Append the message as an object
    setNewMessage(""); // Clear the new message input
  };

  const sendImage = () => {
    const input = inputRef.current;
    if (input && input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        const imageBase64 = event.target.result;
        const messageObject = {
          image: imageBase64,
          timestamp: new Date().getTime(),
          isMe: true,
          recipient: selectedContact.username,
        };
        socket.send(JSON.stringify(messageObject));
        setMessages((prevMessages) => [...prevMessages, messageObject]);
        // console.log(messages);
      };

      reader.readAsDataURL(file);
      setNewMessage("");
    }
  };
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-lg font-semibold mb-4">
        {selectedContact.fname + " " + selectedContact.lname}
      </h2>
      <div className="flex-grow overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === loggedInUser.username
                ? "justify-end"
                : "justify-start"
            } mb-2`}
          >
            <div
              className={`rounded-lg p-2 ${
                message.sender === loggedInUser.username
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {message.text && <p>{message.text}</p>}
              {message.image && (
                <img
                  src={message.image}
                  alt={`${message.sender} image`}
                  style={{ maxWidth: "100%", maxHeight: "300px" }}
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
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-grow px-2 py-1 rounded-lg border border-gray-300"
        />
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={sendImage}
        />
        <button onClick={() => inputRef.current.click()}>
          <img src={sendPic} alt="Choose Image" className="w-6 h-6" />
        </button>

        <button onClick={sendMessage}>
          <img src={sendIcon} alt="Send Message" className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

export default ChatPanel;

{
  /* <div className="p-4">
{selectedContact ? (
  <div>
    <h2 className="text-lg font-semibold mb-4">{selectedContact.name}</h2>
    <div className="flex flex-col h-96 overflow-y-auto mb-4">
      {messages.map((message, index) => (
        <div
          key={index}
          className={`p-2 rounded ${
            message.isMe
              ? "bg-blue-300 self-end"
              : "bg-gray-300 self-start"
          }`}
        >
          {message.text}
        </div>
      ))}
    </div>
    <form className="flex items-center" onSubmit={handleSendMessage}>
      <input
        type="text"
        className="flex-1 p-2 border rounded"
        placeholder="Type a message..."
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-500 text-white p-2 rounded ml-2"
      >
        Send
      </button>
    </form>
  </div>
) : (
  <p>Select a contact to start chatting.</p>
)}
</div> */
}
