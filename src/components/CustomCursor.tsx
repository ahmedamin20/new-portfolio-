import { useEffect, useRef, useState } from 'react';

const HOVER_SELECTOR = 'a, button, [role="button"], input, textarea, select, [data-cursor-hover]';

const CustomCursor = () => {
    const [enabled, setEnabled] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isDown, setIsDown] = useState(false);
    const ringRef = useRef<HTMLDivElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);

    const mouse = useRef({ x: 0, y: 0 });
    const ring = useRef({ x: 0, y: 0 });
    const rafId = useRef<number | null>(null);

    useEffect(() => {
        const fine = window.matchMedia('(pointer: fine)').matches;
        if (!fine) return;
        setEnabled(true);
        document.documentElement.classList.add('custom-cursor-active');

        const handleMove = (e: MouseEvent) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
            }
        };

        const handleOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            setIsHovering(!!target.closest(HOVER_SELECTOR));
        };

        const handleDown = () => setIsDown(true);
        const handleUp = () => setIsDown(false);
        const handleLeave = () => {
            if (ringRef.current) ringRef.current.style.opacity = '0';
            if (dotRef.current) dotRef.current.style.opacity = '0';
        };
        const handleEnter = () => {
            if (ringRef.current) ringRef.current.style.opacity = '1';
            if (dotRef.current) dotRef.current.style.opacity = '1';
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseover', handleOver);
        window.addEventListener('mousedown', handleDown);
        window.addEventListener('mouseup', handleUp);
        document.addEventListener('mouseleave', handleLeave);
        document.addEventListener('mouseenter', handleEnter);

        const tick = () => {
            ring.current.x += (mouse.current.x - ring.current.x) * 0.18;
            ring.current.y += (mouse.current.y - ring.current.y) * 0.18;
            if (ringRef.current) {
                ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
            }
            rafId.current = requestAnimationFrame(tick);
        };
        rafId.current = requestAnimationFrame(tick);

        return () => {
            document.documentElement.classList.remove('custom-cursor-active');
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseover', handleOver);
            window.removeEventListener('mousedown', handleDown);
            window.removeEventListener('mouseup', handleUp);
            document.removeEventListener('mouseleave', handleLeave);
            document.removeEventListener('mouseenter', handleEnter);
            if (rafId.current) cancelAnimationFrame(rafId.current);
        };
    }, []);

    if (!enabled) return null;

    const ringScale = isHovering ? 1.7 : isDown ? 0.85 : 1;

    return (
        <>
            <div
                ref={ringRef}
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--accent-blue, #3b82f6)',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transition: 'width 0.25s ease, height 0.25s ease, border-color 0.25s ease, background-color 0.25s ease, opacity 0.2s ease',
                    background: isHovering ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    transformOrigin: 'center',
                    scale: `${ringScale}`,
                }}
            >
                {/* Orbiting electron — tech motif */}
                <div
                    style={{
                        position: 'absolute',
                        inset: '-6px',
                        animation: 'cursor-orbit 2.4s linear infinite',
                        opacity: isHovering ? 0 : 0.9,
                        transition: 'opacity 0.2s ease',
                    }}
                >
                    <span
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: '50%',
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-blue, #3b82f6)',
                            transform: 'translate(-50%, -50%)',
                            boxShadow: '0 0 6px 1px var(--accent-blue, #3b82f6)',
                        }}
                    />
                </div>
            </div>
            <div
                ref={dotRef}
                aria-hidden="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: isDown ? '5px' : '6px',
                    height: isDown ? '5px' : '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--accent-blue, #3b82f6)',
                    pointerEvents: 'none',
                    zIndex: 9999,
                    transition: 'width 0.15s ease, height 0.15s ease, opacity 0.2s ease',
                }}
            />
        </>
    );
};

export default CustomCursor;
