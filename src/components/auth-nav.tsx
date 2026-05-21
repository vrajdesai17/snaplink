import { auth, signOut } from "@/auth";
import Link from "next/link";
import Image from "next/image";

export async function AuthNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <Link
        href="/auth/signin"
        className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {session.user.image && (
        <Image
          src={session.user.image}
          alt={session.user.name ?? ""}
          width={28}
          height={28}
          className="rounded-full"
        />
      )}
      <span className="text-sm text-zinc-400 hidden sm:block truncate max-w-[140px]">
        {session.user.name}
      </span>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
