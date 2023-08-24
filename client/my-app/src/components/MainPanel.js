import React, { useState, useEffect } from "react";
import ContactList from "./ContactList";
import ChatPanel from "./ChatPanel";
import ProfilePage from "./ProfilePage"; // Make sure you have this component imported
import io from "socket.io-client";
import { useNavigate, useOutletContext } from "react-router-dom";
import SERVER_BASE_URL from "./config";

function MainPanel() {
  const { loggedInUser, setLoggedInUser } = useOutletContext();
  const [myContacts, setMyContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showProfilePage, setShowProfilePage] = useState(false); // State for showing profile modal
  const navigate = useNavigate();
  function handleSelectedContact(contact) {
    setSelectedContact(contact);
  }

  function toggleProfileModal() {
    setShowProfilePage(!showProfilePage);
  }
  function handleLogOut(e) {
    e.stopPropagation();
    console.log("LOGOUT");
    fetch(`${SERVER_BASE_URL}/logout`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-type": "application/json",
      },
    }).then((res) => {
      if (res.ok) {
        setLoggedInUser({});
        navigate("/login");
      }
    });
  }

  useEffect(() => {
    if (
      loggedInUser &&
      (loggedInUser.contacts_received || loggedInUser.contacts_sent)
    ) {
      let combinedContacts = [];
      for (let i = 0; i < loggedInUser.contacts_received.length; i++) {
        combinedContacts.push(loggedInUser.contacts_received[i].user_first_obj);
      }

      for (let i = 0; i < loggedInUser.contacts_sent.length; i++) {
        combinedContacts.push(loggedInUser.contacts_sent[i].user_second_obj);
      }
      setMyContacts(combinedContacts);
    }
  }, [loggedInUser]);

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
            <ContactList
              loggedInUser={loggedInUser}
              myContacts={myContacts}
              handleSelectedContact={handleSelectedContact}
            />
          </div>
          {selectedContact !== null && (
            <div className="flex-1 bg-gray-100">
              <ChatPanel
                loggedInUser={loggedInUser}
                selectedContact={selectedContact}
                myContacts={myContacts}
                setMyContacts={setMyContacts}
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
