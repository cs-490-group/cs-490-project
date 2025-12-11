import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useFlash } from "../context/flashContext";
import AuthAPI from "../api/authentication";
import "../styles/login.css";
import logo from "../logo.svg.png";

const ResetPassword = () => {
  const { token } = useParams();
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(true);

  const { handleSubmit, register, formState: { errors } } = useForm();
  const { flash, showFlash } = useFlash();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await AuthAPI.resetPassword(token);
        if (!res) {
          setRes(null);
          console.log("NO OR NULL RESPONSE");
          return;
        }
        const json = await res.data;
        setRes(json);
      } catch (err) {
        console.error(err);
        setRes(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const onSubmit = async (data) => {
    try {
      data.old_token = token;
      const res = await AuthAPI.updatePassword(data);
      if (!res) {
        showFlash("Something went wrong", "error");
        return;
      }

      if (res.status !== 200) {
        showFlash(res.data.detail || "Error", "error");
        return;
      }

      localStorage.setItem("session", res.data.session_token);
      localStorage.setItem("uuid", res.data.uuid);

      navigate(`/dashboard`);

      //For going to login
      //showFlash("Password reset successful! Please login with your new password.", "success");
      //navigate(`/login`);
    } catch (err) {
      console.error(err);
      showFlash("Something went wrong", "error");
    }
  };

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card shadow">
          <div className="login-logo mb-3">
            <img src={logo} alt="Metamorphosis logo" className="login-logo-img" />
          </div>
          <p className="text-center text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!res) {
    return (
      <div className="login-page">
        <div className="login-card shadow">
          <div className="login-logo mb-3">
            <img src={logo} alt="Metamorphosis logo" className="login-logo-img" />
          </div>
          <h2 className="fw-bold mb-3 text-center">Invalid Link</h2>
          <p className="text-muted mb-4 text-center">
            The password reset link has expired or does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card shadow">
        <div className="login-logo mb-3">
          <img src={logo} alt="Metamorphosis logo" className="login-logo-img" />
        </div>

        <h2 className="fw-bold mb-3">Reset Password</h2>
        <p className="text-muted mb-4">
          Enter your new password for <strong>Metamorphosis</strong>.
        </p>

        <form className="Reset" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" value={res.uuid} {...register("token")} />

          <input
            type="password"
            minLength="8"
            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$"
            {...register("password", { required: true })}
            placeholder="Enter new password"
            title="Password must be minimum 8 characters with at least 1 uppercase, 1 lowercase, 1 number"
            className="form-control mb-3"
          />
          {errors.password && (
            <p className="text-danger mb-2">Password is required</p>
          )}

          <input
            type="password"
            {...register("confirm", {
              required: true,
              validate: (value, data) =>
                value === data.password || "Passwords must match.",
            })}
            placeholder="Confirm new password"
            className="form-control mb-3"
          />
          {errors.confirm && (
            <p className="text-danger mb-3">
              {errors.confirm.message || "Confirmation is required"}
            </p>
          )}

          <input
            type="submit"
            className="btn btn-success w-100 fw-semibold"
            value="Reset Password"
          />
        </form>

      </div>
    </div>
  );
};

export default ResetPassword;