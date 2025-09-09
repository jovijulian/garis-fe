import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signin | GARIS PT. Cisangkan",
};

export default function SignIn() {
  return <SignInForm />;
}
