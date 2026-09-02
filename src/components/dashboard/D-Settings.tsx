import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import anime from 'animejs';
import { Plus, Trash2, Edit2, X, Save, Upload, User, Sliders, Code, Briefcase, Clock, ChevronDown, ZoomIn, Check, Link, GraduationCap, TrendingUp, Languages } from 'lucide-react';
const DEFAULT_HERO_URL = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
import Cropper from 'react-easy-crop';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { apiFetch } from '../../lib/apiFetch';
import Alert, { AlertType } from '../Alert';
import MHandlingProject, { HandlingProject } from './M-HandlingProject';
import MStackItem, { StackItemData } from './M-StackItem';
import Loader from '../reactbits/Loader';
import MConfirmModal from './M-ConfirmModal';
// Replaced failing ui-avatars.com with a local icon-based placeholder logic


interface StackItem {
    id: string;
    name: string;
    icon: string;
}


const timezones = [
    { label: 'UTC-12:00', value: -12 },
    { label: 'UTC-11:00', value: -11 },
    { label: 'UTC-10:00', value: -10 },
    { label: 'UTC-09:00', value: -9 },
    { label: 'UTC-08:00 (PST)', value: -8 },
    { label: 'UTC-07:00 (MST)', value: -7 },
    { label: 'UTC-06:00 (CST)', value: -6 },
    { label: 'UTC-05:00 (EST)', value: -5 },
    { label: 'UTC-04:00', value: -4 },
    { label: 'UTC-03:00', value: -3 },
    { label: 'UTC-02:00', value: -2 },
    { label: 'UTC-01:00', value: -1 },
    { label: 'UTC+00:00 (GMT)', value: 0 },
    { label: 'UTC+01:00 (CET)', value: 1 },
    { label: 'UTC+02:00 (EET)', value: 2 },
    { label: 'UTC+03:00 (MSK)', value: 3 },
    { label: 'UTC+04:00', value: 4 },
    { label: 'UTC+05:00', value: 5 },
    { label: 'UTC+05:30 (IST)', value: 5.5 },
    { label: 'UTC+06:00', value: 6 },
    { label: 'UTC+07:00', value: 7 },
    { label: 'UTC+08:00 (CST)', value: 8 },
    { label: 'UTC+09:00 (JST)', value: 9 },
    { label: 'UTC+10:00 (AEST)', value: 10 },
    { label: 'UTC+11:00', value: 11 },
    { label: 'UTC+12:00 (NZST)', value: 12 },
];

// Helper to create the cropped image
const createImage = (url: string, useCrossOrigin: boolean = true): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        if (useCrossOrigin && url.startsWith('http')) {
            image.setAttribute('crossOrigin', 'anonymous');
        }
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        // Add a timestamp to bypass local cache which might have stored a non-CORS response
        const cacheBuster = url.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
        const finalUrl = url.startsWith('http') ? (url + cacheBuster) : url;
        image.src = finalUrl;
    });

const getCroppedImg = (imageSrc: string, pixelCrop: unknown): Promise<File> => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const image = await createImage(imageSrc);

                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('No 2d context'));
                    return;
                }

                const pc = pixelCrop as { width?: number; height?: number; x?: number; y?: number } | null;
                if (!pc || pc.width === undefined || pc.height === undefined || pc.width <= 0 || pc.height <= 0) {
                    reject(new Error(`Invalid crop dimensions: ${JSON.stringify(pixelCrop)}`));
                    return;
                }
                canvas.width = pc.width as number;
                canvas.height = pc.height as number;

                ctx.drawImage(
                    image,
                    pc.x as number,
                    pc.y as number,
                    pc.width as number,
                    pc.height as number,
                    0,
                    0,
                    pc.width as number,
                    pc.height as number
                );

                canvas.toBlob((blob) => {
                    if (!blob) {
                        console.error('[getCroppedImg] canvas.toBlob returned null');
                        reject(new Error('Canvas is empty'));
                        return;
                    }

                    const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
                    resolve(file);
                }, 'image/jpeg');
            } catch (e) {
                reject(e);
            }
        })();
    });
};


export default function DSettings() {
    const [isLoading, setIsLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<'availability' | 'stack' | 'account'>('availability');
    const [availability, setAvailability] = useState(75);
    const [selectedTimezone, setSelectedTimezone] = useState(2);
    const [currentTime, setCurrentTime] = useState('');
    const [timezoneDropdownOpen, setTimezoneDropdownOpen] = useState(false);
    const [handlingProjects, setHandlingProjects] = useState<HandlingProject[]>([]);
    const [projectModalOpen, setProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<HandlingProject | null>(null);
    const timezoneRef = useRef<HTMLDivElement>(null);

    // Stack state
    const [stackItems, setStackItems] = useState<StackItem[]>([]);
    const [stackModalOpen, setStackModalOpen] = useState(false);
    const [editingStack, setEditingStack] = useState<StackItem | null>(null);

    // Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    const [heroImagePreview, setHeroImagePreview] = useState<string>(DEFAULT_HERO_URL);
    const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
    const heroImageInputRef = useRef<HTMLInputElement>(null);

    const [profileImagePreview, setProfileImagePreview] = useState<string>('');
    const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
    const profileImageInputRef = useRef<HTMLInputElement>(null);

    // Profile info state (editable)
    const [profileName, setProfileName] = useState<string>('Your Name');
    const [profileTitle, setProfileTitle] = useState<string>('Job Title');
    const [profileBio, setProfileBio] = useState<string>('');
    const [profileEmail, setProfileEmail] = useState<string>('');
    const [profilePhone, setProfilePhone] = useState<string>('');
    const [profileLocation, setProfileLocation] = useState<string>('');
    const [socialLinks, setSocialLinks] = useState<{ name: string; url: string }[]>([]);
    const [newLinkName, setNewLinkName] = useState('');
    const [newLinkUrl, setNewLinkUrl] = useState('');
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Digital CV: Education / Impact / Languages
    const [educationList, setEducationList] = useState<{ degree: string; institution: string; period: string }[]>([]);
    const [newEduDegree, setNewEduDegree] = useState('');
    const [newEduInstitution, setNewEduInstitution] = useState('');
    const [newEduPeriod, setNewEduPeriod] = useState('');

    const [impactList, setImpactList] = useState<{ text: string }[]>([]);
    const [newImpactText, setNewImpactText] = useState('');

    const [languagesList, setLanguagesList] = useState<{ name: string; level: string }[]>([]);
    const [newLangName, setNewLangName] = useState('');
    const [newLangLevel, setNewLangLevel] = useState('');

    // For immediate revert on Cancel
    const [profileBackup, setProfileBackup] = useState<{ name: string; title: string; bio: string; email: string; phone: string; location: string } | null>(null);

    // Profile image resolution & size display (same behavior as hero)
    const [profileImageResolution, setProfileImageResolution] = useState<string>('');
    const [profileImageSize, setProfileImageSize] = useState<string>('');
    const [profileImageSizeLoading, setProfileImageSizeLoading] = useState(false);

    // Backup & upload state for profile image (supports immediate revert / save)
    const [profileImageBackupPreview, setProfileImageBackupPreview] = useState<string | null>(null);
    const [profileImageBackupFile, setProfileImageBackupFile] = useState<File | null>(null);
    const [profileImageDirty, setProfileImageDirty] = useState(false);
    const [profileInfoDirty, setProfileInfoDirty] = useState(false);
    const [profileImageUploading, setProfileImageUploading] = useState(false);

    // Hero image resolution & size display
    const [heroImageResolution, setHeroImageResolution] = useState<string>('');
    const [heroImageSize, setHeroImageSize] = useState<string>('');
    const [heroImageSizeLoading, setHeroImageSizeLoading] = useState(false);

    const directionRef = useRef<number>(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const hasAnimatedRef = useRef<string | null>(null);
    const [revealedTabs, setRevealedTabs] = useState<Record<string, boolean>>({
        availability: false,
        stack: false,
        account: false
    });

    const handleTabChange = (newTab: 'availability' | 'stack' | 'account') => {
        if (newTab === activeTab || isTransitioning) return;

        hasAnimatedRef.current = null;
        setRevealedTabs(prev => ({ ...prev, [newTab]: false })); // Force re-animation state

        const indices: Record<string, number> = { availability: 0, stack: 1, account: 2 };
        const direction = indices[newTab] > indices[activeTab] ? 1 : -1;
        directionRef.current = direction;
        setIsTransitioning(true);

        // Instant Exit
        anime({
            targets: '.settings-section',
            translateX: [0, -direction * 30],
            opacity: [1, 0],
            duration: 150,
            easing: 'easeInQuad',
            complete: () => {
                setActiveTab(newTab);
            }
        });
    };

    useEffect(() => {
        const runAnimation = () => {
            const targets = document.querySelectorAll('.settings-section');
            if (targets.length === 0) return;
            if (hasAnimatedRef.current === activeTab) return;

            hasAnimatedRef.current = activeTab;

            const timeline = anime.timeline({
                easing: 'easeOutExpo',
                complete: () => {
                    setRevealedTabs(prev => ({ ...prev, [activeTab]: true }));
                    setIsTransitioning(false);
                }
            });

            // Ultra-Fast Entrance
            timeline.add({
                targets: '.settings-section',
                opacity: [0, 1],
                translateX: [directionRef.current * 50, 0],
                duration: 300
            }, 0);

            timeline.add({
                targets: '.settings-panel',
                opacity: [0, 1],
                translateY: [20, 0],
                scale: [0.99, 1],
                rotateY: [directionRef.current * 3, 0],
                delay: anime.stagger(30, { start: 20 }),
                duration: 450
            }, 0);

            timeline.add({
                targets: '.settings-panel > *',
                opacity: [0, 1],
                translateY: [5, 0],
                delay: anime.stagger(8, { start: 15 }),
                duration: 200
            }, 0);

            timeline.add({
                targets: '.settings-tab-btn.tab-active',
                scale: [0.98, 1.01, 1],
                duration: 250,
                easing: 'easeOutBack'
            }, 0);
        };

        runAnimation();
        // Safety revealed state in case animation doesn't trigger
        const safetyId = setTimeout(() => {
            if (hasAnimatedRef.current !== activeTab) {
                setRevealedTabs(prev => ({ ...prev, [activeTab]: true }));
                setIsTransitioning(false);
            }
        }, 150);

        const tid = setTimeout(runAnimation, 30);
        return () => {
            clearTimeout(tid);
            clearTimeout(safetyId);
        };
    }, [activeTab]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const sizeFromDataUrl = (dataUrl: string) => {
        // data:[<mediatype>][;base64],<data>
        const base64 = dataUrl.split(',')[1] || '';
        const padding = (base64.match(/=+$/) || [''])[0].length;
        const base64Length = base64.length;
        const bytes = Math.round((base64Length * 3) / 4) - padding;
        return bytes;
    };

    useEffect(() => {
        if (!heroImagePreview) {
            setHeroImageResolution('');
            setHeroImageSize('');
            return;
        }

        // resolution check (try without crossOrigin first to avoid noise)
        const checkRes = async () => {
            try {
                const img = await createImage(heroImagePreview, false);
                setHeroImageResolution(`${img.naturalWidth}×${img.naturalHeight}`);
            } catch {
                setHeroImageResolution('');
            }
        };
        checkRes();

        // size
        (async () => {
            setHeroImageSizeLoading(true);
            try {
                if (heroImageFile) {
                    setHeroImageSize(formatBytes(heroImageFile.size));
                } else if (heroImagePreview.startsWith('data:')) {
                    const bytes = sizeFromDataUrl(heroImagePreview);
                    setHeroImageSize(formatBytes(bytes));
                } else if (heroImagePreview.startsWith('http')) {
                    try {
                        const res = await fetch(heroImagePreview, { method: 'GET' });
                        if (res.ok) {
                            const blob = await res.blob();
                            setHeroImageSize(formatBytes(blob.size));
                        }
                    } catch {
                        setHeroImageSize('');
                    }
                } else {
                    setHeroImageSize('');
                }
            } catch {
                // ignore errors, just don't show size
                setHeroImageSize('');
            } finally {
                setHeroImageSizeLoading(false);
            }
        })();

        return () => {
        };
    }, [heroImagePreview, heroImageFile]);

    // profile image resolution & size (best-effort size like hero)
    useEffect(() => {
        if (!profileImagePreview) {
            setProfileImageResolution('');
            setProfileImageSize('');
            return;
        }

        // resolution check (try without crossOrigin first to avoid noise)
        const checkRes = async () => {
            try {
                const img = await createImage(profileImagePreview, false);
                setProfileImageResolution(`${img.naturalWidth}×${img.naturalHeight}`);
            } catch {
                setProfileImageResolution('');
            }
        };
        checkRes();

        (async () => {
            setProfileImageSizeLoading(true);
            try {
                if (profileImageFile) {
                    setProfileImageSize(formatBytes(profileImageFile.size));
                } else if (profileImagePreview.startsWith('data:')) {
                    const bytes = sizeFromDataUrl(profileImagePreview);
                    setProfileImageSize(formatBytes(bytes));
                } else if (profileImagePreview.startsWith('http')) {
                    try {
                        const res = await fetch(profileImagePreview, { method: 'GET' });
                        if (res.ok) {
                            const blob = await res.blob();
                            setProfileImageSize(formatBytes(blob.size));
                        }
                    } catch {
                        setProfileImageSize('');
                    }
                } else {
                    setProfileImageSize('');
                }
            } catch {
                setProfileImageSize('');
            } finally {
                setProfileImageSizeLoading(false);
            }
        })();

        return () => {
        };
    }, [profileImagePreview, profileImageFile]);

    // Load profile and hero info from the API
    useEffect(() => {
        const loadAccount = async () => {
            try {
                const res = await fetch('/api/settings/account');
                const body = await res.json();
                const data = body.data;
                if (!data) return;
                if (data.imageUrl && !profileImageDirty) setProfileImagePreview(data.imageUrl);
                if (data.heroImageUrl && !heroImageFile) setHeroImagePreview(data.heroImageUrl);
                if (data.name && !isEditingProfile && !profileInfoDirty) setProfileName(data.name);
                if (data.title && !isEditingProfile && !profileInfoDirty) setProfileTitle(data.title);
                if (!isEditingProfile && !profileInfoDirty) {
                    setProfileBio(data.bio || '');
                    setProfileEmail(data.email || '');
                    setProfilePhone(data.phone || '');
                    setProfileLocation(data.location || '');
                }
                if (data.socialLinks && !isEditingProfile && !profileInfoDirty) {
                    setSocialLinks(data.socialLinks.map((l: { platform: string; url: string }) => ({ name: l.platform, url: l.url })));
                }
                if (data.education && !isEditingProfile && !profileInfoDirty) {
                    setEducationList(data.education.map((e: { degree: string; institution: string; period: string | null }) => ({ degree: e.degree, institution: e.institution, period: e.period || '' })));
                }
                if (data.impact && !isEditingProfile && !profileInfoDirty) {
                    setImpactList(data.impact.map((e: { text: string }) => ({ text: e.text })));
                }
                if (data.languages && !isEditingProfile && !profileInfoDirty) {
                    setLanguagesList(data.languages.map((e: { name: string; level: string }) => ({ name: e.name, level: e.level })));
                }
            } catch (err) {
                console.error('Error fetching account settings', err);
            }
        };
        loadAccount();
    }, [profileImageDirty, isEditingProfile, profileInfoDirty, heroImageFile]);

    // Cropper State
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ width: number; height: number; x: number; y: number } | null>(null);
    const [isCropping, setIsCropping] = useState(false);
    const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null);

    // Detect dark mode to adjust cropper background
    const [isDark, setIsDark] = useState(false);
    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        checkTheme();
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Custom Alert State
    const [alert, setAlert] = useState<{ show: boolean; type: AlertType; message: string }>({
        show: false,
        type: 'success',
        message: ''
    });

    // Guard to prevent duplicate alerts from rapidly repeating
    const lastAlertRef = useRef<{ message: string; type: AlertType; t: number } | null>(null);
    const safeSetAlert = (next: { show: boolean; type: AlertType; message: string; duration?: number }) => {
        const duration = typeof next.duration === 'number' ? next.duration : 4000; // default 4s
        if (next.show) {
            // If an alert is already visible, suppress new alerts to ensure only one is shown
            if (alert.show) return;

            const last = lastAlertRef.current;
            if (last && last.message === next.message && last.type === next.type && (Date.now() - last.t) < duration) {
                return; // duplicate within cooldown, ignore
            }
            lastAlertRef.current = { message: next.message, type: next.type, t: Date.now() };
            setAlert({ show: true, type: next.type, message: next.message });
            if (duration > 0) {
                setTimeout(() => {
                    setAlert(prev => ({ ...prev, show: false }));
                    lastAlertRef.current = null;
                }, duration);
            }
        } else {
            // explicit hide — clear ref and state
            lastAlertRef.current = null;
            setAlert({ show: false, type: next.type, message: next.message });
        }
    };

    // Track unsaved changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const handleSaveAvailability = async () => {
        try {
            const handlingProjectsPayload = handlingProjects.map(({ name, description, status }) => ({ name, description, status }));

            await apiFetch('/api/settings/availability', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    availabilityPercent: availability,
                    timezoneOffset: selectedTimezone,
                    handlingProjects: handlingProjectsPayload
                })
            });
        } catch (error) {
            console.error("Error saving availability:", error);
            safeSetAlert({ show: true, type: 'error', message: 'Failed to save availability settings' });
        }
    };

    const handleSaveHeroImage = async (silent = false) => {
        if (!heroImageFile && !heroImagePreview) return;

        try {
            setIsLoading(true);

            if (heroImageFile) {
                const downloadURL = await uploadToCloudinary(heroImageFile, 'settings');

                await apiFetch('/api/settings/account', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ heroImageUrl: downloadURL })
                });
            } else if (heroImagePreview && heroImagePreview.startsWith('http')) {
                // Selected from Firebase / remote URL - just persist the URL
                await apiFetch('/api/settings/account', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ heroImageUrl: heroImagePreview })
                });
            } else {
                // Local data URL without a file - nothing to upload to storage
                return;
            }

            if (!silent) safeSetAlert({ show: true, type: 'success', message: 'Hero image updated!', duration: 3000 });
        } catch (error) {
            console.error("Error updating hero image:", error);
            safeSetAlert({ show: true, type: 'error', message: 'Failed to update hero image.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyAll = async () => {
        setIsLoading(true);
        try {
            // If user is still cropping, finalize the crop first
            if (isCropping) {
                await handleCropSave();
            }

            await Promise.all([
                handleSaveAvailability(),
                handleSaveHeroImage(true),
                handleSaveProfileImage(true),
                handleSaveProfileInfo(true)
            ]);

            setProfileInfoDirty(false);
            setHasUnsavedChanges(false);
            safeSetAlert({ show: true, type: 'success', message: 'All settings applied successfully!', duration: 3000 });
        } catch (error) {
            console.error("Error applying all settings:", error);
            safeSetAlert({ show: true, type: 'error', message: 'Failed to apply some settings.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelAll = async () => {
        // Close any open cropper
        if (isCropping) {
            setIsCropping(false);
            setOriginalImageSrc(null);
        }

        setIsLoading(true);
        try {
            const accountRes = await fetch('/api/settings/account');
            const accountBody = await accountRes.json();
            const data = accountBody.data;
            if (data) {
                setProfileName(data.name ?? 'Your Name');
                setProfileTitle(data.title ?? 'Job Title');
                setProfileBio(data.bio ?? '');
                setProfileEmail(data.email ?? '');
                setProfilePhone(data.phone ?? '');
                setProfileLocation(data.location ?? '');
                setEducationList((data.education ?? []).map((e: { degree: string; institution: string; period: string | null }) => ({ degree: e.degree, institution: e.institution, period: e.period || '' })));
                setImpactList((data.impact ?? []).map((e: { text: string }) => ({ text: e.text })));
                setLanguagesList((data.languages ?? []).map((e: { name: string; level: string }) => ({ name: e.name, level: e.level })));
                setProfileImagePreview(data.imageUrl ?? '');
                setProfileImageFile(null);
                setProfileImageBackupPreview(null);
                setProfileImageBackupFile(null);
                setProfileImageDirty(false);
                setProfileInfoDirty(false);
                setHeroImagePreview(data.heroImageUrl ?? DEFAULT_HERO_URL);
                setHeroImageFile(null);
            }

            const availRes = await fetch('/api/settings/availability');
            const availBody = await availRes.json();
            const availData = availBody.data;
            if (availData) {
                setAvailability(availData.availabilityPercent ?? 0);
                setSelectedTimezone(availData.timezoneOffset ?? 0);
                const projectsArray: HandlingProject[] = (availData.handlingProjects ?? []).map(
                    (p: { id: number; name: string; description: string | null; status: string }) => ({
                        id: p.id.toString(),
                        name: p.name,
                        description: p.description ?? '',
                        status: p.status as 'active' | 'pending' | 'completed'
                    })
                );
                setHandlingProjects(projectsArray);
            }

            setHasUnsavedChanges(false);
            safeSetAlert({ show: true, type: 'info', message: 'All staged changes canceled.' });
        } catch (err) {
            console.error('Error cancelling changes', err);
            safeSetAlert({ show: true, type: 'error', message: 'Failed to cancel changes.' });
        } finally {
            setIsLoading(false);
        }
    };





    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (timezoneRef.current && !timezoneRef.current.contains(e.target as Node)) {
                setTimezoneDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update current time based on selected timezone
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
            const localTime = new Date(utcTime + selectedTimezone * 3600000);
            setCurrentTime(localTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [selectedTimezone]);

    const loadAvailability = async () => {
        try {
            const res = await fetch('/api/settings/availability');
            const body = await res.json();
            const data = body.data;
            if (!data) return;

            setAvailability(data.availabilityPercent ?? 0);
            setSelectedTimezone(data.timezoneOffset ?? 0);

            const projectsArray: HandlingProject[] = (data.handlingProjects ?? []).map(
                (p: { id: number; name: string; description: string | null; status: string }) => ({
                    id: p.id.toString(),
                    name: p.name,
                    description: p.description ?? '',
                    status: p.status as 'active' | 'pending' | 'completed'
                })
            );
            setHandlingProjects(projectsArray);
        } catch (err) {
            console.warn('Failed to load availability settings', err);
        }
    };

    useEffect(() => {
        loadAvailability();
    }, []);

    // Fetch Stack Data
    const loadStack = async () => {
        try {
            const res = await fetch('/api/tech-stack');
            const body = await res.json();
            const items: StackItem[] = (body.data as { id: number; name: string; iconUrl: string }[]).map(i => ({
                id: i.id.toString(),
                name: i.name,
                icon: i.iconUrl
            }));
            setStackItems(items);
        } catch (err) {
            console.warn('Failed to load tech stack', err);
        }
    };

    useEffect(() => {
        loadStack();
    }, []);

    const getAvailabilityColor = (value: number) => {
        const red = Math.round(255 * (1 - value / 100));
        const green = Math.round(255 * (value / 100));
        return `rgb(${red}, ${green}, 50)`;
    };

    // Description truncation is handled via CSS (.project-desc) so it adapts to screen size.


    // Project handlers
    const handleSaveProjectLocal = (name: string, description: string, status: 'active' | 'pending' | 'completed') => {
        if (!name.trim()) return;
        if (editingProject) {
            setHandlingProjects(prev => prev.map(p =>
                p.id === editingProject.id
                    ? { ...p, name: name, description: description, status: status }
                    : p
            ));
        } else {
            const ids = handlingProjects.map(p => parseInt(p.id)).filter(n => !isNaN(n));
            const nextId = ids.length > 0 ? Math.max(...ids) + 1 : 1;
            setHandlingProjects(prev => [...prev, {
                id: nextId.toString(),
                name: name,
                description: description,
                status: status
            }]);
        }
        setProjectModalOpen(false);
        setEditingProject(null);
        setHasUnsavedChanges(true);
    };

    const closeProjectModal = () => {
        setProjectModalOpen(false);
        setEditingProject(null);
    };


    const handleSaveStack = async (data: StackItemData) => {
        if (!data.name.trim() || !data.icon) return;
        setIsLoading(true);

        try {
            let iconUrl = data.icon;
            if (data.iconFile) {
                iconUrl = await uploadToCloudinary(data.iconFile, 'settings/stack');
            }

            const payload = { name: data.name, iconUrl };

            if (data.id) {
                await apiFetch(`/api/tech-stack/${data.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/api/tech-stack', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            await loadStack();

            setStackModalOpen(false);
            setEditingStack(null);
            safeSetAlert({ show: true, type: 'success', message: 'Stack item saved!', duration: 3000 });
        } catch (error) {
            console.error("Error saving stack:", error);
            safeSetAlert({ show: true, type: 'error', message: 'Failed to save stack item' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteStack = (id: string) => {
        const item = stackItems.find(i => i.id === id);
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Stack Item',
            message: `Are you sure you want to delete "${item?.name || id}" from your tech stack?`,
            type: 'danger',
            onConfirm: async () => {
                setIsLoading(true);
                try {
                    await apiFetch(`/api/tech-stack/${id}`, { method: 'DELETE' });
                    await loadStack();
                    safeSetAlert({ show: true, type: 'success', message: 'Stack item deleted', duration: 3000 });
                } catch (error) {
                    console.error("Error deleting stack:", error);
                } finally {
                    setIsLoading(false);
                }
            }
        });
    };

    const closeStackModal = () => {
        setStackModalOpen(false);
        setEditingStack(null);
    };

    // Account handlers
    const handleHeroImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setHeroImageFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                setHeroImagePreview(event.target?.result as string);
                setHasUnsavedChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            // keep a backup so Cancel can restore instantly
            if (!profileImageBackupPreview) {
                setProfileImageBackupPreview(profileImagePreview);
                setProfileImageBackupFile(profileImageFile);
            }

            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            setOriginalImageSrc(imageDataUrl as string);
            setIsCropping(true);
            e.target.value = '';
        }
    };

    const readFile = (file: File) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => resolve(reader.result), false);
            reader.readAsDataURL(file);
        });
    };

    const onCropComplete = useCallback((_croppedArea: unknown, croppedAreaPixels: unknown) => {
        setCroppedAreaPixels(croppedAreaPixels as { width: number; height: number; x: number; y: number });
    }, []);

    const handleCropSave = async () => {
        if (originalImageSrc && croppedAreaPixels) {
            try {
                const croppedFile = await getCroppedImg(originalImageSrc, croppedAreaPixels);
                if (croppedFile) {
                    setProfileImageFile(croppedFile);
                    setProfileImagePreview(URL.createObjectURL(croppedFile));
                    setHasUnsavedChanges(true);
                    setProfileImageDirty(true);
                }
            } catch (e) {
                console.error("Crop failed", e);
                // If it's a security/CORS error on a remote URL, give a specific hint
                if (originalImageSrc.startsWith('http')) {
                    safeSetAlert({
                        show: true,
                        type: 'error',
                        message: 'CORS Blocked: Please run the "gsutil" command in your Firebase console to allow image cropping.'
                    });
                } else {
                    safeSetAlert({ show: true, type: 'error', message: 'Failed to crop image.' });
                }
            }
            setIsCropping(false);
            setOriginalImageSrc(null);
        }
    };

    const handleSkipCrop = () => {
        if (originalImageSrc) {
            setProfileImagePreview(originalImageSrc);
            setProfileImageFile(null); // It's a remote URL, no local file to upload
            setProfileImageDirty(true);
            setHasUnsavedChanges(true);
            setIsCropping(false);
            setOriginalImageSrc(null);
        }
    };

    const handleCropCancel = () => {
        setIsCropping(false);
        setOriginalImageSrc(null);
    };

    const handleCancelProfileImageChange = () => {
        if (profileImageBackupPreview) {
            setProfileImagePreview(profileImageBackupPreview);
            setProfileImageFile(profileImageBackupFile);
        }
        setProfileImageBackupPreview(null);
        setProfileImageBackupFile(null);
        setProfileImageDirty(false);
        setHasUnsavedChanges(false);
    };

    // Persist profile name/title/links to Firestore (used by Apply All)
    const handleSaveProfileInfo = async (silent = false) => {
        try {
            await apiFetch('/api/settings/account', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profileName,
                    title: profileTitle,
                    bio: profileBio,
                    email: profileEmail,
                    phone: profilePhone,
                    location: profileLocation,
                    socialLinks: socialLinks.map(l => ({ platform: l.name, url: l.url })),
                    education: educationList,
                    impact: impactList,
                    languages: languagesList
                })
            });

            if (!silent) safeSetAlert({ show: true, type: 'success', message: 'Profile updated!', duration: 3000 });
        } catch (err) {
            console.error('Error saving profile info', err);
            safeSetAlert({ show: true, type: 'error', message: 'Failed to update profile.' });
        }
    };

    const handleSaveProfileImage = async (silent = false) => {
        if (!profileImageFile && !profileImagePreview) return;

        try {
            setProfileImageUploading(true);
            setIsLoading(true);

            if (profileImageFile) {
                const downloadURL = await uploadToCloudinary(profileImageFile, 'settings');

                await apiFetch('/api/settings/account', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: downloadURL })
                });
            } else if (profileImagePreview && profileImagePreview.startsWith('http')) {
                // Selected from Firebase / remote URL - just persist the URL
                await apiFetch('/api/settings/account', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageUrl: profileImagePreview })
                });
            } else {
                // Local data URL without a file - nothing to upload to storage
                return;
            }

            if (!silent) safeSetAlert({ show: true, type: 'success', message: 'Profile image updated!', duration: 3000 });

            // clear temporary states
            setProfileImageDirty(false);
            setProfileImageBackupPreview(null);
            setProfileImageBackupFile(null);
            setProfileImageFile(null);
            setHasUnsavedChanges(false);
        } catch (error) {
            console.error("Error updating profile image:", error);
            safeSetAlert({ show: true, type: 'error', message: 'Failed to update profile image.' });
        } finally {
            setProfileImageUploading(false);
            setIsLoading(false);
        }
    };

    // Tabs definition
    const tabs = [
        { id: 'availability', label: 'Availability', icon: Sliders },
        { id: 'stack', label: 'Tech Stack', icon: Code },
        { id: 'account', label: 'Account', icon: User },
    ] as const;

    const selectedTz = timezones.find(tz => tz.value === selectedTimezone);

    if (isCropping && originalImageSrc) {
        return createPortal(
            <div className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[3000] flex flex-col items-center justify-center animate-fade-in" style={{ padding: '20px' }}>
                <div className="w-full max-w-lg mx-auto">
                    {/* Cropper Container (Header + Canvas + Controls share one background) */}
                    <div className={`relative w-full overflow-hidden rounded-2xl ${isDark ? 'gradient-radial-dark' : 'gradient-radial-light'}`}>
                        {/* Crop Area Header (now inside the background) */}
                        <div className="flex items-center gap-4 p-5 px-6 border-b border-white/8">
                            <div className="icon-box icon-box-md gradient-accent-vibrant glow-accent">
                                <ZoomIn size={22} color="white" strokeWidth={2.5} />
                            </div>
                            <div>
                                <div className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ letterSpacing: '-0.02em' }}>
                                    Crop Your Photo
                                </div>
                                <div className={`flex items-center gap-2 text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Drag to reposition, scroll to zoom
                                </div>
                            </div>
                        </div>

                        {/* Cropper Canvas (fixed height) */}
                        <div style={{ height: '380px' }} className="relative overflow-hidden">
                            {/* Animated Gradient Orbs */}
                            <div className="orb orb-blue animate-float" style={{ top: '-50%', left: '-20%', width: '60%', height: '100%' }} />
                            <div className="orb orb-purple animate-float-reverse" style={{ bottom: '-30%', right: '-20%', width: '50%', height: '80%' }} />

                            {/* Subtle Grid Pattern */}
                            <div className="grid-pattern" />

                            {/* Corner Decorations */}
                            <div className="corner-decoration corner-tl" />
                            <div className="corner-decoration corner-tr" />
                            <div className="corner-decoration corner-bl" />
                            <div className="corner-decoration corner-br" />

                            <Cropper
                                image={originalImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                style={{
                                    containerStyle: { background: 'transparent' },
                                    cropAreaStyle: {
                                        border: '3px solid rgba(255, 255, 255, 0.9)',
                                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)'
                                    }
                                }}
                            />
                        </div>

                        {/* Controls Panel placed on top of the same background so it reads as part of the component */}
                        <div className="p-6" style={{ borderTop: '1px solid transparent', background: isDark ? 'linear-gradient(180deg, rgba(13,13,26,0.45), rgba(13,13,26,0.45))' : 'linear-gradient(180deg, rgba(248,250,252,0.06), rgba(226,232,240,0.06))' }}>
                            <div className="flex-col gap-6" style={{ backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                                {/* Zoom Control */}
                                <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: 'transparent' }}>
                                    <div className="icon-box icon-box-sm">
                                        <ZoomIn size={18} />
                                    </div>

                                    <div className="range-slider-container">
                                        <div className="range-slider-track">
                                            <div
                                                className="range-slider-fill"
                                                style={{ width: `${((zoom - 1) / 2) * 100}%` }}
                                            />
                                        </div>
                                        <input
                                            type="range"
                                            value={zoom}
                                            min={1}
                                            max={3}
                                            step={0.02}
                                            aria-label="Zoom"
                                            onChange={(e) => setZoom(Number(e.target.value))}
                                            className="range-slider"
                                        />
                                    </div>

                                    <div className="gradient-accent glow-accent-sm rounded-sm text-white text-center font-semibold text-xs" style={{ minWidth: '52px', padding: '6px 12px' }}>
                                        {Math.round(zoom * 100)}%
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-end gap-3 items-center">
                                    <button
                                        type="button"
                                        onClick={handleCropSave}
                                        className="btn btn-primary"
                                    >
                                        Save Crop
                                    </button>
                                    {originalImageSrc.startsWith('http') && (
                                        <button
                                            type="button"
                                            onClick={handleSkipCrop}
                                            className="btn btn-secondary px-4 py-2 text-sm border-white/20 bg-white/5 hover:bg-white/10"
                                        >
                                            Skip & Use Original
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={handleCropCancel}
                                        className="btn btn-secondary"
                                    >
                                        Close
                                    </button>

                                    <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'} ml-2`}>
                                        Changes will be applied when you click <strong>Apply Changes</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        );
    }

    return (
        <div className="h-[85vh] flex flex-col gap-6 relative">
            <Loader isOpen={isLoading} isFullScreen={true} />
            {/* Custom Alert */}
            {alert.show && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => safeSetAlert({ show: false, type: alert.type, message: alert.message })}
                />
            )}

            {/* Tabs */}
            <div className="glass-surface p-1.5 rounded-xl flex gap-2 overflow-x-auto shrink-0">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`
                                settings-tab-btn flex items-center gap-2 px-5 py-3 rounded-lg border-none cursor-pointer font-sans font-semibold text-sm whitespace-nowrap transition-all
                                ${isActive ? 'tab-active bg-blue-500/15 text-blue-500' : 'bg-transparent text-gray-500 hover:bg-blue-500/10 hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400'}
                            `}
                        >
                            <Icon size={18} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content Container with overflow-x-hidden for clean transitions */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-6 p-4 custom-scrollbar">
                {activeTab === 'availability' && (
                    <div className="settings-section flex flex-col gap-6" style={{ opacity: revealedTabs.availability ? 1 : 0 }}>
                        {/* Availability Settings */}
                        <div className="settings-panel glass-panel p-6 flex flex-col gap-6 relative z-10" style={{ opacity: revealedTabs.availability ? 1 : 0 }}>
                            <h3 className="heading-md text-base sm:text-lg md:text-xl">Availability Settings</h3>
                            <div className="flex flex-col gap-6">
                                {/* Current Availability Slider */}
                                <div>
                                    <div className="flex-row-between">
                                        <label className="text-sec text-sm">Current Availability</label>
                                        <span className="font-bold text-sm" style={{ color: getAvailabilityColor(availability) }}>{availability}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-500/10 overflow-hidden relative">
                                        <div className="absolute left-0 top-0 h-full" style={{ width: `${availability}%`, background: 'linear-gradient(to right, rgb(239, 68, 68), rgb(234, 179, 8), rgb(34, 197, 94))' }} />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={availability}
                                        onChange={(e) => { setAvailability(Number(e.target.value)); setHasUnsavedChanges(true); }}
                                        className="w-full cursor-pointer"
                                        style={{ accentColor: getAvailabilityColor(availability) }}
                                    />
                                    <div className="flex justify-between text-xs sm:text-sm">
                                        <span className="text-red-500">Not Available</span>
                                        <span className="text-green-500">Available</span>
                                    </div>
                                </div>

                                {/* Current Time / Timezone */}
                                <div>
                                    <div className="flex-row-between stack-on-small">
                                        <label className="text-sec text-sm sm:text-base md:text-lg flex items-center gap-2">
                                            <Clock size={16} />
                                            Current Time
                                        </label>
                                        <div className="text-right">
                                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-blue-500 font-mono">{currentTime}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        {/* Custom Dropdown */}
                                        <div ref={timezoneRef} className="flex-1 min-w-[140px] relative z-50">
                                            <button
                                                onClick={() => setTimezoneDropdownOpen(!timezoneDropdownOpen)}
                                                className="input-field w-full sm:w-auto flex justify-between items-center cursor-pointer text-left"
                                            >
                                                <span className="text-sm sm:text-base md:text-lg">{selectedTz?.label || 'Select Timezone'}</span>
                                                <ChevronDown size={18} className={`transition-transform duration-200 ${timezoneDropdownOpen ? 'rotate-180' : ''}`} />
                                            </button>

                                            {/* Dropdown Menu - Premium Liquid Glass */}
                                            {timezoneDropdownOpen && (
                                                <div
                                                    className="absolute top-full left-0 right-0 mt-3 border border-white dark:border-white/20 rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.45)] max-h-[300px] overflow-y-auto z-[100] p-2 flex flex-col gap-1.5 animate-pop ring-4 ring-black/[0.02] dark:ring-white/[0.02]"
                                                    style={{
                                                        backgroundColor: isDark ? 'rgba(20, 20, 20, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                                                        backdropFilter: 'blur(24px)',
                                                        WebkitBackdropFilter: 'blur(24px)'
                                                    }}
                                                >
                                                    {timezones.map(tz => (
                                                        <button
                                                            key={tz.value}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedTimezone(tz.value);
                                                                setTimezoneDropdownOpen(false);
                                                                setHasUnsavedChanges(true);
                                                            }}
                                                            className={`w-full p-3.5 rounded-xl border-none text-left cursor-pointer transition-all duration-300 text-sm font-sans flex items-center justify-between group
                                                                ${selectedTimezone === tz.value
                                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                                                                    : 'bg-transparent hover:bg-white dark:hover:bg-white/10 hover:shadow-sm hover:translate-x-1'}
                                                            `}
                                                            style={{
                                                                color: selectedTimezone === tz.value ? '#ffffff' : 'var(--text-primary)'
                                                            }}
                                                        >
                                                            <span className="font-medium">{tz.label}</span>
                                                            {selectedTimezone === tz.value && (
                                                                <Check size={16} strokeWidth={3} className="animate-scale-in" />
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Projects Being Handled */}
                        <div className="settings-panel glass-panel p-6 flex flex-col gap-6" style={{ opacity: revealedTabs.availability ? 1 : 0 }}>
                            <div className="flex-row-between stack-on-small">
                                <div>
                                    <h3 className="heading-md text-base sm:text-lg md:text-xl flex items-center mb-1">
                                        <Briefcase size={22} className="mr-2" />
                                        Projects Being Handled
                                    </h3>
                                    <p className="text-muted text-xs">{handlingProjects.length} projects</p>
                                </div>
                                <button onClick={() => { setEditingProject(null); setProjectModalOpen(true); }} className="btn btn-primary sm:w-auto flex justify-center items-center mt-3 sm:mt-0" aria-label="Add project">
                                    <Plus size={18} /> <span className="hidden sm:inline">Add</span>
                                </button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {handlingProjects.length === 0 ? (
                                    <div className="p-8 text-center text-sec border-2 border-dashed border-gray-500/10 rounded-xl">
                                        No projects. Click "Add" to add one.
                                    </div>
                                ) : handlingProjects.map(project => (
                                    <div key={project.id} className="p-4 rounded-xl bg-gray-500/5 border border-gray-500/5 flex justify-between items-center gap-3 stack-on-small min-w-0">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4 className="heading-sm truncate max-w-full">{project.name}</h4>
                                                <span className={`badge ${project.status === 'active' ? 'badge-active' : project.status === 'pending' ? 'badge-pending' : 'badge-blue'}`}>
                                                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                                                </span>
                                            </div>
                                            {project.description ? (
                                                <p className="text-muted project-desc" title={project.description}>{project.description}</p>
                                            ) : null}
                                        </div>
                                        <div className="flex gap-1 mt-3 sm:mt-0">
                                            <button onClick={() => { setEditingProject(project); setProjectModalOpen(true); }} className="btn-icon" aria-label={`Edit ${project.name}`}><Edit2 size={16} /></button>
                                            <button onClick={() => {
                                                setConfirmConfig({
                                                    isOpen: true,
                                                    title: 'Remove Project',
                                                    message: `Are you sure you want to remove "${project.name}" from your currently handled projects list?`,
                                                    type: 'danger',
                                                    onConfirm: () => {
                                                        setHandlingProjects(prev => prev.filter(p => p.id !== project.id));
                                                        setHasUnsavedChanges(true);
                                                    }
                                                });
                                            }} className="btn-icon text-red-500 hover:bg-red-500/10" aria-label={`Delete ${project.name}`}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'stack' && (
                    <div className="settings-section flex flex-col gap-6" style={{ opacity: revealedTabs.stack ? 1 : 0 }}>
                        <div className="settings-panel glass-panel p-3 sm:p-4 md:p-6 flex-1 flex flex-col gap-3 sm:gap-4 md:gap-6" style={{ opacity: revealedTabs.stack ? 1 : 0 }}>
                            <div className="flex-row-between">
                                <h3 className="heading-md text-base sm:text-lg md:text-xl">Tech Stack</h3>
                                <button onClick={() => setStackModalOpen(true)} className="btn btn-primary" aria-label="Add stack">
                                    <Plus size={18} /> <span className="hidden sm:inline">Add Stack</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6 content-start">
                                {stackItems.length === 0 ? (
                                    <div className="col-span-full text-center p-12 text-sec">No stack items. Add your tech stack!</div>
                                ) : stackItems.map(item => (
                                    <div key={item.id} className="p-3 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl bg-gray-500/5 border border-gray-500/5 flex flex-col gap-2 sm:gap-3 md:gap-3.5 relative min-w-0">
                                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 flex gap-0.5 sm:gap-1">
                                            <button onClick={() => { setEditingStack(item); setStackModalOpen(true); }} className="btn-icon p-1 sm:p-1.5"><Edit2 size={14} className="sm:w-4 sm:h-4" /></button>
                                            <button onClick={() => handleDeleteStack(item.id)} className="btn-icon p-1 sm:p-1.5 text-red-500 hover:bg-red-500/10"><Trash2 size={14} className="sm:w-4 sm:h-4" /></button>
                                        </div>
                                        {item.icon ? <img src={item.icon} alt={item.name} className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 opacity-90 object-contain" /> : <Code size={40} className="text-gray-500/50 sm:w-12 sm:h-12 md:w-[60px] md:h-[60px]" />}
                                        <h4 className="heading-sm text-xs sm:text-sm md:text-base truncate">{item.name}</h4>

                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="settings-section grid grid-cols-1 md:grid-cols-12 gap-6 items-start" style={{ opacity: revealedTabs.account ? 1 : 0 }}>
                        <div className="settings-panel md:col-span-4 glass-panel p-6 flex flex-col gap-4" style={{ opacity: revealedTabs.account ? 1 : 0 }}>
                            <h3 className="heading-md text-base sm:text-lg md:text-xl flex items-center mb-2">
                                <User size={22} className="mr-3" />
                                Hero Section Image
                            </h3>
                            <div className="group relative overflow-hidden w-full max-w-full mx-auto md:mx-0 rounded-md bg-zinc-900/50 flex items-center justify-center border border-white/5" style={{ paddingTop: '133%' }}>
                                {heroImagePreview ? (
                                    <img src={heroImagePreview} alt="Hero Preview" className="absolute inset-0 w-full h-full object-cover rounded-md" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-2">
                                        <User size={48} className="opacity-20" />
                                        <span className="text-xs font-semibold uppercase tracking-widest opacity-30">No Image</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                    <button
                                        onClick={() => heroImageInputRef.current?.click()}
                                        aria-label="Upload hero image"
                                        className="inline-flex items-center gap-3 px-4 py-2 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold hover:bg-blue-500/20 transition"
                                    >
                                        <span className="p-1.5 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                                            <Upload size={16} className="text-blue-400" />
                                        </span>
                                        <span className="hidden sm:inline text-blue-400 tracking-wide font-semibold">Upload</span>
                                    </button>

                                    <input ref={heroImageInputRef} type="file" accept="image/*" onChange={handleHeroImageUpload} style={{ display: 'none' }} />
                                </div>
                            </div>
                            {heroImageResolution ? (
                                <p className="text-muted text-xs mt-2">
                                    Resolution: <span className="font-mono text-xs">{heroImageResolution}</span>
                                    {heroImageSize && <span className="text-muted"> &nbsp;•&nbsp; <span className="font-mono text-xs">{heroImageSize}</span></span>}
                                    {heroImageSizeLoading && <span className="text-muted"> &nbsp;•&nbsp; <span className="text-xs">checking...</span></span>}
                                </p>
                            ) : (
                                <p className="text-muted text-xs mt-2">JPG, PNG or GIF. Max 2MB</p>
                            )}
                        </div>

                        <div className="md:col-span-8 flex flex-col gap-6">
                            {/* Profile */}
                            <div className="settings-panel glass-panel p-6 flex flex-col gap-4" style={{ opacity: revealedTabs.account ? 1 : 0 }}>
                                <h3 className="heading-md text-base sm:text-lg md:text-xl flex items-center mb-2">
                                    <User size={22} className="mr-3" />
                                    Profile
                                </h3>
                                <div className="flex flex-col md:flex-row items-center gap-6">
                                    <div className="group relative flex-shrink-0">
                                        <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-blue-400 p-0.5 flex-shrink-0 mx-auto sm:mx-0 bg-zinc-900/50 flex items-center justify-center">
                                            {profileImagePreview ? (
                                                <img src={profileImagePreview} alt="Profile Preview" className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <User size={40} className="text-white/20" />
                                            )}
                                        </div>

                                        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm rounded-full">
                                            <button
                                                aria-label="Upload profile image"
                                                onClick={() => profileImageInputRef.current?.click()}
                                                className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center hover:bg-blue-500/20 transition"
                                            >
                                                <Upload size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full flex-1">
                                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                                            <div className="sm:text-left flex-1">
                                                {!isEditingProfile ? (
                                                    <>
                                                        <div className="font-bold">{profileName}</div>
                                                        <div className="text-sec text-sm opacity-70">{profileTitle}</div>
                                                        {profileBio && (
                                                            <p className="text-muted text-xs mt-2 leading-relaxed">{profileBio}</p>
                                                        )}
                                                        {(profileEmail || profilePhone || profileLocation) && (
                                                            <div className="flex flex-col gap-0.5 mt-2 text-xs text-muted">
                                                                {profileEmail && <span>{profileEmail}</span>}
                                                                {profilePhone && <span>{profilePhone}</span>}
                                                                {profileLocation && <span>{profileLocation}</span>}
                                                            </div>
                                                        )}
                                                        {profileImageResolution ? (
                                                            <p className="text-muted text-xs mt-1">
                                                                Resolution: <span className="font-mono text-xs">{profileImageResolution}</span>
                                                                {profileImageSize && <span className="text-muted"> &nbsp;•&nbsp; <span className="font-mono text-xs">{profileImageSize}</span></span>}
                                                                {profileImageSizeLoading && <span className="text-muted"> &nbsp;•&nbsp; <span className="text-xs">checking...</span></span>}
                                                            </p>
                                                        ) : null}
                                                        <p className="text-muted text-xs mt-2">Profile image is used across the site</p>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col gap-3">
                                                        <div>
                                                            <label className="text-xs text-muted mb-1 block">Full Name</label>
                                                            <input className="input-field w-full" value={profileName} onChange={(e) => { setProfileName(e.target.value); setHasUnsavedChanges(true); }} placeholder="Full name" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted mb-1 block">Job Title</label>
                                                            <input className="input-field w-full" value={profileTitle} onChange={(e) => { setProfileTitle(e.target.value); setHasUnsavedChanges(true); }} placeholder="Job title" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted mb-1 block">Bio / Overview</label>
                                                            <textarea className="input-field w-full" rows={3} value={profileBio} onChange={(e) => { setProfileBio(e.target.value); setHasUnsavedChanges(true); }} placeholder="Bio / overview" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted mb-1 block">Email</label>
                                                            <input className="input-field w-full" value={profileEmail} onChange={(e) => { setProfileEmail(e.target.value); setHasUnsavedChanges(true); }} placeholder="Email" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted mb-1 block">Phone</label>
                                                            <input className="input-field w-full" value={profilePhone} onChange={(e) => { setProfilePhone(e.target.value); setHasUnsavedChanges(true); }} placeholder="Phone" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-muted mb-1 block">Location</label>
                                                            <input className="input-field w-full" value={profileLocation} onChange={(e) => { setProfileLocation(e.target.value); setHasUnsavedChanges(true); }} placeholder="Location" />
                                                        </div>
                                                    </div>
                                                )}

                                            </div>

                                            <div className="flex items-center gap-2 self-start sm:self-auto">
                                                {!isEditingProfile ? (
                                                    <button onClick={() => { setProfileBackup({ name: profileName, title: profileTitle, bio: profileBio, email: profileEmail, phone: profilePhone, location: profileLocation }); setIsEditingProfile(true); }} className="btn btn-secondary px-3 py-2">
                                                        <Edit2 size={16} />
                                                        <span className="hidden sm:inline ml-2">Edit</span>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => {
                                                            // Stage changes locally; Apply Changes will persist to Firebase
                                                            setHasUnsavedChanges(true);
                                                            setProfileInfoDirty(true);
                                                            setIsEditingProfile(false);
                                                            setProfileBackup(null);
                                                            safeSetAlert({ show: true, type: 'success', message: 'Profile changes staged. Click Apply Changes at the bottom of the page to save permanently.', duration: 3000 });
                                                        }} className="btn btn-primary px-3 py-2"><Save size={16} /><span className="hidden sm:inline ml-2">Save</span>
                                                        </button>
                                                        <button onClick={() => {
                                                            if (profileBackup) {
                                                                setProfileName(profileBackup.name);
                                                                setProfileTitle(profileBackup.title);
                                                                setProfileBio(profileBackup.bio);
                                                                setProfileEmail(profileBackup.email);
                                                                setProfilePhone(profileBackup.phone);
                                                                setProfileLocation(profileBackup.location);
                                                                setProfileBackup(null);
                                                            }
                                                            setIsEditingProfile(false);
                                                        }} className="btn btn-secondary px-3 py-2"><X size={16} /><span className="hidden sm:inline ml-2">Cancel</span></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex gap-2 items-center">
                                                {profileImageDirty ? (
                                                    <>
                                                        <button onClick={() => {
                                                            // Stage upload - actual upload will happen when Apply Changes is clicked
                                                            setHasUnsavedChanges(true);
                                                            safeSetAlert({ show: true, type: 'success', message: 'Profile image staged. Click Apply Changes to save to Firebase.', duration: 3000 });
                                                        }} className="btn btn-primary px-3 py-2" disabled={profileImageUploading}>{profileImageUploading ? 'Saving...' : (<><Save size={16} /><span className="hidden sm:inline ml-2">Save Image</span></>)}</button>
                                                        <button onClick={handleCancelProfileImageChange} className="btn btn-secondary px-3 py-2"><X size={16} /><span className="hidden sm:inline ml-2">Cancel</span></button>
                                                    </>
                                                ) : null}
                                            </div>

                                            <input ref={profileImageInputRef} type="file" accept="image/*" onChange={handleProfileImageUpload} style={{ display: 'none' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Social Links Editor */}
                            <div className="settings-panel glass-panel p-6 flex flex-col gap-4" style={{ opacity: revealedTabs.account ? 1 : 0 }}>
                                <h3 className="heading-md text-base sm:text-lg md:text-xl flex items-center mb-2">
                                    <Link size={22} className="mr-3" />
                                    Social Links
                                </h3>
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                        <div className="sm:col-span-4">
                                            <label className="text-xs text-muted mb-1 block">Platform Name</label>
                                            <input
                                                className="input-field w-full"
                                                placeholder="e.g. GitHub"
                                                value={newLinkName}
                                                onChange={(e) => setNewLinkName(e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-6">
                                            <label className="text-xs text-muted mb-1 block">URL</label>
                                            <input
                                                className="input-field w-full"
                                                placeholder="https://..."
                                                value={newLinkUrl}
                                                onChange={(e) => setNewLinkUrl(e.target.value)}
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <button
                                                className="btn btn-primary w-full justify-center"
                                                disabled={socialLinks.length >= 5 || !newLinkName || !newLinkUrl}
                                                onClick={() => {
                                                    if (socialLinks.length < 5 && newLinkName && newLinkUrl) {
                                                        setSocialLinks([...socialLinks, { name: newLinkName, url: newLinkUrl }]);
                                                        setNewLinkName('');
                                                        setNewLinkUrl('');
                                                        setHasUnsavedChanges(true);
                                                    }
                                                }}
                                            >
                                                <Plus size={18} /> <span className="hidden sm:inline">Add</span>
                                            </button>
                                        </div>
                                    </div>

                                    {socialLinks.length > 0 ? (
                                        <div className="flex flex-col gap-2 mt-2">
                                            {socialLinks.map((link, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                            <Link size={14} className="text-primary" />
                                                        </div>
                                                        <div className="flex flex-col overflow-hidden">
                                                            <span className="font-bold text-sm truncate">{link.name}</span>
                                                            <span className="text-xs text-muted truncate">{link.url}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        onClick={() => {
                                                            const newLinks = [...socialLinks];
                                                            newLinks.splice(index, 1);
                                                            setSocialLinks(newLinks);
                                                            setHasUnsavedChanges(true);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-muted text-sm">
                                            No social links added yet. Add up to 5 links.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Education Editor */}
                        <div className="settings-panel md:col-span-12 glass-panel p-6 flex flex-col gap-4" style={{ opacity: revealedTabs.account ? 1 : 0 }}>
                            <h3 className="heading-md text-base sm:text-lg md:text-xl flex items-center mb-2">
                                <GraduationCap size={22} className="mr-3" />
                                Academic Background
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    <div className="sm:col-span-4">
                                        <label className="text-xs text-muted mb-1 block">Degree / Program</label>
                                        <input className="input-field w-full" placeholder="e.g. Systems Information & Comp. Eng." value={newEduDegree} onChange={(e) => setNewEduDegree(e.target.value)} />
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className="text-xs text-muted mb-1 block">Institution</label>
                                        <input className="input-field w-full" placeholder="e.g. MISR Engineering & Technology (MET) • First Year" value={newEduInstitution} onChange={(e) => setNewEduInstitution(e.target.value)} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="text-xs text-muted mb-1 block">Period</label>
                                        <input className="input-field w-full" placeholder="e.g. 2025 — 2030" value={newEduPeriod} onChange={(e) => setNewEduPeriod(e.target.value)} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <button
                                            className="btn btn-primary w-full justify-center"
                                            disabled={!newEduDegree || !newEduInstitution}
                                            onClick={() => {
                                                if (newEduDegree && newEduInstitution) {
                                                    setEducationList([...educationList, { degree: newEduDegree, institution: newEduInstitution, period: newEduPeriod }]);
                                                    setNewEduDegree('');
                                                    setNewEduInstitution('');
                                                    setNewEduPeriod('');
                                                    setHasUnsavedChanges(true);
                                                }
                                            }}
                                        >
                                            <Plus size={18} /> <span className="hidden sm:inline">Add</span>
                                        </button>
                                    </div>
                                </div>

                                {educationList.length > 0 ? (
                                    <div className="flex flex-col gap-2 mt-2">
                                        {educationList.map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                        <GraduationCap size={14} className="text-primary" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-bold text-sm truncate">{entry.degree}</span>
                                                        <span className="text-xs text-muted truncate">{entry.institution}{entry.period ? ` • ${entry.period}` : ''}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        const next = [...educationList];
                                                        next.splice(index, 1);
                                                        setEducationList(next);
                                                        setHasUnsavedChanges(true);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-muted text-sm">
                                        No education entries yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Impact Editor */}
                        <div className="settings-panel md:col-span-12 glass-panel p-6 flex flex-col gap-4" style={{ opacity: revealedTabs.account ? 1 : 0 }}>
                            <h3 className="heading-md text-base sm:text-lg md:text-xl flex items-center mb-2">
                                <TrendingUp size={22} className="mr-3" />
                                Impact
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    <div className="sm:col-span-10">
                                        <label className="text-xs text-muted mb-1 block">Impact Statement</label>
                                        <input className="input-field w-full" placeholder="e.g. Built 3 major apps in 1st year." value={newImpactText} onChange={(e) => setNewImpactText(e.target.value)} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <button
                                            className="btn btn-primary w-full justify-center"
                                            disabled={!newImpactText}
                                            onClick={() => {
                                                if (newImpactText) {
                                                    setImpactList([...impactList, { text: newImpactText }]);
                                                    setNewImpactText('');
                                                    setHasUnsavedChanges(true);
                                                }
                                            }}
                                        >
                                            <Plus size={18} /> <span className="hidden sm:inline">Add</span>
                                        </button>
                                    </div>
                                </div>

                                {impactList.length > 0 ? (
                                    <div className="flex flex-col gap-2 mt-2">
                                        {impactList.map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                        <TrendingUp size={14} className="text-primary" />
                                                    </div>
                                                    <span className="text-sm truncate">{entry.text}</span>
                                                </div>
                                                <button
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        const next = [...impactList];
                                                        next.splice(index, 1);
                                                        setImpactList(next);
                                                        setHasUnsavedChanges(true);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-muted text-sm">
                                        No impact statements yet.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Languages Editor */}
                        <div className="settings-panel md:col-span-12 glass-panel p-6 flex flex-col gap-4" style={{ opacity: revealedTabs.account ? 1 : 0 }}>
                            <h3 className="heading-md text-base sm:text-lg md:text-xl flex items-center mb-2">
                                <Languages size={22} className="mr-3" />
                                Languages
                            </h3>
                            <div className="flex flex-col gap-4">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                    <div className="sm:col-span-6">
                                        <label className="text-xs text-muted mb-1 block">Language</label>
                                        <input className="input-field w-full" placeholder="e.g. English" value={newLangName} onChange={(e) => setNewLangName(e.target.value)} />
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className="text-xs text-muted mb-1 block">Level</label>
                                        <input className="input-field w-full" placeholder="e.g. Prof. / Native" value={newLangLevel} onChange={(e) => setNewLangLevel(e.target.value)} />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <button
                                            className="btn btn-primary w-full justify-center"
                                            disabled={!newLangName || !newLangLevel}
                                            onClick={() => {
                                                if (newLangName && newLangLevel) {
                                                    setLanguagesList([...languagesList, { name: newLangName, level: newLangLevel }]);
                                                    setNewLangName('');
                                                    setNewLangLevel('');
                                                    setHasUnsavedChanges(true);
                                                }
                                            }}
                                        >
                                            <Plus size={18} /> <span className="hidden sm:inline">Add</span>
                                        </button>
                                    </div>
                                </div>

                                {languagesList.length > 0 ? (
                                    <div className="flex flex-col gap-2 mt-2">
                                        {languagesList.map((entry, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                                        <Languages size={14} className="text-primary" />
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="font-bold text-sm truncate">{entry.name}</span>
                                                        <span className="text-xs text-muted truncate">{entry.level}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    onClick={() => {
                                                        const next = [...languagesList];
                                                        next.splice(index, 1);
                                                        setLanguagesList(next);
                                                        setHasUnsavedChanges(true);
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 border border-dashed border-white/10 rounded-xl text-muted text-sm">
                                        No languages added yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Project Modal */}
            <MHandlingProject
                isOpen={projectModalOpen}
                onClose={closeProjectModal}
                onSave={handleSaveProjectLocal}
                initialData={editingProject}
            />

            {/* Stack Modal */}
            <MStackItem
                isOpen={stackModalOpen}
                onClose={closeStackModal}
                onSave={handleSaveStack}
                initialData={editingStack}
            />

            {/* Sticky Action Bar */}
            {
                hasUnsavedChanges && (
                    <div
                        className="fixed bottom-10 z-[5000] flex animate-slide-up pointer-events-none"
                        style={{
                            left: '50%',
                            transform: 'translateX(calc(-50% + (var(--sidebar-width, 0px) / 2)))'
                        }}
                    >
                        <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-4 rounded-full shadow-2xl border pointer-events-auto" style={{
                            background: isDark ? 'rgba(10, 10, 12, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(32px)',
                            WebkitBackdropFilter: 'blur(32px)',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                        }}>
                            <button
                                id="apply-all-btn"
                                onClick={handleApplyAll}
                                className="btn-primary px-5 sm:px-8 py-2.5 sm:py-3 rounded-full shadow-2xl shadow-blue-500/20 text-[13px] sm:text-[15px] font-bold flex items-center gap-2 hover:scale-105 transition-all whitespace-nowrap"
                            >
                                <Save size={18} className="sm:w-5 sm:h-5" /> Apply Settings
                            </button>

                            <button
                                onClick={handleCancelAll}
                                className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-full border transition-all font-semibold text-[13px] sm:text-[14px] whitespace-nowrap ${isDark
                                    ? 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                                    : 'bg-black/5 hover:bg-black/10 text-black border-black/10'
                                    }`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }

            <MConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                confirmText="Confirm"
            />

        </div >
    );
};

