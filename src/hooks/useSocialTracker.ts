import { useState, useEffect, useCallback } from 'react';

// Convert milliseconds to seconds
const msToSeconds = (ms: number) => Math.round(ms / 1000 * 10) / 10; // Round to 1 decimal

export const useSocialTracker = () => {
    const [pendingVisit, setPendingVisit] = useState<{ linkName: string; clickId: number; clickTime: number } | null>(null);

    const trackClick = useCallback(async (linkName: string) => {
        const clickTime = Date.now();

        try {
            const res = await fetch('/api/tracking/social-click', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform: linkName }),
            });

            if (res.ok) {
                const { data } = await res.json() as { data: { socialClickId: number } };
                setPendingVisit({ linkName, clickId: data.socialClickId, clickTime });
            }

            // Dispatch Global Event for Algorithm.tsx (Session Recording)
            window.dispatchEvent(new CustomEvent('revil:social_click', {
                detail: { name: linkName }
            }));

        } catch (error) {
            console.error('Error tracking social click:', error);
        }
    }, []);

    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && pendingVisit) {
                const endTime = Date.now();
                const durationMs = endTime - pendingVisit.clickTime;
                const durationSec = msToSeconds(durationMs);

                try {
                    await fetch(`/api/tracking/social-click/${pendingVisit.clickId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ durationSeconds: durationSec }),
                    });

                    // Dispatch Global Event for Algorithm.tsx (Session Recording)
                    window.dispatchEvent(new CustomEvent('revil:social_return', {
                        detail: { name: pendingVisit.linkName, duration: durationMs }
                    }));

                } catch (error) {
                    console.error('Error tracking social return:', error);
                } finally {
                    setPendingVisit(null);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [pendingVisit]);

    return { trackClick };
};
