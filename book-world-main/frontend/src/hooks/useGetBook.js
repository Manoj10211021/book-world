import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

const useGetBook = () => {
  const [book, setBook] = useState();
  const [isDetailLoading, setIsDetailLoading] = useState(true);
  let { id } = useParams();
  useEffect(() => {
    setIsDetailLoading(true);
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/books/` + id)
      .then((response) => {
        setBook(response.data.book);
      })
      .catch((err) => {
        if (
          err &&
          err.response &&
          err.response.data &&
          err.response.data.message
        ) {
          toast.error(err.response.data.message);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
      })
      .finally(() => setIsDetailLoading(false));
  }, [id]);

  return { book, id, isDetailLoading };
};
export default useGetBook;
