import React, { useState, useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";

import SERVER_BASE_URL from "./config";

function App() {
  const [loggedInUser, setLoggedInUser] = useState({});
  const navigate = useNavigate();

  const refreshUser = async () => {
    try {
      const response = await fetch(`${SERVER_BASE_URL}/session`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const user = await response.json();
        console.log("LOGGED IN USER: ", user);
        if (user) {
          setLoggedInUser(user);
          console.log("APP USER", loggedInUser);
          navigate("/mainpanel");
        } else {
          navigate("/error");
        }
      } else {
        navigate("/login");
      }
    } catch (error) {
      navigate("/error");
    }
    console.log("Fetch and state update complete.");
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <>
      {/* Conditional rendering based on loggedInUser */}
      {/* {Object.keys(loggedInUser).length > 0 ? (
        <MainPanel
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
        />
      ) : null} */}
      {/* <Login
          loggedInUser={loggedInUser}
          setLoggedInUser={setLoggedInUser}
          navigate={navigate}
        />
      )} */}
      <Outlet context={{ loggedInUser, setLoggedInUser, refreshUser }} />
    </>
  );
}

export default App;
