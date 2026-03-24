import { useId } from "react";

export default function MediAiLogo({ size = 46, showText = true }) {
    const uid = useId();

    const glowId = `neonGlow-${uid}`;
    const gradId = `movingGradient-${uid}`;

    return (
        <div>
            <svg
                width={size}
                height={size}
                viewBox="0 0 80 70"
                xmlns="http://www.w3.org/2000/svg"
                className="shrink-0"
            >
                <defs>
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2.2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00E6FF" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#00E6FF" stopOpacity="1" />
                        <stop offset="100%" stopColor="#00E6FF" stopOpacity="0.2" />

                        <animate attributeName="x1" values="-1;1" dur="1.6s" repeatCount="indefinite" />
                        <animate attributeName="x2" values="0;2" dur="1.6s" repeatCount="indefinite" />
                    </linearGradient>
                </defs>

                <rect
                    x="6"
                    y="6"
                    width="68"
                    height="58"
                    rx="14"
                    fill="#0C1F3A"
                    stroke="#1F3D66"
                    strokeWidth="2"
                />

                <path
                    d="M18 36 L28 36 L33 24 L38 48 L43 34 L56 34"
                    fill="none"
                    stroke={`url(#${gradId})`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={`url(#${glowId})`}
                />

                <path
                    d="M18 36 L28 36 L33 24 L38 48 L43 34 L56 34"
                    fill="none"
                    stroke="#00E6FF"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.2"
                >
                    <animate attributeName="opacity" values="0.12;0.32;0.12" dur="1.3s" repeatCount="indefinite" />
                </path>
            </svg>

            {showText && (
                <div className="leading-tight">
                    <div className="text-white font-bold text-xl tracking-wide">
                        Medi<span className="text-cyan-300">AI</span>
                    </div>
                    <div className="text-xs text-slate-300 -mt-1">Smart Healthcare</div>
                </div>
            )}
        </div>
    );
}
