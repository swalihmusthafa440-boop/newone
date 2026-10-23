
import React from "react";
import {
  FaShoppingCart,
  FaSearch,
  FaUserCircle,
  FaCamera,
  FaEdit,
  FaPhone,
  FaMapMarkerAlt,
  FaHome,
  FaChevronRight,
  FaSignOutAlt,
  FaHeart,
  FaThLarge,
  FaUser,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import "./accountpage.css";

function Profile() {

  const { user, logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Logged-in user's details
  const displayName = user
    ? [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ") || user.username || "My Account"
    : "My Account";

  const email = user?.email || "";
  const phone = user?.phone_number || user?.phone || "";

  // Sample address: replace with the logged-in user's saved address

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="profile-page">
      {/* Top Navbar */}
      <header className="profile-navbar">
        <div
          className="profile-brand"
          onClick={() => navigate("/")}
          role="button"
        >
          <div className="image">
            <img src="StatioMart.jpeg" />
          </div>
          
          <div className="brandname"/>
          <h1>
            StatioMart
          </h1>
        </div>


      </header>

      <main className="profile-content">
        {/* Logged-in User Information */}
        <section className="profile-user-card">
          <div className="profile-avatar">
            <FaUserCircle />

            <button
              className="camera-button"
              aria-label="Change profile photo"
              onClick={() => navigate("/edit-profile")}
            >
              <FaCamera />
            </button>
          </div>

          <div className="profile-user-info">
            <h2>{displayName}</h2>
            <p>{email}</p>
          </div>

          
        </section>

        {/* Delivery Address */}
        {/* Logout */}
        <button className="logout-card" onClick={handleLogout}>
          <span className="logout-icon"
          onClick={()=> navigate('/auth')}>
            <FaSignOutAlt />
          </span>

          <span className="logout-text">
            <strong>Logout</strong>
            <span>Sign out from your account</span>
          </span>

          <FaChevronRight className="logout-arrow" />
        </button>
      </main>

    </div>
  );
}

export default Profile;
