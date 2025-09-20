import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../../redux/actions/authActions";

export default function AuthWatcher() {
  const { token, expiresAt } = useSelector((s) => s.auth || {});
  const dispatch = useDispatch();

  useEffect(() => {
    let timer = null;

    const kickIfInvalid = () => {
      const now = Date.now();
      if (!token || !expiresAt || now >= expiresAt) dispatch(logoutUser());
    };

    kickIfInvalid();

    if (token && expiresAt) {
      const msLeft = expiresAt - Date.now();
      if (msLeft > 0) timer = setTimeout(() => dispatch(logoutUser()), msLeft);
    }

    const onVis = () => document.visibilityState === "visible" && kickIfInvalid();
    document.addEventListener("visibilitychange", onVis);

    const onStorage = (e) => {
      if (e.key === "token" && !e.newValue) dispatch(logoutUser());
      if (e.key === "expiresAt" && (!e.newValue || Date.now() >= Number(e.newValue))) dispatch(logoutUser());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("storage", onStorage);
    };
  }, [token, expiresAt, dispatch]);

  return null;
}
