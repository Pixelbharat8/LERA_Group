import Link from "next/link";

export default function Home() {
  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold mb-4">Welcome to LERA Academy Platform</h1>
      <p className="text-lg mb-6">Learning • Engagement • Result • Automation</p>
      <Link
        href="/auth/login"
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Go to Login
      </Link>
    </main>
  );
}
