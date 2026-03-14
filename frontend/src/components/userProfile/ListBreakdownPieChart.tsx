import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTranslation } from "react-i18next";

import { PieChart } from "@mui/x-charts/PieChart";
import { Box, Stack, styled, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useDrawingArea } from "@mui/x-charts";

type ListBreakdownChartProps = {
    numFavourites: number;
    numWatchLater: number;
    numWatched: number;
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
    const { t } = useTranslation();

    const slices = 8;
    const sliceAngle = (2 * Math.PI) / slices;

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

export default function ListBreakdownPieChart({
    numFavourites,
    numWatchLater,
    numWatched,
}: ListBreakdownChartProps) {

    const isLoading = useSelector((state: RootState) =>
        state.favourites.loading || state.watch.watchLater.loading || state.watch.watched.loading
    );

    const total = numFavourites + numWatchLater + numWatched;
    const theme = useTheme();
    const { t } = useTranslation();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

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

    if (total === 0) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" height={400}>
                <Typography variant="h6" color={theme.palette.text.secondary}>
                    {t('profile.error_no_data')}
                </Typography>
            </Box>
        );
    }

    const pieData = [
        { id: 0, value: numFavourites, label: `${t('profile.favourites')}`, color: "#FF1744" },
        { id: 1, value: numWatchLater, label: `${t('profile.watch_later')}`, color: "#FFD700" },
        { id: 2, value: numWatched, label: `${t('profile.watched')}`, color: "#00C853" },
    ].map((item) => ({
        ...item,
        label: `${item.label} (${((item.value / total) * 100).toFixed(1)}%)`,
    }));

    return (
        <Box display="flex" flexDirection="column" alignItems="center">
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
            <Stack direction="row" spacing={2} mt={2} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                {pieData.map((item) => (
                    <Box key={item.id} display="flex" alignItems="center">
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
