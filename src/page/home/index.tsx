import React, { useState, useEffect } from "react";
import liff from "@line/liff";
import axios from "axios";

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const LINE_OA_ID = "@@965fubnq";

  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: "2005584837-9ljv7l55" });
        if (liff.isLoggedIn()) {
          const userProfile = await liff.getProfile();
          const friendFlag = await liff.getFriendship();
          setProfile({ ...userProfile, isFriend: friendFlag.friendFlag });
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.error("LIFF initialization failed", err);
        setError("Failed to initialize LIFF");
      }
    };
    initializeLiff();
  }, []);

  const callAddToCartAPI = async (userId: string, displayName: string) => {
    const payload = {
      customer: {
        lineID: userId,
        name: displayName,
      },
      items: [
        {
          ean: "8851111115037",
          quantity: 5,
        },
      ],
    };

    console.log("Calling API with payload:", payload);
    const response = await axios.post(
      "http://localhost:4000/cart-item/gmol",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  };

  const handleAddToCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!liff.isLoggedIn()) {
        console.log("Step 1: Logging in...");
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      const friendFlag = await liff.getFriendship();
      setProfile({ ...profile, isFriend: friendFlag.friendFlag });

      if (!friendFlag.friendFlag) {
        console.log("Step 2: Adding friend...");
        window.location.href = `https://line.me/R/ti/p/${LINE_OA_ID}`;
        return;
      }

      console.log("Step 3: Calling API...");
      const result = await callAddToCartAPI(
        profile.userId,
        profile.displayName
      );
      console.log("API Result:", result);
      alert("Successfully added to cart!");
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    liff.logout();
    setIsLoggedIn(false);
    setProfile(null);
    window.location.reload();
  };

  useEffect(() => {
    const handleRedirect = async () => {
      if (!liff.isLoggedIn()) return;

      try {
        const profile = await liff.getProfile();
        const friendFlag = await liff.getFriendship();

        if (friendFlag.friendFlag) {
          const result = await callAddToCartAPI(
            profile.userId,
            profile.displayName
          );
          console.log("API Result after redirect:", result);
          alert("Successfully added to cart!");
        }
      } catch (err) {
        console.error("Error after redirect:", err);
        setError("Failed to process after redirect.");
      }
    };

    handleRedirect();
  }, [isLoggedIn]);

  return (
    <div className="h-screen flex justify-center items-center bg-slate-700">
      <div className="flex flex-col p-36 rounded-xl bg-yellow-200 border-4 border-yellow-700">
        <h1 className="text-5xl mb-4">Cart</h1>

        <div className="text-sm mb-4">
          Status: {isLoggedIn ? "Logged In" : "Not Logged In"}
        </div>

        <div className="flex gap-2">
          <button
            className={`px-8 py-2 rounded-xl transition-colors ${
              isLoading
                ? "bg-yellow-300 cursor-not-allowed"
                : "bg-yellow-500 hover:bg-yellow-600"
            }`}
            onClick={handleAddToCart}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Add to Cart"}
          </button>

          {isLoggedIn && (
            <button
              className="px-8 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>

        {profile && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <div className="flex items-center gap-4">
              <img
                src={profile.pictureUrl}
                alt="Profile"
                className="w-16 h-16 rounded-full"
              />
              <div>
                <p className="font-semibold">{profile.displayName}</p>
                <p className="text-sm text-gray-600">{profile.statusMessage}</p>
                <p className="text-xs text-gray-500">ID: {profile.userId}</p>
                <p className="text-xs text-gray-500">
                  Friend Status: {profile.isFriend ? "Friend" : "Not Friend"}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-200 text-red-800 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
