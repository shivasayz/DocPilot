import { createFileRoute } from "@tanstack/react-router";
import { SignupPage } from "@/pages/signup";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Sign up — DocPilot" }],
  }),
  component: SignupPage,
});
