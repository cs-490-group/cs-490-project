import { useForm } from "react-hook-form";
import { useFlash } from "../context/flashContext";
import "../styles/forgot.css";
import logo from "../logo.svg.png";

import AuthAPI from "../api/authentication";

const ForgotPassword = () => {
    
    const {
        handleSubmit,
        register,
        formState: { errors, isSubmitting },
        reset,
    } = useForm();
    

    const { flash, showFlash } = useFlash();

    const onSubmit = async (data) => {
    
        try {
            await AuthAPI.forgotPassword({ email: data.email });
            showFlash(
            "If your email exists, you will receive a password reset link.",
            "success",
            5000
            );
            reset();
        } catch (err) {
            showFlash(
            "Something went wrong, please try again with a different email or at a later time",
            "fail",
            5000
            );
        }
    };

    return (
    <div className="forgot-wrapper">
        <div className="forgot-page">
        <div className="forgot-card shadow">
            <div className="login-logo mb-3">
            <img
                src={logo}
                alt="Metamorphosis logo"
                className="login-logo-img"
            />
            </div>

            <h2 className="fw-bold mb-2">Forgot Password?</h2>
            <p className="text-muted mb-4">
            Enter the email address associated with your account and we’ll send
            you a password reset link.
            </p>

            <form className="Reset" onSubmit={handleSubmit(onSubmit)}>
            <input
                type="email"
                {...register("email", { required: true })}
                placeholder="Email"
                className="form-control mb-3"
            />
            <input
                type="submit"
                disabled={isSubmitting}
                className="btn btn-success w-100 fw-semibold"
                value={isSubmitting ? "Sending..." : "Send Reset Link"}
            />
            </form>
        </div>
        </div>
    </div>
    );
};

export default ForgotPassword;



// import { useForm } from "react-hook-form";
// import { useFlash } from "../context/flashContext";
// import AuthAPI from "../api/authentication";

// const ForgotPassword = () => {

//     const {
//         handleSubmit,
//         register,
//         formState: { errors },
//         reset,
//     } = useForm();

//     const { flash, showFlash } = useFlash();

//     const onSubmit = async (data) => {

//         try {
//             await AuthAPI.forgotPassword({ email: data.email })
//             showFlash('If your email exists, you will receive a password reset link.', "success", 5000);
//             reset();
//         } catch (err) {
//             showFlash("Something went wrong, please try again with a different email or at a later time", "fail", 5000)
//         }
//     };

//     return (
//         <>
//             <p>Enter email address associated with your account.</p>
//             <form className="Reset" onSubmit={handleSubmit(onSubmit)}>

//                 <input type="email"
//                     {...register("email", { required: true })}
//                     placeholder="Email"
//                 ></input>

//                 <input type="submit"></input>
//             </form>
//         </>
//     );

// }

// export default ForgotPassword;