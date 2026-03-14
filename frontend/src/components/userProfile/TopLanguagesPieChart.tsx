import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTranslation } from "react-i18next";

import { Box, Stack, styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useDrawingArea } from "@mui/x-charts";
import { PieChart } from "@mui/x-charts/PieChart";

type LanguageData = {
    language: string;
    count: number;
};

type TopLanguagesPieChartProps = {
    languageCount: LanguageData[];
};

const LoadingSlice = styled('path')({
    stroke: 'white',
    opacity: 0.2,
    fill: 'lightgray',
});

const LoadingText = styled('text')(({ theme }) => ({
    stroke: 'none',
    fill: theme.palette.text.primary,
    shapeRendering: 'crispEdges',
    textAnchor: 'middle',
    dominantBaseline: 'middle',
    fontSize: "16px",
}));

function PieLoadingOverlay() {
    const { width, height, left } = useDrawingArea();
    const centerX = left + width / 2 + 50;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    const slices = 8;
    const sliceAngle = (2 * Math.PI) / slices;

    const { t } = useTranslation();

    return (
        <g>
            {Array.from({ length: slices }).map((_, index) => {
                const startAngle = index * sliceAngle;
                const endAngle = startAngle + sliceAngle;
                const x1 = centerX + radius * Math.cos(startAngle);
                const y1 = centerY + radius * Math.sin(startAngle);
                const x2 = centerX + radius * Math.cos(endAngle);
                const y2 = centerY + radius * Math.sin(endAngle);

                const d = `M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`;

                return <LoadingSlice key={index} d={d} />;
            })}
            <LoadingText x={centerX} y={centerY}>
                {t('profile.loading_text')}
            </LoadingText>
        </g>
    );
}

export default function TopLanguagesPieChart({ languageCount }: TopLanguagesPieChartProps) {
    const isLoading = useSelector((state: RootState) =>
        state.favourites.loading || state.watch.watchLater.loading || state.watch.watched.loading
    );
    const theme = useTheme();
    const { t } = useTranslation();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

    const totalCount = languageCount.reduce((sum, lang) => sum + lang.count, 0);

    const generateColor = (index: number) => {
        const hue = (index * 137) % 360;
        return `hsl(${hue}, 70%, 50%)`
    };

    const pieData = languageCount.map((lang, index) => ({
        id: index,
        value: lang.count,
        label: `${lang.language} (${((lang.count / totalCount) * 100).toFixed(1)}%)`,
        color: generateColor(index)
    }));


    if (isLoading) {
        return (
            <PieChart
                loading
                series={[]}
                slots={{ loadingOverlay: PieLoadingOverlay }}
                width={800}
                height={500}
            />
        );
    }

    if (pieData.length === 0) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" height={400}>
                <Typography variant="h6" color={theme.palette.text.secondary}>
                    {t('profile.error_no_data')}
                </Typography>
            </Box>
        );
    }


    return (
        <Box id='test-2' display="flex" flexDirection="column" alignItems="center">
            <PieChart
                series={[
                    {
                        data: pieData,
                        innerRadius: isSmallScreen ? 20 : 40,
                        outerRadius: isSmallScreen ? 80 : 160,
                        paddingAngle: 3,
                        cornerRadius: 5,
                        cx: '55%',
                        cy: '50%',
                        highlightScope: { fade: "global", highlight: "item" },
                        faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
                    },
                ]}
                height={isSmallScreen ? 250 : 400}
                slotProps={{
                    legend: {
                        hidden: true
                    }
                }}
            />
            <Stack direction="row" gap={1} mt={2} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                {pieData.map((item) => (
                    <Box key={item.id} display="flex" justifyContent='center'>
                        <Box
                            sx={{
                                width: 14,
                                height: 14,
                                backgroundColor: item.color,
                                borderRadius: "50%",
                                marginRight: 1,
                            }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.label}</Typography>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}