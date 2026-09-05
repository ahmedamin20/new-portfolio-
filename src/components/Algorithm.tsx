import { useEffect, useRef, useCallback } from 'react';
import Alert from './Alert';
import useSafeAlert from '../hooks/useSafeAlert';

interface AlgorithmProps {
    currentSection: string;
    isContactOpen: boolean;
    // parameter name intentionally unused in the type signature
    onNavigate: (_section: 'home' | 'stack' | 'projects' | 'secret' | 'dashboard' | 'view_link') => void;
}

interface ProjectStats {
    views: number;
    duration: number; // seconds
}

interface LinkBaseline {
    id: number;
    interviewer: boolean;
    totalSessionSeconds: number;
    stackSeconds: number;
    contactOpens: number;
    projects: { projectId: number; seconds: number; views: number }[];
    socials: { platform: string; seconds: number; views: number }[];
}

export const Algorithm = ({ currentSection, isContactOpen, onNavigate }: AlgorithmProps) => {
    const { alert, showAlert, hideAlert } = useSafeAlert(4000);

    // Session Start
    const sessionStart = useRef(0);

    // Metrics Refs
    const metrics = useRef({
        stackTime: 0, // seconds
        contactOpens: 0,
        projectStats: {} as Record<string, ProjectStats>,
        activeProjectId: null as string | null,
        projectOpenTime: 0,
        socialStats: {} as Record<string, { views: number; duration: number }>,
        isSyncing: false,
    });

    // Link code + baseline for the final keepalive sync
    const linkCodeRef = useRef<string | null>(null);

    // Tracking active section time
    const lastSectionCheck = useRef(0);

    // Initialize time refs on mount (avoids calling Date.now() during render)
    useEffect(() => {
        sessionStart.current = Date.now();
        lastSectionCheck.current = Date.now();
    }, []);

    // Contact Open Tracking
    const prevContactOpen = useRef(isContactOpen);

    // 1. Track Section Time & Contact Clicks
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - lastSectionCheck.current) / 1000;

            if (currentSection === 'stack') {
                metrics.current.stackTime += elapsed;
            }

            // Update project time if one is open
            if (metrics.current.activeProjectId) {
                const pid = metrics.current.activeProjectId;
                if (!metrics.current.projectStats[pid]) {
                    metrics.current.projectStats[pid] = { views: 0, duration: 0 };
                }
                metrics.current.projectStats[pid].duration += elapsed;
            }

            lastSectionCheck.current = now;
        }, 1000);

        // Stop tracking if we enter admin sections
        if (currentSection === 'dashboard' || currentSection === 'secret') {
            sessionStorage.removeItem('revil_link_id');
            linkCodeRef.current = null;
        }

        return () => clearInterval(interval);
    }, [currentSection]);

    // Track Contact Opens
    useEffect(() => {
        if (isContactOpen && !prevContactOpen.current) {
            metrics.current.contactOpens += 1;
        }
        prevContactOpen.current = isContactOpen;
    }, [isContactOpen]);

    // 1.5 Helper to increment the project-view daily/summary counters
    const incrementProjectViewStat = useCallback(() => {
        fetch('/api/tracking/project-view', { method: 'POST' }).catch(() => {});
    }, []);

    // 2. Listen for Project Events & Social Events
    useEffect(() => {
        const handleProjectOpen = (e: CustomEvent) => {
            const { id } = e.detail;
            metrics.current.activeProjectId = id;
            metrics.current.projectOpenTime = Date.now();

            if (!metrics.current.projectStats[id]) {
                metrics.current.projectStats[id] = { views: 0, duration: 0 };
            }
            metrics.current.projectStats[id].views += 1;
            incrementProjectViewStat();
        };

        const handleProjectClose = () => {
            metrics.current.activeProjectId = null;
        };

        const handleSocialClick = (e: CustomEvent) => {
            const { name } = e.detail;
            // Counter increment + SocialClick row creation is handled by useSocialTracker's
            // own POST /api/tracking/social-click call — this listener only tracks
            // per-link duration/views for the final session sync.
            if (!metrics.current.socialStats[name]) {
                metrics.current.socialStats[name] = { views: 0, duration: 0 };
            }
            metrics.current.socialStats[name].views += 1;
        };

        const handleSocialReturn = (e: CustomEvent) => {
            const { name, duration } = e.detail;
            // duration comes in ms from hook, convert to seconds
            const durationSec = duration / 1000;
            if (!metrics.current.socialStats[name]) {
                metrics.current.socialStats[name] = { views: 0, duration: 0 };
            }
            metrics.current.socialStats[name].duration += durationSec;
        };

        window.addEventListener('revil:project_open', handleProjectOpen as EventListener);
        window.addEventListener('revil:project_close', handleProjectClose as EventListener);
        window.addEventListener('revil:social_click', handleSocialClick as EventListener);
        window.addEventListener('revil:social_return', handleSocialReturn as EventListener);

        return () => {
            window.removeEventListener('revil:project_open', handleProjectOpen as EventListener);
            window.removeEventListener('revil:project_close', handleProjectClose as EventListener);
            window.removeEventListener('revil:social_click', handleSocialClick as EventListener);
            window.removeEventListener('revil:social_return', handleSocialReturn as EventListener);
        };
    }, [incrementProjectViewStat]);

    // 2.5 Global Analytics Tracking
    const hasTrackedVisit = useRef(false);
    useEffect(() => {
        const trackGlobalVisit = () => {
            if (hasTrackedVisit.current || currentSection === 'dashboard' || currentSection === 'secret') return;
            hasTrackedVisit.current = true;

            try {
                const today = new Date().toISOString().split('T')[0];
                const hasVisitedToday = !!localStorage.getItem(`revil_visitor_today_${today}`);
                if (!hasVisitedToday) {
                    localStorage.setItem(`revil_visitor_today_${today}`, 'true');
                }

                fetch('/api/tracking/visit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isNewUnique: !hasVisitedToday }),
                }).catch(() => {});
            } catch (error) {
                console.error("Global Analytics Error:", error);
            }
        };

        trackGlobalVisit();
    }, [currentSection]);

    // 2.6 Initial Link Recording & Verification
    const hasRecordedRef = useRef(false);
    useEffect(() => {
        const recordLink = async () => {
            if (hasRecordedRef.current) return;

            const path = window.location.pathname;
            const pathParts = path.split('/').filter(Boolean);
            const baseParts = "/".split('/').filter(Boolean);
            const code = pathParts.length > baseParts.length ? pathParts[pathParts.length - 1] : '';

            if (!code) return;
            hasRecordedRef.current = true;

            try {
                const res = await fetch(`/api/tracking/links/${encodeURIComponent(code)}`);
                if (!res.ok) {
                    if (onNavigate) setTimeout(() => onNavigate('home'), 500);
                    return;
                }

                const { data } = await res.json() as { data: LinkBaseline };

                linkCodeRef.current = code;
                sessionStorage.setItem('revil_link_id', code);

                if (data.interviewer) {
                    sessionStorage.setItem('revil_interviewer_mode', 'true');
                } else {
                    sessionStorage.removeItem('revil_interviewer_mode');
                }

                // Always redirect home after processing code
                if (onNavigate) {
                    setTimeout(() => onNavigate('home'), 500);
                }
            } catch {
                showAlert({ type: 'error', message: 'Failed to record link activity.' });
                if (onNavigate) {
                    setTimeout(() => onNavigate('home'), 500);
                }
            }
        };

        recordLink();
    }, [onNavigate, showAlert]);

    // Only Sync at the very end — using keepalive fetch for reliability
    useEffect(() => {
        const handleFinalSync = () => {
            const linkCode = sessionStorage.getItem('revil_link_id');
            if (!linkCode || metrics.current.isSyncing) return;

            const totalSessionSeconds = Math.floor((Date.now() - sessionStart.current) / 1000);
            const m = metrics.current;

            // Skip if no meaningful activity
            if (totalSessionSeconds < 5 && m.contactOpens === 0 && Object.keys(m.projectStats).length === 0 && Object.keys(m.socialStats).length === 0) {
                return;
            }

            metrics.current.isSyncing = true;

            const body = JSON.stringify({
                sessionSeconds: totalSessionSeconds,
                stackSeconds: Math.round(m.stackTime),
                contactOpens: m.contactOpens,
                projects: Object.entries(m.projectStats).map(([projectId, stats]) => ({
                    projectId: Number(projectId),
                    seconds: Math.round(stats.duration),
                    views: stats.views,
                })),
                socials: Object.entries(m.socialStats).map(([platform, stats]) => ({
                    platform,
                    seconds: Math.round(stats.duration),
                    views: stats.views,
                })),
            });

            // keepalive: true ensures the request survives page navigation/close
            fetch(`/api/tracking/links/${encodeURIComponent(linkCode)}/sync`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body,
                keepalive: true,
            }).catch(() => {
                // Silent fail — page is already closing
            });

            metrics.current.isSyncing = false;
        };

        window.addEventListener('beforeunload', handleFinalSync);
        window.addEventListener('pagehide', handleFinalSync);

        return () => {
            window.removeEventListener('beforeunload', handleFinalSync);
            window.removeEventListener('pagehide', handleFinalSync);
        };
    }, []);

    return (
        <>
            {alert?.show && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => hideAlert()}
                    duration={alert.duration ?? 4000}
                />
            )}
        </>
    );
};
