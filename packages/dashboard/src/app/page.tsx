import { Shield, Award, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Quasar Discord Bot
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            A powerful Discord moderation bot with advanced features to help you manage your community
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/auth/signin"
              className="rounded-md bg-[#5865F2] px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-[#4752C4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5865F2] transition-colors"
            >
              Login with Discord
            </a>
            <a
              href="/dashboard"
              className="text-lg font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Go to Dashboard <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <Shield className="h-12 w-12 text-[#5865F2] mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Advanced Moderation</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Powerful tools to keep your server safe and clean</p>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <Award className="h-12 w-12 text-[#5865F2] mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Leveling System</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Engage your community with XP and custom roles</p>
            </div>
          </div>
          <div className="rounded-lg border bg-white p-6 dark:bg-gray-800 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <MessageSquare className="h-12 w-12 text-[#5865F2] mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Welcome Messages</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-300">Customize how you greet new members</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

