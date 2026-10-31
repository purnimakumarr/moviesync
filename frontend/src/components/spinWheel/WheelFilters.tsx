import { useTranslation } from 'react-i18next';
import {
    Box,
    Checkbox,
    Chip,
    FormControl,
    FormControlLabel,
    InputLabel,
    MenuItem,
    Select,
    Slider,
    Stack,
    Switch,
    Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import {
    ContentTypeFilter,
    CURRENT_YEAR,
    MIN_YEAR,
    RECOMMENDATION_OPTIONS,
    RecommendationCount,
} from '../../utils/spinWheel';

type WheelFiltersProps = {
    genreOptions: string[];
    genres: string[];
    onGenresChange: (genres: string[]) => void;
    count: RecommendationCount;
    onCountChange: (count: RecommendationCount) => void;
    type: ContentTypeFilter;
    onTypeChange: (type: ContentTypeFilter) => void;
    yearRange: [number, number];
    onYearRangeChange: (range: [number, number]) => void;
    excludeWatched: boolean;
    onExcludeWatchedChange: (value: boolean) => void;
    canSmartSpin: boolean;
    smartSpin: boolean;
    onSmartSpinChange: (value: boolean) => void;
};

function WheelFilters(props: WheelFiltersProps) {
    const { t } = useTranslation();

    return (
        <Stack gap={2.5}>
            <FormControl fullWidth>
                <InputLabel id="wheel-genre-label">{t('spin_wheel.genres')}</InputLabel>
                <Select
                    labelId="wheel-genre-label"
                    multiple
                    label={t('spin_wheel.genres')}
                    value={props.genres}
                    onChange={(event) =>
                        props.onGenresChange(
                            typeof event.target.value === 'string'
                                ? event.target.value.split(',')
                                : event.target.value,
                        )
                    }
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                            ))}
                        </Box>
                    )}
                >
                    {props.genreOptions.map((genre) => (
                        <MenuItem key={genre} value={genre}>
                            {genre}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Side by side in the full-width phone accordion; stacked in the narrow desktop column. */}
            <Stack direction={{ xs: 'row', md: 'column' }} gap={2}>
                <FormControl fullWidth>
                    <InputLabel id="wheel-count-label">{t('spin_wheel.picks')}</InputLabel>
                    <Select
                        labelId="wheel-count-label"
                        label={t('spin_wheel.picks')}
                        value={props.count}
                        onChange={(event) => props.onCountChange(Number(event.target.value) as RecommendationCount)}
                    >
                        {RECOMMENDATION_OPTIONS.map((count) => (
                            <MenuItem key={count} value={count}>
                                {count}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl fullWidth>
                    <InputLabel id="wheel-type-label">{t('spin_wheel.type')}</InputLabel>
                    <Select
                        labelId="wheel-type-label"
                        label={t('spin_wheel.type')}
                        value={props.type}
                        onChange={(event) => props.onTypeChange(event.target.value as ContentTypeFilter)}
                    >
                        <MenuItem value="both">{t('spin_wheel.type_both')}</MenuItem>
                        <MenuItem value="movie">{t('spin_wheel.type_movie')}</MenuItem>
                        <MenuItem value="tv">{t('spin_wheel.type_series')}</MenuItem>
                    </Select>
                </FormControl>
            </Stack>

            <Box sx={{ px: 1 }}>
                <Typography id="wheel-year-label" variant="subtitle2" fontWeight={800} sx={{ mb: 1, ml: -1 }}>
                    {t('spin_wheel.release_year', { from: props.yearRange[0], to: props.yearRange[1] })}
                </Typography>
                <Slider
                    aria-labelledby="wheel-year-label"
                    getAriaValueText={(value) => String(value)}
                    value={props.yearRange}
                    min={MIN_YEAR}
                    max={CURRENT_YEAR}
                    onChange={(_, value) => props.onYearRangeChange(value as [number, number])}
                    valueLabelDisplay="auto"
                />
            </Box>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={props.excludeWatched}
                        onChange={(event) => props.onExcludeWatchedChange(event.target.checked)}
                    />
                }
                label={t('spin_wheel.exclude_watched')}
            />

            {props.canSmartSpin ? (
                <Box>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={props.smartSpin}
                                onChange={(event) => props.onSmartSpinChange(event.target.checked)}
                            />
                        }
                        label={
                            <Stack direction="row" gap={0.75} alignItems="center">
                                <AutoAwesomeIcon fontSize="small" color="primary" />
                                {t('spin_wheel.smart_spin')}
                            </Stack>
                        }
                    />
                    <Typography variant="caption" component="p" sx={{ opacity: 0.8, ml: 6 }}>
                        {t('spin_wheel.smart_spin_help')}
                    </Typography>
                </Box>
            ) : (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    {t('spin_wheel.smart_spin_login')}
                </Typography>
            )}
        </Stack>
    );
}

export default WheelFilters;
