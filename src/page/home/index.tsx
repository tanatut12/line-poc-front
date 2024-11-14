import React, { useState, useEffect } from "react";
import liff from "@line/liff";
import axios from "axios";

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null); // เพิ่ม state เก็บข้อมูล profile
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const LINE_OA_ID = "@@965fubnq";

  // Initialize LIFF when component mounts
  useEffect(() => {
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: "2005584837-9ljv7l55" });
        setIsLoggedIn(liff.isLoggedIn());
        // ถ้า login แล้วให้ดึงข้อมูล profile มาเก็บไว้
        if (liff.isLoggedIn()) {
          const userProfile = await liff.getProfile();
          const friendFlag = await liff.getFriendship();
          setProfile({ ...userProfile, isFriend: friendFlag.friendFlag });
        }
      } catch (err) {
        console.error("LIFF initialization failed", err);
        setError("Failed to initialize LIFF");
      }
    };
    initializeLiff();
  }, []);

  const handleAddToCart = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!liff.isLoggedIn()) {
        sessionStorage.setItem("pendingCartAction", "true");
        liff.login();
        return;
      }

      const profile = await liff.getProfile();
      const friendFlag = await liff.getFriendship();

      // เก็บข้อมูล profile ไว้แสดงผล
      setProfile({ ...profile, isFriend: friendFlag.friendFlag });

      if (!friendFlag.friendFlag) {
        sessionStorage.setItem("pendingAddFriend", "true");
        liff.openWindow({
          url: `https://line.me/R/ti/p/${LINE_OA_ID}`,
          external: true,
        });
        return;
      }

      console.log(
        "payload",
        JSON.stringify(
          {
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            statusMessage: profile.statusMessage,
            isFriend: friendFlag.friendFlag,
          },
          null,
          2
        )
      );

      alert("Item added to cart and LINE OA will send you a notification!");
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
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

  // ... rest of the code ...

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

        {/* แสดงข้อมูล Profile */}
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
      </div>
    </div>
  );
};

export default Home;
