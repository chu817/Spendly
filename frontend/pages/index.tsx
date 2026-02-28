import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return (
    <>
      <Head>
        <title>Spendly</title>
        <meta name="description" content="Impulse spending behaviour analytics dashboard" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main className="appShell">
        <p className="muted">Redirecting to dashboard…</p>
      </main>
    </>
  );
}
