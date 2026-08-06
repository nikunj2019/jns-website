import type { Metadata } from "next";
import GolfHeader from "../components/GolfHeader";
import JNSBar from "../components/JNSBar";
import AuthLanding from "./AuthLanding";

export const metadata: Metadata = {
  title: "Signing in",
  description: "Complete your sign-in for the Stonegate Golf Scramble.",
};

export default function AuthPage() {
  return (
    <>
      <GolfHeader title="Sign In" />
      <main className="mx-auto flex w-full max-w-md flex-1 items-center px-5 py-10">
        <div className="w-full">
          <AuthLanding />
        </div>
      </main>
      <JNSBar compact />
    </>
  );
}
