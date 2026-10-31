import { memo, useId } from 'react';
import { motion } from 'framer-motion';
import { Box, useTheme } from '@mui/material';

import { WheelPick } from '../../types';
import { WheelSegment, wrapTitle } from '../../utils/spinWheel';
import { getTitle, posterUrl } from '../../utils/tmdb';
import Cinema from '../../assets/cinema.png';

const SIZE = 400;
const CENTER = SIZE / 2;
const RADIUS = 186;
const HUB_RADIUS = 30;
const BULBS = 24;
// Titles run along the radius, from just outside the hub to near the rim.
const LABEL_START = HUB_RADIUS + 14;
const LABEL_LINE_GAP = 15;

type WheelProps = {
    segments: WheelSegment<WheelPick>[];
    rotation: number;
    durationMs: number;
    label: string;
    // CSS width of the wheel; it is always square.
    size: string;
    // Slice to spotlight once the wheel has stopped; others are dimmed.
    highlightIndex?: number | null;
};

// Angle 0 is the top of the wheel; angles grow clockwise.
const pointAt = (angle: number, radius: number) => {
    const radians = (angle * Math.PI) / 180;
    return [CENTER + radius * Math.sin(radians), CENTER - radius * Math.cos(radians)];
};

const slicePath = (start: number, end: number) => {
    const [x1, y1] = pointAt(start, RADIUS);
    const [x2, y2] = pointAt(end, RADIUS);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;
};

const hasPoster = (movie: WheelPick | null) => Boolean(movie?.poster_path);

// A wheel whose slices are the candidates' posters, each titled along its
// radius. Spinning is driven by the parent through `rotation`; the pointer at
// the top marks the winner.
function Wheel({ segments, rotation, durationMs, label, size, highlightIndex = null }: WheelProps) {
    const theme = useTheme();
    const clipId = `${useId()}-slice`;
    const segmentAngle = 360 / segments.length;
    const halfAngle = segmentAngle / 2;

    // Poster box for one slice drawn pointing straight up: tall enough to
    // reach the rim and wide enough to cover the wedge, cropped to fill it.
    const posterHeight = RADIUS;
    const posterWidth = Math.max(2 * RADIUS * Math.sin((halfAngle * Math.PI) / 180), (RADIUS * 2) / 3) * 1.08;

    const fallbackFills = [
        theme.palette.primary.main,
        theme.palette.background.secondary || theme.palette.primary.dark,
    ];

    return (
        <Box
            role="img"
            aria-label={label}
            sx={{
                position: 'relative',
                width: size,
                aspectRatio: '1 / 1',
                mx: 'auto',
                filter: `drop-shadow(0 0 18px ${theme.palette.primary.main}55)`,
            }}
        >
            <motion.svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                width="100%"
                height="100%"
                animate={{ rotate: rotation }}
                transition={{ duration: durationMs / 1000, ease: [0.12, 0.8, 0.2, 1] }}
                style={{ display: 'block', overflow: 'visible' }}
            >
                <defs>
                    {/* One wedge, pointing up; every slice reuses it inside its own rotation. */}
                    <clipPath id={clipId}>
                        <path d={slicePath(-halfAngle, halfAngle)} />
                    </clipPath>
                    <linearGradient id={`${clipId}-scrim`} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0" stopColor="#000" stopOpacity="0.75" />
                        <stop offset="0.55" stopColor="#000" stopOpacity="0.45" />
                        <stop offset="1" stopColor="#000" stopOpacity="0.2" />
                    </linearGradient>
                </defs>

                {/* Rim */}
                <circle cx={CENTER} cy={CENTER} r={RADIUS + 9} fill={theme.palette.headerIconsBackground} />

                {segments.map(({ key, movie }, index) => {
                    const centre = index * segmentAngle + halfAngle;
                    const dimmed = highlightIndex !== null && highlightIndex !== index;

                    return (
                        <g key={key} transform={`rotate(${centre} ${CENTER} ${CENTER})`} clipPath={`url(#${clipId})`}>
                            <rect x={0} y={0} width={SIZE} height={SIZE} fill={fallbackFills[index % fallbackFills.length]} />
                            {hasPoster(movie) && (
                                <>
                                    <image
                                        href={posterUrl(movie!, 'w342') ?? undefined}
                                        x={CENTER - posterWidth / 2}
                                        y={CENTER - posterHeight}
                                        width={posterWidth}
                                        height={posterHeight}
                                        preserveAspectRatio="xMidYMid slice"
                                    />
                                    {/* Darker towards the hub, where the title sits. */}
                                    <rect
                                        x={CENTER - posterWidth / 2}
                                        y={CENTER - posterHeight}
                                        width={posterWidth}
                                        height={posterHeight}
                                        fill={`url(#${clipId}-scrim)`}
                                    />
                                </>
                            )}
                            <rect
                                x={0}
                                y={0}
                                width={SIZE}
                                height={SIZE}
                                fill="#000"
                                opacity={dimmed ? 0.6 : 0}
                                style={{ transition: 'opacity 0.4s' }}
                            />
                            <path
                                d={slicePath(-halfAngle, halfAngle)}
                                fill="none"
                                stroke={theme.palette.headerIconsBackground}
                                strokeWidth={3}
                            />
                        </g>
                    );
                })}

                {segments.map(({ key, movie }, index) => {
                    const centre = index * segmentAngle + halfAngle;
                    // Where this slice comes to rest on screen. Labels on the left
                    // half are flipped so every title reads upright once stopped.
                    const restingAngle = (((centre + rotation) % 360) + 360) % 360;
                    const flip = restingAngle > 180;
                    const lines = movie ? wrapTitle(getTitle(movie)) : ['?'];
                    const firstLineOffset = -((lines.length - 1) * LABEL_LINE_GAP) / 2;
                    const dimmed = highlightIndex !== null && highlightIndex !== index;

                    return (
                        <text
                            key={`${key}-label`}
                            transform={`rotate(${flip ? centre + 90 : centre - 90} ${CENTER} ${CENTER})`}
                            x={flip ? CENTER - LABEL_START : CENTER + LABEL_START}
                            y={CENTER}
                            textAnchor={flip ? 'end' : 'start'}
                            dominantBaseline="middle"
                            fill="#fff"
                            stroke="rgba(0,0,0,0.85)"
                            strokeWidth={3}
                            paintOrder="stroke"
                            strokeLinejoin="round"
                            fontSize={movie ? 14 : 28}
                            fontWeight={800}
                            fontFamily="'DM Sans', sans-serif"
                            opacity={dimmed ? 0.45 : 1}
                            style={{ transition: 'opacity 0.4s' }}
                        >
                            {lines.map((line, lineIndex) => (
                                <tspan
                                    key={lineIndex}
                                    x={flip ? CENTER - LABEL_START : CENTER + LABEL_START}
                                    dy={lineIndex === 0 ? firstLineOffset : LABEL_LINE_GAP}
                                >
                                    {line}
                                </tspan>
                            ))}
                        </text>
                    );
                })}

                {/* Marquee bulbs around the rim */}
                {Array.from({ length: BULBS }, (_, index) => {
                    const [x, y] = pointAt((360 / BULBS) * index, RADIUS + 4.5);
                    return <circle key={index} cx={x} cy={y} r={2.5} fill={theme.palette.iconsColor} opacity={index % 2 ? 0.95 : 0.55} />;
                })}

                {/* Hub */}
                <circle cx={CENTER} cy={CENTER} r={HUB_RADIUS} fill={theme.palette.background.default} stroke={theme.palette.headerIconsBackground} strokeWidth={4} />
                <image href={Cinema} x={CENTER - 19} y={CENTER - 19} width={38} height={38} />
            </motion.svg>

            {/* Pointer (does not rotate) */}
            <Box
                aria-hidden
                sx={{
                    position: 'absolute',
                    top: '-3%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '14px solid transparent',
                    borderRight: '14px solid transparent',
                    borderTop: `26px solid ${theme.palette.text.primary}`,
                    filter: `drop-shadow(0 2px 3px ${theme.palette.headerIconsBackground})`,
                }}
            />
        </Box>
    );
}

export default memo(Wheel);
