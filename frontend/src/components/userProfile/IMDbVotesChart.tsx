import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { useTranslation } from "react-i18next";

import { BarChart } from "@mui/x-charts/BarChart";
import { Box, styled, Typography, useTheme } from "@mui/material";
import { useDrawingArea, useXScale, useYScale } from "@mui/x-charts";

const LoadingReact = styled('rect')({
    opacity: 0.2,
    fill: 'lightgray',
});

const LoadingText = styled('text')(({ theme }) => ({
    stroke: 'none',
    fill: theme.palette.text.primary,
    shapeRendering: 'crispEdges',
    textAnchor: 'middle',
    dominantBaseline: 'middle',
}));

function LoadingOverlay() {
    const xScale = useXScale<'band'>();
    const yScale = useYScale();
    const { left, width, height } = useDrawingArea();

    const bandWidth = xScale.bandwidth();

    const [bottom, top] = yScale.range();
    const { t } = useTranslation();

    return (
        <g>
            {xScale.domain().map((item, index) => {
                const barHeight = 600;

                return (
                    <LoadingReact
                        key={index}
                        x={xScale(item)}
                        width={bandWidth}
                        y={bottom - barHeight}
                        height={height}
                    />
                );
            })}
            <LoadingText x={left + width / 2} y={top + height / 2}>
                {t('profile.loading_text')}
            </LoadingText>
        </g>
    );
}

type IMDbVotesChartProps = {
    votesData: { title: string; votes: number }[];
};

export default function IMDbVotesChart({ votesData }: IMDbVotesChartProps) {
    const theme = useTheme();
    const { t } = useTranslation();

    const isLoading = useSelector((state: RootState) =>
        state.favourites.loading || state.watch.watchLater.loading || state.watch.watched.loading
    );


    if (isLoading) {
        return (
            <BarChart
                loading
                xAxis={[
                    { scaleType: 'band', data: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
                ]}
                slots={{ loadingOverlay: LoadingOverlay }}
                series={[]}
                height={800}
            />
        );
    }

    if (votesData.length === 0) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" height={400}>
                <Typography variant="h6" color={theme.palette.text.secondary}>
                    {t('profile.error_no_data')}
                </Typography>
            </Box>
        );
    }

    const formattedVotesData = votesData.map((item) => ({
        ...item,
        title: item.title.length > 20 ? `${item.title.slice(0, 20)}...` : item.title,
    }));

    return (
        <BarChart
            sx={{ padding: '1rem' }}
            dataset={formattedVotesData}
            xAxis={[{
                label: `${t('profile.title')}`, labelStyle: { transform: "translate(0px, 10px)", fontWeight: 600, fontSize: '1rem' }, tickLabelStyle: {
                    fontWeight: 500,
                    fontSize: '1rem',
                }, scaleType: "band", dataKey: "title"
            }]}
            yAxis={[
                {
                    label: `${t('profile.votes')}`,
                    labelStyle: { transform: "translate(-36px, 0px)", fontWeight: 600, fontSize: '1rem' }, tickLabelStyle: {
                        fontWeight: 500,
                        fontSize: '1rem',
                    },
                    valueFormatter: (value) => {
                        if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                            return (value / 1000).toFixed(0) + 'K';
                        } else {
                            return value.toString();
                        }
                    }
                },
            ]}
            series={[{ dataKey: "votes", color: theme.palette.secondary.main }]}
            height={800}
            borderRadius={12}
        />
    );
}
