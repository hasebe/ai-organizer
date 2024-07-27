'use client';

import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';

import NewNotebookCard from '@/components/new-notebook-card';
import NotebookCard from '@/components/notebook-card';
import { getNotebooksSnapshot } from '@/lib/firebase/firestore';
import { useUserId } from '@/lib/hooks/auth';
import { notebooksAtom, notesAtom, sourcesAtom } from '@/lib/state';

const NotebooksLayout = () => {
  const [notebooks, setNotebooks] = useAtom(notebooksAtom);

  const setSources = useSetAtom(sourcesAtom);
  const setNotes = useSetAtom(notesAtom);

  const resetState = () => {
    setSources([]);
    setNotes([]);
    console.log('reset');
  };

  const uid = useUserId();

  useEffect(() => {
    if (!uid) return;

    const unsubscribe = getNotebooksSnapshot(uid, (data) => {
      setNotebooks(data);
    });

    resetState();

    return () => {
      unsubscribe();
    };
  }, [uid]);

  return (
    <div className="max-w-screen-lg px-4 pb-4 pt-12">
      <p className="my-8 h-8 text-2xl">ノートブック</p>
      <div className="flex flex-wrap gap-8">
        <NewNotebookCard />
        {notebooks.map((notebook) => {
          const { id, title, sourceCount, createdAt } = notebook;
          return <NotebookCard key={notebook.id} id={id} title={title} count={sourceCount} createdAt={createdAt} />;
        })}
      </div>
    </div>
  );
};

export default NotebooksLayout;
