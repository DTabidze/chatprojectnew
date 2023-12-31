import React, { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import SERVER_BASE_URL from "./config";
const AddNewContact = () => {
  const { loggedInUser, setLoggedInUser, refreshUser } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(loggedInUser);
    async function fetchAllUsers() {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/users`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const users = await response.json();
          if (users) {
            setUsers(users);
          } else {
            // console.log(loggedInUser);
          }
        } else {
          console.error("Error fetching data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      console.log("Fetch and state update complete.");
    }
    fetchAllUsers();
  }, []);

  useEffect(() => {
    async function fetchMyContactList() {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/contacts`, {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          const contacts = await response.json();
          if (contacts) {
            setContacts(contacts);
          } else {
            // console.log(loggedInUser);
          }
        } else {
          console.error("Error fetching data");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      console.log("Fetch and state update complete.");
    }
    fetchMyContactList();
  }, []);

  const handleSearchChange = (event) => {
    const newSearchQuery = event.target.value;
    setSearchQuery(newSearchQuery);
    if (newSearchQuery === "") {
      setFilteredUsers([]);
      return;
    }

    // Filter users who are not in the contact list
    const filtered = users.filter((user) => {
      const userId = user.id;
      const isNotLoggedInUser = userId !== loggedInUser.id;
      // Check if the user is not in the contacts list (both first and second users)
      const isInContacts = contacts.some(
        (contact) =>
          (contact.user_first === userId &&
            contact.user_second === loggedInUser.id) ||
          (contact.user_first === loggedInUser.id &&
            contact.user_second === userId)
      );
      // Filter by search query and whether the user is not in contacts
      return (
        isNotLoggedInUser &&
        user.username.toLowerCase().includes(newSearchQuery.toLowerCase()) &&
        !isInContacts
      );
    });
    setFilteredUsers(filtered);
  };

  function handleAddContact(user) {
    const newContact = {
      user_first: loggedInUser.id,
      user_second: user.id,
    };
    console.log(newContact);
    console.log("ADDED NEW CONTACT: ", user);
    fetch(`${SERVER_BASE_URL}/contacts`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newContact),
    })
      .then((res) => {
        if (res.ok) {
          res.json();
          // refreshUser();
          // setLoggedInUser((prevUser) => ({
          //   ...prevUser,
          //   contacts: [...prevUser.contacts_sent, newContact], // Assuming contacts is an array
          // }));
          // console.log(loggedInUser);
          // refreshUser();
          navigate("/mainpanel");
        }
      })
      .then((contactlist) => console.log(contactlist))
      .catch((error) => console.log(error));
  }

  return (
    <div className="flex flex-col items-center mt-8">
      <div className="mb-4">
        <label className="relative block">
          <span className="sr-only">Search</span>
          <span className="absolute inset-y-0 left-0 flex items-center pl-2">
            <svg className="h-5 w-5 fill-slate-300" viewBox="0 0 20 20">
              whatever
            </svg>
          </span>
          <input
            className="placeholder:italic placeholder:text-slate-400 block bg-white w-full border border-slate-300 rounded-md py-2 pl-9 pr-3 shadow-sm focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 sm:text-sm"
            placeholder="Search for New Contact..."
            type="text"
            name="search"
            onChange={handleSearchChange}
            value={searchQuery}
          />
        </label>
      </div>
      <div className="relative w-full">
        <ul className="absolute w-full bg-white border border-slate-300 rounded-md shadow-sm">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              className="flex justify-between gap-x-6 py-5 items-center border-b border-slate-300 last:border-b-0"
            >
              <div className="flex items-center">
                <img
                  className="h-12 w-12 flex-none rounded-full bg-gray-50"
                  src={`${SERVER_BASE_URL}/static/${user.profile_pic}`}
                  alt=""
                />
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    {user.fname + " " + user.lname}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                    {"Username: " + user.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleAddContact(user)}
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                Add Contact
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default AddNewContact;
