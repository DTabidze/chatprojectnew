import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";
import SERVER_BASE_URL from "./config";

export default function Login() {
  const { loggedInUser, setLoggedInUser } = useOutletContext();
  // console.log("setLoggedInUser prop in Login:", setLoggedInUser);
  const navigate = useNavigate();
  const [logInUser, setLogInUser] = useState({
    username: "",
    password_hash: "",
  });

  function handleUsername(e) {
    setLogInUser((prevUser) => ({ ...prevUser, username: e.target.value }));
  }
  function handlePassword(e) {
    setLogInUser((prevUser) => ({
      ...prevUser,
      password_hash: e.target.value,
    }));
  }
  async function handleLogIn(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${SERVER_BASE_URL}/login`, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(logInUser),
      });

      if (response.ok) {
        const user = await response.json();
        console.log("FETCHED USER RESPONSE: ", user);
        fetch(`${SERVER_BASE_URL}/users/${user.id}`, {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "online" }),
        });
        user.status = "online";
        setLoggedInUser(user);
        navigate("/mainpanel");
      } else {
        alert(`Username or Password Is Wrong!!!`);
      }
    } catch (error) {
      console.log(error);
    }
  }

  function handleRegister() {
    navigate("/registration");
  }

  return (
    <>
      {/* {Object.keys(loggedInUser).length === 0 ? ( */}
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          {/* <img
            className="mx-auto h-10 w-auto"
            // src="https://i.pinimg.com/1200x/50/cd/ca/50cdca2005c83652e0a1b807b8a95aac.jpg"
            alt="Your Company"
          /> */}
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form className="space-y-6" action="#" method="POST">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Username
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  name="username"
                  type="username"
                  autoComplete="username"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  onChange={handleUsername}
                  value={logInUser.username}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Password
                </label>
              </div>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  value={logInUser.password}
                  onChange={handlePassword}
                />
              </div>
            </div>

            <div>
              <button
                onClick={handleLogIn}
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign in
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-gray-500">
            Not a member?{" "}
            <Link
              to="/registration"
              className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
            >
              Register Now
            </Link>
          </p>
        </div>
      </div>
      {/* ) : (
        <MainPanel />
      )} */}
    </>
  );
}
