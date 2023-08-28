import React, { useState, useEffect } from "react";
import ContactList from "./ContactList";
import ChatPanel from "./ChatPanel";
import ProfilePage from "./ProfilePage"; // Make sure you have this component imported
import io from "socket.io-client";
import { useNavigate, useOutletContext } from "react-router-dom";
import SERVER_BASE_URL from "./config";
import NewContact from "./NewContact";

function MainPanel() {
  const { loggedInUser, setLoggedInUser } = useOutletContext();
  const [myContacts, setMyContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showProfilePage, setShowProfilePage] = useState(false); // State for showing profile modal
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [showNewContact, setShowNewContact] = useState(false);
  console.log("MAINPANEL USER: ", loggedInUser);

  function handleSelectedContact(contact) {
    setSelectedContact(contact);
  }

  function toggleProfileModal() {
    setShowProfilePage(!showProfilePage);
  }

  function handleStatusChange(status) {
    // if (myContacts.length > 0) {
    const onlineContacts = myContacts.filter(
      (contact) => contact.status === "online"
    );
    // Check if there are online contacts before emitting
    console.log("ONLINE LIST: ", onlineContacts);
    if (onlineContacts.length > 0) {
      onlineContacts.forEach((contact) => {
        socket.emit("user_status_change", {
          userId: contact.username,
          sender: loggedInUser.username,
          status: status,
        });
      });
    }
  }
  function handleAddContactClick() {
    setShowNewContact(true); // Set the state to true when the button is clicked
  }

  function handleLogOut(e) {
    e.stopPropagation();
    console.log("LOGOUT");
    handleStatusChange("offline");
    fetch(`${SERVER_BASE_URL}/logout`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-type": "application/json",
      },
    }).then((res) => {
      if (res.ok) {
        fetch(`${SERVER_BASE_URL}/users/${loggedInUser.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "offline" }),
        });

        // setLoggedInUser({});
        navigate("/login");
      }
    });
  }

  useEffect(() => {
    if (
      loggedInUser &&
      (loggedInUser.contacts_received || loggedInUser.contacts_sent)
    ) {
      let onlineContacts = [];
      let offlineContacts = [];

      for (let i = 0; i < loggedInUser.contacts_received.length; i++) {
        const contact = loggedInUser.contacts_received[i].user_first_obj;
        if (contact.status === "online") {
          onlineContacts.push(contact);
        } else {
          offlineContacts.push(contact);
        }
      }

      for (let i = 0; i < loggedInUser.contacts_sent.length; i++) {
        const contact = loggedInUser.contacts_sent[i].user_second_obj;
        if (contact.status === "online") {
          onlineContacts.push(contact);
        } else {
          offlineContacts.push(contact);
        }
      }

      const combinedContacts = onlineContacts.concat(offlineContacts);
      setMyContacts(combinedContacts);
    }
  }, [loggedInUser]);

  useEffect(() => {
    // Create the socket connection once when the component mounts
    const newSocket = io("10.129.3.117:8080");
    setSocket(newSocket);

    // Clean up the socket connection when the component unmounts
    return () => {
      newSocket.disconnect();
    };
  }, [loggedInUser]);

  useEffect(() => {
    if (!socket) return;
    // Socket connection listener , automatically log in every time u socket connects.
    const connect_listener = () => {
      const username = loggedInUser.username;
      console.log("USER LOGGED IN HANDLE: ", username, loggedInUser);
      socket.emit("login", { username });
    };
    socket.on("connect", connect_listener);

    const userStatusChangeHandler = (data) => {
      const { userId, sender, status } = data;
      console.log(status, "CHECK FRONT END");
      // Find the contact that matches the sender's username
      const contactToUpdate = myContacts.find(
        (contact) => contact.username === sender
      );
      console.log(sender);
      console.log("FUNCTION SCOPE CHEC!!!!!!K: ", myContacts);
      console.log(contactToUpdate.status, "    ", status);
      console.log("before update check: ", myContacts);
      // Only update if the contact exists and the status has changed
      // if (contactToUpdate && contactToUpdate.status !== status) {
      setMyContacts((prevContacts) => {
        const updatedContacts = prevContacts.map((contact) => {
          if (contact.username === sender) {
            console.log(contact, " UPDATE THIS");
            return { ...contact, status: status };
          }
          return contact;
        });

        // Sort the contacts with online contacts first
        updatedContacts.sort((a, b) => {
          if (a.status === "online" && b.status !== "online") {
            return -1;
          } else if (a.status !== "online" && b.status === "online") {
            return 1;
          }
          return 0;
        });

        return updatedContacts;
      });
      // }
      console.log("status update check: ", myContacts);
    };

    handleStatusChange("online");

    const handleContactAdded = (newContact) => {
      // Update the recipient's contact list to include the new contact
      console.log("NEW CONTACT!!!!:   ", newContact);
      setMyContacts((prevContacts) => [...prevContacts, newContact]);
    };

    socket.on("contact_added", handleContactAdded);
    socket.on("user_status_change", userStatusChangeHandler);

    // socket.on("user_status_change", userStatusChangeHandler);

    return () => {
      if (!socket) return;
      // if socket or user changes this runs before useEffect takes effect again and kills this connection.
      socket.off("connect", connect_listener);
      socket.off("user_status_change", userStatusChangeHandler);
      socket.off("contact_added", handleContactAdded);
    };
  }, [socket, loggedInUser]);

  return (
    <>
      {Object.keys(loggedInUser).length > 0 && (
        <div className="flex h-screen">
          <div className="w-1/4 max-w-25 bg-gray-200">
            <div
              className="flex min-w-0 gap-x-4 p-4 cursor-pointer"
              onClick={toggleProfileModal}
            >
              <img
                className="h-12 w-12 flex-none rounded-full bg-gray-50"
                src={`${SERVER_BASE_URL}/static/${loggedInUser.profile_pic}`}
                alt=""
              />
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  {loggedInUser.fname + " " + loggedInUser.lname}
                </p>
                <div className="text-gray-500">
                  <button onClick={handleLogOut}>Log Out</button>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={handleAddContactClick}
            >
              Add Contact
            </button>
            {showNewContact && (
              <NewContact
                loggedInUser={loggedInUser}
                myContacts={myContacts}
                setMyContacts={setMyContacts}
                setShowNewContact={setShowNewContact}
                socket={socket}
              />
            )}
            <ContactList
              loggedInUser={loggedInUser}
              myContacts={myContacts}
              handleSelectedContact={handleSelectedContact}
            />
          </div>
          {selectedContact !== null && (
            <div className="flex-1 bg-gray-100 overflow-hidden">
              <ChatPanel
                loggedInUser={loggedInUser}
                selectedContact={selectedContact}
                myContacts={myContacts}
                setMyContacts={setMyContacts}
                socket={socket}
              />
            </div>
          )}
        </div>
      )}
      {showProfilePage && (
        <ProfilePage
          setLoggedInUser={setLoggedInUser}
          loggedInUser={loggedInUser}
          onClose={toggleProfileModal}
        />
      )}
    </>
  );
}

export default MainPanel;
