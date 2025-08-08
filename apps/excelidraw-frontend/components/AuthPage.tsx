"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { AtSign, Lock, User } from "lucide-react";
import { z } from "zod";
import { AxiosError } from "axios";

import Logo from "./landingpage/Logo";
import { CreateUserSchema, SigninSchema } from "@repo/common/types";
import { signin, signup } from "@/utils/api";
import { setTokenCookie } from "@/utils/cookies";

// A single component for input fields to keep the form clean
const AuthInput = ({ name, type, placeholder, value, onChange, icon: Icon }: any) => (
  <div className="relative w-full">
    <span className="absolute left-3 top-1/2 -translate-y-1/2">
      <Icon className="text-zinc-500" size={20} />
    </span>
    <input
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full rounded-md border border-zinc-700 bg-zinc-800 py-3 pl-11 text-white placeholder-zinc-500 transition-colors duration-300 focus:border-blue-500 focus:outline-none"
      required
    />
  </div>
);

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      // Client-side validation with Zod
      const schema = isSignin ? SigninSchema : CreateUserSchema;
      schema.parse(formData);

      const apiCall = isSignin ? signin(formData) : signup(formData);
      const response = await toast.promise(apiCall, {
        loading: "Processing...",
        success: isSignin ? "Sign-in successful!" : "Account created!",
        error: (err : any) => err.response?.data?.message || "An unexpected error occurred.",
      });

      if (isSignin && response) {
        localStorage.setItem("token", response.token);
        localStorage.setItem("user", response.username);
        localStorage.setItem("userId", response.userId);
        await setTokenCookie(response.token);
      }

      const pendingRoomId = localStorage.getItem("pendingRoomId");
      if (pendingRoomId) {
        localStorage.removeItem("pendingRoomId");
        router.push(`/room/?roomId=${pendingRoomId}`);
      } else {
        router.push(isSignin ? "/room" : "/signin");
      }
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message); // Show the first validation error
      } else if (!(err instanceof AxiosError)) {
        // Only toast for non-axios errors, as the promise toast already handles them
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-950 p-4">
      <motion.div
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl shadow-blue-900/10 backdrop-blur-sm"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <motion.form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-6"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <Logo />
          </motion.div>

          <motion.h1 className="text-3xl font-bold text-white" variants={itemVariants}>
            {isSignin ? "Welcome Back" : "Create Account"}
          </motion.h1>

          {!isSignin && (
            <motion.div className="w-full" variants={itemVariants}>
              <AuthInput
                name="name"
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                icon={User}
              />
            </motion.div>
          )}

          <motion.div className="w-full" variants={itemVariants}>
            <AuthInput
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              icon={AtSign}
            />
          </motion.div>

          <motion.div className="w-full" variants={itemVariants}>
            <AuthInput
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              icon={Lock}
            />
          </motion.div>

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 py-3 font-bold text-white transition-all duration-300 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-600"
            variants={itemVariants}
          >
            {isLoading ? "Processing..." : isSignin ? "Sign In" : "Sign Up"}
          </motion.button>

          <motion.p className="text-sm text-zinc-400" variants={itemVariants}>
            {isSignin ? "Don't have an account?" : "Already have an account?"}{" "}
            <Link
              href={isSignin ? "/signup" : "/signin"}
              className="font-semibold text-blue-500 transition-colors hover:text-blue-400"
            >
              {isSignin ? "Sign Up" : "Sign In"}
            </Link>
          </motion.p>
        </motion.form>
      </motion.div>
    </div>
  );
}