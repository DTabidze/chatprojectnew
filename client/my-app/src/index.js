import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./components/App";
import Error from "./components/Error";
import Registration from "./components/Registration";
import Login from "./components/Login";
import MainPanel from "./components/MainPanel";
import AddNewContact from "./components/AddNewContact";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <Error />,
    children: [
      {
        path: "/mainpanel",
        element: <MainPanel />,
        errorElement: <Error />,
      },
      {
        path: "/login",
        element: <Login />,
        errorElement: <Error />,
      },
      {
        path: "/registration",
        element: <Registration />,
        errorElement: <Error />,
      },
      {
        path: "addnewcontact",
        element: <AddNewContact />,
        errorElement: <Error />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  // <React.StrictMode>
  <RouterProvider router={router} />
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// import React from "react";
// import ReactDOM from "react-dom";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./components/App";
// import Error from "./components/Error";
// import Registration from "./components/Registration";
// import Login from "./components/Login";
// import MainPanel from "./components/MainPanel";
// import AddNewContact from "./components/AddNewContact";
// import reportWebVitals from "./reportWebVitals";
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// const root = document.getElementById("root");
// const renderApp = () => {
//   createRoot(root).render(
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<App />} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/registration" element={<Registration />} />
//         <Route path="/mainpanel" element={<MainPanel />} />
//         <Route path="/addnewcontact" element={<AddNewContact />} />
//         <Route path="/*" element={<Error />} />
//       </Routes>
//     </BrowserRouter>
//   );
// };

// renderApp();

// reportWebVitals();
