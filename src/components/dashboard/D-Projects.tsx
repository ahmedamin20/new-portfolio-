import { useState, useEffect, useMemo } from 'react';
import { sanitizeSvg } from '../../lib/sanitize';
import { createPortal } from 'react-dom';
import { Plus, Search, MoreVertical, ExternalLink, Eye, Edit2, Trash2, Github, GripVertical } from 'lucide-react';
import { Reorder, useDragControls } from 'motion/react';
import { uploadToCloudinary, deleteFromCloudinaryUrl } from '../../lib/cloudinary';
import { apiFetch } from '../../lib/apiFetch';
import Alert from '../Alert';
import useSafeAlert from '../../hooks/useSafeAlert';
import MProjectForm from './M-ProjectForm';
import { ProjectData, ContributorData, ProjectFormData, TagData } from '../../types';
import MProjectView from '../M-ProjectView';
import MContributorView, { Contributor } from '../M-ContributorView';
import Loader from '../reactbits/Loader';
import MConfirmModal, { ConfirmType } from './M-ConfirmModal';

interface ApiTag {
    id: number;
    name: string;
    color: string;
    iconUrl: string | null;
}

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
    tags: { tag: ApiTag }[];
    contributors: { roleAtProject: string | null; contributor: ApiContributor }[];
    images: { url: string }[];
}


interface ProjectRowProps {
    project: ProjectData;
    isDark: boolean;
    dragWidth: string;
    tableColumns: string;
    tableMinWidth: string;
    searchQuery: string;
    setViewingProject: (p: ProjectData) => void;
    setViewingContributor: (c: ContributorData) => void;
    onReorderEnd: () => void;
    activeMenu: string | number | null;
    setActiveMenu: (id: string | number | null) => void;
    setMenuPos: (pos: { top: number; right: number }) => void;
}

const ProjectRow = ({
    project,
    isDark,
    dragWidth,
    tableColumns,
    tableMinWidth,
    searchQuery,
    setViewingProject,
    setViewingContributor,
    onReorderEnd,
    activeMenu,
    setActiveMenu,
    setMenuPos
}: ProjectRowProps) => {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={project}
            dragListener={false}
            dragControls={controls}
            className="grid p-4 border-b items-center transition-colors cursor-pointer"
            style={{
                gridTemplateColumns: `${dragWidth} ${tableColumns}`,
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                minWidth: `calc(${tableMinWidth} + ${dragWidth})`,
                position: 'relative',
                background: 'var(--card-bg)'
            }}
            onClick={() => setViewingProject(project)}
            onDragEnd={onReorderEnd}
            whileDrag={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                zIndex: 100
            }}
        >
            {/* Drag Handle */}
            <div
                className={`flex items-center justify-center text-sec transition-opacity ${searchQuery.length < 2 ? 'opacity-40 hover:opacity-100 cursor-grab' : 'opacity-10 cursor-not-allowed'}`}
                onPointerDown={(e) => searchQuery.length < 2 && controls.start(e)}
                onClick={(e) => e.stopPropagation()}
            >
                <GripVertical size={18} />
            </div>

            {/* Project Info */}
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
                    {project.icon ? (
                        typeof project.icon === 'string' ? (
                            <img src={project.icon} alt={project.name} className="w-full h-full object-cover" />
                        ) : (
                            <img src={URL.createObjectURL(project.icon)} alt={project.name} className="w-full h-full object-cover" />
                        )
                    ) : project.images.length > 0 ? (
                        <div className="w-full h-full bg-blue-500 text-white flex items-center justify-center font-bold">{project.name.charAt(0)}</div>
                    ) : (
                        <span className="text-xl">📁</span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-primary truncate" style={{ maxWidth: '100%' }} title={project.name}>{project.name}</div>
                    <div className="text-xs text-sec opacity-70" style={{
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }} title={project.description}>
                        {project.description}
                    </div>
                </div>
            </div>

            {/* Tags - Minimalist Badges */}
            <div className="flex items-center">
                {project.tags && project.tags.length > 0 ? (
                    <div className="flex items-center">
                        {project.tags.slice(0, 5).map((tag, idx) => (
                            <div key={idx} title={tag.name}
                                className="w-8 h-8 rounded-full flex items-center justify-center border shadow-sm relative transition-all hover:z-20 cursor-help hover:scale-110"
                                style={{
                                    backgroundColor: tag.color ? `${tag.color}40` : 'rgba(59, 130, 246, 0.25)',
                                    borderColor: tag.color || 'rgba(59, 130, 246, 0.5)',
                                    color: 'white',
                                    zIndex: 10 - idx,
                                    marginLeft: idx === 0 ? 0 : -12,
                                    backdropFilter: 'blur(4px)',
                                    transform: `translateX(-${idx * 2}px)`
                                }}>
                                {tag.iconSvg ? (
                                    (tag.iconSvg.startsWith('http') || tag.iconSvg.startsWith('data:image')) ? (
                                        <img src={tag.iconSvg} alt={tag.name} className="w-4 h-4 object-contain" />
                                    ) : (
                                        <span className="w-4 h-4 flex items-center justify-center"
                                            style={{ filter: isDark ? 'brightness(0) invert(1)' : 'none' }}
                                            dangerouslySetInnerHTML={{ __html: sanitizeSvg(tag.iconSvg || '') }} />
                                    )
                                ) : (
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200">{tag.name.charAt(0)}</span>
                                )}
                            </div>
                        ))}
                        {project.tags.length > 5 && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1a1a1a] bg-gray-100 dark:bg-white/10 text-[9px] font-bold text-sec shadow-sm relative" style={{ zIndex: 0, marginLeft: -10 }}>
                                +{project.tags.length - 5}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-xs text-sec">—</div>
                )}
            </div>

            {/* Contributors */}
            <div className="flex items-center gap-2">
                {project.contributors && project.contributors.length > 0 ? (
                    <div className="flex items-center">
                        {project.contributors.slice(0, 5).map((c, i) => (
                            <div key={i}
                                className="w-7 h-7 rounded-full overflow-hidden border-2 border-white dark:border-[#1a1a1a] bg-gray-200 shadow-sm relative transition-all hover:z-20 cursor-pointer hover:scale-110"
                                title={c.name}
                                style={{
                                    zIndex: 10 - i,
                                    marginLeft: i === 0 ? 0 : -12,
                                    transform: `translateX(-${i * 2}px)`
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingContributor(c);
                                }}
                            >
                                {c.image ? (
                                    typeof c.image === 'string' ? (
                                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={URL.createObjectURL(c.image)} alt={c.name} className="w-full h-full object-cover" />
                                    )
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-accent/10 text-accent">{c.name.charAt(0)}</div>
                                )}
                            </div>
                        ))}
                        {project.contributors.length > 5 && (
                            <div className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-[#1a1a1a] bg-gray-200 dark:bg-white/10 text-[9px] font-bold text-sec shadow-sm relative" style={{ zIndex: 0, marginLeft: -12 }}>
                                +{project.contributors.length - 5}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-xs text-sec">—</div>
                )}
            </div>

            {/* Views */}
            <div className="flex items-center gap-1.5 text-sec">
                <Eye size={16} />
                {typeof project.views === 'number' ? project.views : 0}
            </div>

            {/* Actions */}
            <div className="text-right relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setMenuPos({
                            top: rect.bottom + 4,
                            right: window.innerWidth - rect.right
                        });
                        setActiveMenu(activeMenu === project.id ? null : project.id!);
                    }}
                    className={`p-2 rounded-lg border-none bg-transparent cursor-pointer transition-all ${activeMenu === project.id ? 'text-blue-500 bg-blue-500/10' : 'text-sec hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <MoreVertical size={20} />
                </button>
            </div>
        </Reorder.Item>
    );
};

const DProjects = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<ProjectFormData | null>(null);
    const [isDark, setIsDark] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [activeMenu, setActiveMenu] = useState<string | number | null>(null);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingProject, setViewingProject] = useState<ProjectData | null>(null);
    const [viewingContributor, setViewingContributor] = useState<ContributorData | null>(null);

    // Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: ConfirmType;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Alert Toast State
    const { alert, showAlert, hideAlert } = useSafeAlert(4000);

    // Levenshtein distance for fuzzy search
    const getLevenshteinDistance = (a: string, b: string) => {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                    );
                }
            }
        }
        return matrix[b.length][a.length];
    };

    const filteredProjects = useMemo(() => {
        const sorted = [...projects].sort((a, b) => {
            const aVal = a.listing && a.listing > 0 ? a.listing : 999999;
            const bVal = b.listing && b.listing > 0 ? b.listing : 999999;
            if (aVal !== bVal) return aVal - bVal;
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            return aName.localeCompare(bName);
        });

        if (searchQuery.length < 2) {
            return sorted;
        }

        const query = searchQuery.toLowerCase();
        // ... (rest of search scoring logic)

        const scored = projects.map(project => {
            let minDistance = Infinity;
            // Check helper
            const checkTerm = (term: string) => {
                const lower = term.toLowerCase();
                if (lower.includes(query)) return 0;
                const words = lower.split(/[\s-_]+/);
                let d = Infinity;
                words.forEach(w => {
                    d = Math.min(d, getLevenshteinDistance(query, w));
                });
                return d;
            };

            // Search in Name
            minDistance = Math.min(minDistance, checkTerm(project.name));

            // Search in Tags (assuming plain string array or object with name)
            // project.tags is {name: string, ...}[] based on usage
            project.tags.forEach(tag => {
                minDistance = Math.min(minDistance, checkTerm(tag.name));
            });

            return { project, minDistance };
        });

        return scored
            .filter(item => item.minDistance <= 2)
            .sort((a, b) => a.minDistance - b.minDistance)
            .map(item => item.project);
    }, [projects, searchQuery]);

    // Responsive breakpoints
    const isExtraSmall = windowWidth < 400;
    const isSmall = windowWidth < 640;

    useEffect(() => {
        const checkTheme = () => setIsDark(document.documentElement.classList.contains('dark'));
        const handleResize = () => setWindowWidth(window.innerWidth);

        checkTheme();
        window.addEventListener('resize', handleResize);
        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => {
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, []);

    const handleAddProject = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const handleEditProject = (project: ProjectData) => {
        setEditingProject(project);
        setIsModalOpen(true);
        setActiveMenu(null);
    };

    const loadProjects = async () => {
        try {
            const res = await fetch('/api/projects');
            const body = await res.json();
            const loaded: ProjectData[] = (body.data as ApiProject[]).map((p) => {
                const tags: TagData[] = p.tags.map(({ tag }) => ({
                    id: tag.id,
                    name: tag.name,
                    color: tag.color,
                    iconSvg: tag.iconUrl || undefined
                }));

                const contributors: ContributorData[] = p.contributors.map(({ contributor, roleAtProject }) => ({
                    id: contributor.id,
                    name: contributor.name,
                    role: roleAtProject || contributor.role || 'Contributor',
                    jobTitle: contributor.role || 'Contributor',
                    image: contributor.imageUrl || undefined,
                    socials: {
                        github: contributor.github || undefined,
                        linkedin: contributor.linkedin || undefined,
                        facebook: contributor.facebook || undefined,
                        instagram: contributor.instagram || undefined,
                        portfolio: contributor.portfolio || undefined
                    }
                }));

                return {
                    id: p.id,
                    name: p.name,
                    description: p.description || '',
                    liveLink: p.liveLink || '',
                    repoLink: p.repoLink || '',
                    downloadLink: p.downloadLink || '',
                    icon: p.iconUrl || '',
                    tags,
                    stack: tags.map(t => t.name),
                    contributors,
                    views: p.viewsProject,
                    githubViews: p.viewsGithub,
                    liveViews: p.viewsLive,
                    downloadViews: p.viewsDownload,
                    images: p.images.map(img => img.url),
                    listing: p.listing
                } as ProjectData;
            });
            setProjects(loaded);
        } catch {
            showAlert({ type: 'warning', message: 'Projects sync failed' });
        }
    };

    useEffect(() => {
        loadProjects();
    }, []);

    const handleDeleteProject = (projectId: string | number) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Project',
            message: 'Are you sure you want to permanently delete this project? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    setIsLoading(true);

                    const project = projects.find(p => p.id === projectId);

                    await apiFetch(`/api/projects/${projectId}`, { method: 'DELETE' });

                    // Best-effort cleanup of the project's Cloudinary files
                    if (project) {
                        const filesToDelete = [
                            ...(typeof project.icon === 'string' ? [project.icon] : []),
                            ...project.images.filter((img): img is string => typeof img === 'string')
                        ];
                        for (const url of filesToDelete) {
                            try {
                                await deleteFromCloudinaryUrl(url);
                            } catch (err) {
                                console.warn('Failed to delete Cloudinary file:', url, err);
                            }
                        }
                    }

                    await loadProjects();
                    showAlert({ type: 'success', message: 'Project deleted successfully.' });
                } catch {
                    showAlert({ type: 'error', message: 'Failed to delete project.' });
                } finally {
                    setIsLoading(false);
                }
            }
        });
        setActiveMenu(null);
    };

    const handleSaveProject = async (data: ProjectFormData) => {
        try {
            setIsLoading(true);

            let iconUrl = typeof data.icon === 'string' ? data.icon : '';
            const imageUrls: string[] = [];

            // 1. Upload Project Icon (if new file provided)
            if (data.icon && typeof data.icon !== 'string') {
                iconUrl = await uploadToCloudinary(data.icon as File, 'projects');
            }

            // 2. Upload Project Images
            for (const file of data.images) {
                if (typeof file === 'string') {
                    imageUrls.push(file);
                } else if (file instanceof File) {
                    const url = await uploadToCloudinary(file, 'projects');
                    imageUrls.push(url);
                }
            }

            const payload = {
                name: data.name,
                description: data.description,
                liveLink: data.liveLink,
                repoLink: data.repoLink,
                downloadLink: data.downloadLink || '',
                iconUrl,
                images: imageUrls,
                tagIds: data.tags.map((tag: TagData) => Number(tag.id)).filter((id) => !isNaN(id)),
                contributors: data.contributors.map((contrib: ContributorData) => ({
                    contributorId: Number(contrib.id),
                    roleAtProject: contrib.role
                })).filter((c) => !isNaN(c.contributorId)),
                listing: data.listing || 0
            };

            if (editingProject?.id) {
                await apiFetch(`/api/projects/${editingProject.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                await apiFetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            await loadProjects();
            setIsModalOpen(false);
        } catch {
            showAlert({ type: 'error', message: 'Failed to save project. Please check your data and try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReorder = (reordered: ProjectData[]) => {
        const withNewListing = reordered.map((p, idx) => ({ ...p, listing: idx + 1 }));
        setProjects(withNewListing);
    };

    const persistOrder = async () => {
        try {
            await Promise.all(
                filteredProjects.map((p, idx) =>
                    p.id
                        ? apiFetch(`/api/projects/${p.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ listing: idx + 1 })
                        })
                        : Promise.resolve()
                )
            );
        } catch (error) {
            console.error("Reorder persistence failed:", error);
            showAlert({ type: 'error', message: 'Failed to save projects order.' });
        }
    };

    // Responsive sizing
    const gap = isExtraSmall ? '16px' : '24px';
    const searchWidth = isExtraSmall ? '100%' : (isSmall ? '180px' : '300px');
    const inputPadding = isExtraSmall ? '10px 10px 10px 36px' : '12px 12px 12px 40px';
    const inputFontSize = isExtraSmall ? '0.85rem' : '0.9rem';
    const buttonPadding = isExtraSmall ? '10px 16px' : '12px 24px';

    // Table columns and min-width responsive settings
    const dragWidth = '40px';
    const actionWidth = '56px';
    const tableColumns = isExtraSmall
        ? `minmax(140px, 1fr) 80px 80px 60px ${actionWidth}`
        : isSmall
            ? `minmax(180px, 1fr) 120px 100px 70px ${actionWidth}`
            : `minmax(240px, 1fr) 180px 140px 80px ${actionWidth}`;
    const tableMinWidth = isExtraSmall ? '500px' : isSmall ? '680px' : '820px';

    return (
        <div className="h-[90%] flex flex-col" style={{ gap: gap }}>
            <Loader isOpen={isLoading} isFullScreen={true} />
            {/* Header Actions */}
            <div className="flex justify-between items-center" style={{
                flexWrap: isExtraSmall ? 'wrap' : 'nowrap',
                gap: isExtraSmall ? '12px' : '0'
            }}>
                <div className="relative" style={{ width: searchWidth, minWidth: isExtraSmall ? '100%' : 'auto' }}>
                    <Search size={isExtraSmall ? 18 : 20} className="absolute left-3 top-1/2 -translate-y-1/2 text-sec" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input-field w-full"
                        style={{
                            padding: inputPadding,
                            borderRadius: isExtraSmall ? '10px' : '12px',
                            fontSize: inputFontSize
                        }}
                    />
                </div>
                <button
                    onClick={handleAddProject}
                    className="btn btn-primary"
                    style={{
                        gap: isExtraSmall ? '6px' : '8px',
                        padding: buttonPadding,
                        width: isExtraSmall ? '100%' : 'auto',
                        borderRadius: isExtraSmall ? '10px' : '12px',
                        fontSize: isExtraSmall ? '0.85rem' : '0.9rem'
                    }}
                >
                    <Plus size={isExtraSmall ? 18 : 20} />
                    {isExtraSmall ? 'Add' : 'Add Project'}
                </button>
            </div>
            {/* Projects Table */}
            <div className="flex-1 glass-panel flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {/* Header */}
                    <div className="grid p-4 border-b text-sec font-semibold text-sm" style={{
                        gridTemplateColumns: `${dragWidth} ${tableColumns}`,
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        minWidth: `calc(${tableMinWidth} + ${dragWidth})`
                    }}>
                        <div style={{ textAlign: 'center' }}></div>
                        <div>Project Name</div>
                        <div>Tags</div>
                        <div>Contributors</div>
                        <div>Views</div>
                        <div style={{ textAlign: 'right' }}>Actions</div>
                    </div>

                    {/* Table Body */}
                    <Reorder.Group
                        axis="y"
                        values={filteredProjects}
                        onReorder={handleReorder}
                        className="min-w-0"
                    >
                        {filteredProjects.length === 0 ? (
                            <div className="p-12 text-center text-sec">
                                {searchQuery ? "No projects match your search." : "No projects found. Click \"Add Project\" to start."}
                            </div>
                        ) : (
                            filteredProjects.map((project) => (
                                <ProjectRow
                                    key={project.id}
                                    project={project}
                                    isDark={isDark}
                                    dragWidth={dragWidth}
                                    tableColumns={tableColumns}
                                    tableMinWidth={tableMinWidth}
                                    searchQuery={searchQuery}
                                    setViewingProject={setViewingProject}
                                    setViewingContributor={setViewingContributor}
                                    onReorderEnd={persistOrder}
                                    activeMenu={activeMenu}
                                    setActiveMenu={setActiveMenu}
                                    setMenuPos={setMenuPos}
                                />
                            ))
                        )}
                    </Reorder.Group>
                </div>
            </div>

            <MProjectForm
                key={isModalOpen ? (editingProject?.id || 'new') : 'none'}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
                initialData={editingProject}
            />

            <MConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onClose={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                confirmText="Delete Project"
            />

            {/* Custom Alert Toast */}
            {alert?.show && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => hideAlert()}
                    duration={alert.duration ?? 4000}
                />
            )}

            {/* Fixed Position Menu - Rendered via Portal */}
            {activeMenu && createPortal(
                <>
                    {/* Backdrop to close menu */}
                    <div
                        className="fixed inset-0 z-[999]"
                        onClick={() => setActiveMenu(null)}
                    />
                    <div className="fixed z-[1000] glass-panel min-w-[160px] p-2 animate-pop flex flex-col gap-2 shadow-2xl border border-white/10" style={{
                        top: `${menuPos.top}px`,
                        right: `${menuPos.right}px`,
                        borderRadius: '16px'
                    }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const project = projects.find(p => p.id === activeMenu);
                                if (project) setViewingProject(project);
                                setActiveMenu(null);
                            }}
                            className="w-full text-left flex items-center gap-2 bg-transparent border-none cursor-pointer rounded-lg text-sm p-2.5 transition-colors"
                            style={{
                                color: 'var(--text-primary)',
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Eye size={16} /> View
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const project = projects.find(p => p.id === activeMenu);
                                if (project) handleEditProject(project);
                            }}
                            className="w-full text-left flex items-center gap-2 bg-transparent border-none cursor-pointer rounded-lg text-sm p-2.5 transition-colors"
                            style={{
                                color: 'var(--text-primary)',
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Edit2 size={16} /> Edit
                        </button>

                        {/* Links in Menu */}
                        {(projects.find(p => p.id === activeMenu)?.repoLink || projects.find(p => p.id === activeMenu)?.liveLink) && (
                            <div className="mx-2 my-1 h-[1px]" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                        )}
                        {projects.find(p => p.id === activeMenu)?.repoLink && (
                            <a
                                href={projects.find(p => p.id === activeMenu)?.repoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-left flex items-center gap-2 bg-transparent border-none cursor-pointer rounded-lg text-sm p-2.5 no-underline transition-colors"
                                style={{
                                    color: isDark ? '#60a5fa' : '#2563eb',
                                    fontFamily: "'Inter', sans-serif"
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(37, 99, 235, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Github size={16} /> View Code
                            </a>
                        )}
                        {projects.find(p => p.id === activeMenu)?.liveLink && (
                            <a
                                href={projects.find(p => p.id === activeMenu)?.liveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-left flex items-center gap-2 bg-transparent border-none cursor-pointer rounded-lg text-sm p-2.5 no-underline transition-colors"
                                style={{
                                    color: isDark ? '#4ade80' : '#16a34a',
                                    fontFamily: "'Inter', sans-serif"
                                }}
                                onClick={(e) => e.stopPropagation()}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(22, 163, 74, 0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <ExternalLink size={16} /> Visit Live
                            </a>
                        )}

                        <div className="mx-2 my-1 h-[1px]" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (activeMenu !== null) handleDeleteProject(activeMenu);
                            }}
                            className="w-full text-left flex items-center gap-2 bg-transparent border-none cursor-pointer rounded-lg text-sm p-2.5 transition-colors"
                            style={{
                                color: 'rgb(239, 68, 68)',
                                fontFamily: "'Inter', sans-serif"
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <Trash2 size={16} /> Remove
                        </button>
                    </div>
                </>,
                document.body
            )}
            {/* View Modals */}
            {viewingProject && (
                <MProjectView
                    project={{
                        ...viewingProject,
                        title: viewingProject.name,
                        images: viewingProject.images.map((img: string | File) => typeof img === 'string' ? img : URL.createObjectURL(img))
                    }}
                    onClose={() => setViewingProject(null)}
                    onContributorClick={(c) => setViewingContributor(c)}
                />
            )}
            {viewingContributor && (
                <MContributorView
                    contributor={{
                        ...viewingContributor,
                        image: typeof viewingContributor.image === 'string' ? viewingContributor.image : undefined,
                        links: viewingContributor.links || (viewingContributor.socials ? {
                            github: viewingContributor.socials.github,
                            linkedin: viewingContributor.socials.linkedin,
                            facebook: viewingContributor.socials.facebook,
                            instagram: viewingContributor.socials.instagram,
                            portfolio: viewingContributor.socials.portfolio,
                        } : {})
                    } as Contributor}
                    onClose={() => setViewingContributor(null)}
                />
            )}
        </div>
    );
};

export default DProjects;
