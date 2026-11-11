import { useEffect, useRef } from 'react';

/**
 * Makes the phone's own Back button (or swipe) leave a round and return to the topic
 * list, instead of leaving the whole app. While a round is open we add one history entry;
 * Back removes it, and leaving the round with the on-screen button removes it too.
 */
export function useTopicBackButton(topicId: string | null, leaveRound: () => void): void {
  const pushed = useRef(false);
  const leaveRef = useRef(leaveRound);
  leaveRef.current = leaveRound;

  useEffect(() => {
    try {
      if (topicId) {
        if (!pushed.current) {
          window.history.pushState({ kiyuvRound: true }, '');
          pushed.current = true;
        }
      } else if (pushed.current) {
        pushed.current = false;
        if ((window.history.state as { kiyuvRound?: boolean } | null)?.kiyuvRound) window.history.back();
      }
    } catch {
      // history unavailable: the on-screen button still works
    }
  }, [topicId]);

  useEffect(() => {
    const onPop = () => {
      if (!pushed.current) return;
      pushed.current = false;
      leaveRef.current();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
}
