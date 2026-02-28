import type { NextPageContext } from "next";
import Head from "next/head";
import Link from "next/link";

interface ErrorProps {
  statusCode?: number;
}

function Error({ statusCode }: ErrorProps) {
  const title = statusCode === 404 ? "Page not found" : "An error occurred";
  const message =
    statusCode === 404
      ? "The page you're looking for doesn't exist."
      : statusCode
      ? `An error ${statusCode} occurred on the server.`
      : "An error occurred in the browser.";

  return (
    <>
      <Head>
        <title>{title} – Spendly</title>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          fontFamily: "var(--font-sans)",
          background: "var(--color-bg)",
          color: "var(--color-text)",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{statusCode ?? "Error"}</h1>
        <p style={{ color: "var(--color-text-muted)", marginBottom: "1.5rem" }}>{message}</p>
        <Link
          href="/dashboard"
          style={{
            padding: "10px 20px",
            background: "var(--color-text)",
            color: "var(--color-bg)",
            borderRadius: "8px",
            fontWeight: 500,
          }}
        >
          Back to Dashboard
        </Link>
      </main>
    </>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
