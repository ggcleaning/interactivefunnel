import { useEffect, useRef } from 'react';

/**
 * useScrollReveal — attaches an IntersectionObserver to a ref element.
 * As soon as 15% of the element enters the viewport it adds the "visible"
 * class, triggering the CSS fade-in transition defined in index.css.
 *
 * Usage:
 *   const ref = useScrollReveal();
 *   return <section ref={ref} className="reveal"> ... </section>
 */
const useScrollReveal = (threshold = 0.15) => {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el); } },
            { threshold }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return ref;
};

export default useScrollReveal;
