import React, { useEffect, useState } from 'react';
import { Box, keyframes, useTheme } from "@mui/material";

interface StarProps {
    size: number;
    posX: number;
    posY: number;
    delay: number;
}

const MovieAppBackground: React.FC = () => {
    const [stars, setStars] = useState<StarProps[]>([]);
    const theme = useTheme();

    const move = keyframes`
        0% {
            transform: translateX(-100%) rotate(-20deg);
            opacity: 0.3;
        }
        50% {
            opacity: 0.7;
        }
        100% {
            transform: translateX(100%) rotate(20deg);
            opacity: 0.3;
        `;

    const twinkle = keyframes`0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }`


    useEffect(() => {
        // Create stars on component mount
        const numberOfStars = 500;
        const newStars: StarProps[] = [];

        for (let i = 0; i < numberOfStars; i++) {
            newStars.push({
                size: Math.random() * 3 + 1,
                posX: Math.random() * 100,
                posY: Math.random() * 100,
                delay: Math.random() * 5,
            });
        }

        setStars(newStars);
    }, []);

    return (
        <Box sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            background: `linear-gradient(180deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))`,
            zIndex: - 1,
            overflow: 'hidden'
        }}>
            {/* Background gradient */}
            < Box sx={{
                background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 50%, ${theme.palette.background.paper} 100%)`,
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -10,
            }} />

            {/* Stars */}
            <Box sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: -5
            }}>
                {stars.map((star, index) => (
                    <Box
                        key={index}
                        sx={{
                            width: `${star.size}px`,
                            height: `${star.size}px`,
                            left: `${star.posX}%`,
                            top: `${star.posY}%`,
                            animationDelay: `${star.delay}s`,
                            position: 'absolute',
                            backgroundColor: `${theme.palette.primary.main}`,
                            borderRadius: '50%',
                            animation: `${twinkle} 3s infinite`,
                        }}
                    />
                ))}
            </Box>

            {/* Moving spotlights */}
            <Box sx={{
                position: 'absolute',
                width: '200px',
                height: '50px',
                background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%)`,
                bordeRadius: '50%',
                left: 0,
                animation: `${move} 15s ease-in-out infinite alternate`,
                transformOrigin: 'center',
                top: '30%'
            }} />
            <Box sx={{
                position: 'absolute',
                width: '200px',
                height: '50px',
                background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%)`,
                bordeRadius: '50%',
                left: 0,
                animation: `${move} 15s ease-in-out infinite alternate`,
                transformOrigin: 'center',
                top: '60%', animationDelay: '2s'
            }} />

            <Box sx={{
                position: 'absolute',
                width: '200px',
                height: '50px',
                background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%)`,
                bordeRadius: '50%',
                right: 0,
                animation: `${move} 15s ease-in-out infinite alternate`,
                transformOrigin: 'center',
                top: '60%'
            }} />
            <Box sx={{
                position: 'absolute',
                width: '200px',
                height: '50px',
                background: `radial-gradient(ellipse at center, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0) 70%)`,
                bordeRadius: '50%',
                right: 0,
                animation: `${move} 15s ease-in-out infinite alternate`,
                transformOrigin: 'center',
                top: '40%',
                animationDelay: '2s'
            }} />
        </Box >
    );
};

export default MovieAppBackground;