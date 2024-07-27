'use client';

import { useAtom } from 'jotai';

import { createSession, removeSession } from '@/lib/actions/auth';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@/lib/firebase/auth';
import { addUser } from '@/lib/firebase/firestore';
import { userAtom } from '@/lib/state';

const Auth = () => {
  const [user, setUser] = useAtom(userAtom);

  const handleSignIn = async () => {
    const user = await signInWithEmailAndPassword('hasebok3@gmail.com', 'Passw0rd');
    if (user) {
      console.log(`User ${user.uid} signined`);
      setUser(user);
      await createSession(user.uid);
    }
  };

  const handleSignUp = async () => {
    const user = await createUserWithEmailAndPassword('hasebok3@gmail.com', 'Passw0rd');
    if (user) {
      console.log(`User ${user.uid} created`);
      setUser(user);
      await createSession(user.uid);
      await addUser(user.uid, user.email as string);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    await removeSession();
    setUser(null);
  };

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center gap-4">
        <button className="rounded bg-primary px-4 py-2 font-bold text-white" onClick={handleSignUp}>
          Sign up
        </button>
        <button className="rounded bg-primary px-4 py-2 font-bold text-white" onClick={handleSignIn}>
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <button className="rounded bg-primary px-4 py-2 font-bold text-white" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
};

export default Auth;
