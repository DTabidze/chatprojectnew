import React, { useState } from "react";
import { CardHeader } from "@material-tailwind/react";
import SERVER_BASE_URL from "./config";

export default function ProfilePage({
  setLoggedInUser,
  loggedInUser,
  onClose,
}) {
  const [newProfileImage, setNewProfileImage] = useState(null);

  function handleProfileImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewProfileImage(event.target.result);
        uploadProfileImage(file);
      };
      reader.readAsDataURL(file);
    }
  }

  async function uploadProfileImage(file) {
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
        updateProfilePicture(data.filename);
      } else {
        console.error("Failed to upload file:", response.statusText);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  async function updateProfilePicture(filename) {
    try {
      const response = await fetch(
        `${SERVER_BASE_URL}/users/${loggedInUser.id}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profile_pic: filename }),
        }
      );

      if (response.ok) {
        const updatedUser = await response.json();
        setNewProfileImage(null);
        setLoggedInUser(updatedUser);
        onClose();
      } else {
        console.error("Failed to update profile picture:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating profile picture:", error);
    }
  }

  return (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <CardHeader color="blue-gray" className="relative h-56">
              <label
                htmlFor="profileImage"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 p-1 bg-blue-500 border-0 text-white opacity-5 text-3xl leading-none font-semibold outline-none focus:outline-none cursor-pointer"
              >
                <span className="bg-transparent text-white opacity-5 h-6 w-6 text-2xl block outline-none focus:outline-none">
                  📸
                </span>
                <input
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />
              </label>
              {newProfileImage ? (
                <img
                  src={newProfileImage}
                  alt="Profile"
                  className="object-cover w-full h-full"
                />
              ) : (
                <img
                  src={`${SERVER_BASE_URL}/static/${loggedInUser.profile_pic}`}
                  alt="Profile"
                  className=" w-full h-full"
                />
              )}
            </CardHeader>
            <div className="relative p-6 flex-auto">
              <p className="my-4 text-slate-500 text-lg leading-relaxed">
                Email: {loggedInUser.email}
              </p>
              <p className="my-4 text-slate-500 text-lg leading-relaxed">
                Date Joined: {loggedInUser.date}
              </p>
            </div>
            <div className="flex items-center justify-end p-6 border-t border-solid border-slate-200 rounded-b">
              <button
                className="text-red-500 background-transparent font-bold uppercase px-6 py-2 text-sm outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={onClose}
              >
                Close
              </button>
              <button
                className="bg-blue-500 text-white active:bg-emerald-600 font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
                type="button"
                onClick={onClose}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
}
