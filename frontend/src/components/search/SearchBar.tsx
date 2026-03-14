import { useTranslation } from 'react-i18next';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, IconButton, useTheme, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid2';
import CloseIcon from "@mui/icons-material/Close";

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
        <Grid container spacing={4} size={{ xs: 4 }} sx={{ alignItems: 'center', justifyContent: 'center' }}>
            <TextField sx={{
                minWidth: { xs: '100%', sm: "100%", md: '8rem' },
                fontWeight: 600
            }} label={t("search.search_title")} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => {
                if (e.key === "Enter") {
                    handleSearch();
                }
            }} />
            <FormControl sx={{ minWidth: { xs: '100%', sm: '100%', md: '12rem' } }}>
                <InputLabel id="year-label">{t("search.year")}</InputLabel>
                <Select id="year" labelId="year-label" label="Year" value={year} onChange={(e) => setYear(e.target.value)}>
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
            <FormControl sx={{ minWidth: { xs: '100%', sm: '100%', md: '12rem' } }}>
                <InputLabel id="filter-type-label">{t("search.type")}</InputLabel>
                <Select id="filter-type" labelId="filter-type-label" label="Type" value={type} onChange={(e) => setType(e.target.value)}>
                    <MenuItem value='None'>{t("search.none")}</MenuItem>
                    <MenuItem value="movie">{t("search.movies")}</MenuItem>
                    <MenuItem value="series">{t("search.series")}</MenuItem>
                    <MenuItem value="episode">{t("search.episode")}</MenuItem>
                </Select>
            </FormControl>
            <Tooltip title='Clear search'>
                <IconButton onClick={resetSearchBar} aria-label="clear fields">
                    <CloseIcon sx={{ color: theme.palette.text.primary }} />
                </IconButton>
            </Tooltip>
            <Button size="large"
                sx={{
                    fontSize: { sm: "0.8rem", lg: '1rem' },
                    padding: { xs: "6px 12px", sm: "8px 16px", md: "10px 20px", lg: "12px 24px" },
                    minWidth: { xs: "100%", sm: "100px", md: "120px", lg: "150px" },
                    fontWeight: 600
                }} variant="contained" onClick={handleSearch}>{t("search.search")}</Button>
        </Grid>
    )
}

export default SearchBar;