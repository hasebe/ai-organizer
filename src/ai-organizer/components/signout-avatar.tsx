'use client';

import { useSetAtom } from 'jotai';

import { removeSession } from '@/lib/actions/auth';
import { signOut } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/client-app';
import { userAtom } from '@/lib/state';

const SignOutAvatar = () => {
  const user = auth.currentUser;
  const setUser = useSetAtom(userAtom);

  const handleClick = async () => {
    await signOut();
    setUser(null);
    await removeSession();
  };

  return (
    <p
      className="ml-3 flex size-9 min-w-9 cursor-pointer items-center justify-center rounded-full bg-purple-600 text-lg font-bold text-white"
      onClick={handleClick}
    >
      {user && user.email?.at(2)}
    </p>
  );
};

export default SignOutAvatar;
