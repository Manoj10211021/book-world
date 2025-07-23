import { useState, useEffect } from "react";
import axios from "axios";
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  isLoggedInAtom,
  isUserLoadingAtom,
  likedCommentsAtom,
  likedReviewsAtom,
  userAvatarSelector,
  userIdAtom,
  userRoleAtom,
  usersFavouriteBooksAtom,
} from "@/atoms/userData";

const useUserData = () => {
  const setUserRole = useSetRecoilState(userRoleAtom);
  const setUserId = useSetRecoilState(userIdAtom);
  const setUsersFavouriteBooks = useSetRecoilState(usersFavouriteBooksAtom);
  const setLikedReviews = useSetRecoilState(likedReviewsAtom);
  const setLikedComments = useSetRecoilState(likedCommentsAtom);
  const setIsUserLoading = useSetRecoilState(isUserLoadingAtom);
  const setUserAvatar = useSetRecoilState(userAvatarSelector);
  const [isLoggedIn, setIsLoggedIn] = useRecoilState(isLoggedInAtom);

  const fetchUser = async () => {
    setIsUserLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((response) => {
        setUserRole(response.data.user.role);
        setUserId(response.data.user._id);
        setUserAvatar(response.data.user.picture || "");
        setIsLoggedIn(true);
        setUsersFavouriteBooks(response.data.user.favoriteBooks || []);
        setLikedReviews(response.data.user.likedReviews || []);
        setLikedComments(response.data.user.likedComments || []);
      })
      .catch((error) => {
        if (
          error &&
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          console.log(error.response.data.message);
        } else {
          console.log("An unexpected error occurred. Please try again.");
        }
      })
      .finally(() => setIsUserLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn) {
      setUserRole("");
      setUserId("");
      setUserAvatar("");
      setUsersFavouriteBooks([]);
      setLikedReviews([]);
      setLikedComments([]);
      return;
    }
    fetchUser();
  }, [isLoggedIn]);

  return [isLoggedIn, setIsLoggedIn];
};

export default useUserData;
