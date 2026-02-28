import { useEffect } from "react";
import { useRouter } from "next/router";

/** Redirect to dashboard - user list is on main dashboard per plan */
export default function CardsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
