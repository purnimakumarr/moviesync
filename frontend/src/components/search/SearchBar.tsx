import { useTranslation } from 'react-i18next';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, IconButton, useTheme, Tooltip, Box, InputAdornment } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";

type SearchBarProps = {
    title: string;
    setTitle: React.Dispatch<React.SetStateAction<string>>;
    year: string;
    setYear: React.Dispatch<React.SetStateAction<string>>;
    type: string;
    setType: React.Dispatch<React.SetStateAction<string>>;
    resetSearchBar: () => void;
    handleSearch: () => void;
};

function SearchBar({ title, setTitle, year, setYear, type, setType, resetSearchBar, handleSearch }: SearchBarProps) {

    const { t } = useTranslation();
    const theme = useTheme();

    return (
        <Box
            component="form"
            role="search"
            onSubmit={(event: React.FormEvent) => {
                event.preventDefault();
                handleSearch();
            }}
            sx={{
                display: 'grid',
                gap: 2,
                alignItems: 'center',
                // Phones: stacked. Tablets: title on its own row. Desktop: one row.
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) auto' },
                '& > .search-title': { gridColumn: { sm: '1 / -1', md: 'auto' } },
            }}
        >
            <TextField
                className="search-title"
                label={t("search.search_title")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                fullWidth
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: theme.palette.text.primary, opacity: 0.6 }} />
                            </InputAdornment>
                        ),
                        endAdornment: title ? (
                            <InputAdornment position="end">
                                <Tooltip title={t("search.clear")}>
                                    <IconButton onClick={resetSearchBar} aria-label={t("search.clear")} edge="end">
                                        <CloseIcon sx={{ color: theme.palette.text.primary }} />
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ) : undefined,
                    },
                }}
            />
            <FormControl fullWidth>
                <InputLabel id="year-label">{t("search.year")}</InputLabel>
                <Select id="year" labelId="year-label" label={t("search.year")} value={year} onChange={(e) => setYear(e.target.value)}>
                    <MenuItem value="All Years">{t("search.all_years")}</MenuItem>
                    {Array.from({ length: 50 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                            <MenuItem key={year} value={year}>
                                {year}
                            </MenuItem>
                        );
                    })}
                </Select>
            </FormControl>
            <FormControl fullWidth>
                <InputLabel id="filter-type-label">{t("search.type")}</InputLabel>
                <Select id="filter-type" labelId="filter-type-label" label={t("search.type")} value={type} onChange={(e) => setType(e.target.value)}>
                    <MenuItem value='None'>{t("search.none")}</MenuItem>
                    <MenuItem value="movie">{t("search.movies")}</MenuItem>
                    <MenuItem value="tv">{t("search.series")}</MenuItem>
                </Select>
            </FormControl>
            <Button
                type="submit"
                variant="contained"
                sx={{ gridColumn: { sm: '1 / -1', md: 'auto' }, height: 40, px: 3 }}
            >
                {t("search.search")}
            </Button>
        </Box>
    )
}

export default SearchBar;
