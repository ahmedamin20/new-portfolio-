import { useEffect, useRef } from "react";

export function usePolling(fn: () => void | Promise<void>, intervalMs: number, enabled: boolean = true) {
    const fnRef = useRef(fn);

    useEffect(() => {
        fnRef.current = fn;
    });

    useEffect(() => {
        if (!enabled) return;

        const tick = () => {
            if (document.visibilityState === "visible") {
                void fnRef.current();
            }
        };

        tick();
        const id = setInterval(tick, intervalMs);

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") tick();
        };
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            clearInterval(id);
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [intervalMs, enabled]);
}
