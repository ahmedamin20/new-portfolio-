import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Mail, Phone, MapPin, Globe, Github, Linkedin, Instagram, ExternalLink, FileText } from 'lucide-react';
import { ProjectData as FullProject } from '../types';
import { useSocialTracker } from '../hooks/useSocialTracker';

interface CVProject {
    id: number;
    title: string;
    stack: string[];
    fullData?: unknown;
    listing?: number;
}

type StackItem = { id: number; name: string; icon?: string };

interface ApiContributor {
    id: number;
    name: string;
    role: string | null;
    imageUrl: string | null;
    github: string | null;
    linkedin: string | null;
    facebook: string | null;
    instagram: string | null;
    portfolio: string | null;
}

interface ApiProject {
    id: number;
    name: string;
    description: string | null;
    liveLink: string | null;
    repoLink: string | null;
    downloadLink: string | null;
    iconUrl: string | null;
    viewsProject: number;
    viewsGithub: number;
    viewsLive: number;
    viewsDownload: number;
    listing: number;
    tags: { tag: { name: string } }[];
    contributors: { roleAtProject: string | null; contributor: ApiContributor }[];
    images: { url: string }[];
}

interface MCVProps {
    isOpen: boolean;
    onClose: () => void;
    onProjectClick: (project: FullProject) => void;
}

const MCV = ({ onClose, onProjectClick }: Omit<MCVProps, 'isOpen'>) => {
    const { trackClick } = useSocialTracker();
    const [projects, setProjects] = useState<CVProject[]>([]);
    const [socialLinks, setSocialLinks] = useState<{ name: string; url: string }[]>([]);
    const [contactInfo, setContactInfo] = useState({
        email: '',
        phone: '',
        location: ''
    });
    const [bio, setBio] = useState('');
    const [ownerName, setOwnerName] = useState('');
    const [ownerTitle, setOwnerTitle] = useState('');
    const [education, setEducation] = useState<{ degree: string; institution: string; period: string | null }[]>([]);
    const [impact, setImpact] = useState<{ text: string }[]>([]);
    const [languages, setLanguages] = useState<{ name: string; level: string }[]>([]);
    const [availableStack, setAvailableStack] = useState<StackItem[]>([]);

    // Fetch contact info
    useEffect(() => {
        fetch('/api/settings/account')
            .then(res => res.json())
            .then(body => {
                const data = body.data;
                if (data) {
                    setContactInfo({
                        email: data.email || '',
                        phone: data.phone || '',
                        location: data.location || ''
                    });
                    setBio(data.bio || '');
                    setOwnerName(data.name || '');
                    setOwnerTitle(data.title || '');
                    setEducation(data.education || []);
                    setImpact(data.impact || []);
                    setLanguages(data.languages || []);
                }
            })
            .catch(err => console.warn('Failed to load contact info', err));
    }, []);

    // Fetch Tech Stack
    useEffect(() => {
        fetch('/api/tech-stack')
            .then(res => res.json())
            .then(body => {
                const items: StackItem[] = (body.data as { id: number; name: string; iconUrl: string }[]).map(i => ({
                    id: i.id,
                    name: i.name,
                    icon: i.iconUrl
                }));
                setAvailableStack(items);
            })
            .catch(err => console.warn('Failed to load tech stack', err));
    }, []);

    // Fetch Projects
    useEffect(() => {
        fetch('/api/projects')
            .then(res => res.json())
            .then(body => {
                const loaded: CVProject[] = (body.data as ApiProject[]).map((data) => {
                    const stack = data.tags.map(({ tag }) => tag.name);

                    const projectContributors = data.contributors.map(({ contributor, roleAtProject }) => ({
                        name: contributor.name,
                        role: roleAtProject || contributor.role || 'Contributor',
                        jobTitle: contributor.role || 'Contributor',
                        image: contributor.imageUrl || '',
                        links: {
                            github: contributor.github || undefined,
                            linkedin: contributor.linkedin || undefined,
                            facebook: contributor.facebook || undefined,
                            instagram: contributor.instagram || undefined,
                            portfolio: contributor.portfolio || undefined
                        }
                    }));

                    const mappedProject = {
                        id: data.id,
                        title: data.name,
                        name: data.name,
                        description: data.description || '',
                        fullDescription: data.description || '',
                        images: data.images.map(img => img.url),
                        stack,
                        contributors: projectContributors,
                        repoLink: data.repoLink,
                        liveLink: data.liveLink,
                        downloadLink: data.downloadLink || '',
                        views: data.viewsProject,
                        githubViews: data.viewsGithub,
                        liveViews: data.viewsLive,
                        downloadViews: data.viewsDownload
                    };

                    return {
                        id: data.id,
                        title: mappedProject.title,
                        stack,
                        fullData: mappedProject,
                        listing: data.listing
                    };
                }).sort((a, b) => {
                    const aVal = a.listing && a.listing > 0 ? a.listing : 999999;
                    const bVal = b.listing && b.listing > 0 ? b.listing : 999999;
                    if (aVal !== bVal) return aVal - bVal;
                    return (a.title || '').localeCompare(b.title || '');
                });
                setProjects(loaded);
            })
            .catch(err => console.warn('Failed to load projects', err));
    }, []);

    // Fetch Social Links
    useEffect(() => {
        fetch('/api/settings/account')
            .then(res => res.json())
            .then(body => {
                const links = body.data?.socialLinks as { platform: string; url: string }[] | undefined;
                if (links) {
                    setSocialLinks(
                        links
                            .filter(l => !l.platform.toLowerCase().includes('instagram'))
                            .map(l => ({ name: l.platform, url: l.url }))
                    );
                }
            })
            .catch(err => console.warn('Failed to load social links', err));
    }, []);

    // Close on Escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    const getSocialIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('github')) return <Github size={16} />;
        if (lower.includes('linkedin')) return <Linkedin size={16} />;
        if (lower.includes('instagram')) return <Instagram size={16} />;
        if (lower.includes('whatsapp')) return <img src="https://cdn.simpleicons.org/whatsapp/25D366" alt="" width={16} height={16} />;
        return <Globe size={16} />;
    };

    return createPortal(
        <>
            {/* Overlay */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-[1500] bg-black/20 dark:bg-black/40 backdrop-blur-xl"
            />

            {/* Modal Container */}
            <div className="fixed inset-0 z-[1501] flex items-center justify-center p-4 md:p-12 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.3, y: 400 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.3, y: 400 }}
                    transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 1 }}
                    style={{ transformOrigin: 'bottom center' }}
                    onClick={(e) => e.stopPropagation()}
                    className="glass-panel-deep relative w-full max-w-5xl h-full max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col border border-black/5 dark:border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                >
                    {/* Header & Title */}
                    <div className="p-6 pb-0 flex flex-col gap-4 relative z-10 shrink-0 font-sans">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <motion.div
                                    layoutId="cv-icon"
                                    className="flex items-center justify-center"
                                    transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 1 }}
                                >
                                    <FileText size={26} strokeWidth={2} className="text-blue-500" />
                                </motion.div>
                                <h2 className="text-2xl font-bold text-primary m-0 tracking-tight" style={{ fontSize: '1.5rem' }}>
                                    Fast Report
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 hover:bg-red-500/10 dark:hover:bg-red-500/10 hover:border-red-500/20 dark:hover:border-red-500/30 hover:text-red-500 rounded-full transition-all text-sec shadow-sm group"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>
                    </div>

                    {/* CV Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-6 py-2 selection:bg-blue-500/30">
                        <div className="max-w-4xl mx-auto space-y-10">

                            {/* Header Section */}
                            <header className="space-y-5">
                                <div className="space-y-3">
                                    <motion.h1
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="text-5xl md:text-7xl font-black tracking-tighter text-primary font-sans uppercase leading-none"
                                    >
                                        {ownerName}
                                    </motion.h1>
                                    {ownerTitle && (
                                        <p className="text-blue-500/80 dark:text-blue-400/80 font-sans font-bold tracking-[0.2em] text-lg md:text-sm uppercase">{ownerTitle}</p>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-x-8 gap-y-3 text-base text-sec font-sans">
                                    <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2.5 hover:text-primary transition-colors">
                                        <Mail size={16} className="text-blue-500" /> {contactInfo.email}
                                    </a>
                                    <span className="flex items-center gap-2.5">
                                        <Phone size={16} className="text-blue-500" /> {contactInfo.phone}
                                    </span>
                                    <span className="flex items-center gap-2.5">
                                        <MapPin size={16} className="text-blue-500" /> {contactInfo.location}
                                    </span>
                                </div>
                            </header>

                            <div className="grid md:grid-cols-[1fr_350px] gap-10 pt-10 md:pt-6">
                                <div className="space-y-16">
                                    {/* Summary Section */}
                                    <section className="space-y-4">
                                        <h2 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-[0.3em] text-blue-500">Overview</h2>
                                        {bio && (
                                            <p className="text-lg leading-relaxed text-sec font-medium block">
                                                {bio}
                                            </p>
                                        )}
                                    </section>

                                    {/* Projects Section (Dynamic) */}
                                    <section className="space-y-8">
                                        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
                                            <h2 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-[0.3em] text-blue-500">Projects</h2>
                                        </div>
                                        <div className="space-y-8">
                                            {projects.length > 0 ? projects.map((project) => (
                                                <motion.div
                                                    key={project.id}
                                                    whileHover={{ x: 10 }}
                                                    onClick={() => onProjectClick(project.fullData as FullProject)}
                                                    className="group cursor-pointer space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-2xl font-bold text-primary group-hover:text-blue-500 transition-colors uppercase tracking-tight">{project.title}</h3>
                                                        <ExternalLink size={16} className="text-blue-500/0 group-hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                                        {project.stack.map((tech) => (
                                                            <span
                                                                key={tech}
                                                                className="px-2.5 py-1 bg-black/[0.04] dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-full text-[9.5px] font-black text-blue-500/80 uppercase tracking-wider"
                                                            >
                                                                {tech}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )) : (
                                                <p className="text-muted text-sm italic">Synchronizing cloud assets...</p>
                                            )}
                                        </div>
                                    </section>

                                    {/* Education Section */}
                                    {education.length > 0 && (
                                        <section className="space-y-8 pt-4">
                                            <h2 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-[0.3em] text-blue-500">Academic Background</h2>
                                            <div className="space-y-8 pt-2">
                                                {education.map((entry, i) => (
                                                    <div key={i} className={`space-y-4 ${i > 0 ? 'opacity-60' : ''}`}>
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="text-xl font-bold text-primary">{entry.degree}</h3>
                                                            {entry.period && (
                                                                <span className={`text-[10px] font-black px-2 py-1 rounded ${i === 0 ? 'text-blue-500 bg-blue-500/10' : 'text-muted border border-black/10 dark:border-white/10'}`}>{entry.period}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sec text-sm">{entry.institution}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>

                                <aside className="space-y-12">
                                    {/* Skills Section */}
                                    <section className="space-y-6">
                                        <h2 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-[0.3em] text-blue-500">Stack</h2>
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {availableStack.map((skill) => (
                                                <motion.div
                                                    key={skill.id}
                                                    whileHover={{ scale: 1.05, y: -2 }}
                                                    className="flex items-center gap-2 px-3.5 py-1.5 bg-white/40 dark:bg-black/20 backdrop-blur-md border border-black/[0.03] dark:border-white/[0.05] rounded-2xl shadow-sm cursor-default transition-all hover:bg-white/60 dark:hover:bg-black/40 hover:border-blue-500/20"
                                                >
                                                    {skill.icon && (
                                                        <img
                                                            src={skill.icon}
                                                            alt=""
                                                            width={14}
                                                            height={14}
                                                            className="shrink-0 opacity-70"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    )}
                                                    <span className="text-[12px] font-bold text-sec whitespace-nowrap">{skill.name}</span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Achievements */}
                                    {impact.length > 0 && (
                                        <section className="space-y-6">
                                            <h2 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-[0.3em] text-blue-500">Impact</h2>
                                            <div className="space-y-4 text-xs leading-relaxed text-sec pt-2">
                                                {impact.map((entry, i) => (
                                                    <p key={i}>{entry.text}</p>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    {/* Presence */}
                                    <section className="space-y-6">
                                        <h2 className="text-sm md:text-base lg:text-lg font-black uppercase tracking-[0.3em] text-blue-500">Connect</h2>
                                        <div className="flex flex-col gap-3 pt-2">
                                            {socialLinks.filter(link => !link.name.toLowerCase().includes('instagram')).map((link) => (
                                                <a
                                                    key={link.name}
                                                    href={link.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={() => trackClick(link.name)}
                                                    className="flex items-center gap-3 text-xs md:text-sm font-bold text-sec hover:text-blue-500 transition-all group"
                                                >
                                                    <span className="p-2 bg-black/5 dark:bg-white/5 rounded-lg group-hover:bg-blue-500/10 dark:group-hover:bg-blue-500/20 transition-colors">
                                                        {getSocialIcon(link.name)}
                                                    </span>
                                                    {link.name}
                                                </a>
                                            ))}
                                        </div>
                                    </section>
                                </aside>
                            </div>

                            {/* Footer */}
                            <footer className="pt-12 border-t border-black/5 dark:border-white/5 flex flex-col items-center gap-4">
                                {languages.length > 0 && (
                                    <div className="flex items-center gap-2 flex-wrap justify-center">
                                        {languages.map((lang, i) => (
                                            <span key={i} className="flex items-center gap-2">
                                                {i > 0 && <div className="w-1 h-1 rounded-full bg-black/10 dark:bg-white/10" />}
                                                <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{lang.name} ({lang.level})</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest leading-loose text-center">
                                    © {new Date().getFullYear()} {ownerName}
                                </p>
                            </footer>
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
        ,
        document.body
    );
};

export default MCV;
