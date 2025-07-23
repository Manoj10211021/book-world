import { isLoggedInAtom } from "@/atoms/userData";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useRecoilState } from "recoil";
import { toast } from "sonner";

export const OauthLogin = () => {
  const [isLoggedIn, setIsLoggedIn] = useRecoilState(isLoggedInAtom);
  const navigate = useNavigate();

  return (
    <div className="w-fit mx-auto mb-6">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          let promise = axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/users/google-auth`,
            {
              token: credentialResponse.credential,
              auth_method: "google",
            }
          );
          toast.promise(promise, {
            loading: "Loading...",
            success: (response) => {
              const { token } = response.data;
              localStorage.setItem("token", token);
              setIsLoggedIn(true);
              navigate("/books");
              return response.data.message;
            },
            error: (error) => {
              if (
                error &&
                error.response &&
                error.response.data &&
                error.response.data.message
              ) {
                return error.response.data.message;
              }
              return "An unexpected error occurred. Please try again.";
            },
          });
        }}
        useOneTap
        auto_select
        shape="pill"
        theme="filled_black"
      />
    </div>
  );
};
