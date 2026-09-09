import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: () => {
    // Check if the user session exists in localStorage
    const savedUser = localStorage.getItem("leadspilot_user");

    // Redirect unauthenticated users to the login page
    if (!savedUser) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return <Outlet />;
}